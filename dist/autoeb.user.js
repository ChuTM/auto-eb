// ==UserScript==
// @name         Auto EB
// @namespace    http://tampermonkey.net/
// @version      1.30
// @description  Complete your EB tasks in seconds.
// @author       ReTrn.
// @grant        GM_xmlhttpRequest
// @require      https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js
// @require      https://alb-cdn.web.app/popupjs/pu.min.js
// @require      https://raw.githubusercontent.com/ChuTM/auto-eb/refs/heads/main/services/updater.user.js
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
    const DEFAULT = 100;
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
  function getCorrectArray(question_count, correct_target) {
    const arr = [];
    for (let i = 0; i < correct_target; i++) {
      arr.push(true);
    }
    for (let i = correct_target; i < question_count; i++) {
      arr.push(false);
    }
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function getQuestionCount() {
    return getIframeContext().documentElement.querySelector("group-pagination").childElementCount;
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
                  answers.push(
                    val.includes("/") ? val.split("/")[0] : val
                  );
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
        addToLog2(`CRITICAL: XML Error: ${err.message}`, "DEV");
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
      const uiHead = decodeHtml(
        ((_a = iframe.querySelector(".c_question-head")) == null ? void 0 : _a.innerText) || ""
      );
      const uiBody = decodeHtml(
        ((_b = iframe.querySelector(".c_question-body")) == null ? void 0 : _b.innerText) || ""
      );
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
        return {
          ID: q.id,
          Match: matchResult,
          "XML Reconstructed": q.bodyText.slice(0, 50),
          Answers: q.answers.join(" | "),
          _score: score
        };
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
        addToLog2(
          `[TARGET] ID: ${found.id} | ANSWERS: ${JSON.stringify(found.answers)}`,
          "DEV"
        );
        const inputs = iframe.querySelectorAll(
          'input:not([type="hidden"]), select, .c_input-box'
        );
        found.answers.forEach((ans, i) => {
          if (isRadio) {
            const radioIdx = parseInt(ans) - 1;
            const radios = iframe.querySelectorAll('input[type="radio"]');
            if (correct) {
              if (radios[radioIdx]) {
                radios[radioIdx].checked = true;
                radios[radioIdx].dispatchEvent(
                  new Event("change", { bubbles: true })
                );
                radios[radioIdx].click();
              }
            } else {
              chosenRadio = radioIdx === 0 ? radios[1] : radios[0];
              if (chosenRadio) {
                chosenRadio.checked = true;
                chosenRadio.dispatchEvent(
                  new Event("change", { bubbles: true })
                );
                chosenRadio.click();
              }
            }
          } else {
            const el = inputs[i];
            if (el) {
              if (correct) {
                el.value = ans;
                el.dispatchEvent(
                  new Event(
                    el.tagName === "SELECT" ? "change" : "input",
                    { bubbles: true }
                  )
                );
              } else {
                el.value = ans + ans;
                el.dispatchEvent(
                  new Event(
                    el.tagName === "SELECT" ? "change" : "input",
                    { bubbles: true }
                  )
                );
              }
            }
          }
        });
        return true;
      }
      return false;
    });
  }
  function startAutomation() {
    const correctArray = getCorrectArray(getQuestionCount(), CORRECT_COUNT(getQuestionCount()));
    console.log(correctArray, currentQuestion);
    inputAnswerForCurrentQuestion(correctArray[currentQuestion]).then(
      (success) => {
        if (success) {
          const iframe = getIframeContext();
          setTimeout(() => {
            const submitBtn = iframe == null ? void 0 : iframe.querySelector(
              "button[btn-for='submit']"
            );
            if (!submitBtn) return;
            submitBtn.click();
            setTimeout(() => {
              const nextBtn = iframe == null ? void 0 : iframe.querySelector(
                "button[btn-for='next']"
              );
              if (!nextBtn || nextBtn.offsetParent === null) {
                addToLog2(
                  "Finished: No 'Next' button found.",
                  "INFO"
                );
                return;
              }
              nextBtn.click();
              currentQuestion++;
              if ((localStorage == null ? void 0 : localStorage.AUTOEB_AVOID_CONTINUOUS_ANSWERING) !== "AVOID") {
                setTimeout(startAutomation, TIMEOUT());
              }
            }, TIMEOUT());
          }, TIMEOUT());
        } else {
          addToLog2(
            "Automation stopped: No match found for this screen.",
            "WARN"
          );
        }
      }
    );
  }

  // res/ui.html
  var ui_default = '<div class="autoeb-overlay">\n    <div class="overlay-close">\n        <span class="close-button">\n            &times;\n        </span>\n    </div>\n    <div class="component settings">\n        <span class="title">\n            AUTO-EB Settings\n        </span>\n        <div class="layer">\n            <div class="information">\n                <span class="title">\n                    Pause Between Questions\n                </span>\n                <span class="description">\n                    <span class="general">\n                        Stop the system from automatically proceeding to the next question.\n                    </span>\n                    <span class="variable">AUTOEB_AVOID_CONTINUOUS_ANSWERING "AVOID" || ANY</span>\n                </span>\n            </div>\n            <div class="action">\n                <input type="checkbox" name="AUTOEB_AVOID_CONTINUOUS_ANSWERING" id="AUTOEB_AVOID_CONTINUOUS_ANSWERING">\n                <span class="AUTOEB_AVOID_CONTINUOUS_ANSWERING-descriptive-text">\n                    Continuously\n                </span>\n            </div>\n        </div>\n        <div class="layer">\n            <div class="information">\n                <span class="title">\n                    Action Delay\n                </span>\n                <span class="description">\n                    <span class="general">\n                        Set a delay for each action in ms or a range (e.g., "random.1000.2500" for 1s to 2.5s).\n                    </span>\n                    <span class="variable">AUTOEB_TIMEOUT "random.[n].[n]" || INT || NULL</span>\n                </span>\n            </div>\n            <div class="action">\n                <input type="text" name="AUTOEB_TIMEOUT" id="AUTOEB_TIMEOUT" placeholder="e.g. 1500 || random.100.150">\n            </div>\n        </div>\n        <div class="layer">\n            <div class="information">\n                <span class="title">\n                    Accuracy Target\n                </span>\n                <span class="description">\n                    <span class="general">\n                        The desired percentage of correct answers (1-100%).\n                    </span>\n                    <span class="variable">AUTOEB_CORRECT_TARGET FLOAT || ANY</span>\n                </span>\n            </div>\n            <div class="action">\n                <input type="number" name="AUTOEB_CORRECT_TARGET" id="AUTOEB_CORRECT_TARGET" min="0" max="100" step="1" value="100">\n                <span class="AUTOEB_CORRECT_TARGET-descriptive-text">\n                    %\n                </span>\n            </div>\n        </div>\n    </div>\n</div>\n<div class="autoeb-settings-button">\n    AUTO-EB\n    <span class="settings">\n        <?xml version="1.0" encoding="UTF-8"?> <!--Generator: Apple Native CoreSVG 341-->\n        <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"> <svg\n            version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"\n            viewBox="0 0 20.7715 20.4199">\n            <g>\n                <rect height="20.4199" opacity="0" width="20.7715" x="0" y="0" />\n                <path\n                    d="M9.30664 20.4102L11.1035 20.4102C11.6113 20.4102 11.9727 20.1074 12.0898 19.6094L12.5977 17.4609C12.9785 17.334 13.3496 17.1875 13.6719 17.0312L15.5566 18.1836C15.9766 18.4473 16.4551 18.4082 16.8066 18.0566L18.0664 16.8066C18.418 16.4551 18.4668 15.9473 18.1836 15.5273L17.0312 13.6621C17.1973 13.3203 17.3438 12.9688 17.4512 12.6172L19.6191 12.0996C20.1172 11.9824 20.4102 11.6211 20.4102 11.1133L20.4102 9.3457C20.4102 8.84766 20.1172 8.48633 19.6191 8.36914L17.4707 7.85156C17.3438 7.45117 17.1875 7.08984 17.0508 6.78711L18.2031 4.89258C18.4668 4.46289 18.4473 4.00391 18.0859 3.64258L16.8066 2.38281C16.4453 2.05078 16.0059 1.97266 15.5859 2.23633L13.6719 3.41797C13.3594 3.25195 12.998 3.10547 12.5977 2.97852L12.0898 0.800781C11.9727 0.302734 11.6113 0 11.1035 0L9.30664 0C8.79883 0 8.4375 0.302734 8.31055 0.800781L7.80273 2.95898C7.42188 3.08594 7.05078 3.23242 6.71875 3.4082L4.82422 2.23633C4.4043 1.97266 3.94531 2.03125 3.59375 2.38281L2.32422 3.64258C1.96289 4.00391 1.93359 4.46289 2.20703 4.89258L3.34961 6.78711C3.22266 7.08984 3.06641 7.45117 2.93945 7.85156L0.791016 8.36914C0.292969 8.48633 0 8.84766 0 9.3457L0 11.1133C0 11.6211 0.292969 11.9824 0.791016 12.0996L2.95898 12.6172C3.06641 12.9688 3.21289 13.3203 3.36914 13.6621L2.22656 15.5273C1.93359 15.9473 1.99219 16.4551 2.34375 16.8066L3.59375 18.0566C3.94531 18.4082 4.43359 18.4473 4.85352 18.1836L6.72852 17.0312C7.06055 17.1875 7.42188 17.334 7.80273 17.4609L8.31055 19.6094C8.4375 20.1074 8.79883 20.4102 9.30664 20.4102ZM10.2051 13.6523C8.30078 13.6523 6.75781 12.1094 6.75781 10.2051C6.75781 8.30078 8.30078 6.75781 10.2051 6.75781C12.1094 6.75781 13.6523 8.30078 13.6523 10.2051C13.6523 12.1094 12.1094 13.6523 10.2051 13.6523Z"\n                    fill="black" fill-opacity="0.85" />\n            </g>\n        </svg>\n    </span>\n</div>';

  // res/style.css
  var style_default = '.pujs-poAlert {\n	z-index: 9999999999;\n}\n.pujs-poAlert::-webkit-scrollbar,\n.pujs-poAlert *::-webkit-scrollbar {\n	display: none;\n}\n.homepage .auto-eb-hidden {\n	display: none;\n}\n#xml-container {\n	padding: 15px !important;\n	background: #2d2d2d !important;\n	border-radius: 8px;\n	margin: 0 !important;\n	/* CRITICAL: pre-wrap preserves the tabs while allowing horizontal scrolling if needed */\n	white-space: pre !important;\n	overflow: auto !important;\n}\n#xml-block {\n	display: block !important;\n	white-space: pre !important;\n	line-height: 1.4 !important;\n	font-size: 13px !important;\n	/* FORCE TAB SIZE */\n	tab-size: 4 !important;\n	-moz-tab-size: 4 !important;\n	-o-tab-size: 4 !important;\n	font-family: "Consolas", "Monaco", "Courier New", monospace !important;\n	color: #ccc !important;\n}\n/* Stop Prism from messing with the layout */\npre[class*="language-"] {\n	margin: 0 !important;\n	padding: 0 !important;\n}\n\n.autoeb-overlay {\n	font-size: 16px;\n\n	position: fixed;\n	top: 0;\n	bottom: 0;\n	left: 0;\n	right: 0;\n\n	background: rgba(255, 255, 255, 0.75);\n	backdrop-filter: blur(17px);\n	-webkit-backdrop-filter: blur(17px);\n	z-index: 10000000;\n\n	pointer-events: none;\n	opacity: 0;\n\n	transition: 1s;\n\n	transform: translateY(50%);\n}\n\n.autoeb-overlay .component {\n	width: 95%;\n	background-color: white;\n	margin: 2em auto;\n	padding: 2em;\n	border-radius: 17px;\n	border: 1.5px solid rgba(0, 0, 0, 0.05);\n	box-shadow: 0 4px 10px 0 rgba(0, 0, 0, 0.1);\n}\n\n.autoeb-overlay .component > .title {\n	font-size: 2em;\n	font-weight: 600;\n}\n\n.autoeb-overlay .component .layer {\n	display: flex;\n	flex-direction: row;\n	flex-wrap: wrap;\n\n	.information {\n		padding: 1em 2em;\n		width: 80%;\n		display: flex;\n		flex-direction: column;\n\n		.title {\n			font-size: 1.2em;\n			font-weight: 400;\n			color: rgba(0, 0, 0, 0.6);\n		}\n\n		.description {\n			font-size: 0.8em;\n			font-weight: 400;\n			color: rgba(0, 0, 0, 0.4);\n			display: flex;\n			flex-direction: column;\n		}\n\n		.description > .variable {\n			font-size: 0.6em;\n			width: fit-content;\n			padding: 2px 6px;\n			background: rgba(0, 0, 0, 0.05);\n			border-radius: 5px;\n		}\n	}\n\n	.action {\n		padding: 1em 2em;\n		color: rgba(0, 0, 0, 0.6);\n	}\n\n	input {\n		color: rgba(0, 0, 0, 0.6);\n		border: 1px solid black;\n		border-radius: 3px;\n		padding: 2px 7px;\n	}\n\n	.action {\n		width: 20%;\n		min-width: 200px;\n	}\n	.AUTOEB_AVOID_CONTINUOUS_ANSWERING-descriptive-text {\n		content: "Continuously";\n	}\n	#AUTOEB_AVOID_CONTINUOUS_ANSWERING:checked\n		+ .AUTOEB_AVOID_CONTINUOUS_ANSWERING-descriptive-text {\n		content: "AVOID";\n	}\n}\n\n.autoeb-settings-button {\n	position: fixed;\n	bottom: 2rem;\n	right: 2rem;\n	z-index: 9999999;\n    display: flex;\n    justify-content: center;\n    align-items: center;\n    gap: 1em;\n}\n\n.autoeb-settings-button .settings {\n	display: block;\n	width: 24px;\n	height: 24px;\n    cursor: pointer;\n}\n\n.close-button {\n	font-size: 3em;\n	cursor: pointer;\n	color: black;\n	font-weight: 300;\n	position: absolute;\n	top: 2rem;\n	right: 2rem;\n	height: 24px;\n	width: 24px;\n	display: flex;\n	justify-content: center;\n	align-items: center;\n}';

  // src/main.js
  (function() {
    sessionStorage.AUTOEB_VERSION = "1.30";
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
    })();
    (function() {
      let custom_style_tag = document.createElement("style");
      custom_style_tag.innerHTML = style_default;
      document.head.appendChild(custom_style_tag);
      document.head.innerHTML += `<meta name="viewport" content="width=device-width, initial-scale=1">`;
    })();
    (function() {
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
    })();
    (function() {
      document.body.innerHTML += ui_default;
      const AVOID_AUTO_CONTINUOUSLY_ANSWER_INTPUT = document.getElementById(
        "AUTOEB_AVOID_CONTINUOUS_ANSWERING"
      );
      AVOID_AUTO_CONTINUOUSLY_ANSWER_INTPUT.addEventListener("change", () => {
        const v = AVOID_AUTO_CONTINUOUSLY_ANSWER_INTPUT.checked;
        if (v) {
          localStorage.AUTOEB_AVOID_CONTINUOUS_ANSWERING = "AVOID";
          document.querySelector(
            ".AUTOEB_AVOID_CONTINUOUS_ANSWERING-descriptive-text"
          ).innerText = "AVOID";
        } else {
          localStorage.AUTOEB_AVOID_CONTINUOUS_ANSWERING = void 0;
          document.querySelector(
            ".AUTOEB_AVOID_CONTINUOUS_ANSWERING-descriptive-text"
          ).innerText = "Continuously";
        }
      });
      document.getElementById("AUTOEB_TIMEOUT").addEventListener("input", () => {
        const value = document.getElementById("AUTOEB_TIMEOUT").value;
        localStorage.AUTOEB_TIMEOUT = value;
      });
      document.getElementById("AUTOEB_CORRECT_TARGET").addEventListener("input", () => {
        const value = document.getElementById(
          "AUTOEB_CORRECT_TARGET"
        ).value;
        localStorage.AUTOEB_CORRECT_TARGET = value;
      });
      document.querySelector(".autoeb-settings-button>.settings").addEventListener("click", () => {
        const AUTOEB_OVERLAY = document.querySelector(".autoeb-overlay");
        AUTOEB_OVERLAY.style.transform = "translateY(0) translateX(0)";
        AUTOEB_OVERLAY.style.opacity = "1";
        AUTOEB_OVERLAY.style.pointerEvents = "all";
      });
      document.querySelector(".autoeb-overlay .overlay-close .close-button").addEventListener("click", () => {
        const AUTOEB_OVERLAY = document.querySelector(".autoeb-overlay");
        AUTOEB_OVERLAY.style.transform = "translateY(50%)";
        AUTOEB_OVERLAY.style.opacity = "0";
        AUTOEB_OVERLAY.style.pointerEvents = "none";
      });
    })();
    (function() {
      pujs.setup.icons_path = "https://alphabrate.github.io/icons";
      pujs.setup.init();
      document.querySelectorAll("a.popup.link-blue").forEach((el) => {
        el.addEventListener("click", () => {
          document.body.classList.remove("homepage");
        });
      });
    })();
  })();
})();
