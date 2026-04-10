import * as esbuild from "esbuild";
import fs from "fs";

const header = fs.readFileSync("./src/header.js", "utf8");

await esbuild.build({
	entryPoints: ["src/main.js"],
	bundle: true,
	outfile: "dist/autoeb.user.js",
	banner: { js: header },
	format: "iife",
	target: ["es6"],
});
