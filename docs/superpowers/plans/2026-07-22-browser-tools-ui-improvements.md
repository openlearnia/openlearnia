# Browser Tools UI Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a consistent Openlearnia dark brand chrome and P0 UX fixes across browser tools (excluding Live Wallpaper), then deploy each Cloudflare Pages project manually with wrangler and bump umbrella submodule SHAs.

**Architecture:** Freeze canonical CSS tokens once, then copy a small AppChrome pattern (header + privacy chip + footer) into each tool repo rather than publishing a shared npm package in this pass. Retheme light orphans first (json-toolkit, password-strength-lab, image-metadata-viewer), close chrome gaps on already-dark apps (markdown-editor, schema-builder), then land tool-specific P0s and shared empty-state / shortcuts / export / related-tools conventions. Each tool remains an independent Pages deploy.

**Tech Stack:** Astro + Bun (image-tools); Vite + React + TypeScript + Vitest (json-toolkit, password-strength-lab, image-metadata-viewer, markdown-editor, schema-builder); Cloudflare Pages via `wrangler pages deploy`; git submodules under `projects/tools/*` + `website/`.

## Global Constraints

- **Out of scope:** Live Wallpaper / desktop (`projects/tools/livewallpaper`).
- **Privacy-first:** All processing stays in-browser; never upload passwords or images to a server.
- **Canonical dark tokens (freeze verbatim):** `--bg #0f1117`, `--surface #1a1d27`, `--surface-2` / `--surface-raised ~#242936` / `#222633`, `--text #e8eaed`, `--muted #9aa0a6`, `--accent #6ea8fe`, `--border #2a2f3a`, `--success #3dd68c`, `--warning #f5a623`, `--danger #f28b82`; `theme-color #0f1117`; dark-first (optional light later).
- **Brand chrome (every tool):** product name, Openlearnia link-back (`https://openlearnia.com`), GitHub repo link, persistent privacy chip copy exactly: `Runs locally — nothing leaves your device`, footer with `© Openlearnia · openlearnia.com · GitHub · privacy one-liner`.
- **Marketing vs app:** SEO landings stay on `openlearnia.com/tools/*`; apps keep dense chrome, not marketing heroes.
- **URL hash share:** only for non-secret text tools (JSON / schema / markdown) — **never** password.
- **Motion:** respect `prefers-reduced-motion`.
- **Deploy:** production is **manual** `wrangler pages deploy ./dist --project-name=<name> --commit-dirty=true` after build — do **not** assume GitHub Actions push deploys.
- **Repo reality:** work lands in each tool submodule on its own branch/PR; after merge, bump the pinned SHA in the umbrella `openlearnia` repo. Commit messages use `feat:` / `fix:` / `refactor:` / `perf:` / `docs:` prefixes.
- **Build tools:** Bun for `image-tools` and `markdown-editor`; npm for the rest.
- **YAGNI on shared package:** do **not** create `@openlearnia/app-chrome` in this plan; copy tokens + chrome files. Revisit only after a third retheme proves drift.

---

## Submodule & deploy workflow (every phase)

Work inside the tool repo, not only the umbrella tree:

```bash
cd projects/tools/<tool>
git checkout -b feat/ui-p0-<short-name>
# ... implement, test, commit in the submodule ...
# after PR merge to that repo's main:
cd /path/to/openlearnia   # umbrella
git add projects/tools/<tool>
git commit -m "chore: bump <tool> submodule for UI P0"
```

Manual deploy from the tool root after `build`:

| Project | Build | Deploy |
|---------|-------|--------|
| image-tools | `bun run build` | `wrangler pages deploy ./dist --project-name=image-tools --commit-dirty=true` |
| json-toolkit | `npm run build` | `wrangler pages deploy ./dist --project-name=json-toolkit --commit-dirty=true` |
| password-strength-lab | `npm run build` | `wrangler pages deploy ./dist --project-name=password-strength-lab --commit-dirty=true` |
| image-metadata-viewer | `npm run build` | `wrangler pages deploy ./dist --project-name=image-metadata-viewer --commit-dirty=true` |
| markdown-editor | `bun run build` | `wrangler pages deploy ./dist --project-name=markdown-editor --commit-dirty=true` |
| schema-builder | `npm run build` | `wrangler pages deploy ./dist --project-name=schema-builder --commit-dirty=true` |
| website (only if related-tools /tools pages change) | `npm run build` | `wrangler pages deploy ./dist --project-name=website --commit-dirty=true` |

---

## File map (create / modify)

### Shared pattern (copied per React tool)

