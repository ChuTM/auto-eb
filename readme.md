# 🚀 Auto EB

**Complete your EB tasks in seconds.**  
<u>Auto EB</u> is a lightweight automation engine designed to automatically answer all your questions correctly.

---

## 🛠️ How it Works

The tool operates through a four-stage pipeline:
1.  **Fetch**: Retrieves the question XML/dataset from the server.
2.  **Analyze**: Parses the dataset to identify question types and locations.
3.  **Decrypt**: Decodes the obfuscated correct answers using the internal `MAP` cipher.
4.  **Inject**: Detects DOM input fields, autofills the decrypted values, and triggers the submit event.

### Decryption Logic
The core obfuscation relies on a character mapping shift. The decryption function calculates a shifted index based on the character code and a seed value ($t$):

```javascript
const MAP = "c3D1RFP9eM[UjINfOZi0Qg+mhkxSJ5p* uX8B}`-rs,LqAH@lnbVT.C{z4YWtGv72^/aw|do_6\\yE~]K";

function decrypt(n, t) {
    let i = "";
    for (let o, s, r = 0; r < n.length; r++) {
        o = n.charCodeAt(r);
        // Determine base offset
        s = 32 === o ? 0 : o >= 42 && o <= 57 ? o - 41 : o >= 64 && o <= 126 ? o - 47 : -1;
        
        if (s >= 0 && s <= 79) {
            s = (s + r + t) % 80; // Calculate shifted index
            i += MAP.charAt(s);
        } else {
            i += n.charAt(r);
        }
    }
    return i;
}
```

---

## 📊 Feature Roadmap

| Feature | Status |
| :--- | :--- |
| **Single Fill-in-the-blank** | ✅ Supported |
| **Multiple Choice (MCQ)** | ✅ Supported |
| **Multiple Fill-in-the-blank** | ⏳ To Do |
| **Selection Questions** | ⏳ To Do |

---

## 📁 Project Structure

```text
├── dist/                # Compiled userscript output
├── res/                 # Resource files & original source samples
│   ├── craker.js        # Internal decryption helper
│   └── main.*.js        # Reference vendor scripts
├── src/                 # Core logic
│   ├── config.js        # User configurations
│   ├── header.js        # Userscript Metadata block
│   ├── logic.js         # Answer parsing & decryption
│   ├── main.js          # Entry point
│   └── utils.js         # DOM helpers
├── build.mjs            # Build script (ESM)
└── package.json         # Dependencies and metadata
```

---

## 🚀 Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (Latest LTS recommended)

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Compilation
To build the final `dist/autoeb.user.js` file, run:
```bash
node build.mjs
```

---

## ⚠️ Disclaimer
This tool is for educational and research purposes only. Please use responsibly and in accordance with your institution's academic integrity policies.