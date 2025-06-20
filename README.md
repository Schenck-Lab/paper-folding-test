# Paper Folding Tester

## Usage and Deployment
- A web-based tool inspired by the Paper Folding Test (VZ-2) developed by ETS  
- Deployed for academic research use: https://schenck-lab.github.io/paper-folding-test/  
- No original ETS test content is distributed  
- © 1962 Educational Testing Service. All rights reserved

## Theme and Svg

### Theme Modes
- `BLACK_WHITE` (`'white'`):  
  Renders the paper in solid white, matching the background. This theme resembles the original PDF version of the test.

- `SOLID_COLOR` (`'solid'`):  
  Renders the paper in a light purple color, clearly distinguishing it from the background.

- `ALPHA_BLENDING` (`'alpha'`):  
  Renders the paper with semi-transparent color, allowing overlapping areas to appear darker and simulate layer stacking.

### SVG Element Specification
- All figures in this test are implemented using SVG elements.
- We define an imaginary **24 × 24 square** as the base coordinate system for the paper.
- Each **hole** is positioned using a pair of integers in this paper coordinate system.
- For each **Answer Option**, we use a list of hole positions to render the frame.
- For each **Question Frame**, we compose the SVG using the following parts:
  - `prePath`
  - `rect`
  - `poly`
  - `hole`
  - `postPath`


## DATA COLLECTION

### File Naming: `P000_FL_MMDD_HHMM.csv`
- We use JavaScript’s `new Date()` to get the **local time** based on the user’s device.
- `P000`: Participant ID (uppercase `P` + 3-digit number)
- `FL`: Initials of first and last name
- `MMDD`: Month and day of the test
- `HHMM`: Hour and minute when the test begins

### Meta Data Specification

- `PID`: Participant ID. Format: `'Pxxx'` for real participants, `'Txxx'` for testing.
- `First_Name`: Participant's first name.
- `Last_Name`: Participant's last name.
- `Email`: Participant's registered email address.
- `Start_Time`: Timestamp when the user clicks the **“Start the Test”** button.  
  Format: generated by `new Date()` in JavaScript.
- `Theme`**: The display theme used for this test session.
- `Answer_1`: A string of 10 characters representing the user’s selected answers for questions in **Part 1**.  
  Example: `"ABCDEABCDE"`
- `Answer_2`: Same format as `Answer_1`, representing answers for **Part 2**.
- `Score_1`: Raw score for **Part 1**. Each correct answer adds 1 point.
- `Score_2`: Raw score for **Part 2**. Each correct answer adds 1 point.
- `Record_Count`: the number of record for mouse event data.


### Object Labels
- `QF1`–`QF5`: Question frames (top row), 1-indexed
- `AO1`–`AO5`: Answer options (bottom row), 1-indexed
- `CONF`: the `Confirm` button
- `none`: Any other area not covered by the above


### Sampling Policy
- `Minimum Displacement Threshold`: **10** in CSS pixel.
- **Click events** are **ALWAYS** recorded.
- **Hover Object changes** are **ALWAYS** recorded.


###  CSV Header (Data Schema)
| **Column**      | **Description** |
|-----------------|-----------------|
| `PART_ID`       | The part number of the test (1 or 2) |
| `QUESTION_ID`   | The question index *within that part*, 1-indexed, up to 10 |
| `TIMESTAMP`     | Time when the event was recorded, in `hh:mm:ss.sss` format (granularity: ms) |
| `STEP`          | 0-indexed frame counter (per question) |
| `MOUSE_X`       | X coordinate in the **viewport coordinate system** |
| `MOUSE_Y`       | Y coordinate in the **viewport coordinate system** |
| `OBJ_HOVER_ON`  | The object currently under the mouse: `QF1` to `QF5`, `AO1` to `AO5`, `BTN`, or `none` |
| `CLICK`         | `1`: is a click event, `0`: not a click event |


## Firebase Specification

- Project name: `kslab-pft-2025`

### Database

- Collection: `participants`
- Document Schma
    ```
    auth.uid: {
        uid: string,
        email: string,
        firstName: string,
        lastName: string,
        participationStage: 'sentLink' | 'inProgress' | 'completed',
        timeStamp: {
            sentLink: null,
            startTest: null,
            uploadCsv: null,
        },
        csvFileName: null,
    }
    ```

