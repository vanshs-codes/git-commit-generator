# 🚀 AI Git Commit Generator (gcm)

A command-line tool that uses the **Google Gemini API** to instantly generate conventional commit messages from your staged Git changes.

---

## ✨ Features

- Analyzes `git diff` output to understand code changes.
- Leverages the **Google Gemini API** for intelligent, context-aware suggestions.
- Generates messages following the **Conventional Commits** standard.
- Interactive CLI to confirm and copy the generated message to your clipboard.

---

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/vanshs-codes/git-commit-generator.git
cd git-commit-generator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Your API Key

The tool needs a global configuration file to store your Gemini API key.

- Navigate to your home directory (cd ~).
- Create a file named .gcm-config.json.
- Add your API key to the file in JSON format:

```json
{
  "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY"
}
```

### 4. Link the CLI for Global Use
Run the following command inside the project directory to make the gcm command available everywhere on your system.

```bash
npm link
```
---

## Usage

To use the tool, first stage the changes. Then run:
```bash
gcm
```

The tool will use AI to generate conventional commit messages which can be then directly copied to the clipboard by typing 'y'.

All of the commit messages of this project itself except "initial project setup" are the ones recommended by the tool itself.