| File | Role |
|------|------|
| `src/chrome/tokens.css` | Canonical CSS variables + `theme-color` guidance |
| `src/chrome/AppChrome.tsx` | Header, privacy chip, footer, related-tools slot |
| `src/chrome/ShortcutsOverlay.tsx` | `?` / `⌘/` overlay shell (tools customize shortcut rows) |
| `src/chrome/relatedTools.ts` | Curated sibling tool links |

### image-tools (Astro)

| File | Role |
|------|------|
| `src/styles/global.css` | Tokens (already close) + **fix `[hidden]` preview bug** |
| `src/layouts/AppLayout.astro` | Chrome completeness; nav overflow later (P1) |
| `src/components/DropZone.astro`, `src/scripts/ui.ts` | Paste + sample image |
| `src/pages/strip-metadata.astro` | Cross-link to metadata viewer |
| `public/samples/*` | Demo assets |

### json-toolkit

| File | Role |
|------|------|
| `src/index.css`, `src/App.css`, `src/App.tsx` | Retheme, split panes, actions, copy on output |
| `src/chrome/*` | Brand chrome |
| `src/lib/jsonHighlight.ts` | Line numbers + lightweight highlight (or CodeMirror) |
| `src/App.test.tsx` | Error message + copy behavior |

### password-strength-lab

| File | Role |
|------|------|
| `src/index.css`, `src/App.css`, `src/App.tsx` | Retheme, copy, generator controls, honest meter |
| `src/chrome/*` | Brand chrome |
| `src/lib/analyzePassword.ts` | Extract analysis for unit tests |
| `src/lib/analyzePassword.test.ts` | Score / rating / meter color mapping |

### image-metadata-viewer

| File | Role |
|------|------|
| `src/index.css`, `src/App.css`, `src/App.tsx` | Dark retheme, summary, filter, chrome |
| `src/chrome/*` | Brand chrome + Strip Metadata cross-link |
| `src/lib/summarizeExif.ts` | Human summary + grouping helpers |
| `src/lib/summarizeExif.test.ts` | Camera / date / GPS extraction |

### markdown-editor

| File | Role |
|------|------|
| `src/components/TopBar.tsx`, `AppShell.tsx` | Openlearnia + GitHub + privacy chip |
| `src/components/FileTree.tsx` | Stronger active-file contrast |
| `src/editor/MarkdownEditor.tsx`, `src/preview/MarkdownPreview.tsx` | Scroll-sync |
| `src/fs/import.ts` (new) | Drag-drop / file import |
| `src/index.css` | Token align if any drift |

### schema-builder (Database Lab)

| File | Role |
|------|------|
| `src/index.css` | Align tokens to canonical set |
| `src/App.tsx`, `src/components/Toolbar.tsx` | Chrome, Apply/dirty status |
| `src/components/SchemaCanvas.tsx` | Empty CTA + sample schema |
| `src/components/SqlTab.tsx` / `SqlPanel.tsx` | SQL editor quality (highlight) |
| `src/chrome/ShortcutsOverlay.tsx` | `?` shortcuts |
| `src/schema-core/sampleSchema.ts` | Seed sample |

### Audit reference (read-only)

- `.audit-screenshots/` (umbrella) — do not re-audit; use for visual acceptance.

---

## Phase overview

| Phase | Intent | Ships when |
|-------|--------|------------|
| **0** | Freeze tokens + AppChrome copy kit | Docs + reference files in umbrella; first React tool can paste them |
| **1** | Retheme light orphans + chrome | json / password / metadata match dark brand + chrome |
| **2** | Close chrome on dark apps | markdown + schema link-back, privacy, footer, token align |
| **3** | Tool P0s | Per-tool acceptance below |
| **4** | Cross-cutting polish | Empty/sample/`?`/export/related-tools where missing |
| **5** | Deploy + umbrella SHA bumps | Live Pages + submodule pins |

**Opponent note:** A shared package would DRY chrome faster — but six independent Pages deploys + submodule publish lag would block P0s. Copy-first wins this sprint; extract later if tokens drift.

---

### Task 1: Freeze tokens + AppChrome kit in umbrella docs

**Files:**
- Create: `docs/superpowers/plans/assets/app-chrome/tokens.css`
- Create: `docs/superpowers/plans/assets/app-chrome/AppChrome.tsx`
- Create: `docs/superpowers/plans/assets/app-chrome/relatedTools.ts`
- Modify: this plan file only if paths change

**Interfaces:**
- Consumes: canonical token list from Global Constraints
- Produces: copy-paste kit used by Tasks 3–5

- [ ] **Step 1: Write `tokens.css`**

