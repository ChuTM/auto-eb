// ==UserScript==
// @name         Auto EB
// @namespace    http://tampermonkey.net/
// @version      1.61
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
        } catch (e2) {
          reject(e2);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e2) {
          reject(e2);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/config.js
  var MAP = "c3D1RFP9eM[UjINfOZi0Qg+mhkxSJ5p* uX8B}`-rs,LqAH@lnbVT.C{z4YWtGv72^/aw|do_6\\yE~]K";
  var TIMEOUT = (type = "default", length = 0) => {
    if (parseInt(localStorage == null ? void 0 : localStorage.AUTOEB_TIMEOUT))
      return localStorage.AUTOEB_TIMEOUT;
    const BASE_DELAY = 200;
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
  var presistence = {};
  function reportPresistence(e2, v) {
    presistence[v] = e2;
  }
  function getPresistence(e2) {
    return presistence[e2];
  }
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
      const events = [
        "pointerdown",
        "mousedown",
        "pointerup",
        "mouseup",
        "click"
      ];
      for (const name of events) {
        const ev = new MouseEvent(name, {
          bubbles: true,
          cancelable: true,
          buttons: 1
        });
        el.dispatchEvent(ev);
        yield new Promise(
          (r) => setTimeout(
            r,
            (localStorage == null ? void 0 : localStorage.AUTOEB_TIMEOUT) || Math.floor(Math.random() * 30 + 20)
          )
        );
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
        el.dispatchEvent(
          new KeyboardEvent("keydown", { key: char, bubbles: true })
        );
        el.dispatchEvent(
          new KeyboardEvent("keypress", { key: char, bubbles: true })
        );
        el.value += char;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(
          new KeyboardEvent("keyup", { key: char, bubbles: true })
        );
        yield new Promise(
          (r) => setTimeout(r, Math.floor(Math.random() * 60 + 60))
        );
      }
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.blur();
    });
  }
  function sleep(ms) {
    return __async(this, null, function* () {
      return new Promise((resolve) => setTimeout(resolve, ms));
    });
  }
  function setAutoEBButtonCSS(target, type = "default", text, disabled = false) {
    e = target || getPresistence("autofill");
    const map = {
      default: `position: fixed;bottom: 2rem;left: 2rem;background: white;padding: 0.7rem 1rem;border-radius: 11px;box-shadow: 0 0 10px 0px #00000035;cursor: pointer;display: block;font-family: sans-serif;font-weight: bold;transition: all 0.2s ease;outline: none;border: none;`,
      error: `position: fixed;bottom: 2rem;left: 2rem;background: #ff3e3e;color: white;padding: 0.7rem 1rem;border-radius: 11px;box-shadow: 0 0 10px 0px #00000035;cursor: pointer;display: block;font-family: sans-serif;font-weight: bold;transition: all 0.2s ease;outline: none;border: none;`
    };
    if (typeof type === "string") e.style.cssText = map[type] || map.default;
    else if (typeof type === "object") {
      const style = type;
      Object.keys(style).forEach((w) => {
        const key = w, value = style[w];
        e.style[key] = value;
      });
    }
    if (text) e.innerText = text;
    e.disabled = disabled;
  }

  // src/logic.js
  var currentQuestion = 0;
  function getIframeContext() {
    var _a, _b;
    const overlay = (_a = document.querySelector(".overlay-player")) == null ? void 0 : _a.contentDocument;
    return (_b = overlay == null ? void 0 : overlay.querySelector("iframe")) == null ? void 0 : _b.contentDocument;
  }
  function isInTaskPage() {
    const iframe = getIframeContext();
    return !!(iframe == null ? void 0 : iframe.querySelector(
      ".c_course-title.p_head-title.ng-star-inserted"
    ));
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
      const uiHead = decodeHtml(
        ((_a = iframe.querySelector(".c_question-head")) == null ? void 0 : _a.innerText) || ""
      );
      const uiBody = decodeHtml(
        ((_b = iframe.querySelector(".c_question-body")) == null ? void 0 : _b.innerText) || ""
      );
      const isRadio = iframe.querySelectorAll('input[type="radio"]').length > 0;
      addToLog(`Current UI BODY ${uiBody}`);
      if (uiHead.includes("Students\u2019 Voices") || /student.*voice/.test(uiHead.toLowerCase())) {
        const target = iframe.querySelectorAll('input[type="checkbox"]')[0];
        console.log(target);
        if (target) {
          yield new Promise((r) => setTimeout(r, TIMEOUT("click")));
          yield simulateClick(target);
          return true;
        }
        addToLog(
          "Special case matched but target not found, falling back to normal matching.",
          "WARN"
        );
        addToLog(`UI Head: ${uiHead}`, "DEV");
        addToLog(`UI Body: ${uiBody}`, "DEV");
      }
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
        const inputs = iframe.querySelectorAll(
          'input:not([type="hidden"]), select, .c_input-box'
        );
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
                el.dispatchEvent(
                  new Event("change", { bubbles: true })
                );
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
    addToLog(
      `Starting automation for Question ${currentQuestion + 1}...`,
      "INFO"
    );
    const totalQuestions = getQuestionCount();
    const correctArray = getCorrectArray(
      totalQuestions,
      CORRECT_COUNT(totalQuestions)
    );
    inputAnswerForCurrentQuestion(correctArray[currentQuestion]).then(
      (success) => __async(null, null, function* () {
        if (success) {
          const iframe = getIframeContext();
          yield new Promise((r) => setTimeout(r, TIMEOUT("click")));
          const submitBtn = iframe == null ? void 0 : iframe.querySelector(
            "button[btn-for='submit']"
          );
          if (!submitBtn) return;
          yield simulateClick(submitBtn);
          yield new Promise(
            (r) => setTimeout(
              r,
              (localStorage == null ? void 0 : localStorage.AUTOEB_TIMEOUT) || Math.floor(Math.random() * 400 + 600)
            )
          );
          const nextBtn = iframe == null ? void 0 : iframe.querySelector("button[btn-for='next']");
          if (!nextBtn || nextBtn.offsetParent === null) {
            addToLog("Finished: No 'Next' button found.", "INFO");
            setAutoEBButtonCSS(void 0, "default", "Lesson Completed");
            if (sessionStorage.AUTOEB_FULL_AUTOMATION === "TASK_START") {
              addToLog("All questions attempted. Submitting", "INFO");
              sessionStorage.AUTOEB_FULL_AUTOMATION = "TASK_END_CONTINUE";
              yield simulateClick(
                iframe.querySelector("button[btn-for='end']")
              );
              location.reload();
            }
            return;
          }
          yield simulateClick(nextBtn);
          currentQuestion++;
          if ((localStorage == null ? void 0 : localStorage.AUTOEB_AVOID_CONTINUOUS_ANSWERING) !== "AVOID") {
            setTimeout(
              startAutomation,
              (localStorage == null ? void 0 : localStorage.AUTOEB_TIMEOUT) || Math.floor(Math.random() * 500 + 500)
            );
          }
        } else {
          addToLog(
            "Automation stopped: No match found for this screen.",
            "WARN"
          );
          setAutoEBButtonCSS(
            void 0,
            "error",
            `Error: NO MATCH FOUND`,
            false
          );
          pujs.popup(
            "Error Encountered",
            // Title
            `AutoEB couldn't automatically match this page with the correct answer. Please open the source data and select the option manually.`,
            // Message
            [
              {
                // Buttons
                text: "Open XML",
                color: "lightgreen",
                callback: () => {
                  getPresistence("XMLData").click();
                }
              },
              {
                // Cancel Button
                text: "Cancel",
                callback: () => {
                }
              }
            ],
            "horiz"
          );
        }
      })
    );
  }
  function getAvailableTasks() {
    const table_tasksRows = document.querySelectorAll(
      ".table-responsive>table.table>tbody>tr"
    );
    return Array.from(table_tasksRows).reduce((tasks, row) => {
      try {
        const aElement = row.querySelector("a.popup.link-blue");
        const mark = row.querySelector(
          "td.text-center>span>span"
        ).textContent;
        if (mark === "-") {
          tasks.push(aElement);
        }
      } catch (err) {
      }
      return tasks;
    }, []);
  }
  function automaticallyCheckAndChooseDifficulty() {
    setTimeout(() => __async(null, null, function* () {
      var _a;
      console.log(
        sessionStorage.AUTOEB_FULL_AUTOMATION === "TASK_START",
        isInTaskPage()
      );
      if (sessionStorage.AUTOEB_FULL_AUTOMATION === "TASK_START" && isInTaskPage()) {
        iframeContent = getIframeContext();
        let headingText = (_a = iframeContent == null ? void 0 : iframeContent.querySelector(
          "span[tag='h1']>span[tag='b']"
        )) == null ? void 0 : _a.innerText;
        if (headingText == "LEVEL OF DIFFICULTY") {
          const AUTOEB_DIFFICULTY_LEVEL = localStorage.AUTOEB_DIFFICULTY_LEVEL || "Challenging";
          const index = AUTOEB_DIFFICULTY_LEVEL === "Challenging" ? 1 : 0;
          yield simulateClick(
            iframeContent.querySelectorAll(
              "label.c_start_group-field_label"
            )[index]
          );
          yield sleep(200);
          yield simulateClick(
            iframeContent.querySelector("button[btn-for='start']")
          );
          yield sleep(1e3);
          startAutomation();
          addToLog(
            `Difficulty level "${AUTOEB_DIFFICULTY_LEVEL}" selected`
          );
        } else {
          startAutomation();
        }
      }
    }), 5e3);
  }
  function startFullAutomation() {
    var _a;
    sessionStorage.AUTOEB_FULL_AUTOMATION = "TASK_START";
    (_a = getAvailableTasks()[0]) == null ? void 0 : _a.click();
  }

  // res/ui.html
  var ui_default = '<div class="autoeb-overlay"\n    style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transform: translateY(50%); transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1); z-index: 2147483647;">\n    <div class="autoeb-settings-card"\n        style="position: relative;background: #1e1e1e; color: #ffffff; padding: 2rem; border-radius: 16px; width: 90%; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-family: sans-serif; border: 1px solid #333;">\n        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">\n            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600;">AutoEB Engine Settings</h2>\n            <div class="overlay-close">\n                <button class="close-button"\n                    style="background: transparent; border: none; color: #888; cursor: pointer; font-size: 1.2rem;">&times;</button>\n            </div>\n        </div>\n\n        <!-- Live tracking module inside operational controller panel -->\n        <div class="autoeb-status-text"\n            style="margin-bottom: 1.5rem; font-size: 0.9rem; color: #aaa; font-weight: 500; transition: color 0.2s ease;">\n            Status: Idle</div>\n\n        <div style="margin-bottom: 1.2rem; display: none;">\n            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: #aaa;">Target Correct\n                Count</label>\n            <input type="number" id="AUTOEB_CORRECT_TARGET"\n                style="width: 100%; background: #2a2a2a; border: 1px solid #444; border-radius: 8px; padding: 0.6rem; color: white; box-sizing: border-box;"\n                placeholder="e.g. 8">\n        </div>\n\n        <div style="margin-bottom: 1.2rem;">\n            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: #aaa;">Step Delay\n                (ms)</label>\n            <input type="number" id="AUTOEB_TIMEOUT"\n                style="width: 100%; background: #2a2a2a; border: 1px solid #444; border-radius: 8px; padding: 0.6rem; color: white; box-sizing: border-box;"\n                placeholder="Leave blank to emulate human-like answering.">\n        </div>\n\n        <div\n            style="display: flex; align-items: center; justify-content: space-between; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #333;">\n            <span style="font-size: 0.85rem; color: #aaa;">Stop Between Questions</span>\n            <label class="switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">\n                <input type="checkbox" id="AUTOEB_AVOID_CONTINUOUS_ANSWERING">\n            </label>\n        </div>\n        <div style="font-size: 0.75rem; color: #666; margin-top: 0.4rem; text-align: right;"\n            class="AUTOEB_AVOID_CONTINUOUS_ANSWERING-descriptive-text">Continuously</div>\n    </div>\n</div>\n\n<div class="autoeb-settings-button" style="position: fixed; bottom: 2rem; z-index: 2147483646;">\n    <button class="settings">\n        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"\n            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"\n            class="lucide lucide-settings-icon lucide-settings">\n            <path\n                d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />\n            <circle cx="12" cy="12" r="3" />\n        </svg>\n        AutoEB Settings\n    </button>\n</div>';

  // res/style.css
  var style_default = '.pujs-poAlert {\n	z-index: 9999999999 !important;\n}\n.pujs-poAlert::-webkit-scrollbar,\n.pujs-poAlert *::-webkit-scrollbar {\n	display: none !important;\n}\n.homepage .auto-eb-hidden {\n	display: none;\n}\n#xml-container {\n	padding: 15px !important;\n	background: #2d2d2d !important;\n	border-radius: 8px;\n	margin: 0 !important;\n	/* CRITICAL: pre-wrap preserves the tabs while allowing horizontal scrolling if needed */\n	white-space: pre !important;\n	overflow: auto !important;\n}\n#xml-block {\n	display: block !important;\n	white-space: pre !important;\n	line-height: 1.4 !important;\n	font-size: 13px !important;\n	/* FORCE TAB SIZE */\n	tab-size: 4 !important;\n	-moz-tab-size: 4 !important;\n	-o-tab-size: 4 !important;\n	font-family: "Consolas", "Monaco", "Courier New", monospace !important;\n	color: #ccc !important;\n}\n/* Stop Prism from messing with the layout */\npre[class*="language-"] {\n	margin: 0 !important;\n	padding: 0 !important;\n}\n\n.autoeb-overlay {\n	font-size: 16px;\n\n	position: fixed;\n	top: 0;\n	bottom: 0;\n	left: 0;\n	right: 0;\n\n	background: rgba(255, 255, 255, 0.75);\n	backdrop-filter: blur(17px);\n	-webkit-backdrop-filter: blur(17px);\n	z-index: 10000000;\n\n	pointer-events: none;\n	opacity: 0;\n\n	transition: 1s;\n\n	transform: translateY(50%);\n}\n\n.autoeb-overlay .component {\n	width: 95%;\n	background-color: white;\n	margin: 2em auto;\n	padding: 2em;\n	border-radius: 17px;\n	border: 1.5px solid rgba(0, 0, 0, 0.05);\n	box-shadow: 0 4px 10px 0 rgba(0, 0, 0, 0.1);\n}\n\n.autoeb-overlay .component > .title {\n	font-size: 2em;\n	font-weight: 600;\n}\n\n.autoeb-overlay .component .layer {\n	display: flex;\n	flex-direction: row;\n	flex-wrap: wrap;\n\n	.information {\n		padding: 1em 2em;\n		width: 80%;\n		display: flex;\n		flex-direction: column;\n\n		.title {\n			font-size: 1.2em;\n			font-weight: 400;\n			color: rgba(0, 0, 0, 0.6);\n		}\n\n		.description {\n			font-size: 0.8em;\n			font-weight: 400;\n			color: rgba(0, 0, 0, 0.4);\n			display: flex;\n			flex-direction: column;\n		}\n\n		.description > .variable {\n			font-size: 0.6em;\n			width: fit-content;\n			padding: 2px 6px;\n			background: rgba(0, 0, 0, 0.05);\n			border-radius: 5px;\n		}\n	}\n\n	.action {\n		padding: 1em 2em;\n		color: rgba(0, 0, 0, 0.6);\n	}\n\n	input {\n		color: rgba(0, 0, 0, 0.6);\n		border: 1px solid black;\n		border-radius: 3px;\n		padding: 2px 7px;\n	}\n\n	.action {\n		width: 20%;\n		min-width: 200px;\n	}\n	.AUTOEB_AVOID_CONTINUOUS_ANSWERING-descriptive-text {\n		content: "Continuously";\n	}\n	#AUTOEB_AVOID_CONTINUOUS_ANSWERING:checked\n		+ .AUTOEB_AVOID_CONTINUOUS_ANSWERING-descriptive-text {\n		content: "AVOID";\n	}\n}\n\n.autoeb-settings-button {\n	position: fixed;\n	bottom: 2rem;\n	right: 2rem;\n	z-index: 9999999;\n	display: flex;\n	justify-content: center;\n	align-items: center;\n	gap: 1em;\n}\n\n.autoeb-settings-button .settings {\n	display: block;\n	height: 40px;\n	cursor: pointer;\n	display: flex;\n	justify-content: center;\n	gap: 6px;\n	align-items: center;\n	background: #2a2a2a;\n	color: white;\n	border: 1px solid #444;\n	padding: 0.5rem;\n	border-radius: 11px;\n	box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);\n	cursor: pointer;\n	font-family: sans-serif;\n	font-weight: 500;\n}\n\n.close-button {\n	font-size: 3em;\n	cursor: pointer;\n	color: black;\n	font-weight: 300;\n	position: absolute;\n	top: 2rem;\n	right: 2rem;\n	height: 24px;\n	width: 24px;\n	display: flex;\n	justify-content: center;\n	align-items: center;\n}\n';

  // res/xml_data.html
  var xml_data_default = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AUTOEB PAGE</title>
    <style>
        *::-webkit-scrollbar {
            display: none;
        }

        *::selection {
            background-color: rgba(167, 167, 255, 0.3) !important;
        }

        /*
Name:   Duotone Light
Author: Simurai, adapted from DuoTone themes for Atom (http://simurai.com/projects/2016/01/01/duotone-themes)

Conversion: Bram de Haan (http://atelierbram.github.io/Base2Tone-prism/output/prism/prism-base2tone-morning-light.css)
Generated with Base16 Builder (https://github.com/base16-builder/base16-builder)
*/

        code[class*="language-"],
        pre[class*="language-"] {
            font-family: Consolas, Menlo, Monaco, "Andale Mono WT", "Andale Mono", "Lucida Console", "Lucida Sans Typewriter", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Liberation Mono", "Nimbus Mono L", "Courier New", Courier, monospace;
            font-size: 14px;
            line-height: 1.375;
            direction: ltr;
            text-align: left;
            white-space: pre;
            word-spacing: normal;
            word-break: normal;

            -moz-tab-size: 4;
            -o-tab-size: 4;
            tab-size: 4;

            -webkit-hyphens: none;
            -moz-hyphens: none;
            -ms-hyphens: none;
            hyphens: none;
            background: #fffefe;
            color: #728fcb;

            white-space: pre-wrap;
            word-wrap: break-word;
        }

        pre>code[class*="language-"] {
            font-size: 1em;
        }

        /* Code blocks */
        pre[class*="language-"] {
            padding: 1em;
            margin: .5em 0;
            overflow: auto;
            border-radius: 11px;
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(0, 0, 0, 0.05);
        }

        /* Inline code */
        :not(pre)>code[class*="language-"] {
            padding: .1em;
            border-radius: .3em;
        }

        .token.comment,
        .token.prolog,
        .token.doctype,
        .token.cdata {
            color: #b6ad9a;
        }

        .token.punctuation {
            color: #b6ad9a;
        }

        .token.namespace {
            opacity: .7;
        }

        .token.tag,
        .token.operator,
        .token.number {
            color: #063289;
        }

        .token.property,
        .token.function {
            color: #b29762;
        }

        .token.tag-id,
        .token.selector,
        .token.atrule-id {
            color: #2d2006;
        }

        code.language-javascript,
        .token.attr-name {
            color: #896724;
        }

        code.language-css,
        code.language-scss,
        .token.boolean,
        .token.string,
        .token.entity,
        .token.url,
        .language-css .token.string,
        .language-scss .token.string,
        .style .token.string,
        .token.attr-value,
        .token.keyword,
        .token.control,
        .token.directive,
        .token.unit,
        .token.statement,
        .token.regex,
        .token.atrule {
            color: #728fcb;
        }

        .token.placeholder,
        .token.variable {
            color: #93abdc;
        }

        .token.deleted {
            text-decoration: line-through;
        }

        .token.inserted {
            border-bottom: 1px dotted #2d2006;
            text-decoration: none;
        }

        .token.italic {
            font-style: italic;
        }

        .token.important,
        .token.bold {
            font-weight: bold;
        }

        .token.important {
            color: #896724;
        }

        .token.entity {
            cursor: help;
        }

        pre>code.highlight {
            outline: .4em solid #896724;
            outline-offset: .4em;
        }

        /* overrides color-values for the Line Numbers plugin
 * http://prismjs.com/plugins/line-numbers/
 */
        .line-numbers.line-numbers .line-numbers-rows {
            border-right-color: #ece8de;
        }

        .line-numbers .line-numbers-rows>span:before {
            color: #cdc4b1;
        }

        .correctAnswer {
            background: yellow;
        }

        .highlight {
            background: rgba(0, 191, 255, 0.5);
        }

        .strongHighlight {
            display: inline-block;
            background: rgba(0, 255, 55, 0.5);
            color: black !important;
            animation: jump 0.5s ease-in-out forwards;
        }

        @keyframes jump {
            0% {
                transform: scale(1);
            }

            50% {
                transform: scale(2);
            }

            100% {
                transform: scale(1);
            }
        }

        /* overrides color-values for the Line Highlight plugin
 * http://prismjs.com/plugins/line-highlight/
 */
        .line-highlight.line-highlight {
            background: rgba(45, 32, 6, 0.2);
            background: -webkit-linear-gradient(left, rgba(45, 32, 6, 0.2) 70%, rgba(45, 32, 6, 0));
            background: linear-gradient(to right, rgba(45, 32, 6, 0.2) 70%, rgba(45, 32, 6, 0));
        }

        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            padding: 34px;
            margin: 0;
            padding-bottom: 75px;
        }

        @media (max-width: 600px) {
            body {
                padding: 14px;
                padding-bottom: 75px;
            }

            h1 {
                margin-top: 14px;
            }

            pre {
                font-size: 12px !important;
            }
        }

        .auto-eb {
            display: flex;
            flex-direction: column;
            margin-bottom: 24px;

            h1 {
                margin-bottom: 8px;
            }

            p {
                margin: 8px 0;
            }

            button {
                border: none;
                outline: none;
                background: #EBEBEB;
                border-radius: 7px;
            }
        }

        .copyright {
            color: rgba(0, 0, 0, 0.2);
            margin: 10px auto;
            margin-top: 19px;
            text-align: center;
            font-size: 12px;
        }

        .overlay {
            position: fixed;
            bottom: 24px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;

            .input {
                width: 80%;
                max-width: 400px;
                height: 30px;
                border: 1px solid rgba(0, 0, 0, 0.1);
                outline: none;
                padding: 4px 16px;
                padding-right: 8px;
                border-radius: 70px;
                background: rgba(255, 255, 255, 0.5);
                backdrop-filter: blur(7px);
                display: flex;
                justify-content: center;
                align-items: center;
                box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
            }

            .input>input {
                background: transparent;
                border: none;
                outline: none;
                width: 100%;
                height: 100%;
                font-size: 16px;
            }

            .input>input:not(:placeholder-shown)+.searchControls {
                opacity: 0.3 !important;

            }

            .searchControls {
                display: flex;
                flex-direction: column;
                align-items: center;
                opacity: 0;
                transition: .3s;
            }

            .searchControls>button {
                background: transparent;
                width: 24px;
                height: 24px;
                outline: none;
                border: none;
                display: flex;
                justify-content: center;
                align-items: flex-end;
                transition: .3s;

                svg {
                    transform: scale(1.5);
                }
            }

            button#nextBtn {
                transform: rotate(180deg);
            }

            #resultCounter {
                opacity: 0.3;
            }
        }
    </style>

