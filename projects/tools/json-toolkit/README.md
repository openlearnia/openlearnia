# json-toolkit

Privacy-first JSON utility for the browser. The app runs locally and does not send JSON data to any server.

## Features

- Paste JSON text directly into the input editor
- Load JSON from a local file (`.json` or text)
- Pretty format JSON
- Minify JSON
- Validate JSON with parser error details and line/column
- Copy output to clipboard

## Development

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Build

```bash
npm run build
npm run preview
```

`npm run build` outputs production files to `dist/`.

## CI/CD

Pushes to `main` that touch this tool (or its workflow file) deploy `dist/` to Cloudflare Pages via GitHub Actions (`.github/workflows/deploy-json-toolkit.yml`). You can also run the workflow manually from the Actions tab.

Required repository secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CF_PAGES_JSON_TOOLKIT`.
