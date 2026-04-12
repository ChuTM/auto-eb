// ==UserScript==
// @name         Auto EB
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Complete your EB tasks in seconds.
// @author       ReTrn.
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @require      https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js
// @require      https://alb-cdn.web.app/popupjs/pu.min.js
// @resource PRISM_CSS https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css
// @run-at       document-end
// @match        https://*.wiseman.com.hk/*
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
  var TIMEOUT = () => {
    const DEFAULT = 10;
    let t = (localStorage == null ? void 0 : localStorage.AUTOEB_TIMEOUT) || DEFAULT;
    if (Number.isNaN(parseInt(t))) {
      if (t == null ? void 0 : t.startsWith("random.")) {
        const min = parseInt(t.split(".")[1]);
        const max = parseInt(t.split(".")[2]);
        t = Math.floor(Math.random() * (max - min + 1)) + min;
      } else {
        addToLog(
          "USER SET: AUTOEB_TIMEOUT WRONGLY SET. \u2260 random.[s].[e]",
          "error"
        );
        t = DEFAULT;
      }
    }
    if (t < DEFAULT) {
      addToLog("USER SET: WAIT TIME TOO SHORT.", "warning");
      t = DEFAULT;
    }
    return t;
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
    const doc = new DOMParser().parseFromString(html, "text/html");
    const decoded = doc.documentElement.textContent;
    return decoded.replace(/[^a-zA-Z0-9]/g, "");
  }
  function addToLog2(m) {
    console.log(m);
  }
  function addToTable(t) {
    console.table(t);
  }

  // src/logic.js
  document.addEventListener("DOMContentLoaded", () => {
    console.log("[Auto EB] Plugin Ready.");
  });
  function getXMLData() {
    return __async(this, null, function* () {
      const overlay = document.querySelector(".overlay-player");
      if (!(overlay == null ? void 0 : overlay.contentDocument)) throw new Error("Overlay player not found");
      const iframe = overlay.contentDocument.querySelector("iframe");
      if (!(iframe == null ? void 0 : iframe.contentDocument)) throw new Error("Course iframe not found");
      const iframeSrc = iframe.contentDocument.location.href;
      const baseURL = iframeSrc.substring(0, iframeSrc.lastIndexOf("/"));
      console.log(`Compiled course data: ${baseURL}/course/course_pc.exml`);
      const res = yield fetch(`${baseURL}/course/course_pc.exml`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
        const xml = yield getXMLData();
        const seed = getSeedFromXML(xml);
        const questionMatches = [
          ...xml.matchAll(/<question[^>]*?>([\s\S]*?)<\/question>/g)
        ];
        return questionMatches.map((match, index) => {
          var _a, _b;
          const fullTag = match[0];
          const block = match[1];
          const typeMatch = fullTag.match(/type="([^"]*)"/);
          const qType = typeMatch ? typeMatch[1] : "unknown";
          let qText = "";
          let answer = "N/A";
          if (qType === "fillin") {
            const sets = [...block.matchAll(/<text[^>]*?text="([^"]*)"/g)];
            qText = sets.map((s) => s[1].trim().toLowerCase().replace(/\s+/g, "")).join(" | ");
            const correctMatch = block.match(/correct="([^"]*)"/);
            if (correctMatch) {
              answer = decrypt(correctMatch[1], seed);
              if (answer.includes("/")) answer = answer.split("/")[0];
            }
          } else {
            qText = ((_a = fullTag.match(/text="([^"]*)"/)) == null ? void 0 : _a[1]) || `Question ${index + 1}`;
            qText = qText.toLowerCase().replace(/\s+/g, "");
            let correctValue = (_b = fullTag.match(/correct="([^"]*)"/)) == null ? void 0 : _b[1];
            if (correctValue) {
              if (correctValue.length === 1 && /[A-Z]/.test(correctValue)) {
                const letterIndex = correctValue.charCodeAt(0) - 65;
                const answers = [
                  ...block.matchAll(/<answer[^>]*?text="([^"]*)"/g)
                ];
                answer = answers[letterIndex] ? answers[letterIndex][1] : decrypt(correctValue, seed);
              } else {
                answer = decrypt(correctValue, seed);
              }
            }
          }
          return { question: qText, answer };
        });
      } catch (err) {
        console.error("\u274C Crack failed:", err.message);
        return [];
      }
    });
  }
  function getAllInput() {
    return __async(this, null, function* () {
      var _a, _b;
      const overlay = (_a = document.querySelector(".overlay-player")) == null ? void 0 : _a.contentDocument;
      const iframe = (_b = overlay == null ? void 0 : overlay.querySelector("iframe")) == null ? void 0 : _b.contentDocument;
      return iframe ? iframe.querySelectorAll("input") : [];
    });
  }
  function getCurrentQuestionText() {
    var _a, _b, _c;
    try {
      const player = (_a = document.querySelector(".overlay-player")) == null ? void 0 : _a.contentDocument;
      const course = (_b = player == null ? void 0 : player.querySelector("body > #course")) == null ? void 0 : _b.contentDocument;
      const entry = (course == null ? void 0 : course.querySelector("question-smc")) || (course == null ? void 0 : course.querySelector("question-fillin"));
      if (course == null ? void 0 : course.querySelector("question-fillin"))
        (_c = entry == null ? void 0 : entry.querySelector(".c_question-head")) == null ? void 0 : _c.remove();
      return (entry == null ? void 0 : entry.innerText.trim().toLowerCase().replace(/\s+/g, "")) || "";
    } catch (e) {
      return "";
    }
  }
  function showAnswerForCurrentQuestion() {
    return __async(this, null, function* () {
      const allQuestions = yield crackCourse();
      if (allQuestions.length === 0) return false;
      const currentText = getCurrentQuestionText().trim().replaceAll("\n", "");
      if (!currentText) return false;
      const found = allQuestions.find(
        (q) => q.question === currentText || decodeHtml(q.question).includes(decodeHtml(currentText)) || decodeHtml(currentText).includes(decodeHtml(q.question))
      );
      if (found) {
        const inputs = yield getAllInput();
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
              new Event("change", { bubbles: true })
            );
            return true;
          }
        }
      }
      addToLog2("\u274C No matching question found");
      addToTable(allQuestions);
    });
  }
  function startAutomation() {
    showAnswerForCurrentQuestion().then((success) => {
      var _a, _b, _c;
      if (success) {
        const iframe = (_c = (_b = (_a = document.querySelector(".overlay-player")) == null ? void 0 : _a.contentDocument) == null ? void 0 : _b.querySelector("iframe")) == null ? void 0 : _c.contentDocument;
        const submitBtn = iframe == null ? void 0 : iframe.querySelector("button[btn-for='submit']");
        setTimeout(() => {
          submitBtn == null ? void 0 : submitBtn.click();
          setTimeout(() => {
            var _a2;
            (_a2 = iframe == null ? void 0 : iframe.querySelector("button[btn-for='next']")) == null ? void 0 : _a2.click();
            if ((localStorage == null ? void 0 : localStorage.avoidContinuousAnswering) !== "AVOID") {
              setTimeout(startAutomation, TIMEOUT());
            }
          }, TIMEOUT());
        }, TIMEOUT());
      }
    });
  }

  // src/main.js
  (function() {
    document.body.classList.add("homepage");
    const prismStyles = GM_getResourceText("PRISM_CSS");
    if (prismStyles) GM_addStyle(prismStyles);
    let popup_style = document.createElement("link");
    popup_style.rel = "stylesheet";
    popup_style.href = "https://alb-cdn.web.app/popupjs/pu.min.css";
    document.head.appendChild(popup_style);
    GM_addStyle(`
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
    `);
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
      getXMLData().then((data) => __async(null, null, function* () {
        addToLog2("Original Data Received");
        const xmlString = yield getXMLData();
        const regex = /correct="(.*?)"/g;
        const seed = getSeedFromXML(xmlString);
        const updatedXml = xmlString.replace(regex, (match, p1) => {
          const decrypted = decrypt(p1, seed);
          return `correct="${decrypted}"`;
        });
        addToLog2(updatedXml);
        pujs.pullOut(
          `
                <div style="display: flex; flex-direction: column; width: 100%; height: 100%;">
                    <center style="color:white; margin-bottom:10px; font-family: sans-serif;">Decrypted Source XML</center>
                    <pre class="language-xml" id="xml-container"><code id="xml-block" class="language-xml"></code></pre>
                </div>
                `,
          true,
          { closeButton: true }
        );
        const cleanedXml = updatedXml.replace(/\r\n/g, "\n").replace(/^\n{2,}/g, "\n").trim();
        setTimeout(() => {
          const xml_block = document.getElementById("xml-block");
          if (xml_block) {
            xml_block.textContent = cleanedXml;
            xml_block.className = "language-xml";
            try {
              Prism.highlightElement(xml_block);
            } catch (e) {
              console.error("Highlight Error:", e);
            }
          }
        }, 10);
      }));
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
})();