```css
:root {
  color-scheme: dark;
  --bg: #0f1117;
  --surface: #1a1d27;
  --surface-2: #242936;
  --surface-raised: #222633;
  --text: #e8eaed;
  --muted: #9aa0a6;
  --accent: #6ea8fe;
  --border: #2a2f3a;
  --success: #3dd68c;
  --warning: #f5a623;
  --danger: #f28b82;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
}

.privacy-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--muted);
  font-size: 0.75rem;
}
```

- [ ] **Step 2: Write `AppChrome.tsx` reference**

```tsx
import type { ReactNode } from 'react'

type AppChromeProps = {
  productName: string
  githubUrl: string
  children: ReactNode
  relatedTools?: { name: string; href: string }[]
}

const PRIVACY = 'Runs locally — nothing leaves your device'

export function AppChrome({ productName, githubUrl, children, relatedTools = [] }: AppChromeProps) {
  return (
    <div className="app-chrome">
      <header className="app-header">
        <div className="app-header__brand">
          <strong>{productName}</strong>
          <a href="https://openlearnia.com">Openlearnia</a>
          <a href={githubUrl} rel="noreferrer" target="_blank">GitHub</a>
        </div>
        <p className="privacy-chip" role="status">{PRIVACY}</p>
      </header>
      <main>{children}</main>
      {relatedTools.length > 0 && (
        <nav className="related-tools" aria-label="Related tools">
          {relatedTools.map((t) => (
            <a key={t.href} href={t.href}>{t.name}</a>
          ))}
        </nav>
      )}
      <footer className="app-footer">
        <span>© Openlearnia</span>
        <a href="https://openlearnia.com">openlearnia.com</a>
        <a href={githubUrl} rel="noreferrer" target="_blank">GitHub</a>
        <span>{PRIVACY}</span>
      </footer>
    </div>
  )
}
```

- [ ] **Step 3: Write `relatedTools.ts` seed**

```ts
export const OPENLEARNIA_TOOLS = [
  { name: 'Image Tools', href: 'https://image-tools.openlearnia.com' },
  { name: 'Image Metadata Viewer', href: 'https://image-metadata-viewer.openlearnia.com' },
  { name: 'JSON Toolkit', href: 'https://json-toolkit.openlearnia.com' },
  { name: 'Password Strength Lab', href: 'https://password-strength-lab.openlearnia.com' },
  { name: 'Markdown Editor', href: 'https://markdown-editor.openlearnia.com' },
  { name: 'Database Lab', href: 'https://schema-builder.openlearnia.com' },
] as const

export function relatedExcept(currentHref: string) {
  return OPENLEARNIA_TOOLS.filter((t) => t.href !== currentHref)
}
```

- [ ] **Step 4: Commit in umbrella**

```bash
git add docs/superpowers/plans/assets/app-chrome docs/superpowers/plans/2026-07-22-browser-tools-ui-improvements.md
git commit -m "docs: add AppChrome token kit for browser-tool UI plan"
```

**Acceptance:** Kit files exist; hex values match Global Constraints exactly.

---

### Task 2: image-tools — fix `[hidden]` preview CSS bug

**Files:**
- Modify: `projects/tools/image-tools/src/styles/global.css` (around `.preview-row` / `.preview-box img`)
- Reference: `projects/tools/image-tools/src/components/PreviewCompare.astro`

**Interfaces:**
- Consumes: existing `hidden` attribute on `#preview` rows
- Produces: empty state with no broken-image icons

- [ ] **Step 1: Reproduce locally**

```bash
cd projects/tools/image-tools && bun run build && bunx --bun astro preview --port 4321
# Open /compress with no file — preview row must not show broken images
```

Expected today: broken-image icons because `.preview-row { display: grid }` overrides `[hidden]`.

- [ ] **Step 2: Add explicit hidden override**

In `global.css`, immediately after `.preview-row { ... }`:

```css
.preview-row[hidden] {
  display: none !important;
}

.preview-box img[hidden],
.preview-box img:not([src]),
.preview-box img[src=""] {
  display: none;
}
```

- [ ] **Step 3: Verify empty compress page**

Reload `/compress` with no upload. Expected: no broken-image icons; dropzone visible.

- [ ] **Step 4: Commit in image-tools submodule**

```bash
cd projects/tools/image-tools
git add src/styles/global.css
git commit -m "fix: respect [hidden] on preview rows so empty state stays clean"
```

**Acceptance:** Empty tool pages show no broken `<img>`; after upload, preview still grids correctly.

---

### Task 3: json-toolkit — dark retheme + AppChrome

**Files:**
- Create: `projects/tools/json-toolkit/src/chrome/tokens.css`
- Create: `projects/tools/json-toolkit/src/chrome/AppChrome.tsx`
- Modify: `projects/tools/json-toolkit/src/index.css`
- Modify: `projects/tools/json-toolkit/src/App.css`
- Modify: `projects/tools/json-toolkit/src/App.tsx`
- Modify: `projects/tools/json-toolkit/index.html` (`theme-color`)

