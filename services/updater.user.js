(function () {
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
							color: "lightgreen",
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
										{ text: "Reload Now", callback: () => {
											window.location.reload();
										} },
									]),
								);
							},
						},
						{
							// Cancel Button
							text: "Cancel",
							callback: () => {},
						},
					],
					"horiz",
				);
			}
		});
})();
