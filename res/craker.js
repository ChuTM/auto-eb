// ==================== CONFIG ====================
const MAP =
	"c3D1RFP9eM[UjINfOZi0Qg+mhkxSJ5p* uX8B}`-rs,LqAH@lnbVT.C{z4YWtGv72^/aw|do_6\\yE~]K";

// Main.js

const ATTR_LIST = ["src", "href", "value"];
const ATTR_CHILDREN_LIST = ["INPUT"];
const JUNK_KEYWORDS = new Set(["subject", "zoom_out_map", "question_answer"]);

// ==================== DECRYPTION ====================
function decrypt(encoded, seed) {
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

// ==================== MAIN CRACKER ====================
async function crackCourse() {
	try {
		const overlay = document.querySelector(".overlay-player");
		if (!overlay?.contentDocument)
			throw new Error("Overlay player not found");

		const iframe = overlay.contentDocument.querySelector("iframe");
		if (!iframe?.contentDocument)
			throw new Error("Course iframe not found");

		const baseURI = iframe.contentDocument.baseURI;
        console.log(`Compiled course data: ${baseURI}/course/course_pc.exml`);
		const res = await fetch(`${baseURI}/course/course_pc.exml`);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const xml = await res.text();

		const seedMatch = xml.match(/seed="(\d+)"/);
		const seed = seedMatch ? parseInt(seedMatch[1], 10) : 0;

		const questionMatches = [
			...xml.matchAll(/<question[^>]*?>([\s\S]*?)<\/question>/g),
		];

		const questions = questionMatches.map((match, index) => {
			const fullTag = match[0];
			const block = match[1];

			// Detect type
			const typeMatch = fullTag.match(/type="([^"]*)"/);
			const qType = typeMatch ? typeMatch[1] : "unknown";

			let qText = "";
			let answer = "N/A";

			if (qType === "fillin") {
				// --- FILL-IN LOGIC ---
				const sets = [...block.matchAll(/<text[^>]*?text="([^"]*)"/g)];
				qText = sets
					.map((s) => s[1].trim().toLowerCase().replace(/\s+/g, ""))
					.join(" | ");

				const correctMatch = block.match(/correct="([^"]*)"/);
				if (correctMatch) {
					answer = decrypt(correctMatch[1], seed);
                    if (answer.includes("/")) {
                        answer = answer.split("/")[0];
                    }
				}
			} else {
				// --- MULTIPLE CHOICE LOGIC ---
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
							: `${decrypt(correctValue, seed)}`;
					} else {
						answer = decrypt(correctValue, seed);
					}
				} else {
					const deepMatch = block.match(/correct="([^"]*)"/);
					if (deepMatch) {
						answer = decrypt(deepMatch[1], seed);
					}
				}
			}

			return { question: qText, answer };
		});

		console.log(`📊 Extracted ${questions.length} questions`);
		return questions;
	} catch (err) {
		console.error("❌ Crack failed:", err.message);
		return [];
	}
}

async function getAllInput() {
	return new Promise((resolve) => {
		const overlay = document.querySelector(".overlay-player");
		if (!overlay?.contentDocument)
			throw new Error("Overlay player not found");

		const iframe = overlay.contentDocument.querySelector("iframe");
		if (!iframe?.contentDocument)
			throw new Error("Course iframe not found");

		const inputs = iframe.contentDocument.querySelectorAll("input");
		resolve(inputs);
	});
}

// ==================== GET CURRENT QUESTION ====================
function getCurrentQuestionText() {
	try {
		const player =
			document.querySelector(".overlay-player")?.contentDocument;
		const course = player?.querySelector("body > #course")?.contentDocument;
		const entry =
			course?.querySelector("question-smc") ||
			course?.querySelector("question-fillin");

		if (course?.querySelector("question-fillin"))
			entry.querySelector(".c_question-head")?.remove();

		return entry?.innerText.trim().toLowerCase().replace(/\s+/g, "") || "";
	} catch (e) {
		console.warn("Could not read current question");
		return "";
	}
}

function decodeHtml(html) {
	const txt = document.createElement("textarea");
	txt.innerHTML = html;
	return txt.value.replace(/[^a-zA-Z0-9]/g, "");
}

// ==================== MATCH & SHOW ANSWER ====================
async function showAnswerForCurrentQuestion() {
	return new Promise(async (resolve) => {
		console.log("🔍 Searching for current question...");

		const allQuestions = await crackCourse();
		if (allQuestions.length === 0) return;

		const currentText = getCurrentQuestionText()
			.trim()
			.replaceAll("\n", "")
			.replaceAll(
				"Complete the sentences using the correct word or phrase from the options given. Each word or phrase can be used only once.",
				"",
			);

		console.log(`Question Text: ${currentText}`);

		if (!currentText) {
			console.warn("⚠️ Could not detect current question text");
			resolve(false);
			return;
		}

		const found = allQuestions.find(
			(q) =>
				q.question === currentText ||
				decodeHtml(q.question.trim().replaceAll("\n", "")).includes(
					decodeHtml(currentText),
				) ||
				decodeHtml(currentText).includes(
					decodeHtml(q.question.trim().replaceAll("\n", "")),
				),
		);

		if (found) {
			console.log("%c✅ Answer found:", "color: lime; font-size: 16px;");
			console.log(
				"%c" + found.answer,
				"color: yellow; font-size: 18px; font-weight: bold;",
			);

			getAllInput().then((inputs) => {
				if (!inputs || inputs.length === 0) {
					resolve(false);
					return;
				}
				if (inputs.length === 1 && inputs[0].type === "text") {
					inputs[0].value = found.answer;
					inputs[0].dispatchEvent(
						new Event("input", { bubbles: true }),
					);
					resolve(true);
				}
				if (inputs[0].type === "radio") {
					const idx = parseInt(found.answer) - 1;
					if (inputs[idx]) {
						inputs[idx].checked = true;
						inputs[idx].dispatchEvent(
							new Event("change", { bubbles: true }),
						);
						resolve(true);
					}
				}
			});
		} else {
			console.log("❌ No matching question found");
			console.table(allQuestions);
			resolve(false);
		}
	});
}

function startAutomation() {
	showAnswerForCurrentQuestion().then((r) => {
		if (r) {
			const overlay = document.querySelector(".overlay-player");
			if (!overlay?.contentDocument)
				throw new Error("Overlay player not found");

			const iframe = overlay.contentDocument.querySelector("iframe");
			if (!iframe?.contentDocument)
				throw new Error("Course iframe not found");

			const submitBtn = iframe.contentDocument.querySelector(
				"button[btn-for='submit']",
			);

			setTimeout(() => {
				submitBtn?.click();
				submitBtn?.dispatchEvent(new Event("click", { bubbles: true }));
				setTimeout(() => {
					const nextBtn = iframe.contentDocument.querySelector(
						"button[btn-for='next']",
					);
					nextBtn?.click();
					nextBtn?.dispatchEvent(
						new Event("click", { bubbles: true }),
					);
					startAutomation();
				}, 100);
			}, 100);
		}
	});
}

startAutomation();
