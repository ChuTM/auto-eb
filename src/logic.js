import {
	decrypt,
	decodeHtml,
	addToLog,
	addToTable,
	getSimilarity,
	getCorrectArray,
	getQuestionCount,
	simulateClick,
	simulateTyping
} from "./utils.js";
import { TIMEOUT, CORRECT_COUNT } from "./config.js";

let currentQuestion = 0;

export function getIframeContext() {
	const overlay = document.querySelector(".overlay-player")?.contentDocument;
	return overlay?.querySelector("iframe")?.contentDocument;
}

export async function getXMLData() {
	const iframe = getIframeContext();
	if (!iframe) throw new Error("Course iframe not found");
	const res = await fetch(
		iframe.location.href.substring(
			0,
			iframe.location.href.lastIndexOf("/"),
		) + "/course/course_pc.exml",
	);
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

		return Array.from(questions).map((q, idx) => {
			let answers = [];
			const qType = q.getAttribute("type");

			if (qType === "smc") {
				const qCorrectAttr = q.getAttribute("correct");
				if (qCorrectAttr) {
					const isNumeric = /^\d+$/.test(qCorrectAttr);
					let val = isNumeric ? qCorrectAttr : decrypt(qCorrectAttr, seed);
					if (val) answers.push(val);
				}
			} else {
				q.querySelectorAll("[correct]").forEach((node) => {
					const nodeCorrect = node.getAttribute("correct");
					if (nodeCorrect) {
						let val = decrypt(nodeCorrect, seed);
						if (val) {
							answers.push(val.includes("/") ? val.split("/")[0] : val);
						}
					}
				});
			}

			let bodyParts = Array.from(
				q.querySelectorAll("set text:not([correct])"),
			).map((t) => t.getAttribute("text") || t.textContent);
			let reconstructedBody = bodyParts.join(" ").trim();

			if (reconstructedBody.length < 3) {
				reconstructedBody = q.getAttribute("text") || "";
			}

			return {
				id: idx,
				type: qType,
				headerText: q.getAttribute("text") || "",
				bodyText: decodeHtml(reconstructedBody),
				answers,
			};
		});
	} catch (err) {
		addToLog(`CRITICAL: XML Error: ${err.message}`, "DEV");
		return [];
	}
}

async function inputAnswerForCurrentQuestion(correct = true) {
	const allQuestions = await crackCourse();
	const iframe = getIframeContext();
	if (!iframe || allQuestions.length === 0) return false;

	const uiHead = decodeHtml(iframe.querySelector(".c_question-head")?.innerText || "");
	const uiBody = decodeHtml(iframe.querySelector(".c_question-body")?.innerText || "");
	const isRadio = iframe.querySelectorAll('input[type="radio"]').length > 0;

	let found = null;
	if (isRadio) {
		found = allQuestions.find((q) => {
			const xmlHead = decodeHtml(q.headerText);
			return xmlHead.length > 5 && (uiHead.includes(xmlHead) || xmlHead.includes(uiHead));
		});
	} else {
		let bestScore = 0;
		allQuestions.forEach((q) => {
			const score = getSimilarity(uiBody, q.bodyText);
			if (score > bestScore && score > 0.6) {
				bestScore = score;
				found = q;
			}
		});
	}

	if (found && found.answers.length > 0) {
		const totalTextLength = uiHead.length + uiBody.length;
		
		// Phase 1: Simulate psychological reading delay based on text complexity
		const readingTime = TIMEOUT("read", totalTextLength);
		await new Promise((r) => setTimeout(r, readingTime));

		const inputs = iframe.querySelectorAll('input:not([type="hidden"]), select, .c_input-box');

		for (let i = 0; i < found.answers.length; i++) {
			const ans = found.answers[i];
			
			if (isRadio) {
				const radioIdx = parseInt(ans) - 1;
				const radios = iframe.querySelectorAll('input[type="radio"]');
				let targetRadio = radios[radioIdx];
				
				if (!correct) {
					targetRadio = radioIdx === 0 ? radios[1] : radios[0];
				}
				
				if (targetRadio) {
					// Phase 2a: Simulate target localization and mouse interaction latency
					await new Promise((r) => setTimeout(r, TIMEOUT("click")));
					await simulateClick(targetRadio);
				}
			} else {
				const el = inputs[i];
				if (el) {
					const finalValue = correct ? ans : ans + "x";
					// Phase 2b: Mimic micro-movements prior to text field parsing
					await new Promise((r) => setTimeout(r, TIMEOUT("click")));
					if (el.tagName === "SELECT") {
						el.value = finalValue;
						el.dispatchEvent(new Event("change", { bubbles: true }));
					} else {
						await simulateTyping(el, finalValue);
					}
				}
			}
		}
		return true;
	}
	return false;
}

export function startAutomation() {
	const totalQuestions = getQuestionCount();
	const correctArray = getCorrectArray(totalQuestions, CORRECT_COUNT(totalQuestions));

	inputAnswerForCurrentQuestion(correctArray[currentQuestion]).then(async (success) => {
		if (success) {
			const iframe = getIframeContext();
			
			// Deliberate pause post-answering before moving cursor to submission vector
			await new Promise((r) => setTimeout(r, TIMEOUT("click")));
			const submitBtn = iframe?.querySelector("button[btn-for='submit']");
			if (!submitBtn) return;

			await simulateClick(submitBtn);

			// Gating time slice required for database mutation reflection
			await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 400 + 600)));
			const nextBtn = iframe?.querySelector("button[btn-for='next']");

			if (!nextBtn || nextBtn.offsetParent === null) {
				addToLog("Finished: No 'Next' button found.", "INFO");
				return;
			}

			await simulateClick(nextBtn);
			currentQuestion++;

			if (localStorage?.AUTOEB_AVOID_CONTINUOUS_ANSWERING !== "AVOID") {
				// Structural loop sequencing
				setTimeout(startAutomation, Math.floor(Math.random() * 500 + 500));
			}
		} else {
			addToLog("Automation stopped: No match found for this screen.", "WARN");
		}
	});
}