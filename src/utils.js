import { MAP } from "./config.js";

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

/**
 * Robust text normalization:
 * 1. Converts HTML entities to text.
 * 2. Lowercases everything.
 * 3. Strips ALL punctuation and special characters (keeping only letters and numbers).
 * 4. Removes all whitespace.
 */
export function decodeHtml(html) {
	if (!html) return "";
	const doc = new DOMParser().parseFromString(html, "text/html");
	const textContent = doc.documentElement.textContent || "";
	return textContent
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "") // Removes everything except lowercase a-z and 0-9
		.trim();
}

export function addToLog(m, type = "INFO") {
	const color = type === "DEV" ? "color: #00ff00" : "color: #ffffff";
	console.log(`%c[Auto EB][${type}] ${m}`, color);
}

export function getSimilarity(s1, s2) {
	if (!s1 || !s2) return 0;
	if (s1 === s2) return 1.0;
	let longer = s1.length > s2.length ? s1 : s2;
	let shorter = s1.length > s2.length ? s2 : s1;
	const costs = new Array();
	for (let i = 0; i <= longer.length; i++) {
		let lastValue = i;
		for (let j = 0; j <= shorter.length; j++) {
			if (i === 0) costs[j] = j;
			else if (j > 0) {
				let newValue = costs[j - 1];
				if (longer.charAt(i - 1) !== shorter.charAt(j - 1))
					newValue =
						Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
				costs[j - 1] = lastValue;
				lastValue = newValue;
			}
		}
		if (i > 0) costs[shorter.length] = lastValue;
	}
	return (longer.length - costs[shorter.length]) / parseFloat(longer.length);
}

export function addToTable(t) {
	console.table(t);
}
