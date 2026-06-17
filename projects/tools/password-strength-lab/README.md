# Password Strength Lab

Small browser-based tool to test password strength locally and get practical improvement tips.

## Features

- Password input with show/hide toggle
- Strength score (`0-100`) with human-readable rating
- Checklist for:
  - length
  - uppercase/lowercase letters
  - numbers
  - symbols
  - repeated patterns
  - common words/sequences
- Suggestions to improve weak passwords
- One-click strong password generator

## Run locally

From this folder:

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Build

```bash
npm run build
```

## CI/CD

Pushes to `main` that touch this tool (or its workflow file) deploy `dist/` to Cloudflare Pages via GitHub Actions (`.github/workflows/deploy-password-strength-lab.yml`). You can also run the workflow manually from the Actions tab.

Required repository secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CF_PAGES_PASSWORD_STRENGTH_LAB`.

## Notes

- All analysis runs in the browser.
- The tool does not send entered passwords to any backend.
