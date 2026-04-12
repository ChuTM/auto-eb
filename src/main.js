import {
	startAutomation,
	crackCourse,
	getXMLData,
	getSeedFromXML,
} from "./logic.js";
import { addToLog, decrypt } from "./utils.js";

(function () {
	unsafeWindow.AUTOEB_VERSION = "1.21"; // VERSIONING

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

	let custom_style_tag = document.createElement("style");
	custom_style_tag.innerHTML = `
    .pujs-poAlert {
        z-index: 9999999999;
    }
    .pujs-poAlert::-webkit-scrollbar,
    .pujs-poAlert *::-webkit-scrollbar {
        display: none;
    }
    .homepage .auto-eb-hidden {
        display: none;
    }
    #xml-container {
        padding: 15px !important;
        background: #2d2d2d !important;
        border-radius: 8px;
        margin: 0 !important;
        /* CRITICAL: pre-wrap preserves the tabs while allowing horizontal scrolling if needed */
        white-space: pre !important; 
        overflow: auto !important;
    }
    #xml-block {
        display: block !important;
        white-space: pre !important;    
        line-height: 1.4 !important;    
        font-size: 13px !important;
        /* FORCE TAB SIZE */
        tab-size: 4 !important;         
        -moz-tab-size: 4 !important;
        -o-tab-size: 4 !important;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
        color: #ccc !important;
    }
    /* Stop Prism from messing with the layout */
    pre[class*="language-"] {
        margin: 0 !important;
        padding: 0 !important;
    }
    `;

	document.head.appendChild(custom_style_tag);

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

	pujs.setup.icons_path = "https://alphabrate.github.io/icons";
	pujs.setup.init();

	document.querySelectorAll("a.popup.link-blue").forEach((el) => {
		el.addEventListener("click", () => {
			document.body.classList.remove("homepage");
		});
	});
})();
