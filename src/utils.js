import { MAP } from "./config.js";
import { getIframeContext } from "./logic.js";

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
	if (!html) return "";
	const doc = new DOMParser().parseFromString(html, "text/html");
	const textContent = doc.documentElement.textContent || "";
	return textContent
		.toLowerCase()
		.replace(/\s+/g, " ")
		.replace(/[^a-z0-9 ]/g, "")
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
	if (localStorage?.AUTOEB_DEBUG_MODE === "TRUE") {
		console.table(t);
	}
}

export function getCorrectArray(question_count, correct_target) {
	const arr = [];
	for (let i = 0; i < correct_target; i++) arr.push(true);
	for (let i = correct_target; i < question_count; i++) arr.push(false);
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

export function getQuestionCount() {
	return getIframeContext().documentElement.querySelector("group-pagination")
		.childElementCount;
}

/**
 * Fires a full structural mouse interaction sequence mimicking biological movement
 */
export async function simulateClick(el) {
	if (!el) return;
	const events = ["pointerdown", "mousedown", "pointerup", "mouseup", "click"];
	for (const name of events) {
		const ev = new MouseEvent(name, {
			bubbles: true,
			cancelable: true,
			buttons: 1
		});
		el.dispatchEvent(ev);
		await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 30 + 20)));
	}
}

/**
 * Simulates asynchronous character streams mimicking human keyboard inputs
 */
export async function simulateTyping(el, text) {
	if (!el) return;
	el.focus();
	el.value = "";
	
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		
		el.dispatchEvent(new KeyboardEvent("keydown", { key: char, bubbles: true }));
		el.dispatchEvent(new KeyboardEvent("keypress", { key: char, bubbles: true }));
		
		el.value += char;
		el.dispatchEvent(new Event("input", { bubbles: true }));
		
		el.dispatchEvent(new KeyboardEvent("keyup", { key: char, bubbles: true }));
		
		await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 60 + 60)));
	}
	
	el.dispatchEvent(new Event("change", { bubbles: true }));
	el.blur();
}

export async function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}