**Interfaces:**
- Consumes: Task 1 kit
- Produces: dark-branded shell wrapping existing Format/Minify/Validate

- [ ] **Step 1: Copy kit into `src/chrome/`** and import tokens from `index.css`:

```css
@import './chrome/tokens.css';
```

- [ ] **Step 2: Set `theme-color` in `index.html`**

```html
<meta name="theme-color" content="#0f1117" />
```

- [ ] **Step 3: Wrap App return in AppChrome**

```tsx
import { AppChrome } from './chrome/AppChrome'
import { relatedExcept } from './chrome/relatedTools'

// inside return:
return (
  <AppChrome
    productName="JSON Toolkit"
    githubUrl="https://github.com/openlearnia/json-toolkit"
    relatedTools={relatedExcept('https://json-toolkit.openlearnia.com')}
  >
    {/* existing app body */}
  </AppChrome>
)
```

- [ ] **Step 4: Retheme `App.css`** — replace light `#eff6ff` / Inter-default cards with `var(--surface)`, `var(--border)`, `var(--accent)` primary buttons; muted secondary actions.

- [ ] **Step 5: Visual check**

```bash
cd projects/tools/json-toolkit && npm run build && npm run preview
```

Expected: dark bg `#0f1117`, privacy chip visible, footer present, no light Vite-default look.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: retheme JSON Toolkit with Openlearnia dark chrome"
```

**Acceptance:** Matches image-tools/markdown dark tokens; chrome links work; privacy chip always visible.

---

### Task 4: password-strength-lab — dark retheme + AppChrome

**Files:**
- Create: `projects/tools/password-strength-lab/src/chrome/{tokens.css,AppChrome.tsx,relatedTools.ts}`
- Modify: `src/index.css`, `src/App.css`, `src/App.tsx`, `index.html`

- [ ] **Step 1–4:** Same pattern as Task 3 with `productName="Password Strength Lab"` and `githubUrl="https://github.com/openlearnia/password-strength-lab"`.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: retheme Password Strength Lab with Openlearnia dark chrome"
```

**Acceptance:** Dark brand + chrome; **no** URL-hash sharing of passwords (do not add hash sync).

---

### Task 5: image-metadata-viewer — dark retheme + AppChrome

**Files:**
- Create: `projects/tools/image-metadata-viewer/src/chrome/{tokens.css,AppChrome.tsx,relatedTools.ts}`
- Modify: `src/index.css`, `src/App.css`, `src/App.tsx`, `index.html`

- [ ] **Step 1–4:** Same chrome pattern; `productName="Image Metadata Viewer"`; GitHub `https://github.com/openlearnia/image-metadata-viewer`.

- [ ] **Step 5: Add Strip Metadata cross-link in related tools / empty CTA**

```tsx
<a href="https://image-tools.openlearnia.com/strip-metadata">
  Strip metadata in Image Tools
</a>
```

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: retheme Image Metadata Viewer with Openlearnia dark chrome"
```

**Acceptance:** No `#eff6ff` light shell; privacy chip + Openlearnia + GitHub; strip-metadata link present.

---

### Task 6: markdown-editor — chrome gaps

**Files:**
- Modify: `projects/tools/markdown-editor/src/components/TopBar.tsx`
- Modify: `projects/tools/markdown-editor/src/components/AppShell.tsx` (footer / privacy if not in TopBar)
- Modify: `projects/tools/markdown-editor/src/index.css` (ensure `--danger` etc. present)

**Interfaces:**
- Consumes: existing ShortcutsOverlay / privacy-friendly OPFS app
- Produces: org link-back + GitHub + privacy chip in dense chrome

- [ ] **Step 1: Extend TopBar brand cluster**

```tsx
<a
  href="https://openlearnia.com"
  className="text-xs text-muted hover:text-accent"
>
  Openlearnia
</a>
<a
  href="https://github.com/openlearnia/markdown-editor"
  className="text-xs text-muted hover:text-accent"
  target="_blank"
  rel="noreferrer"
>
  GitHub
</a>
<span className="hidden md:inline-flex rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">
  Runs locally — nothing leaves your device
</span>
```

- [ ] **Step 2: Add compact footer** in `AppShell.tsx` with copyright + privacy one-liner.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add Openlearnia link-back and privacy chrome to Markdown Editor"
```

**Acceptance:** First viewport still dense (not a marketing hero); Openlearnia + GitHub + privacy visible.

---

### Task 7: schema-builder — align tokens + chrome

**Files:**
- Modify: `projects/tools/schema-builder/src/index.css` (`:root` tokens)
- Modify: `projects/tools/schema-builder/src/App.tsx`
- Modify: `projects/tools/schema-builder/src/components/Toolbar.tsx`

- [ ] **Step 1: Replace schema-builder `:root` colors** with canonical set (today uses `#0b1220` / `#3b82f6` — wrong brand accent).

