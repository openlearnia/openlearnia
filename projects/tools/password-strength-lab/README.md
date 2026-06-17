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

## Notes

- All analysis runs in the browser.
- The tool does not send entered passwords to any backend.
