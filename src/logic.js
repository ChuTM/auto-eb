import { decrypt, decodeHtml, addToLog, addToTable, getSimilarity } from "./utils.js";
import { TIMEOUT } from "./config.js";

function getIframeContext() {
	const overlay = document.querySelector(".overlay-player")?.contentDocument;
	return overlay?.querySelector("iframe")?.contentDocument;
}

export async function getXMLData() {
	const iframe = getIframeContext();
	if (!iframe) throw new Error("Course iframe not found");
	const res = await fetch(iframe.location.href.substring(0, iframe.location.href.lastIndexOf("/")) + "/course/course_pc.exml");
	return await res.text();
}

export function getSeedFromXML(xml) {
	const seedMatch = xml.match(/seed="(\d+)"/);
	return seedMatch ? parseInt(seedMatch[1], 10) : 0;
}

export async function crackCourse() {
	try {
		const xmlString = await getXMLData();
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(xmlString, "text/xml");
		const seed = getSeedFromXML(xmlString);
		const questions = xmlDoc.querySelectorAll("question");

		return Array.from(questions).map((q, index) => {
			const answers = [];
			q.querySelectorAll("[correct]").forEach((node) => {
				let val = decrypt(node.getAttribute("correct"), seed);
				answers.push(val?.includes("/") ? val.split("/")[0] : val);
			});

			// NEW: If it's SMC, we still want to keep the original header-match possibility
			const qType = q.getAttribute("type");
			if (qType === "smc" && answers.length === 0) {
				const correctVal = q.getAttribute("correct");
				if (correctVal && /[A-Z]/.test(correctVal)) {
					const options = q.querySelectorAll("answer");
					answers.push(options[correctVal.charCodeAt(0) - 65]?.getAttribute("text") || decrypt(correctVal, seed));
				}
			}

			// Fingerprint: Use the text INSIDE the <set> tags (the sentence)
			const bodyText = Array.from(q.querySelectorAll("set")).map(s => decodeHtml(s.textContent)).join("");
			const headerText = decodeHtml(q.getAttribute("text") || "");

			return { type: qType, headerText, bodyText, answers };
		});
	} catch (err) { return []; }
}

async function showAnswerForCurrentQuestion() {
	const allQuestions = await crackCourse();
	const iframe = getIframeContext();
	if (!iframe || allQuestions.length === 0) return false;

	const uiHead = decodeHtml(iframe.querySelector(".c_question-head")?.innerText || "");
	const uiBody = decodeHtml(iframe.querySelector(".c_question-body")?.innerText || "");
	const inputs = iframe.querySelectorAll("input, select");

	addToLog(`UI Body: ${uiBody.slice(0, 50)}...`, "DEV");

	let found = null;
	let bestScore = 0;

	// PRIORITY 1: Match based on the Sentence Body (Works for single and multi fill-in)
	allQuestions.forEach(q => {
		if (!q.bodyText) return;
		const score = getSimilarity(uiBody, q.bodyText);
		if (score > bestScore) {
			bestScore = score;
			found = q;
		}
	});

	// If body match is weak or it's an MC question with no body text in XML, fallback to header
	if (bestScore < 0.7) {
		addToLog("Body match weak, trying Header matching...", "DEV");
		found = allQuestions.find(q => uiHead.includes(q.headerText) || q.headerText.includes(uiHead));
	} else {
		addToLog(`Body Match Success (${(bestScore * 100).toFixed(1)}%)`, "DEV");
	}

	if (found && found.answers.length > 0) {
		found.answers.forEach((ans, i) => {
			const el = inputs[i];
			if (!el) return;
			if (el.tagName === "SELECT") {
				el.value = ans;
				el.dispatchEvent(new Event("change", { bubbles: true }));
			} else if (el.type === "radio") {
				const idx = parseInt(ans) - 1;
				const radios = iframe.querySelectorAll('input[type="radio"]');
				if (radios[idx]) {
					radios[idx].checked = true;
					radios[idx].dispatchEvent(new Event("change", { bubbles: true }));
				}
			} else {
				el.value = ans;
				el.dispatchEvent(new Event("input", { bubbles: true }));
			}
		});
		return true;
	}

	addToLog("❌ No unique match found.", "DEV");
	return false;
}

export function startAutomation() {
	showAnswerForCurrentQuestion().then((success) => {
		if (success) {
			const iframe = getIframeContext();
			setTimeout(() => {
				iframe?.querySelector("button[btn-for='submit']")?.click();
				setTimeout(() => {
					iframe?.querySelector("button[btn-for='next']")?.click();
					if (localStorage?.avoidContinuousAnswering !== "AVOID") setTimeout(startAutomation, TIMEOUT());
				}, TIMEOUT());
			}, TIMEOUT());
		}
	});
}