# Design Sandbox

A unified web app for creative production workflows — Storyboard, Krea, and Higgsfield generation tools in one place. Runs entirely in the browser with no server required.

## Live App

**[https://capejsonstorage.github.io/design-sandbox/](https://capejsonstorage.github.io/design-sandbox/)**

---

## Tabs

| Tab | Tool | Description |
|-----|------|-------------|
| Storyboard | `storyboard-app.html` | Create, sketch, and export visual storyboards with shot metadata |
| Krea Generator | `docx_to_krea_v5.html` | Convert a `.docx` with red-font DESIGN blocks into a `.krea` project file |
| Higgsfield Generator | `higgsfield-generator.html` | Convert a `.docx` into a structured `.higgsfield.json` + visual node graph + CLI commands |

### DOCX Format (for Krea + Higgsfield tabs)

The `.docx` must contain DESIGN blocks marked in **red font** (`#FF0000`):

```
DESIGN:
Type: Still         ← or "Video"
Description: A couple on phones in bed back to back
Ref: https://www.pexels.com/photo/man-and-woman-8037093/
```

Context text (black font) immediately before each `DESIGN:` line is captured as a sticky note.

---

## Deploy to GitHub Pages

1. Create a new **public** repo (e.g. `design-sandbox`) on your GitHub account
2. Push all files:
   ```bash
   git init
   git add index.html storyboard-app.html docx_to_krea_v5.html higgsfield-generator.html README.md
   git commit -m "Initial Design Sandbox"
   git remote add origin https://github.com/YOUR_USERNAME/design-sandbox.git
   git push -u origin main
   ```
3. In the repo → **Settings → Pages → Source:** `main` branch, root `/` → Save
4. Wait ~60 seconds, then visit `https://YOUR_USERNAME.github.io/design-sandbox/`

---

## Switching GitHub Accounts

Only the remote URL needs to change — no code edits required:

```bash
git remote set-url origin https://github.com/NEW_ACCOUNT/design-sandbox.git
git push -u origin main
```

Then enable GitHub Pages on the new repo as described above.

---

## Higgsfield CLI Setup

The Higgsfield Generator exports a `.higgsfield.json` project file and a `_cli_commands.txt` file. To use them with the CLI:

```bash
npm install -g @higgsfield/cli
higgsfield auth login        # opens browser for 5-second auth
```

Then run the commands from the exported `_cli_commands.txt`, or integrate the `.higgsfield.json` with any MCP-compatible agent.

More info: [higgsfield.ai/cli](https://higgsfield.ai/cli)

---

## Local Development

Open any file directly in a browser — no build step, no server needed:

```
file:///path/to/claude/index.html
```

Or serve with any static server:

```bash
npx serve .
python -m http.server 8080
```