```css
:root {
  color-scheme: dark;
  --bg: #0f1117;
  --surface: #1a1d27;
  --surface-raised: #222633;
  --surface-hover: #242936;
  --border: #2a2f3a;
  --border-subtle: #242936;
  --text: #e8eaed;
  --muted: #9aa0a6;
  --accent: #6ea8fe;
  --accent-hover: #4a7fd4;
  --accent-muted: rgba(110, 168, 254, 0.15);
  --danger: #f28b82;
  --success: #3dd68c;
  --warning: #f5a623;
  /* keep --pk etc. mapped to warning/accent as needed */
}
```

- [ ] **Step 2: Add product title row** above tabs: `Database Lab` + Openlearnia + GitHub + privacy chip.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: align Database Lab tokens and add Openlearnia chrome"
```

**Acceptance:** Accent is `#6ea8fe`; org links + privacy chip present; canvas still usable.

---

### Task 8: json-toolkit P0 — split panes, highlight, copy, errors

**Files:**
- Modify: `projects/tools/json-toolkit/src/App.tsx`
- Modify: `projects/tools/json-toolkit/src/App.css`
- Create: `projects/tools/json-toolkit/src/lib/parseError.ts`
- Create: `projects/tools/json-toolkit/src/lib/parseError.test.ts`
- Create: `projects/tools/json-toolkit/src/components/JsonPane.tsx` (optional split)

**Interfaces:**
- Consumes: existing `getParseErrorDetails`
- Produces: `formatParseError(source, error): string` without duplicated line/col; output pane with Copy adjacent

- [ ] **Step 1: Write failing test for clean error message**

```ts
import { describe, expect, it } from 'vitest'
import { formatParseError } from './parseError'

describe('formatParseError', () => {
  it('adds line/col once when engine message lacks them', () => {
    const source = '{\n  "a": 1,\n}'
    const err = new SyntaxError('Unexpected token } in JSON at position 14')
    const msg = formatParseError(source, err)
    expect(msg.match(/line/gi)?.length ?? 0).toBe(1)
    expect(msg).toMatch(/line \d+/i)
  })

  it('does not duplicate coords if message already has them', () => {
    const err = new SyntaxError('Bad JSON (line 2, column 3)')
    const msg = formatParseError('{\n}', err)
    expect(msg.match(/line 2/gi)?.length ?? 0).toBe(1)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd projects/tools/json-toolkit && npm test -- src/lib/parseError.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `formatParseError`**

```ts
export function getLineAndColumn(text: string, index: number) {
  const safeIndex = Math.max(0, Math.min(index, text.length))
  const lines = text.slice(0, safeIndex).split('\n')
  return { line: lines.length, column: lines[lines.length - 1].length + 1 }
}

export function formatParseError(source: string, error: unknown): string {
  const fallback = error instanceof Error ? error.message : 'Invalid JSON.'
  if (/\bline\s+\d+/i.test(fallback)) return fallback
  const match = fallback.match(/position\s+(\d+)/i)
  if (!match) return fallback
  const position = Number.parseInt(match[1], 10)
  if (Number.isNaN(position)) return fallback
  const { line, column } = getLineAndColumn(source, position)
  return `${fallback} (line ${line}, column ${column})`
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test -- src/lib/parseError.test.ts
```

- [ ] **Step 5: Layout — side-by-side panes**

CSS:

```css
.panes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
@media (max-width: 800px) {
  .panes { grid-template-columns: 1fr; }
}
.pane-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-bottom: 0.5rem;
}
.btn-primary { background: var(--accent); color: var(--bg); }
.btn-secondary { background: var(--surface-2); color: var(--text); border: 1px solid var(--border); }
```

Move **Copy** next to output (not only under input). Add **Clear** and **Download** (`.json` blob) as secondary.

- [ ] **Step 6: Syntax highlight + line numbers**

Prefer lightweight approach: wrap output in `<pre class="json-hl">` with line-number gutter CSS + token spans for strings/keys, **or** add `@uiw/react-codemirror` + `json` lang if bundle size is acceptable. Minimum bar: monospace + line numbers on both panes.

- [ ] **Step 7: Commit**

```bash
git commit -m "feat: split-pane JSON Toolkit with honest errors and output copy"
```

**Acceptance:** Desktop shows two panes; Format is primary; Copy lives on output; error shows line/col once; download works offline.

---

### Task 9: password-strength-lab P0 — copy, generator, honest meter

**Files:**
- Create: `projects/tools/password-strength-lab/src/lib/analyzePassword.ts`
- Create: `projects/tools/password-strength-lab/src/lib/analyzePassword.test.ts`
- Create: `projects/tools/password-strength-lab/src/lib/meterColor.ts`
- Modify: `src/App.tsx`, `src/App.css`

**Interfaces:**
- Produces: `ratingToMeterColor(rating: string): string`; `generatePassword(options)`; `analyzePassword(password)`

- [ ] **Step 1: Failing tests for meter color by rating**

```ts
import { describe, expect, it } from 'vitest'
import { ratingToMeterColor } from './meterColor'