</head>

<body>
    <div class="auto-eb">
        <h1>AUTOEB</h1>
        <p>AutoEB has decrypted the source XML File.</p>
        <p>Look for the \`correct\` attributes for the answers.</p>
        <div class="controls">
            <button onclick="window.close()">Close</button>
        </div>
    </div>

    <!-- XML DATA -->
    <pre>NO XML DATA FOUND</pre>
    <!-- END XML DATA -->

    <p class="copyright">&copy; Copyright 2026 ChuTM. All rights reserved.</p>
    <div class="overlay">
        <div class="input">
            <input id="searchInput" type="text" placeholder="Search...">
            <div class="searchControls">
                <button id="prevBtn" title="Previous"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" class="lucide lucide-chevron-up-icon lucide-chevron-up">
                        <path d="m18 15-6-6-6 6" />
                    </svg></button>
                <button id="nextBtn" title="Next">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="lucide lucide-chevron-up-icon lucide-chevron-up">
                        <path d="m18 15-6-6-6 6" />
                    </svg>
                </button>
            </div>
        </div>
    </div>

    <script>
        document.querySelectorAll(".token.attr-name").forEach(w => {
            if (w.innerHTML === "correct") {
                w.classList.add("correctAnswer");
            }
        });

        const input = document.getElementById('searchInput');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const counter = document.getElementById('resultCounter');
        let results = [];
        let current = -1;

        function normalize(s) { return s.toLowerCase(); }
        function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

        function updateResults() {
            const q = normalize(input.value.trim());
            // restore original token text if modified
            document.querySelectorAll('.token').forEach(el => {
                if (el.dataset.original != null) el.innerHTML = escapeHtml(el.dataset.original);
            });
            results = [];
            current = -1;
            if (!q) { counter.textContent = '0 / 0'; return; }
            // find tokens containing query and wrap matched substring(s)
            document.querySelectorAll('.token').forEach(el => {
                const orig = el.textContent;
                if (el.dataset.original == null) el.dataset.original = orig;
                const low = normalize(orig);
                if (!low.includes(q)) return;
                // build innerHTML with matched parts wrapped
                const parts = [];
                let idx = 0;
                let start = low.indexOf(q, idx);
                while (start !== -1) {
                    parts.push(escapeHtml(orig.slice(idx, start)));
                    const matched = orig.slice(start, start + q.length);
                    parts.push('<span class="tokenMatch">' + escapeHtml(matched) + '</span>');
                    idx = start + q.length;
                    start = low.indexOf(q, idx);
                }
                parts.push(escapeHtml(orig.slice(idx)));
                el.innerHTML = parts.join('');
                // collect match spans
                el.querySelectorAll('.tokenMatch').forEach(ms => results.push(ms));
            });
            // mark highlights on matched substrings
            results.forEach(ms => ms.classList.add('highlight'));
            if (results.length) {
                current = 0;
                results[0].classList.remove('highlight');
                results[0].classList.add('strongHighlight');
                results[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            counter.textContent = (results.length ? (current + 1) : 0) + ' / ' + results.length;
        }

        function setCurrent(idx) {
            if (!results.length) return;
            results[current].classList.remove('strongHighlight');
            results[current].classList.add('highlight');
            current = (idx + results.length) % results.length;
            results[current].classList.remove('highlight');
            results[current].classList.add('strongHighlight');
            results[current].scrollIntoView({ behavior: 'smooth', block: 'center' });
            counter.textContent = (current + 1) + ' / ' + results.length;
        }

        input.addEventListener('input', updateResults);
        nextBtn.addEventListener('click', (e) => { if (results.length) setCurrent(current + 1); });
        prevBtn.addEventListener('click', (e) => { if (results.length) setCurrent(current - 1); });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { if (e.shiftKey) { if (results.length) setCurrent(current - 1); } else { if (results.length) setCurrent(current + 1); } }
        });
    <\/script>
</body>

</html>`;

  // src/main.js
  (function() {
    const rawTimeout = localStorage.getItem("AUTOEB_TIMEOUT");
    let AUTOEB_TIMEOUT = null;
    if (rawTimeout !== null && rawTimeout !== "") {
      const parsedTimeout = parseInt(rawTimeout, 10);
      if (!Number.isNaN(parsedTimeout) && parsedTimeout >= 10) {
        AUTOEB_TIMEOUT = parsedTimeout;
      } else {
        localStorage.removeItem("AUTOEB_TIMEOUT");
      }
    }
    sessionStorage.AUTOEB_VERSION = "1.61";
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
    const updater_script = document.createElement("script");
    updater_script.src = "https://raw.githubusercontent.com/ChuTM/auto-eb/refs/heads/main/services/updater.user.js";
    document.body.appendChild(updater_script);
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
    appendStyleLink(
      "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css"
    );
    appendStyleLink("https://alb-cdn.web.app/popupjs/pu.min.css");
    let custom_style_tag = document.createElement("style");
    custom_style_tag.innerHTML = style_default;
    shadow.appendChild(custom_style_tag);
    const container = document.createElement("div");
    container.innerHTML = ui_default;
    shadow.appendChild(container);
    let start_autofill = document.createElement("button");
    start_autofill.innerText = `Activate Auto EB ${sessionStorage.AUTOEB_VERSION}`;
    start_autofill.className = "auto-eb-hidden eb-button";
    setAutoEBButtonCSS(start_autofill, "default");
    start_autofill.addEventListener("click", (e2) => {
      if (!isInTaskPage()) {
        pujs.popup(
          "Start Automation?",
          // Title
          `Auto-EB will take over the web page to complete all the tasks.`,
          // Message
          [
            {
              // Buttons
              text: "Start Now",
              color: "lightgreen",
              callback: () => {
                startFullAutomation();
              }
            },
            {
              // Cancel Button
              text: "Cancel",
              callback: () => {
              }
            }
          ],
          "horiz"
        );
        return;
      } else {
        setAutoEBButtonCSS(
          start_autofill,
          {
            color: "#ffffff",
            background: "#2e7d32",
            cursor: "default"
          },
          "Auto EB is running..."
        );
        start_autofill.disabled = true;
        const statusTextElement = shadow.querySelector(
          ".autoeb-status-text"
        );
        if (statusTextElement) {
          statusTextElement.innerText = "Status: Auto EB is running...";
          statusTextElement.style.color = "#4caf50";
        }
        startAutomation(e2);
      }
    });
    shadow.appendChild(start_autofill);
    reportPresistence(start_autofill, "autofill");
    addToLog("Auto EB UI Initialized");
    let getAllAnswers = document.createElement("button");
    getAllAnswers.innerText = "Avoid Detection,\nInteract with page first.\nGet Decrypted XML";
    getAllAnswers.style.cssText = `position: fixed; left: 2rem; bottom: 5rem; cursor: pointer; text-decoration: underline; background: transparent; border: none; color: #0066cc; font-family: sans-serif;`;
    getAllAnswers.addEventListener("click", () => {
      if (!isInTaskPage()) {
        pujs.alert("Try this in a task page.");
        return;
      }
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
				<div>
					<center style="color:white; margin-bottom:10px; font-family: sans-serif;">Decrypted Source XML</center>
					<p>The source data has be parsed by the powerful AutoEB, <a id="pullOutNewTabLink" target="_blank" style="color: lightblue; text-decoration: underline;">click here to open in new tab to view.</a></p>
					<div style="display: none"><pre class="language-xml" id="xml-container"><code id="xml-block" class="language-xml"></code></pre></div>
					
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
              setTimeout(() => {
                const htmlContent = xml_data_default.replace(
                  "<pre>NO XML DATA FOUND</pre>",
                  document.getElementById("xml-container").outerHTML
                );
                const blob = new Blob([htmlContent], {
                  type: "text/html"
                });
                const url = URL.createObjectURL(blob);
                document.getElementById("pullOutNewTabLink").href = url;
              });
            } catch (e2) {
              console.error("Highlight Error:", e2);
            }
          }
        }, 100);
      }));
    });
    shadow.appendChild(getAllAnswers);
    reportPresistence(getAllAnswers, "XMLData");
    const AVOID_AUTO_CONTINUOUS_RETRY = shadow.getElementById(
      "AUTOEB_AVOID_CONTINUOUS_ANSWERING"
    );
    AVOID_AUTO_CONTINUOUS_RETRY.addEventListener("change", () => {
      if (AVOID_AUTO_CONTINUOUS_RETRY.checked) {
        localStorage.AUTOEB_AVOID_CONTINUOUS_ANSWERING = "AVOID";
        shadow.querySelector(
          ".AUTOEB_AVOID_CONTINUOUS_ANSWERING-descriptive-text"
        ).innerText = "AVOID";
      } else {
        localStorage.AUTOEB_AVOID_CONTINUOUS_ANSWERING = "CONTINUOUS";
        shadow.querySelector(
          ".AUTOEB_AVOID_CONTINUOUS_ANSWERING-descriptive-text"
        ).innerText = "Continuously";
      }
    });
    shadow.getElementById("AUTOEB_TIMEOUT").addEventListener("input", () => {
      localStorage.AUTOEB_TIMEOUT = shadow.getElementById("AUTOEB_TIMEOUT").value;
    });
    shadow.getElementById("AUTOEB_CORRECT_TARGET").addEventListener("input", () => {
      localStorage.AUTOEB_CORRECT_TARGET = shadow.getElementById(
        "AUTOEB_CORRECT_TARGET"
      ).value;
    });
    shadow.querySelector(".autoeb-settings-button .settings").addEventListener("click", () => {
      const OVERLAY = shadow.querySelector(".autoeb-overlay");
      OVERLAY.style.transform = "translateY(0) translateX(0)";
      OVERLAY.style.opacity = "1";
      OVERLAY.style.pointerEvents = "all";
      try {
        shadow.getElementById("AUTOEB_TIMEOUT").value = parseInt(localStorage.AUTOEB_TIMEOUT) || "";
      } catch (e2) {
        localStorage.AUTOEB_TIMEOUT = void 0;
      }
      shadow.getElementById("AUTOEB_AVOID_CONTINUOUS_ANSWERING").checked = localStorage.AUTOEB_AVOID_CONTINUOUS_ANSWERING === "AVOID";
      shadow.querySelector(
        ".AUTOEB_AVOID_CONTINUOUS_ANSWERING-descriptive-text"
      ).innerText = localStorage.AUTOEB_AVOID_CONTINUOUS_ANSWERING;
    });
    shadow.querySelector(".autoeb-overlay .overlay-close .close-button").addEventListener("click", () => {
      const OVERLAY = shadow.querySelector(".autoeb-overlay");
      OVERLAY.style.transform = "translateY(50%)";
      OVERLAY.style.opacity = "0";
      OVERLAY.style.pointerEvents = "none";
    });
    document.querySelectorAll("a.popup.link-blue[data-from='lesson']").forEach((el) => {
      el.addEventListener("click", (e2) => {
        if (e2.isTrusted) {
          sessionStorage.AUTOEB_FULL_AUTOMATION = "ENDED";
        }
        addToLog("Lesson Opened");
        console.log(
          sessionStorage.AUTOEB_FULL_AUTOMATION === "TASK_START"
        );
        if (sessionStorage.AUTOEB_FULL_AUTOMATION === "TASK_START") {
          automaticallyCheckAndChooseDifficulty();
        }
      });
    });
    setTimeout(() => {
      if (pujs && pujs.setup) {
        pujs.setup.icons_path = "https://alphabrate.github.io/icons";
        pujs.setup.init();
      }
      if (sessionStorage.AUTOEB_FULL_AUTOMATION === "TASK_END_CONTINUE") {
        startFullAutomation();
        start_autofill.innerText = "Continuing to next task...";
      }
    }, 500);
  })();
})();
