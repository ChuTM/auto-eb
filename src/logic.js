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

/**
 * Parses the XML and reconstructs sentences for fill-in-the-blank questions
 * to avoid matching generic header instructions.
 */
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

            // --- MC (SMC) LOGIC ---
            if (qType === "smc") {
                const qCorrectAttr = q.getAttribute("correct");
                if (qCorrectAttr) {
                    // SMC correct values are indices ("1", "2") on the question tag itself
                    const isNumeric = /^\d+$/.test(qCorrectAttr);
                    let val = isNumeric ? qCorrectAttr : decrypt(qCorrectAttr, seed);
                    if (val) answers.push(val);
                }
            } 
            // --- FILL-IN LOGIC ---
            else {
                // Fill-in answers are inside child <text> or <answer> tags
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

            // Reconstruct body text for fill-ins
            let bodyParts = Array.from(q.querySelectorAll("set text:not([correct])"))
                .map(t => t.getAttribute("text") || t.textContent);
            let reconstructedBody = bodyParts.join(" ").trim();

            if (reconstructedBody.length < 3) {
                reconstructedBody = q.getAttribute("text") || "";
            }

            return { 
                id: idx, 
                type: qType, 
                headerText: q.getAttribute("text") || "", 
                bodyText: decodeHtml(reconstructedBody), 
                answers 
            };
        });
    } catch (err) { 
        addToLog(`CRITICAL: XML Extraction Error: ${err.message}`, "DEV");
        return []; 
    }
}

async function showAnswerForCurrentQuestion() {
    const allQuestions = await crackCourse();
    const iframe = getIframeContext();
    if (!iframe || allQuestions.length === 0) return false;

    const uiHead = decodeHtml(iframe.querySelector(".c_question-head")?.innerText || "");
    const uiBody = decodeHtml(iframe.querySelector(".c_question-body")?.innerText || "");
    const isRadio = iframe.querySelectorAll('input[type="radio"]').length > 0;

    addToLog(`DEBUG SESSION: ${isRadio ? "Multiple Choice" : "Fill-in"}`, "DEV");

    // Preparations for the table... (Code remains same as previous version)
    const debugData = allQuestions.map(q => {
        let score = 0;
        let matchResult = "NO";
        if (isRadio) {
            const xmlHead = decodeHtml(q.headerText);
            const isMatch = xmlHead.length > 5 && (uiHead.includes(xmlHead) || xmlHead.includes(uiHead));
            matchResult = isMatch ? "YES" : "NO";
        } else {
            score = getSimilarity(uiBody, q.bodyText);
            matchResult = score > 0.6 ? `YES` : `NO`;
        }
        return { ID: q.id, Match: matchResult, "XML Reconstructed": q.bodyText.slice(0, 50), "Answers": q.answers.join(" | "), _score: score };
    });
    addToTable(debugData);

    // Finding the match
    let found = null;
    if (isRadio) {
        found = allQuestions.find(q => {
            const xmlHead = decodeHtml(q.headerText);
            return xmlHead.length > 5 && (uiHead.includes(xmlHead) || xmlHead.includes(uiHead));
        });
    } else {
        let bestScore = 0;
        allQuestions.forEach(q => {
            const score = getSimilarity(uiBody, q.bodyText);
            if (score > bestScore && score > 0.6) {
                bestScore = score;
                found = q;
            }
        });
    }

    if (found) {
        // --- THIS IS THE PART YOU NEED ---
        addToLog(`[TARGET] ID: ${found.id} | TYPE: ${found.type}`, "DEV");
        addToLog(`[ANSWERS FOUND] ${JSON.stringify(found.answers)}`, "DEV");
        
        const inputs = iframe.querySelectorAll('input:not([type="hidden"]), select, .c_input-box');
        
        found.answers.forEach((ans, i) => {
            if (isRadio) {
                // Radio buttons: 'ans' is usually "1", "2", "3" etc.
                const radioIdx = parseInt(ans) - 1;
                const radios = iframe.querySelectorAll('input[type="radio"]');
                
                addToLog(`[ACTION] Attempting to click Radio at Index: ${radioIdx} (Answer was: ${ans})`, "DEV");
                
                if (radios[radioIdx]) {
                    radios[radioIdx].checked = true;
                    radios[radioIdx].dispatchEvent(new Event("change", { bubbles: true }));
                    radios[radioIdx].click();
                    addToLog(`[SUCCESS] Radio ${radioIdx} clicked.`, "DEV");
                } else {
                    addToLog(`[ERROR] Radio index ${radioIdx} not found. Total radios: ${radios.length}`, "error");
                }
            } else {
                // Fill-ins
                const el = inputs[i];
                if (el) {
                    addToLog(`[ACTION] Filling input ${i} with value: "${ans}"`, "DEV");
                    el.value = ans;
                    const eventType = el.tagName === "SELECT" ? "change" : "input";
                    el.dispatchEvent(new Event(eventType, { bubbles: true }));
                } else {
                    addToLog(`[ERROR] Input index ${i} not found in UI.`, "error");
                }
            }
        });
        return true;
    }

    addToLog("❌ FAIL: No matching XML entry found.", "DEV");
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
                    if (localStorage?.avoidContinuousAnswering !== "AVOID") {
                        setTimeout(startAutomation, TIMEOUT());
                    }
                }, TIMEOUT());
            }, TIMEOUT());
        }
    });
}