describe('ratingToMeterColor', () => {
  it('maps ratings to solid semantic colors', () => {
    expect(ratingToMeterColor('Very weak')).toBe('#f28b82')
    expect(ratingToMeterColor('Weak')).toBe('#f28b82')
    expect(ratingToMeterColor('Moderate')).toBe('#f5a623')
    expect(ratingToMeterColor('Strong')).toBe('#3dd68c')
    expect(ratingToMeterColor('Excellent')).toBe('#3dd68c')
  })
})
```

- [ ] **Step 2: Run — expect FAIL**, then implement:

```ts
export function ratingToMeterColor(rating: string): string {
  switch (rating) {
    case 'Excellent':
    case 'Strong':
      return '#3dd68c'
    case 'Moderate':
      return '#f5a623'
    default:
      return '#f28b82'
  }
}
```

- [ ] **Step 3: Fix meter CSS** — remove full red→green gradient clip:

```css
.meter {
  height: 8px;
  background: var(--surface-2);
  border-radius: 999px;
  overflow: hidden;
}
.meter span {
  display: block;
  height: 100%;
  background: var(--meter-color, var(--danger));
  transition: width 150ms ease-out, background-color 150ms ease-out;
}
```

```tsx
<span
  style={{
    width: `${analysis.score}%`,
    ['--meter-color' as string]: ratingToMeterColor(analysis.rating),
  }}
/>
```

- [ ] **Step 4: Generator controls + Copy**

```tsx
const [length, setLength] = useState(16)
const [useSymbols, setUseSymbols] = useState(true)
// length range 8–64; checkboxes for upper/lower/numbers/symbols
<button type="button" onClick={() => setPassword(generateStrongPassword(length, { useSymbols /* ... */ }))}>
  Regenerate
</button>
<button type="button" onClick={() => void navigator.clipboard.writeText(password)}>
  Copy
</button>
```

Label score as `Score: {score}/100 · {rating}` (explicit “Score” word).

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: honest password meter, copy, and generator controls"
```

**Acceptance:** Mid score is solid amber/red, not a clipped rainbow; Copy works; length/charset adjustable; no password in URL.

---

### Task 10: image-metadata-viewer P0 — summary, filter, thumbnail

**Files:**
- Create: `projects/tools/image-metadata-viewer/src/lib/summarizeExif.ts`
- Create: `projects/tools/image-metadata-viewer/src/lib/summarizeExif.test.ts`
- Modify: `src/App.tsx`, `src/App.css`

- [ ] **Step 1: Failing test for human summary**

```ts
import { describe, expect, it } from 'vitest'
import { summarizeExif } from './summarizeExif'

describe('summarizeExif', () => {
  it('extracts camera, date, and GPS when present', () => {
    const summary = summarizeExif({
      Make: 'Canon',
      Model: 'EOS R5',
      DateTimeOriginal: new Date('2024-01-02T03:04:05Z'),
      latitude: 37.77,
      longitude: -122.42,
    })
    expect(summary.camera).toMatch(/Canon/)
    expect(summary.takenAt).toBeTruthy()
    expect(summary.gps).toMatch(/37/)
  })
})
```

- [ ] **Step 2: Implement `summarizeExif` + group ICC arrays** under a collapsed “Color profile” section (do not flatten `BlueMatrixColumn.N` into the top list).

- [ ] **Step 3: UI** — show thumbnail (`URL.createObjectURL`), summary cards, then filter input:

