# PDF Tools — Design Spec

**Date:** 2026-07-23  
**Status:** Approved — Phase 2 tools shipped (delete/reorder/watermark/images↔PDF; Pages/DNS still pending)  
**Product shape:** Full suite hub (Option A), mirroring Image Tools

## Summary

Ship **Openlearnia PDF Tools** as a privacy-first, client-side Astro multi-tool suite at `pdf-tools.openlearnia.com`. MVP ships three tools — **Merge**, **Split**, **Rotate** — with PDF.js page thumbnails, hard limits, and no uploads. Later tools land on the same hub without changing architecture.

## Locked decisions

| Decision | Choice |
|----------|--------|
| Product shape | Astro multi-tool suite hub (like Image Tools) |
| MVP tools | Merge, Split, Rotate |
| Processing | Browser-only (main thread + Web Worker); never upload |
| Location | `projects/tools/pdf-tools` → Pages project `pdf-tools` |
| Live URL | `https://pdf-tools.openlearnia.com` |
| Hub listing | Entry in `website/src/data/tools.json` |
| Repo | New `openlearnia/pdf-tools` + umbrella submodule |

## Resolved defaults (override before build if needed)

| Topic | Default | Rationale / counter-argument |
|-------|---------|------------------------------|
| Previews | **PDF.js page thumbnails in MVP** | Trust beats “download and pray.” Opponent: heavier bundle. We still ship it — PDFs without thumbs feel like a fax machine. |
| File limits | **Warn/block at 50 MB per file and 200 pages per doc** | Images use 25 MB; PDFs run larger. Soft UX: clear error, no silent OOM. Mobile may still struggle — acceptable for v1. |
| Password PDFs | **Hard-fail with a clear message** | Unlock UI is Phase 2+. No false promise of “we’ll crack it.” |
| Sample files | Optional tiny public sample PDF(s) for “Try a sample” | Mirror Image Tools DropZone sample button; can land with MVP or immediately after. |

---

## Architecture

### Placement (mirror Image Tools)

```
projects/tools/pdf-tools/          # git submodule → github.com/openlearnia/pdf-tools
├── package.json                   # astro, @astrojs/sitemap, pdf-lib, pdfjs-dist
├── wrangler.toml                  # name = "pdf-tools", pages_build_output_dir = "./dist"
├── DEPLOY.md
├── README.md
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   ├── sitemap handled by @astrojs/sitemap
│   └── samples/                   # optional tiny.pdf
└── src/
    ├── layouts/AppLayout.astro    # dark chrome, nav, privacy footer, JSON-LD
    ├── styles/global.css          # tokens aligned with image-tools / AppChrome (#0f1117, #6ea8fe)
    ├── data/pdf-tools.json        # tool catalog for hub + nav
    ├── components/
    │   ├── ToolShell.astro        # privacy badge + title + card slot
    │   ├── DropZone.astro         # accept application/pdf
    │   └── PageThumbGrid.astro    # thumbnail strip / grid container
    ├── lib/pdf/
    │   ├── limits.ts              # MAX_FILE_BYTES, MAX_PAGES, validateFile, formatBytes
    │   ├── types.ts
    │   ├── download.ts            # blob → download (same idea as image-tools)
    │   ├── load.ts                # ArrayBuffer load + password / corrupt detection
    │   ├── preview.ts             # pdfjs-dist render page → canvas/blob URL
    │   ├── engine.ts              # UI ↔ worker queue (pattern from image-tools engine.ts)
    │   └── worker.ts              # pdf-lib merge/split/rotate off main thread
    ├── pages/
    │   ├── index.astro            # hub by category
    │   ├── merge.astro
    │   ├── split.astro
    │   └── rotate.astro
    └── scripts/
        ├── ui.ts                  # dropzone helpers, processing state
        ├── merge.ts
        ├── split.ts
        └── rotate.ts
```

Umbrella repo also updates:

- `.gitmodules` — add `projects/tools/pdf-tools`
- `website/src/data/tools.json` — new `pdf-tools` entry
- Optionally `docs/superpowers/plans/assets/app-chrome/relatedTools.ts` — add PDF Tools link

### Processing model

| Concern | Library | Where it runs |
|---------|---------|----------------|
| Mutate PDFs (merge / copy pages / rotate) | **`pdf-lib`** | Web Worker (`lib/pdf/worker.ts`) via `engine.ts` queue |
| Render page thumbnails | **`pdfjs-dist`** | Main thread (canvas); cache blob URLs; revoke on reset |
| Download | Native `Blob` + `<a download>` | Main thread (`download.ts`) |
| ZIP (multi-file split later) | `jszip` only if needed | **Not MVP** — split downloads one PDF (or one ZIP in Phase 2) |

No Cloudflare Worker logic, no R2, no API routes. Pages serves static `dist/` only.

### Limits (`lib/pdf/limits.ts`)

```ts
MAX_FILE_BYTES = 50 * 1024 * 1024   // 50 MB
MAX_PAGES = 200
ACCEPTED = application/pdf + /\.pdf$/i
```

Validation order: type → size → (after load) page count → password/encrypt flag.

---

## Routes and pages

| Route | Purpose |
|-------|---------|
| `/` | Hub: categories + tool cards from `pdf-tools.json` |
| `/merge` | Combine 2+ PDFs in user-chosen order |
| `/split` | Extract page ranges into a new PDF |
| `/rotate` | Rotate all or selected pages by 90° steps |

`AppLayout` nav: “All tools” + first tools from catalog (same slice pattern as Image Tools) + Openlearnia + GitHub.

### `pdf-tools.json` (MVP)

