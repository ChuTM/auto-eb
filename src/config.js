export const MAP =
	"c3D1RFP9eM[UjINfOZi0Qg+mhkxSJ5p* uX8B}`-rs,LqAH@lnbVT.C{z4YWtGv72^/aw|do_6\\yE~]K";

export const ATTR_LIST = ["src", "href", "value"];
export const ATTR_CHILDREN_LIST = ["INPUT"];
export const JUNK_KEYWORDS = new Set([
	"subject",
	"zoom_out_map",
	"question_answer",
]);

/**
 * Calculates a human-like dynamic timeout based on action type and content length
 * @param {string} type - The action type ('read', 'type', 'click', 'default')
 * @param {number} [length=0] - Length of text to process for reading/typing simulation
 * @returns {number} Timeout duration in milliseconds
 */
export const TIMEOUT = (type = "default", length = 0) => {
	if (parseInt(localStorage?.AUTOEB_TIMEOUT))
		return localStorage.AUTOEB_TIMEOUT;
	const BASE_DELAY = 200;
	let t = BASE_DELAY;

	// Human reading speed: ~200-250 words per minute (WPM) -> ~4-5 words per second
	// Average word length is ~5 chars. So ~20-25 chars per second -> ~40-50ms per char
	if (type === "read") {
		t = length * Math.floor(Math.random() * 20 + 30); // 30-50ms per character reading time
		t = Math.max(t, 1200); // Minimum reading time 1.2s
	} else if (type === "type") {
		t = length * Math.floor(Math.random() * 80 + 70); // 70-150ms per character typing emulation
	} else if (type === "click") {
		t = Math.floor(Math.random() * 400 + 300); // 300-700ms reaction time before clicking
	}

	// Inject statistical jitter to eliminate predictable patterns
	const jitter = Math.floor(Math.random() * 150) - 75; // +/- 75ms jitter
	const totalDelay = Math.max(100, t + jitter);

	return totalDelay;
};

export const CORRECT_COUNT = (total) => {
	const target = localStorage.AUTOEB_CORRECT_TARGET || void 0;
	if (!target || isNaN(parseInt(target))) return total;
	return Math.round(parseFloat(target) * total);
};