```tsx
const [filter, setFilter] = useState('')
const entries = flatEntries.filter((e) =>
  e.key.toLowerCase().includes(filter.toLowerCase()) ||
  e.value.toLowerCase().includes(filter.toLowerCase()),
)
```

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: human EXIF summary, filter, and thumbnail for metadata viewer"
```

**Acceptance:** Thumbnail + camera/date/GPS before raw dump; filter hides noise; Strip Metadata link visible.

---

### Task 11: image-tools P0 — paste + samples (nav completeness = later)

**Files:**
- Modify: `projects/tools/image-tools/src/scripts/ui.ts`
- Modify: `projects/tools/image-tools/src/components/DropZone.astro`
- Create: `projects/tools/image-tools/public/samples/demo.jpg` (small royalty-free JPEG)
- Modify: `projects/tools/image-tools/src/pages/strip-metadata.astro` (link to metadata viewer)

- [ ] **Step 1: Paste handler in `ui.ts`**

```ts
export function bindPaste(onFile: (file: File) => void) {
  window.addEventListener('paste', (event) => {
    const items = event.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) onFile(file)
        break
      }
    }
  })
}
```

- [ ] **Step 2: Sample button** in DropZone: `fetch('/samples/demo.jpg')` → `File` → existing load path.

- [ ] **Step 3: Cross-link** on strip-metadata page to `https://image-metadata-viewer.openlearnia.com`.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: paste and sample images for Image Tools empty states"
```

**Acceptance:** Paste image into compress works; sample loads; empty preview still clean (Task 2). Nav listing all tools is **P1 — skip this phase**.

---

### Task 12: markdown-editor P0 — scroll-sync, import, active contrast

**Files:**
- Modify: `projects/tools/markdown-editor/src/editor/MarkdownEditor.tsx`
- Modify: `projects/tools/markdown-editor/src/preview/MarkdownPreview.tsx`
- Modify: `projects/tools/markdown-editor/src/App.tsx` or `AppShell.tsx`
- Create: `projects/tools/markdown-editor/src/fs/import.ts`
- Modify: `projects/tools/markdown-editor/src/components/FileTree.tsx`
- Test: extend or add `src/fs/import.test.ts` if pure helpers exist

- [ ] **Step 1: Stronger active file styles**

```tsx
${isActive
  ? 'bg-accent/25 text-accent border-l-2 border-accent'
  : 'text-text hover:bg-surface-raised border-l-2 border-transparent'}
```

- [ ] **Step 2: Scroll-sync** — share scroll ratio between editor scroller and preview:

```ts
let syncing = false
function syncScroll(from: HTMLElement, to: HTMLElement) {
  if (syncing) return
  syncing = true
  const maxFrom = from.scrollHeight - from.clientHeight
  const maxTo = to.scrollHeight - to.clientHeight
  if (maxFrom > 0 && maxTo > 0) {
    to.scrollTop = (from.scrollTop / maxFrom) * maxTo
  }
  requestAnimationFrame(() => {
    syncing = false
  })
}
```

Wire `scroll` listeners; disable when `prefers-reduced-motion: reduce` if motion feels noisy (ratio sync is OK to keep).

- [ ] **Step 3: Import** — accept `.md` / folder via `<input type="file" multiple>` and drag-drop onto file tree; write into OPFS via existing `opfs` helpers.

```ts
export async function importMarkdownFiles(files: File[]): Promise<string[]> {
  const written: string[] = []
  for (const file of files) {
    if (!file.name.endsWith('.md')) continue
    const text = await file.text()
    // use existing OPFS write API from src/fs/opfs.ts
    written.push(file.name)
  }
  return written
}
```

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: markdown scroll-sync, import, and clearer active file"
```

**Acceptance:** Scrolling editor moves preview proportionally; drag `.md` imports; active file clearly contrasted.

---

### Task 13: schema-builder P0 — empty CTA, SQL quality, Apply/dirty, `?`

**Files:**
- Create: `projects/tools/schema-builder/src/schema-core/sampleSchema.ts`
- Modify: `src/components/SchemaCanvas.tsx`
- Modify: `src/components/SqlTab.tsx` / `SqlPanel.tsx`
- Modify: `src/components/Toolbar.tsx`
- Modify: `src/store/schemaStore.ts` (dirty vs applied tracking if missing)
- Create: `src/components/ShortcutsOverlay.tsx`

- [ ] **Step 1: Sample schema seed**

```ts
import type { Schema } from './types'

export function createBlogSampleSchema(): Schema {
  // Minimal users + posts with FK — match Schema type in types.ts
  return {
    tables: [
      /* users(id PK, email), posts(id PK, user_id FK → users.id, title) */
    ],
  } as Schema
}
```

Fill concrete fields to match `schema-core/types.ts` exactly when implementing.

- [ ] **Step 2: Empty canvas CTA** when `tables.length === 0`:

```tsx
<div className="empty-cta">
  <p>Start a schema</p>
  <button type="button" onClick={() => dispatch({ type: 'add_table', payload: {} })}>
    Add table
  </button>
  <button type="button" onClick={() => loadSample(createBlogSampleSchema())}>
    Load sample (users + posts)
  </button>
</div>
```