```json
[
  { "slug": "merge",  "name": "Merge",  "category": "Combine", "description": "Combine multiple PDFs into one file, in order." },
  { "slug": "split",  "name": "Split",  "category": "Extract", "description": "Extract a page range into a new PDF." },
  { "slug": "rotate", "name": "Rotate", "category": "Edit",    "description": "Rotate pages 90°, 180°, or 270°." }
]
```

---

## UX per tool

Shared chrome (from Image Tools):

- Privacy badge: “Processed on your device — nothing uploaded”
- Drop zone → file list / stats → controls → thumbnails → primary Download button
- Errors inline under drop zone (not only `alert`)

### Merge

1. Drop/select **2+** PDFs (`multiple`).
2. List files with **reorder** controls (up/down or drag). Order = final page order.
3. Show stacked section thumbs (first page of each file is enough for MVP; optional all-pages if cheap).
4. Process → single PDF download (`merged.pdf`).
5. Edge: <2 files → disable download; oversize/page-cap on any file → reject that file with message.

### Split

1. Drop **one** PDF.
2. Render **all page thumbnails** (capped by `MAX_PAGES`).
3. Controls: range inputs (`from`–`to`, 1-based) and/or click-select pages (range inputs are MVP-minimum; click-select is nice-to-have in MVP).
4. Preview selection count → Download `split.pdf` (pages in original order).
5. Invalid range → inline error.

### Rotate

1. Drop **one** PDF.
2. Thumbnails + per-page or global rotation: **90° / 180° / 270°** (CW).
3. MVP minimum: **rotate all pages** by one angle; optional per-page toggles if cheap.
4. Download `rotated.pdf`.

### Password / corrupt handling

- Detect encryption / password requirement on load → show:  
  **“This PDF is password-protected. Unlock support isn’t available yet — use an unlocked copy.”**
- Corrupt / unreadable → **“Couldn’t read this PDF. It may be damaged.”**
- Do not attempt empty-password unlock heuristics that silently fail.

---

## Privacy and copy constraints

Must match Openlearnia browser-tool voice:

- Hub + every tool: privacy badge and footer “files never leave your device”
- Meta description / JSON-LD `WebApplication`: emphasize local processing, free, no account
- **Never** claim compression quality, cloud OCR, or “we store nothing on our servers because we never receive files” without the local-processing framing
- No analytics that upload file contents; no third-party upload widgets
- Theme: dark (`#0f1117` background, `#6ea8fe` accent) — reuse Image Tools / AppChrome tokens, not a light Inter orphan

Suggested `tools.json` marketing copy:

- **name:** PDF Tools  
- **tagline:** Privacy-first PDF utilities that run entirely in your browser.  
- **description:** Merge, split, and rotate PDFs on your device — nothing is uploaded.  
- **url:** `https://pdf-tools.openlearnia.com`  
- **github:** `https://github.com/openlearnia/pdf-tools`  
- **type:** `web`, **platform:** `Browser`

---

## Hub listing + deploy

### Website

Add to `website/src/data/tools.json` (browser tools section). Detail page at `/tools/pdf-tools` is automatic via `[slug].astro`.

### Repo / submodule

1. Create `openlearnia/pdf-tools` (MIT, same as siblings).
2. Add submodule path `projects/tools/pdf-tools`.
3. Local develop: `bun install && bun run dev` (Astro default; document port in README).

### Cloudflare Pages

Per existing ops memory: **manual** `wrangler pages deploy` (do not rely on GHA alone).

```bash
bun run build
wrangler pages deploy ./dist --project-name=pdf-tools --commit-dirty=true
```

- `wrangler.toml`: `name = "pdf-tools"`, `pages_build_output_dir = "./dist"`
- Custom domain: `pdf-tools.openlearnia.com`
- `DEPLOY.md` cloned from Image Tools with names swapped

### SEO

- `@astrojs/sitemap`, `robots.txt`, canonical URLs, OG basics, `WebApplication` JSON-LD (same shape as Image Tools `AppLayout`).

---

## Phase 2 backlog (not MVP)

- Reorder pages within a single PDF (dedicated tool or merge-adjacent UI)
- Delete pages
- Text watermark
- Images → PDF / PDF → images (PDF.js render + pdf-lib embed)
- Multi-range split → ZIP (`jszip`)
- Password unlock / encrypt
- “Compress” only if we can be honest about method and results
- Related-tools footer via AppChrome `relatedTools.ts`
- PWA / offline cache

## Explicit non-goals (MVP and near-term)

- Server-side processing, accounts, cloud storage
- Office/Word ↔ PDF conversion
- OCR / searchable-PDF generation
- Digital signatures, form filling, redaction (true secure redaction)
- Editing text content inside PDFs
- Claiming “compress like TinyPDF” without a real pipeline
- Bolting PDF routes into `image-tools` or into the main `website/` app shell

---

## Testing (implementation plan detail later)

Minimum when building:

- Unit-level checks on page-range parsing and limit validation (no framework required if project stays light)
- Manual: merge 2 small PDFs, split middle pages, rotate 90°, reject oversize / password / non-PDF
- Smoke: hub + three routes load on Pages preview URL

## Implementation order (after approval)

1. Scaffold Astro app + layout/tokens + hub from `pdf-tools.json`
2. `limits` + load/password errors + DropZone
3. PDF.js thumbnails
4. Worker + pdf-lib: merge → split → rotate
5. Website `tools.json` + submodule wiring + DEPLOY.md
6. Manual wrangler deploy + domain

---

## Approval

Approve this design to proceed to an implementation plan and build, or list changes (especially any override to the defaults table).
