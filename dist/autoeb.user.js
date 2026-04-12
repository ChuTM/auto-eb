// ==UserScript==
// @name         Auto EB
// @namespace    http://tampermonkey.net/
// @version      1.21
// @description  Complete your EB tasks in seconds.
// @author       ReTrn.
// @grant        GM_xmlhttpRequest
// @require      https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js
// @require      https://alb-cdn.web.app/popupjs/pu.min.js
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
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    const textContent = doc.documentElement.textContent || "";
    return textContent.toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();
  }
  function addToLog2(m, type = "INFO") {
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
  function addToTable(t) {
    console.table(t);
  }

  // src/logic.js
  function getIframeContext() {
    var _a, _b;
    const overlay = (_a = document.querySelector(".overlay-player")) == null ? void 0 : _a.contentDocument;
    return (_b = overlay == null ? void 0 : overlay.querySelector("iframe")) == null ? void 0 : _b.contentDocument;
  }
  function getXMLData() {
    return __async(this, null, function* () {
      const iframe = getIframeContext();
      if (!iframe) throw new Error("Course iframe not found");
      const res = yield fetch(iframe.location.href.substring(0, iframe.location.href.lastIndexOf("/")) + "/course/course_pc.exml");
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
          let bodyParts = Array.from(q.querySelectorAll("set text:not([correct])")).map((t) => t.getAttribute("text") || t.textContent);
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
        addToLog2(`CRITICAL: XML Error: ${err.message}`, "DEV");
        return [];
      }
    });
  }
  function showAnswerForCurrentQuestion() {
    return __async(this, null, function* () {
      var _a, _b;
      const allQuestions = yield crackCourse();
      const iframe = getIframeContext();
      if (!iframe || allQuestions.length === 0) return false;
      const uiHead = decodeHtml(((_a = iframe.querySelector(".c_question-head")) == null ? void 0 : _a.innerText) || "");
      const uiBody = decodeHtml(((_b = iframe.querySelector(".c_question-body")) == null ? void 0 : _b.innerText) || "");
      const isRadio = iframe.querySelectorAll('input[type="radio"]').length > 0;
      const debugData = allQuestions.map((q) => {
        let score = 0;
        let matchResult = "NO";
        if (isRadio) {
          const xmlHead = decodeHtml(q.headerText);
          const isMatch = xmlHead.length > 5 && (uiHead.includes(xmlHead) || xmlHead.includes(uiHead));
          matchResult = isMatch ? "YES" : "NO";
        } else {
          score = getSimilarity(uiBody, q.bodyText);
          matchResult = score > 0.6 ? "YES" : "NO";
        }
        return { ID: q.id, Match: matchResult, "XML Reconstructed": q.bodyText.slice(0, 50), "Answers": q.answers.join(" | "), _score: score };
      });
      addToTable(debugData);
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
        addToLog2(`[TARGET] ID: ${found.id} | ANSWERS: ${JSON.stringify(found.answers)}`, "DEV");
        const inputs = iframe.querySelectorAll('input:not([type="hidden"]), select, .c_input-box');
        found.answers.forEach((ans, i) => {
          if (isRadio) {
            const radioIdx = parseInt(ans) - 1;
            const radios = iframe.querySelectorAll('input[type="radio"]');
            if (radios[radioIdx]) {
              radios[radioIdx].checked = true;
              radios[radioIdx].dispatchEvent(new Event("change", { bubbles: true }));
              radios[radioIdx].click();
            }
          } else {
            const el = inputs[i];
            if (el) {
              el.value = ans;
              el.dispatchEvent(new Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
            }
          }
        });
        return true;
      }
      return false;
    });
  }
  function startAutomation() {
    showAnswerForCurrentQuestion().then((success) => {
      if (success) {
        const iframe = getIframeContext();
        setTimeout(() => {
          const submitBtn = iframe == null ? void 0 : iframe.querySelector("button[btn-for='submit']");
          if (!submitBtn) return;
          submitBtn.click();
          setTimeout(() => {
            const nextBtn = iframe == null ? void 0 : iframe.querySelector("button[btn-for='next']");
            if (!nextBtn || nextBtn.offsetParent === null) {
              addToLog2("Finished: No 'Next' button found.", "INFO");
              return;
            }
            nextBtn.click();
            if ((localStorage == null ? void 0 : localStorage.avoidContinuousAnswering) !== "AVOID") {
              setTimeout(startAutomation, TIMEOUT());
            }
          }, TIMEOUT());
        }, TIMEOUT());
      } else {
        addToLog2("Automation stopped: No match found for this screen.", "WARN");
      }
    });
  }

  // src/main.js
  (function() {
    document.body.classList.add("homepage");
    document.createElement("link");
    let prism_style = document.createElement("link");
    prism_style.rel = "stylesheet";
    prism_style.href = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css";
    document.head.appendChild(prism_style);
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
