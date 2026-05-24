import { startAutomation, getXMLData, getSeedFromXML } from "./logic.js";
import { addToLog, decrypt } from "./utils.js";

import AUTOEB_UI from "../res/ui.html";
import AUTOEB_STYLE from "../res/style.css";

(function () {
	sessionStorage.AUTOEB_VERSION = "1.50";

	// Append Popup styles to main head context to satisfy core UI dependency check
	const mainStyle = document.createElement("link");
	mainStyle.rel = "stylesheet";
	mainStyle.href = "https://alb-cdn.web.app/popupjs/pu.min.css";
	document.head.appendChild(mainStyle);

	const pujs_script = document.createElement("script");
	pujs_script.src = "https://alb-cdn.web.app/popupjs/pu.min.js";
	document.body.appendChild(pujs_script);

	const prism_script = document.createElement("script");
	prism_script.src = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js";
	document.body.appendChild(prism_script);

	// Initializing isolated UI encapsulation context (Shadow DOM)
	const host = document.createElement("div");
	host.style.position = "fixed";
	host.style.zIndex = "2147483647";
	document.body.appendChild(host);
	const shadow = host.attachShadow({ mode: "closed" });

	const appendStyleLink = (href) => {
		let link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = href;
		shadow.appendChild(link);
	};

	appendStyleLink("https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css");
	appendStyleLink("https://alb-cdn.web.app/popupjs/pu.min.css");

	let custom_style_tag = document.createElement("style");
	custom_style_tag.innerHTML = AUTOEB_STYLE;
	shadow.appendChild(custom_style_tag);

	const container = document.createElement("div");
	container.innerHTML = AUTOEB_UI;
	shadow.appendChild(container);

	let start_autofill = document.createElement("button");
	start_autofill.innerText = "Activate Auto EB";
	start_autofill.className = "auto-eb-hidden";
	start_autofill.style.cssText = `position: fixed; bottom: 2rem; left: 2rem; background: white; padding: 0.5rem 1rem; border-radius: 11px; box-shadow: 0 0 10px 0px #00000035; cursor: pointer; display: block; font-family: sans-serif; font-weight: bold; transition: all 0.2s ease;`;
	
	start_autofill.addEventListener("click", (e) => {
		// Reflect runtime lifecycle change on the primary action trigger
		start_autofill.innerText = "Auto EB is running...";
		start_autofill.style.background = "#2e7d32";
		start_autofill.style.color = "#ffffff";
		start_autofill.style.cursor = "default";
		start_autofill.disabled = true;

		// Propagate state variables directly into the parameters interface
		const statusTextElement = shadow.querySelector(".autoeb-status-text");
		if (statusTextElement) {
			statusTextElement.innerText = "Status: Auto EB is running...";
			statusTextElement.style.color = "#4caf50";
		}

		startAutomation(e);
	});
	shadow.appendChild(start_autofill);

	let getAllAnswers = document.createElement("button");
	getAllAnswers.innerText = "Avoid Detection,\nInteract with page first.\nGet Decrypted XML";
	getAllAnswers.style.cssText = `position: fixed; left: 2rem; bottom: 5rem; cursor: pointer; text-decoration: underline; background: transparent; border: none; color: #0066cc; font-family: sans-serif;`;
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

			addToLog(updatedXml);

			pujs.pullOut(
				`
				<div style="display: flex; flex-direction: column; width: 100%; height: 100%; overflow-x: scroll;">
					<center style="color:white; margin-bottom:10px; font-family: sans-serif;">Decrypted Source XML</center>
					<pre class="language-xml" id="xml-container"><code id="xml-block" class="language-xml"></code></pre>
				</div>
				`,
				true,
				{ closeButton: true },
			);

			const cleanedXml = updatedXml.replace(/\r\n/g, "\n").replace(/^\n{2,}/g, "\n").trim();

			setTimeout(() => {
				document.querySelector(".pujs-poAlert").style.zIndex = "9999999999";
				const xml_block = document.getElementById("xml-block");
				if (xml_block) {
					xml_block.textContent = cleanedXml;
					xml_block.className = "language-xml";
					try {
						window.Prism.highlightElement(xml_block);
					} catch (e) {
						console.error("Highlight Error:", e);
					}
				}
			}, 10);
		});
	});
	shadow.appendChild(getAllAnswers);

	const AVOID_AUTO_CONTINUOUS_RETRY = shadow.getElementById("AUTOEB_AVOID_CONTINUOUS_ANSWERING");
	AVOID_AUTO_CONTINUOUS_RETRY.addEventListener("change", () => {
		if (AVOID_AUTO_CONTINUOUS_RETRY.checked) {
			localStorage.AUTOEB_AVOID_CONTINUOUS_ANSWERING = "AVOID";
			shadow.querySelector(".AUTOEB_AVOID_CONTINUOUS_ANSWERING-descriptive-text").innerText = "AVOID";
		} else {
			localStorage.AUTOEB_AVOID_CONTINUOUS_ANSWERING = "CONTINUOUS";
			shadow.querySelector(".AUTOEB_AVOID_CONTINUOUS_ANSWERING-descriptive-text").innerText = "Continuously";
		}
	});

	shadow.getElementById("AUTOEB_TIMEOUT").addEventListener("input", () => {
		localStorage.AUTOEB_TIMEOUT = shadow.getElementById("AUTOEB_TIMEOUT").value;
	});

	shadow.getElementById("AUTOEB_CORRECT_TARGET").addEventListener("input", () => {
		localStorage.AUTOEB_CORRECT_TARGET = shadow.getElementById("AUTOEB_CORRECT_TARGET").value;
	});

	// shadow.querySelector(".autoeb-settings-button .settings").addEventListener("click", () => {
	// 	const OVERLAY = shadow.querySelector(".autoeb-overlay");
	// 	OVERLAY.style.transform = "translateY(0) translateX(0)";
	// 	OVERLAY.style.opacity = "1";
	// 	OVERLAY.style.pointerEvents = "all";
	// });

	shadow.querySelector(".autoeb-overlay .overlay-close .close-button").addEventListener("click", () => {
		const OVERLAY = shadow.querySelector(".autoeb-overlay");
		OVERLAY.style.transform = "translateY(50%)";
		OVERLAY.style.opacity = "0";
		OVERLAY.style.pointerEvents = "none";
	});

	setTimeout(() => {
		if (pujs && pujs.setup) {
			pujs.setup.icons_path = "https://alphabrate.github.io/icons";
			pujs.setup.init();
		}
	}, 500);
})();