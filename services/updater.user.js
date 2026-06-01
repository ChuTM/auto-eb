(function () {
	console.log(
		"%c\n █████╗ ██╗   ██╗████████╗ ██████╗ \n ██╔══██╗██║   ██║╚══██╔══╝██╔═══██╗\n ███████║██║   ██║   ██║   ██║   ██║\n ██╔══██║██║   ██║   ██║   ██║   ██║\n ██║  ██║╚██████╔╝   ██║   ╚██████╔╝\n ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝ \n\n ███████╗██████╗ \n ██╔════╝██╔══██╗\n █████╗  ██████╔╝\n ██╔══╝  ██╔══██╗\n ███████╗██████╔╝\n ╚══════╝╚═════╝ \n\n  ██████╗████████╗███╗   ███╗\n ██╔════╝╚══██╔══╝████╗ ████║\n ██║        ██║   ██╔████╔██║\n ██║        ██║   ██║╚██╔╝██║\n ╚██████╗   ██║   ██║ ╚═╝ ██║\n  ╚═════╝   ╚═╝   ╚═╝     ╚═╝\n%c ───────────────────────────────────────────────────────────── \n  📅  COPYRIGHT (C) 2026 CHUTM. ALL RIGHTS RESERVED.           \n  📦  PRODUCT: PopupJS (An AlphaBet Project)                   \n  🌐  SOURCE:  https://github.com                               \n  🐛  SUPPORT: Open an issue on the GitHub repository.         \n ───────────────────────────────────────────────────────────── \n%c 💥  NO MORE USELESS MANUAL WORK, LET'S AUTOMATE!",
		// Style for ASCII Art
		"font-family: monospace; font-size: 13px; font-weight: 900; color: #00ffcc; background: #0b0f19; line-height: 1.2; padding-right: 20px;",
		// Style for Info Block
		"font-family: monospace; font-size: 12px; font-weight: bold; color: #e2e8f0; background: #0b0f19; line-height: 1.8; padding-right: 20px;",
		// Style for CTA Badge
		"font-family: sans-serif; font-size: 14px; font-weight: bold; color: #ffffff; background: #e11d48; padding: 6px 12px; border-radius: 4px; display: inline-block; margin-top: 10px;",
	);
	console.log(
		`[AUTOEB] External Online Script - Current Version: ${sessionStorage.AUTOEB_VERSION}`,
	);
	fetch(
		"https://raw.githubusercontent.com/ChuTM/auto-eb/refs/heads/main/.version.env",
	)
		.then((response) => response.text())
		.then((data) => {
			console.log(
				`[AUTOEB] External Online Script - Latest Version: ${data}`,
			);

			const latestVersion = data.split("=")[1].trim();
			if (latestVersion !== sessionStorage.AUTOEB_VERSION) {
				pujs.popup(
					"Update Detected", // Title
					`Current Version: ${sessionStorage.AUTOEB_VERSION}\nLatest Version: ${latestVersion}. Please update the script for the latest features and bug fixes.`, // Message
					[
						{
							// Buttons
							text: "Update Now",
							callback: () => {
								window.open(
									"https://raw.githubusercontent.com/ChuTM/auto-eb/refs/heads/main/dist/autoeb.user.js",
									"_blank",
								);
								pujs.lastingBanner(
									`<p>Reload the page once you have updated the script.</p>`,
									(type = "success"),
									"bottom",
									(buttons = [
										{
											text: "Reload Now",
											callback: () => {
												window.location.reload();
											},
										},
									]),
								);
							},
						},
						{
							// Cancel Button
							text: "Cancel",
							callback: () => {},
							color: "light-dark(#FF3B30, #FF453A)",
						},
					],
					"horiz",
				);
			}
		});
})();
