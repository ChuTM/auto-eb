# 📖 Auto EB

**Complete your EB tasks in seconds.**  
`Auto EB` is a high-efficiency automation engine designed to parse, decrypt, and solve Wiseman LMS tasks automatically.

---

<p align="center" width="100%">
   <video src="https://github.com/user-attachments/assets/2d6ac87f-470f-4371-9583-d1d349d34936" width="80%" controls autoplay loop></video>
</p>

Watch [attachments/demo-video.mp4](attachments/demo-video.mp4).

## 🚀 Getting Started

### Tutorial Video

<p align="center" width="100%">
   <video src="https://github.com/user-attachments/assets/1341b289-c75c-42ca-9d2c-194c42be25a5" width="80%" controls autoplay loop></video>
</p>

Watch [attachments/tutorial.mp4](attachments/tutorial.mp4).

---

### For Safari Users (macOS & iOS)

#### 1. Install a Userscript Manager
Safari requires a third-party app to run userscripts. Download one of the following from the App Store:
* **Userscripts** (Highly recommended, free, and open-source).
* **Tampermonkey for Safari** (Paid).

#### 2. Enable the Extension
* Open **Safari Settings** (or Preferences).
* Go to the **Extensions** tab.
* Find your chosen manager (e.g., "Userscripts") and **check the box** to enable it.
* **Note for iOS:** Go to Settings > Safari > Extensions to enable it there.

#### 3. Configure the Extension Permissions
* While in the Extensions menu, click on the manager.
* Ensure "Allow" or "Always Allow on Every Website" is selected so the script can run on the Wiseman EB page.

### 4. Install the Script
* **Method A (Automatic):** Click this link: [autoeb.user.js](https://raw.githubusercontent.com/ChuTM/auto-eb/refs/heads/main/dist/autoeb.user.js). Safari should prompt you to "Install" or "Create" the script automatically.
* **Method B (Manual):** * Open the [raw script code](https://raw.githubusercontent.com/ChuTM/auto-eb/refs/heads/main/dist/autoeb.user.js) and copy everything.
    * Open your Userscript manager's dashboard/editor.
    * Create a **New Script**, paste the code, and save.

#### 5. Activate on Wiseman EB
* Navigate to the Wiseman EB lesson page.
* You may need to refresh the page once.
* Click the **"Activate Auto EB"** button that appears on the interface.

---

### For All Other Browsers (Chrome, Edge, Firefox, Brave)

#### 1. Install Tampermonkey
Visit the **[Tampermonkey Official Website](https://www.tampermonkey.net/)** and install the extension for your specific browser.

#### 2. Configure Browser Settings
To allow custom scripts to run, you must adjust your browser's security settings:
* **Enable Developer Mode:** Go to your Extensions page (`chrome://extensions` or `edge://extensions`) and toggle **Developer Mode** to **ON**.
* **Allow User Scripts:**
    1.  In your browser's Extension settings, click **Details** under Tampermonkey.
    2.  Find the toggle for **"Allow access to file URLs"** and turn it **ON**.
    3.  (For Chrome/Edge) Look for the **"Allow user scripts"** setting and ensure it is enabled to prevent the browser from blocking the script execution.

#### 3. Install the Script
* **Automatic Install:** Open the [autoeb.user.js](https://raw.githubusercontent.com/ChuTM/auto-eb/refs/heads/main/dist/autoeb.user.js) link. Tampermonkey will open a new tab; click **Install**.
* **Manual Install:**
    1.  Copy the full code from the [source link](https://raw.githubusercontent.com/ChuTM/auto-eb/refs/heads/main/dist/autoeb.user.js).
    2.  Click the Tampermonkey icon in your toolbar and select **Create a new script**.
    3.  Paste the code and select **File > Save**.

#### 4. Activate on Wiseman EB
1.  Navigate to the **Wiseman EB lesson page**.
2.  Click the **"Activate Auto EB"** button that appears on the interface.

--- 

### For Developers (Build from Source)

If you want to modify the logic or the cipher:

1. **Install Dependencies**:
    ```bash
    npm install
    ```
2. **Build**:
    ```bash
    node build.mjs
    ```
    _This bundles the source files into a single IIFE script in the `dist` folder._

---

## 🛠️ How It Works

The engine operates through a coordinated four-stage pipeline:

1.  **Extraction**: Locates the active course `iframe` and fetches the underlying `course_pc.exml` dataset.
2.  **Analysis**: Parses the XML structure to map question types (fill-in/MCQ) and retrieve the encryption `seed`.
3.  **Decryption**: Processes obfuscated strings using a custom Caesar-style shift against a specific internal `MAP` cipher.
4.  **Injection**: Matches the current DOM state to the decrypted database, autofills values, and programmatically triggers `submit` and `next` events.

### The Decryption Logic

The core security relies on a character mapping shift. The decryption function calculates a shifted index based on the character code and a dynamic seed value $s$:

$$s = (index_{base} + i + seed) \pmod{80}$$

---

## 📊 Feature Roadmap

| Feature                      | Status     | Description                                        |
| :--------------------------- | :--------- | :------------------------------------------------- |
| **Single Fill-in**           | ✅ Stable  | Single text input detection and entry.             |
| **Standard MCQ**             | ✅ Stable  | Radio button selection and auto-submit.            |
| **Multiple Fill-in** | ⏳ Planned | Handling arrays of text inputs within one slide.   |
｜ **Variable Answering Time** | ✅ Taking Shape | Avoid being logged and suspected by your teacher. |
| **Single/Multiple Dropdown Questions** | ⏳ Planned | Identify multiple or single dropdown menus. |

---

## 📂 Project Structure

```text
├── dist/                # Compiled Userscript (Ready for Tampermonkey)
├── src/                 # Modular Source Code
│   ├── config.js        # Global constants & Cipher MAP
│   ├── header.js        # Tampermonkey metadata block
│   ├── logic.js         # DOM scraping & automation flow
│   ├── main.js          # UI Entry point (The "Activate" button)
│   └── utils.js         # Decryption engine & HTML sanitizers
├── build.mjs            # ESBuild configuration script
└── package.json         # Build dependencies
```

---

## ⚠️ Disclaimer

**For Educational Purposes Only.**  
This project is a proof-of-concept demonstrating how client-side obfuscation can be bypassed. The authors are not responsible for any misuse, academic consequences, or account bans. Please use this tool responsibly and respect your institution's academic integrity policies.
