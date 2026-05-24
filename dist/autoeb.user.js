// ==UserScript==
// @name         Auto EB
// @namespace    http://tampermonkey.net/
// @version      1.50
// @description  Complete your EB tasks in seconds.
// @author       ReTrn.
// @grant        GM_xmlhttpRequest
// @require      https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js
// @require      https://alb-cdn.web.app/popupjs/pu.min.js
// @require      https://raw.githubusercontent.com/ChuTM/auto-eb/refs/heads/main/services/updater.user.js
// @run-at       document-end
// @match        https://lms1.wiseman.com.hk/lms/user/secure/course/eb/select_lesson/
// @match        https://lms1.wiseman.com.hk/lms/user/secure/course/eb/select_theme/select_module/select_skill/
// @updateURL    https://raw.githubusercontent.com/ChuTM/auto-eb/refs/heads/main/dist/autoeb.user.js
// @downloadURL  https://raw.githubusercontent.com/ChuTM/auto-eb/refs/heads/main/dist/autoeb.user.js
// ==/UserScript==
(() => {
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/config.js
  var MAP = "c3D1RFP9eM[UjINfOZi0Qg+mhkxSJ5p* uX8B}`-rs,LqAH@lnbVT.C{z4YWtGv72^/aw|do_6\\yE~]K";
  var TIMEOUT = (type = "default", length = 0) => {
    const BASE_DELAY = parseInt(localStorage == null ? void 0 : localStorage.AUTOEB_TIMEOUT) || 200;
    let t = BASE_DELAY;
    if (type === "read") {
      t = length * Math.floor(Math.random() * 20 + 30);
      t = Math.max(t, 1200);
    } else if (type === "type") {
      t = length * Math.floor(Math.random() * 80 + 70);
    } else if (type === "click") {
      t = Math.floor(Math.random() * 400 + 300);
    }
    const jitter = Math.floor(Math.random() * 150) - 75;
    const totalDelay = Math.max(100, t + jitter);
    return totalDelay;
  };
  var CORRECT_COUNT = (total) => {
    const target = localStorage.AUTOEB_CORRECT_TARGET || void 0;
    if (!target || isNaN(parseInt(target))) return total;
    return Math.round(parseFloat(target) * total);
  };

  // src/utils.js
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
  function decodeHtml(html) {
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    const textContent = doc.documentElement.textContent || "";
    return textContent.toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();
  }
  function addToLog(m, type = "INFO") {
    const color = type === "DEV" ? "color: #00ff00" : "color: #ffffff";
    console.log(`%c[Auto EB][${type}] ${m}`, color);
  }
  function getSimilarity(s1, s2) {
    if (!s1 || !s2) return 0;
    if (s1 === s2) return 1;
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
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[shorter.length] = lastValue;
    }
    return (longer.length - costs[shorter.length]) / parseFloat(longer.length);
  }
  function getCorrectArray(question_count, correct_target) {
    const arr = [];
    for (let i = 0; i < correct_target; i++) arr.push(true);
    for (let i = correct_target; i < question_count; i++) arr.push(false);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function getQuestionCount() {
    return getIframeContext().documentElement.querySelector("group-pagination").childElementCount;
  }
  function simulateClick(el) {
    return __async(this, null, function* () {
      if (!el) return;
      const events = ["pointerdown", "mousedown", "pointerup", "mouseup", "click"];
      for (const name of events) {
        const ev = new MouseEvent(name, {
          bubbles: true,
          cancelable: true,
          buttons: 1
        });
        el.dispatchEvent(ev);
        yield new Promise((r) => setTimeout(r, Math.floor(Math.random() * 30 + 20)));
      }
    });
  }
  function simulateTyping(el, text) {
    return __async(this, null, function* () {
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
        yield new Promise((r) => setTimeout(r, Math.floor(Math.random() * 60 + 60)));
      }
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.blur();
    });
  }

  // src/logic.js
  var currentQuestion = 0;
  function getIframeContext() {
    var _a, _b;
    const overlay = (_a = document.querySelector(".overlay-player")) == null ? void 0 : _a.contentDocument;
    return (_b = overlay == null ? void 0 : overlay.querySelector("iframe")) == null ? void 0 : _b.contentDocument;
  }
  function getXMLData() {
    return __async(this, null, function* () {
      const iframe = getIframeContext();
      if (!iframe) throw new Error("Course iframe not found");
      const res = yield fetch(
        iframe.location.href.substring(
          0,
          iframe.location.href.lastIndexOf("/")
        ) + "/course/course_pc.exml"
      );
      return yield res.text();
    });
  }
  function getSeedFromXML(xml) {
    const seedMatch = xml.match(/seed="(\d+)"/);
    return seedMatch ? parseInt(seedMatch[1], 10) : 0;
  }
  function crackCourse() {
    return __async(this, null, function* () {
      try {
        const xmlString = yield getXMLData();
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
            q.querySelectorAll("set text:not([correct])")
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
            answers
          };
        });
      } catch (err) {
        addToLog(`CRITICAL: XML Error: ${err.message}`, "DEV");
        return [];
      }
    });
  }
  function inputAnswerForCurrentQuestion(correct = true) {
    return __async(this, null, function* () {
      var _a, _b;
      const allQuestions = yield crackCourse();
      const iframe = getIframeContext();
      if (!iframe || allQuestions.length === 0) return false;
      const uiHead = decodeHtml(((_a = iframe.querySelector(".c_question-head")) == null ? void 0 : _a.innerText) || "");
      const uiBody = decodeHtml(((_b = iframe.querySelector(".c_question-body")) == null ? void 0 : _b.innerText) || "");
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
        const readingTime = TIMEOUT("read", totalTextLength);
        yield new Promise((r) => setTimeout(r, readingTime));
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
              yield new Promise((r) => setTimeout(r, TIMEOUT("click")));
              yield simulateClick(targetRadio);
            }
          } else {
            const el = inputs[i];
            if (el) {
              const finalValue = correct ? ans : ans + "x";
              yield new Promise((r) => setTimeout(r, TIMEOUT("click")));
              if (el.tagName === "SELECT") {
                el.value = finalValue;
                el.dispatchEvent(new Event("change", { bubbles: true }));
              } else {
                yield simulateTyping(el, finalValue);
              }
            }
          }
        }
        return true;
      }
      return false;
    });
  }
  function startAutomation() {
    const totalQuestions = getQuestionCount();
    const correctArray = getCorrectArray(totalQuestions, CORRECT_COUNT(totalQuestions));
    inputAnswerForCurrentQuestion(correctArray[currentQuestion]).then((success) => __async(null, null, function* () {
      if (success) {
        const iframe = getIframeContext();
        yield new Promise((r) => setTimeout(r, TIMEOUT("click")));
        const submitBtn = iframe == null ? void 0 : iframe.querySelector("button[btn-for='submit']");
        if (!submitBtn) return;
        yield simulateClick(submitBtn);
        yield new Promise((r) => setTimeout(r, Math.floor(Math.random() * 400 + 600)));
        const nextBtn = iframe == null ? void 0 : iframe.querySelector("button[btn-for='next']");
        if (!nextBtn || nextBtn.offsetParent === null) {
          addToLog("Finished: No 'Next' button found.", "INFO");
          return;
        }
        yield simulateClick(nextBtn);
        currentQuestion++;
        if ((localStorage == null ? void 0 : localStorage.AUTOEB_AVOID_CONTINUOUS_ANSWERING) !== "AVOID") {
          setTimeout(startAutomation, Math.floor(Math.random() * 500 + 500));
        }
      } else {
        addToLog("Automation stopped: No match found for this screen.", "WARN");
      }
    }));
  }

  // res/ui.html
  var ui_default = '<div class="autoeb-overlay" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transform: translateY(50%); transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1); z-index: 2147483647;">\n    <div class="autoeb-settings-card" style="background: #1e1e1e; color: #ffffff; padding: 2rem; border-radius: 16px; width: 90%; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-family: sans-serif; border: 1px solid #333;">\n        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">\n            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Engine Parameters</h2>\n            <div class="overlay-close"><button class="close-button" style="background: transparent; border: none; color: #888; cursor: pointer; font-size: 1.2rem;">&times;</button></div>\n        </div>\n        \n        <!-- Live tracking module inside operational controller panel -->\n        <div class="autoeb-status-text" style="margin-bottom: 1.5rem; font-size: 0.9rem; color: #aaa; font-weight: 500; transition: color 0.2s ease;">Status: Idle</div>\n\n        <div style="margin-bottom: 1.2rem;">\n            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: #aaa;">Target Correct Count</label>\n            <input type="number" id="AUTOEB_CORRECT_TARGET" style="width: 100%; background: #2a2a2a; border: 1px solid #444; border-radius: 8px; padding: 0.6rem; color: white; box-sizing: border-box;" placeholder="e.g. 8">\n        </div>\n\n        <div style="margin-bottom: 1.2rem;">\n            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: #aaa;">Step Delay Latency (ms)</label>\n            <input type="number" id="AUTOEB_TIMEOUT" style="width: 100%; background: #2a2a2a; border: 1px solid #444; border-radius: 8px; padding: 0.6rem; color: white; box-sizing: border-box;" placeholder="e.g. 2000">\n        </div>\n\n        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #333;">\n            <span style="font-size: 0.85rem; color: #aaa;">Continuous Answering Mode</span>\n            <label class="switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">\n                <input type="checkbox" id="AUTOEB_AVOID_CONTINUOUS_ANSWERING" style="opacity: 0; width: 0; height: 0;">\n                <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #444; transition: .3s; border-radius: 24px;"></span>\n            </label>\n        </div>\n        <div style="font-size: 0.75rem; color: #666; margin-top: 0.4rem; text-align: right;" class="AUTOEB_AVOID_CONTINUOUS_ANSWERING-descriptive-text">Continuously</div>\n    </div>\n</div>\n<!-- \n<div class="autoeb-settings-button" style="position: fixed; bottom: 2rem; left: 13rem; z-index: 2147483646;">\n    <button class="settings" style="background: #2a2a2a; color: white; border: 1px solid #444; padding: 0.5rem 1rem; border-radius: 11px; box-shadow: 0 0 10px rgba(0,0,0,0.2); cursor: pointer; font-family: sans-serif; font-weight: 500;">Settings</button>\n</div> -->';

  // res/style.css
  var style_default = '.pujs-poAlert {\n	z-index: 9999999999 !important;\n}\n.pujs-poAlert::-webkit-scrollbar,\n.pujs-poAlert *::-webkit-scrollbar {\n	display: none !important;\n}\n.homepage .auto-eb-hidden {\n	display: none;\n}\n#xml-container {\n	padding: 15px !important;\n	background: #2d2d2d !important;\n	border-radius: 8px;\n	margin: 0 !important;\n	/* CRITICAL: pre-wrap preserves the tabs while allowing horizontal scrolling if needed */\n	white-space: pre !important;\n	overflow: auto !important;\n}\n#xml-block {\n	display: block !important;\n	white-space: pre !important;\n	line-height: 1.4 !important;\n	font-size: 13px !important;\n	/* FORCE TAB SIZE */\n	tab-size: 4 !important;\n	-moz-tab-size: 4 !important;\n	-o-tab-size: 4 !important;\n	font-family: "Consolas", "Monaco", "Courier New", monospace !important;\n	color: #ccc !important;\n}\n/* Stop Prism from messing with the layout */\npre[class*="language-"] {\n	margin: 0 !important;\n	padding: 0 !important;\n}\n\n.autoeb-overlay {\n	font-size: 16px;\n\n	position: fixed;\n	top: 0;\n	bottom: 0;\n	left: 0;\n	right: 0;\n\n	background: rgba(255, 255, 255, 0.75);\n	backdrop-filter: blur(17px);\n	-webkit-backdrop-filter: blur(17px);\n	z-index: 10000000;\n\n	pointer-events: none;\n	opacity: 0;\n\n	transition: 1s;\n\n	transform: translateY(50%);\n}\n\n.autoeb-overlay .component {\n	width: 95%;\n	background-color: white;\n	margin: 2em auto;\n	padding: 2em;\n	border-radius: 17px;\n	border: 1.5px solid rgba(0, 0, 0, 0.05);\n	box-shadow: 0 4px 10px 0 rgba(0, 0, 0, 0.1);\n}\n\n.autoeb-overlay .component > .title {\n	font-size: 2em;\n	font-weight: 600;\n}\n\n.autoeb-overlay .component .layer {\n	display: flex;\n	flex-direction: row;\n	flex-wrap: wrap;\n\n	.information {\n		padding: 1em 2em;\n		width: 80%;\n		display: flex;\n		flex-direction: column;\n\n		.title {\n			font-size: 1.2em;\n			font-weight: 400;\n			color: rgba(0, 0, 0, 0.6);\n		}\n\n		.description {\n			font-size: 0.8em;\n			font-weight: 400;\n			color: rgba(0, 0, 0, 0.4);\n			display: flex;\n			flex-direction: column;\n		}\n\n		.description > .variable {\n			font-size: 0.6em;\n			width: fit-content;\n			padding: 2px 6px;\n			background: rgba(0, 0, 0, 0.05);\n			border-radius: 5px;\n		}\n	}\n\n	.action {\n		padding: 1em 2em;\n		color: rgba(0, 0, 0, 0.6);\n	}\n\n	input {\n		color: rgba(0, 0, 0, 0.6);\n		border: 1px solid black;\n		border-radius: 3px;\n		padding: 2px 7px;\n	}\n\n	.action {\n		width: 20%;\n		min-width: 200px;\n	}\n	.AUTOEB_AVOID_CONTINUOUS_ANSWERING-descriptive-text {\n		content: "Continuously";\n	}\n	#AUTOEB_AVOID_CONTINUOUS_ANSWERING:checked\n		+ .AUTOEB_AVOID_CONTINUOUS_ANSWERING-descriptive-text {\n		content: "AVOID";\n	}\n}\n\n.autoeb-settings-button {\n	position: fixed;\n	bottom: 2rem;\n	right: 2rem;\n	z-index: 9999999;\n    display: flex;\n    justify-content: center;\n    align-items: center;\n    gap: 1em;\n}\n\n.autoeb-settings-button .settings {\n	display: block;\n	width: 24px;\n	height: 24px;\n    cursor: pointer;\n}\n\n.close-button {\n	font-size: 3em;\n	cursor: pointer;\n	color: black;\n	font-weight: 300;\n	position: absolute;\n	top: 2rem;\n	right: 2rem;\n	height: 24px;\n	width: 24px;\n	display: flex;\n	justify-content: center;\n	align-items: center;\n}';

  // src/main.js
  (function() {
    sessionStorage.AUTOEB_VERSION = "1.50";
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
    custom_style_tag.innerHTML = style_default;
    shadow.appendChild(custom_style_tag);
    const container = document.createElement("div");
    container.innerHTML = ui_default;
    shadow.appendChild(container);
    let start_autofill = document.createElement("button");
    start_autofill.innerText = "Activate Auto EB";
    start_autofill.className = "auto-eb-hidden";
    start_autofill.style.cssText = `position: fixed; bottom: 2rem; left: 2rem; background: white; padding: 0.5rem 1rem; border-radius: 11px; box-shadow: 0 0 10px 0px #00000035; cursor: pointer; display: block; font-family: sans-serif; font-weight: bold; transition: all 0.2s ease;`;
    start_autofill.addEventListener("click", (e) => {
      start_autofill.innerText = "Auto EB is running...";
      start_autofill.style.background = "#2e7d32";
      start_autofill.style.color = "#ffffff";
      start_autofill.style.cursor = "default";
      start_autofill.disabled = true;
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
      getXMLData().then((data) => __async(null, null, function* () {
        addToLog("Original Data Received");
        const xmlString = yield getXMLData();
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
          { closeButton: true }
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
      }));
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
})();
