export const MAP =
	"c3D1RFP9eM[UjINfOZi0Qg+mhkxSJ5p* uX8B}`-rs,LqAH@lnbVT.C{z4YWtGv72^/aw|do_6\\yE~]K";

export const ATTR_LIST = ["src", "href", "value"];
export const ATTR_CHILDREN_LIST = ["INPUT"];
export const JUNK_KEYWORDS = new Set([
	"subject",
	"zoom_out_map",
	"question_answer",
]);

export const TIMEOUT = () => {
	const DEFAULT = 100;
	let t = localStorage?.AUTOEB_TIMEOUT || DEFAULT;
	if (Number.isNaN(parseInt(t))) {
		// random.1000.25000 (in ms)
		if (t?.startsWith("random.")) {
			const min = parseInt(t.split(".")[1]);
			const max = parseInt(t.split(".")[2]);
			t = Math.floor(Math.random() * (max - min + 1)) + min;
		} else {
			addToLog(
				"USER SET: AUTOEB_TIMEOUT WRONGLY SET. ≠ random.[s].[e]",
				"error",
			);
			t = DEFAULT;
		}
	}
	if (t < DEFAULT) {
		addToLog("USER SET: WAIT TIME TOO SHORT.", "warning");
		t = DEFAULT;
	}
	return t;
}; // Prevent error

export const CORRECT_COUNT = (total) => {
	const target = localStorage.AUTOEB_CORRECT_TARGET || void 0;

	if (!target || isNaN(parseInt(target))) return total;

	return Math.round(parseFloat(target) * total);
};