- [ ] **Step 3: Apply / dirty status** — show chip `Dirty` when `present !== lastApplied`; after successful Apply set `lastApplied`. Keep destructive confirm copy clear.

- [ ] **Step 4: SQL editor** — CodeMirror or `<textarea>` with basic keyword highlight + monospace; minimum: line numbers + `font-family: ui-monospace`.

- [ ] **Step 5: Shortcuts overlay on `?`**

```tsx
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === '?' && !e.metaKey && !e.ctrlKey) setOpen(true)
  }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
}, [])
```

List: Undo/Redo, Add table, Apply, switch tabs.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: Database Lab empty CTA, dirty Apply status, SQL editor polish"
```

**Acceptance:** Empty schema shows CTA + sample; dirty chip accurate; `?` opens shortcuts; SQL pane readable.

---

### Task 14: Cross-cutting empty states, `?`, export, related-tools

**Files:** each tool’s App / chrome as touched above; ensure consistency.

- [ ] **Step 1: Checklist per tool**

| Tool | Empty CTA | Sample/paste | `?` shortcuts | Export/copy near results | Related-tools |
|------|-----------|--------------|---------------|--------------------------|---------------|
| image-tools | dropzone | Task 11 | optional P1 | download exists | strip↔metadata |
| metadata | dropzone | optional sample | optional | JSON export near results | Task 5 |
| json-toolkit | sample JSON button | paste already | Format/Copy/`?` | Task 8 | Task 3 |
| password | placeholder tips | generate = sample | optional | Copy Task 9 | Task 4 |
| markdown | existing EmptyState | import Task 12 | already has | ZIP export | Task 6 |
| schema | Task 13 | sample | Task 13 | SQL copy/export if present | Task 7 |

- [ ] **Step 2: Add sample JSON button** to json-toolkit empty input:

```ts
const SAMPLE = '{\n  "hello": "openlearnia",\n  "tools": ["json", "markdown"]\n}\n'
```

- [ ] **Step 3: Commit per repo** as needed:

```bash
git commit -m "feat: standardize empty states and related-tools strip"
```

**Acceptance:** No tool opens to a dead blank panel without one primary CTA.

---

### Task 15: Manual wrangler deploy + umbrella SHA bumps

**Files:**
- Submodule pointers under `projects/tools/*` in umbrella
- No CI assumption

- [ ] **Step 1: For each changed tool, from its repo root after merge to main:**

```bash
# example: json-toolkit
cd projects/tools/json-toolkit
npm ci
npm run build
wrangler pages deploy ./dist --project-name=json-toolkit --commit-dirty=true
```

Repeat with correct package manager / project-name from the table above.

- [ ] **Step 2: Verify production URLs**

- https://json-toolkit.openlearnia.com — dark + chrome
- https://password-strength-lab.openlearnia.com — honest meter + copy
- https://image-metadata-viewer.openlearnia.com — summary + dark
- https://image-tools.openlearnia.com/compress — no broken empty preview; paste/sample
- https://markdown-editor.openlearnia.com — chrome + scroll-sync
- https://schema-builder.openlearnia.com — empty CTA + tokens

- [ ] **Step 3: Bump umbrella SHAs**

```bash
cd /Users/kartikbazzad/Desktop/projects/openlearnia
git add projects/tools/image-tools projects/tools/json-toolkit \
  projects/tools/password-strength-lab projects/tools/image-metadata-viewer \
  projects/tools/markdown-editor projects/tools/schema-builder
git commit -m "chore: bump browser-tool submodules after UI P0"
```

- [ ] **Step 4: Optional website deploy** only if `/tools` marketing copy/links changed.

**Acceptance:** Live sites match P0 acceptance; umbrella points at new commits; deploy was wrangler-manual.

---

## Self-review (plan author)

1. **Spec coverage:** Cross-cutting tokens/chrome/empty/`?`/export/related-tools → Tasks 1, 3–7, 14. Light orphans → 3–5. Dark chrome gaps → 6–7. Tool P0s → 2, 8–13. Deploy/submodules → Global Constraints + Task 15. Live Wallpaper excluded. Nav completeness for image-tools deferred to P1 as specified.
2. **Placeholder scan:** Sample schema table bodies marked “fill to match types.ts” — implementer must expand using actual `Schema` type; no TBD phases remain.
3. **Type consistency:** `AppChrome` props (`productName`, `githubUrl`, `relatedTools`) stable across Tasks 3–5; `formatParseError` / `ratingToMeterColor` / `summarizeExif` named consistently in tests and impl.
4. **Argument retained:** Copy-paste chrome over shared package for this pass — ship brand before inventing a design-system registry.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-22-browser-tools-ui-improvements.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — execute in-session with executing-plans and checkpoints  

Which approach?
