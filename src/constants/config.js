
// Google App Script | Web app URL
const webAppKey = 'AKfycbwA2BGT4KJFMdo8P_IAISeofAWO98H8itScjojD9HdgJr5KBao8PwcMPltc7uvX2ajq';
export const GAS_URL = `https://script.google.com/macros/s/${webAppKey}/exec`;
export const ACTION = {
    loginVerification: 'loginVerification',
    completionVerification: 'completionVerification',
};

// Color Themes
export const THEME = Object.freeze({
    BLACK_WHITE: 'white',
    SOLID_COLOR: 'solid',
    ALPHA_BLENDING: 'alpha',
});


/** Apply alpha blending based on n layers RGBA-color objects. */
function blendAlphaStack(n) {
    // Base color for a single object (light bluish)
    const { R, G, B, A } = { R: 150, G: 150, B: 255, A: 0.4 };
    
    // Calculate final alpha after n overlapping objects
    const alpha = 1 - Math.pow(1 - A, n);
    const blendColor = (c) => Math.round(c * alpha + 255 * (1 - alpha));
    
    return `rgba(
        ${blendColor(R)}, 
        ${blendColor(G)}, 
        ${blendColor(B)}, 
        ${alpha.toFixed(3)})`;
};


/** parse 'rgba(...)` to a list of 4 numbers */
function parseRgbaString(rgbaString) {
    const match = rgbaString.match(
        /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/
    );

    if (!match) {
        throw new Error('Invalid rgba format');
    }

    return [
        parseInt(match[1], 10),
        parseInt(match[2], 10),
        parseInt(match[3], 10),
        parseFloat(match[4]),
    ];
}

/** Compute the same RGB color given an RGBA color */
function rgbaToBlendedRgb(r, g, b, a, bg = [255, 255, 255]) {
    const blend = (channel, bgChannel) =>
        Math.round(a * channel + (1 - a) * bgChannel);

    const rFinal = blend(r, bg[0]);
    const gFinal = blend(g, bg[1]);
    const bFinal = blend(b, bg[2]);

    return `rgb(${rFinal}, ${gFinal}, ${bFinal})`;
}

const baseRGBA = parseRgbaString(blendAlphaStack(1));
const solidRGB = rgbaToBlendedRgb(...baseRGBA);

/** Compute fill color given mode and layers */
export function computeFill(mode, n=1) {
    if (mode === THEME.BLACK_WHITE) {
        return '#fff';
    }
    if (mode === THEME.SOLID_COLOR) {
        return solidRGB;
    }
    if (mode === THEME.ALPHA_BLENDING) {
        return blendAlphaStack(n);
    }
};


export const MIN_DISPLACEMENT_THR = 10;


export function createFrozenMap(list) {
    return Object.freeze(
        Object.fromEntries(list.map(item => [item, item]))
    );
}

export const CSV_HEADER = createFrozenMap([
    'PART_ID', 'QUESTION_ID', 'TIMESTAMP', 'STEP',
    'MOUSE_X', 'MOUSE_Y', 'OBJ_HOVER_ON', 'CLICK',
    'MODAL',
]);

export const OBJ_LIST = createFrozenMap([
    'QF1', 'QF2', 'QF3', 'QF4', 'QF5',
    'AO1', 'AO2', 'AO3', 'AO4', 'AO5',
    'CONF', 'HELP',
]);

export function formatTime(date = new Date()) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0');

    return `${h}:${m}:${s}:${ms}`;
}