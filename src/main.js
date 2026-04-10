import { startAutomation } from "./logic.js";

(function () {
	let start_autofill = document.createElement("button");
	start_autofill.innerText = "Activate Auto EB";
	start_autofill.addEventListener("click", startAutomation);
    start_autofill.style = `position: fixed;z-index: 10000;background: white;padding: 0.5rem 1rem;border-radius: 11px;box-shadow: 0 0 10px 0px #00000035;margin: 1rem;`

    document.body.appendChild(start_autofill);
})();
