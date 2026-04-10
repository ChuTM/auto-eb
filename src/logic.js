import { decrypt, decodeHtml, addToLog, addToTable } from "./utils.js";

async function crackCourse() {
	try {
		const overlay = document.querySelector(".overlay-player");
		if (!overlay?.contentDocument)
			throw new Error("Overlay player not found");

		const iframe = overlay.contentDocument.querySelector("iframe");
		if (!iframe?.contentDocument)
			throw new Error("Course iframe not found");

		// Replace the old baseURL line with this logic:
		const iframeSrc = iframe.contentDocument.location.href;
		// This regex grabs everything up to the last forward slash to get the directory
		const baseURL = iframeSrc.substring(0, iframeSrc.lastIndexOf("/"));
		
		console.log(`Compiled course data: ${baseURL}/course/course_pc.exml`);
		const res = await fetch(`${baseURL}/course/course_pc.exml`);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const xml = await res.text();

		const seedMatch = xml.match(/seed="(\d+)"/);
		const seed = seedMatch ? parseInt(seedMatch[1], 10) : 0;
		const questionMatches = [
			...xml.matchAll(/<question[^>]*?>([\s\S]*?)<\/question>/g),
		];

		return questionMatches.map((match, index) => {
			const fullTag = match[0];
			const block = match[1];
			const typeMatch = fullTag.match(/type="([^"]*)"/);
			const qType = typeMatch ? typeMatch[1] : "unknown";
			let qText = "";
			let answer = "N/A";

			if (qType === "fillin") {
				const sets = [...block.matchAll(/<text[^>]*?text="([^"]*)"/g)];
				qText = sets
					.map((s) => s[1].trim().toLowerCase().replace(/\s+/g, ""))
					.join(" | ");
				const correctMatch = block.match(/correct="([^"]*)"/);
				if (correctMatch) {
					answer = decrypt(correctMatch[1], seed);
					if (answer.includes("/")) answer = answer.split("/")[0];
				}
			} else {
				qText =
					fullTag.match(/text="([^"]*)"/)?.[1] ||
					`Question ${index + 1}`;
				qText = qText.toLowerCase().replace(/\s+/g, "");
				let correctValue = fullTag.match(/correct="([^"]*)"/)?.[1];
				if (correctValue) {
					if (
						correctValue.length === 1 &&
						/[A-Z]/.test(correctValue)
					) {
						const letterIndex = correctValue.charCodeAt(0) - 65;
						const answers = [
							...block.matchAll(/<answer[^>]*?text="([^"]*)"/g),
						];
						answer = answers[letterIndex]
							? answers[letterIndex][1]
							: decrypt(correctValue, seed);
					} else {
						answer = decrypt(correctValue, seed);
					}
				}
			}
			return { question: qText, answer };
		});
	} catch (err) {
		console.error("❌ Crack failed:", err.message);
		return [];
	}
}

async function getAllInput() {
	const overlay = document.querySelector(".overlay-player")?.contentDocument;
	const iframe = overlay?.querySelector("iframe")?.contentDocument;
	return iframe ? iframe.querySelectorAll("input") : [];
}

function getCurrentQuestionText() {
	try {
		const player =
			document.querySelector(".overlay-player")?.contentDocument;
		const course = player?.querySelector("body > #course")?.contentDocument;
		const entry =
			course?.querySelector("question-smc") ||
			course?.querySelector("question-fillin");
		if (course?.querySelector("question-fillin"))
			entry?.querySelector(".c_question-head")?.remove();
		return entry?.innerText.trim().toLowerCase().replace(/\s+/g, "") || "";
	} catch (e) {
		return "";
	}
}

async function showAnswerForCurrentQuestion() {
	const allQuestions = await crackCourse();
	if (allQuestions.length === 0) return false;

	const currentText = getCurrentQuestionText().trim().replaceAll("\n", "");
	if (!currentText) return false;

	const found = allQuestions.find(
		(q) =>
			q.question === currentText ||
			decodeHtml(q.question).includes(decodeHtml(currentText)) ||
			decodeHtml(currentText).includes(decodeHtml(q.question)),
	);

	if (found) {
		const inputs = await getAllInput();
		if (!inputs || inputs.length === 0) return false;

		if (inputs.length === 1 && inputs[0].type === "text") {
			inputs[0].value = found.answer;
			inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
			return true;
		}
		if (inputs[0].type === "radio") {
			const idx = parseInt(found.answer) - 1;
			if (inputs[idx]) {
				inputs[idx].checked = true;
				inputs[idx].dispatchEvent(
					new Event("change", { bubbles: true }),
				);
				return true;
			}
		}
	}

	addToLog("❌ No matching question found");
	addToTable(allQuestions);
}

export function startAutomation() {
	showAnswerForCurrentQuestion().then((success) => {
		if (success) {
			const iframe = document
				.querySelector(".overlay-player")
				?.contentDocument?.querySelector("iframe")?.contentDocument;
			const submitBtn = iframe?.querySelector("button[btn-for='submit']");
			setTimeout(() => {
				submitBtn?.click();
				setTimeout(() => {
					iframe?.querySelector("button[btn-for='next']")?.click();
					setTimeout(startAutomation, 500);
				}, 200);
			}, 500);
		}
	});
}
