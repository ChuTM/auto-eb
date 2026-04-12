import { MAP } from './config.js';

export function decrypt(encoded, seed) {
    if (!encoded) return "N/A";

    let result = "";
    for (let i = 0; i < encoded.length; i++) {
        let code = encoded.charCodeAt(i);
        let s = -1;

        if (code === 32) s = 0;
        else if (code >= 42 && code <= 57) s = code - 41;
        else if (code >= 64 && code <= 126) s = code - 47;

        if (s >= 0 && s <= 79) {
            s = (s + i + seed) % 80;
            result += MAP[s];
        } else {
            result += encoded[i];
        }
    }
    return result;
}

export function decodeHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const decoded = doc.documentElement.textContent;
    
    // Your specific logic to strip non-alphanumeric characters
    return decoded.replace(/[^a-zA-Z0-9]/g, "");
}

export function addToLog(m) {
	console.log(m);
}

export function addToTable(t) {
	console.table(t);
}