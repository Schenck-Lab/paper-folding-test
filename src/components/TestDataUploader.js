import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';
import { GAS_URL, ACTION, CSV_HEADER, createFrozenMap } from '../constants/config';
import { useTestContext } from './TestContext';
import { Spin, Alert, Button } from 'antd';

// A map to control the format of meta data labels
const metaDataLabel = Object.freeze({
    pid: 'PID',
    firstName: 'First_Name',
    lastName: 'Last_Name',
    email: 'Email',
    startTime: 'Start_Time',
    theme: 'Theme',
    answer1: 'Answer_1',
    answer2: 'Answer_2',
    score1: 'Score_1',
    score2: 'Score_2',
    recordCount: 'Record_Count',
    strategy: 'Strategy',
    gender: 'Gender',
    raceSeq: 'Races',
    raceOther: 'Other_Race',
    birthYear: 'Birth_Year',
    major: 'Major',
    games: 'Games',
    handedness: 'Handedness',
});

// Uploading status
const UPLOAD_STATUS = createFrozenMap([
    'uploading', 'success', 'error',
]);


function TestDataUploader() {
    const { metaData, csvDataBuf } = useTestContext();
    const fileName = useRef('??.csv');
    const csvContent = useRef(null);
    const [requestSent, setRequestSent] = useState(false);
    const [status, setStatus] = useState(UPLOAD_STATUS.uploading);
    const docRef = useRef(null);

    useEffect(() => {
        if (metaData.current.email && !docRef.current) {
            docRef.current = doc(db, 'participants', metaData.current.email);
        }
    });
    
    const generateFileName = (isDownloaded = false) => {
        //const id = metaData.current.pid;
        const F = metaData.current.firstName.charAt(0).toUpperCase();
        const L = metaData.current.lastName.charAt(0).toUpperCase();
        const now = new Date();
        const month  = String(now.getMonth() + 1).padStart(2, '0');
        const day    = String(now.getDate()).padStart(2, '0');
        const hour   = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        const suffix = isDownloaded ? '_DL.csv' : '.csv';
        //return `${id}_${F}${L}_${month}${day}_${hour}${minute}${suffix}`;

        // A self registered one, ignore pid
        return `${F}${L}_${month}${day}_${hour}${minute}${suffix}`;
    }

    const generateCSVContent = () => {
        const csvContentArray = [
            Object.entries(metaData.current)
                .map(([key, value]) => `# ${metaDataLabel[key]}: ${value}`)
                .join('\n'),
            '---',
            Object.keys(CSV_HEADER).join(','), 
            csvDataBuf.current.map(row => row.join(',')).join('\n')
        ];
        return csvContentArray.join('\n');
    };

    const sendPostRequest = () => {
        fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            redirect: 'follow',
            headers: { 
                'Content-Type': 'text/plain;charset=utf-8',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ 
                fileName: fileName.current, 
                csvContent: csvContent.current,
                emailAddress: metaData.current.email,
            }),
        })
        .then(() => {
            console.log('Request sent successfully.');
            setRequestSent(true);
        })
        .catch(error => {
            console.error('Error: ', error);
            setStatus(UPLOAD_STATUS.error);
        });
    };
    
    // const verifyCSVUpload = () => {
    //     const action = ACTION.completionVerification;
    //     const encodedEmail = encodeURIComponent(metaData.current.email);

    //     fetch(`${GAS_URL}?action=${action}&email=${encodedEmail}&fileName=${fileName.current}`)
    //         .then(response => response.json())
    //         .then(data => {
    //             if (!data.success) {
    //                 console.error('Verification failed: ', data.message);
    //                 setStatus(UPLOAD_STATUS.error);
    //                 return;
    //             }
    //             if (data.taskCompleted && data.fileExists) {
    //                 console.log('Task completed and file successfully uploaded!');
    //                 setStatus(UPLOAD_STATUS.success);
    //                 return;
    //             }
    //             console.warn('Task marked as completed, but file not found.');
    //             setStatus(UPLOAD_STATUS.error);
    //         })
    //         .catch(error => {
    //             console.error('Error checking upload status: ', error);
    //             setStatus(UPLOAD_STATUS.error);
    //         });
    // };

    const upDateUserDoc = async () => {
        await updateDoc(docRef.current, { 
            csvFileName: fileName.current,
            participationStage: 'completed',
            'timeStamp.uploadCsv': serverTimestamp(),
        });
    };

    const verifyCSVUpload = () => {
        const action = ACTION.completionVerification;
        const encodedEmail = encodeURIComponent(metaData.current.email);

        fetch(`${GAS_URL}?action=${action}&email=${encodedEmail}&fileName=${fileName.current}`)
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    console.error('Verification failed: ', data.message);
                    setStatus(UPLOAD_STATUS.error);
                    return;
                }
                // if (data.taskCompleted && data.fileExists) {
                //     console.log('Task completed and file successfully uploaded!');
                //     setStatus(UPLOAD_STATUS.success);
                //     return;
                // }
                // console.warn('Task marked as completed, but file not found.');
                // setStatus(UPLOAD_STATUS.error);

                if (data.fileExists) {
                    upDateUserDoc();
                    console.log('File uploaded successfully!');
                    setStatus(UPLOAD_STATUS.success);
                } else {
                    setStatus(UPLOAD_STATUS.error);
                }

            })
            .catch(error => {
                console.error('Error checking upload status: ', error);
                setStatus(UPLOAD_STATUS.error);
            });
    };

    // Upload csv to google drive and verify upload status
    useEffect(() => {
        if (!requestSent) {
            // Prepare csv file
            fileName.current = generateFileName();
            csvContent.current = generateCSVContent();
            console.log('csv file is ready.');

            // Send Post Request
            sendPostRequest();
            console.log('Sending request for \'POST\'...');
            
            // Schedule timeout check in 20 sec.
            const timeoutTimer = setTimeout(() => {
                setStatus(prev => {
                    if (prev === UPLOAD_STATUS.uploading) {
                        console.log('Error: request TIMEOUT.');
                        return UPLOAD_STATUS.error;
                    }
                    return prev;
                });
            }, 20000);

            return () => clearTimeout(timeoutTimer);
        }
        
        // Schedule upload verification in 2 sec.
        console.log('Verifying file upload status...');
        const verifyTimer = setTimeout(() => {
            verifyCSVUpload();
        }, 2000);

        return () => clearTimeout(verifyTimer);
        
    // eslint-disable-next-line
    }, [requestSent]);

    const downloadCSV = () => {
        const blob = new Blob(
            [csvContent.current], { type: 'text/csv;charset=utf-8;' }
        );
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = generateFileName(true);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        upDateUserDoc();
    };

    // UI components
    const message = (
        <div style={styles.msgDiv}>
            Congratulations! You have completed the test. Thank you!
        </div>
    );
 
    const alertSpin = (
        <Spin size='large'>
            <Alert 
                message='Uploading data... Please wait...'
                type='info' 
                showIcon 
                style={styles.alert}
            />
        </Spin>
    );

    const alertSuccess = (
        <Alert 
            message='Your data has been saved. You are safe to quit the app.' 
            type='success'
            showIcon 
            style={styles.alert}
        />
    );

    const alertBusy = (
        <Alert 
            message='Network is busy, please manually download the CSV file.'
            type='warning'
            showIcon 
            style={styles.alert}
        />
    );

    const downLoadButton = (
        <Button 
            type='primary' 
            onClick={downloadCSV} 
            style={styles.downloadButton}
        >
            Download CSV Data
        </Button>
    );

    return (
        <div style={styles.outerDiv}>
            {message}
            <div style={styles.alertDiv}>
                {status === UPLOAD_STATUS.uploading && alertSpin}
                {status === UPLOAD_STATUS.success && alertSuccess}
                {status === UPLOAD_STATUS.error && (<>
                    {alertBusy}
                    {downLoadButton}
                </>)}
            </div>
        </div>
    );
}

const styles = {
    outerDiv: {
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        textAlign: 'center',
    },
    msgDiv: {
        width: '80vw',
        marginTop: '25vh',
        color: '#333',
        fontSize: '50px',
        fontWeight: 'bold',
    },
    alertDiv: { 
        width: '500px', 
        margin: 'auto', 
        marginTop: '135px' 
    },
    downloadButton: {
        width: '500px',
        height: '40px',
        fontSize: '16px',
        fontWeight: 'bold',
        padding: '10px 20px',
        marginTop: '20px',
        borderRadius: '8px',
    },
};

export default TestDataUploader;
