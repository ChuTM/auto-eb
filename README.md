# 🚀 Auto EB

**Complete your EB tasks in seconds.**  
`Auto EB` is a high-efficiency automation engine designed to parse, decrypt, and solve Wiseman LMS tasks automatically.

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

| Feature | Status | Description |
| :--- | :--- | :--- |
| **Single Fill-in** | ✅ Stable | Single text input detection and entry. |
| **Standard MCQ** | ✅ Stable | Radio button selection and auto-submit. |
| **Multiple Fill-in/Options** | ⏳ Planned | Handling arrays of text inputs within one slide. |
| **Drag & Drop** | ⏳ Backlog | Identifying coordinate-based or sortable elements. |

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

## 🚀 Getting Started

### For Users (Tampermonkey)
1. Install the [Tampermonkey](https://www.tampermonkey.net/) extension.
2. Copy the contents of `dist/autoeb.user.js`.
3. Create a "New Script" in Tampermonkey and paste the code.
4. Navigate to the Wiseman EB lesson page and click **"Activate Auto EB"**.

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
   *This bundles the source files into a single IIFE script in the `dist` folder.*

---

## ⚠️ Disclaimer
**For Educational Purposes Only.**  
This project is a proof-of-concept demonstrating how client-side obfuscation can be bypassed. The authors are not responsible for any misuse, academic consequences, or account bans. Please use this tool responsibly and respect your institution's academic integrity policies.
