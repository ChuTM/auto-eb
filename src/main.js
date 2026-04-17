import { startAutomation, getXMLData, getSeedFromXML } from "./logic.js";
import { addToLog, decrypt } from "./utils.js";

import AUTOEB_UI from "../res/ui.html";
import AUTOEB_STYLE from "../res/style.css";

(function () {
	sessionStorage.AUTOEB_VERSION = "1.30"; // VERSIONING

	(function () {
		document.body.classList.add("homepage");
		document.createElement("link");
		let prism_style = document.createElement("link");
		prism_style.rel = "stylesheet";
		prism_style.href =
			"https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css";
		document.head.appendChild(prism_style);

		// Append Popup Styles
		let popup_style = document.createElement("link");
		popup_style.rel = "stylesheet";
		popup_style.href = "https://alb-cdn.web.app/popupjs/pu.min.css";
		document.head.appendChild(popup_style);
	})();

	(function () {
		let custom_style_tag = document.createElement("style");
		custom_style_tag.innerHTML = AUTOEB_STYLE;

		document.head.appendChild(custom_style_tag);
		document.head.innerHTML += `<meta name="viewport" content="width=device-width, initial-scale=1">`;
	})();

	(function () {
		let start_autofill = document.createElement("button");
		start_autofill.innerText = "Activate Auto EB";
		start_autofill.addEventListener("click", startAutomation);
		start_autofill.style = `position: fixed;z-index: 10000;background: white;padding: 0.5rem 1rem;border-radius: 11px;box-shadow: 0 0 10px 0px #00000035;margin: 1rem;cursor: pointer;`;
		start_autofill.classList.add("auto-eb-hidden");
		document.body.appendChild(start_autofill);

		let getAllAnswers = document.createElement("button");
		getAllAnswers.innerText = "Get Source XML";
		getAllAnswers.classList.add("auto-eb-hidden");
		getAllAnswers.addEventListener("click", () => {
			getXMLData().then(async (data) => {
				addToLog("Original Data Received");

				const xmlString = await getXMLData();
				const regex = /correct="(.*?)"/g;
				const seed = getSeedFromXML(xmlString);

				const updatedXml = xmlString.replace(regex, (match, p1) => {
					const decrypted = decrypt(p1, seed);
					return `correct="${decrypted}"`;
				});

				// LOGGING CHECK: Verify tabs exist in console
				addToLog(updatedXml);

				pujs.pullOut(
					`
                <div style="display: flex; flex-direction: column; width: 100%; height: 100%;">
                    <center style="color:white; margin-bottom:10px; font-family: sans-serif;">Decrypted Source XML</center>
                    <pre class="language-xml" id="xml-container"><code id="xml-block" class="language-xml"></code></pre>
                </div>
                `,
					true,
					{ closeButton: true },
				);

				// CLEANING: Only remove excessive blank lines, leave indentation alone
				const cleanedXml = updatedXml
					.replace(/\r\n/g, "\n")
					.replace(/^\n{2,}/g, "\n")
					.trim();

				setTimeout(() => {
					const xml_block = document.getElementById("xml-block");
					if (xml_block) {
						// Set content as text to escape tags, then force highlight
						xml_block.textContent = cleanedXml;
						xml_block.className = "language-xml";

						try {
							Prism.highlightElement(xml_block);
						} catch (e) {
							console.error("Highlight Error:", e);
						}
					}
				}, 10); // Slight delay for the popup DOM to settle
			});
		});
		getAllAnswers.style = `position: fixed;z-index: 10000;margin: 1rem;top: 3.5rem;cursor: pointer;text-decoration: underline;`;

		document.body.appendChild(getAllAnswers);
	})();

	(function () {
		document.body.innerHTML += AUTOEB_UI;

		const AVOID_AUTO_CONTINUOUSLY_ANSWER_INTPUT = document.getElementById(
			"AUTOEB_AVOID_CONTINUOUS_ANSWERING",
		);

		AVOID_AUTO_CONTINUOUSLY_ANSWER_INTPUT.addEventListener("change", () => {
			const v = AVOID_AUTO_CONTINUOUSLY_ANSWER_INTPUT.checked;

			if (v) {
				localStorage.AUTOEB_AVOID_CONTINUOUS_ANSWERING = "AVOID";
				document.querySelector(
					".AUTOEB_AVOID_CONTINUOUS_ANSWERING-descriptive-text",
				).innerText = "AVOID";
			} else {
				localStorage.AUTOEB_AVOID_CONTINUOUS_ANSWERING = void 0;
				document.querySelector(
					".AUTOEB_AVOID_CONTINUOUS_ANSWERING-descriptive-text",
				).innerText = "Continuously";
			}
		});

		document
			.getElementById("AUTOEB_TIMEOUT")
			.addEventListener("input", () => {
				const value = document.getElementById("AUTOEB_TIMEOUT").value;

				localStorage.AUTOEB_TIMEOUT = value;
			});

		document
			.getElementById("AUTOEB_CORRECT_TARGET")
			.addEventListener("input", () => {
				const value = document.getElementById(
					"AUTOEB_CORRECT_TARGET",
				).value;

				localStorage.AUTOEB_CORRECT_TARGET = value;
			});

		document
			.querySelector(".autoeb-settings-button>.settings")
			.addEventListener("click", () => {
				const AUTOEB_OVERLAY =
					document.querySelector(".autoeb-overlay");

				AUTOEB_OVERLAY.style.transform = "translateY(0) translateX(0)";
				AUTOEB_OVERLAY.style.opacity = "1";
				AUTOEB_OVERLAY.style.pointerEvents = "all";
			});

		document
			.querySelector(".autoeb-overlay .overlay-close .close-button")
			.addEventListener("click", () => {
				const AUTOEB_OVERLAY =
					document.querySelector(".autoeb-overlay");

				AUTOEB_OVERLAY.style.transform =
					"translateY(50%)";
				AUTOEB_OVERLAY.style.opacity = "0";
				AUTOEB_OVERLAY.style.pointerEvents = "none";
			});
	})();

	(function () {
		pujs.setup.icons_path = "https://alphabrate.github.io/icons";
		pujs.setup.init();

		document.querySelectorAll("a.popup.link-blue").forEach((el) => {
			el.addEventListener("click", () => {
				document.body.classList.remove("homepage");
			});
		});
	})();
})();
