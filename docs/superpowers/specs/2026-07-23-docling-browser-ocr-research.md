# Docling in the Browser — Feasibility Research

**Date:** 2026-07-23 (updated same day after inspecting IBM WebGPU Space)  
**Status:** Research note (not a build plan)  
**Context:** Privacy-first OpenLearnia tools (`pdf-tools`, image-tools). OCR was an **explicit non-goal** in `2026-07-23-pdf-tools-design.md`. This note asks whether IBM Docling / Granite-Docling changes that.

**Primary proof link:** [ibm-granite/granite-docling-258M-WebGPU](https://huggingface.co/spaces/ibm-granite/granite-docling-258M-WebGPU) ([source tree](https://huggingface.co/spaces/ibm-granite/granite-docling-258M-WebGPU/tree/main))

---

## 1. Verdict (corrected)

| Question | Answer |
|----------|--------|
| Can the **full Docling Python library** (classic multi-model layout/OCR/table pipeline) run in-browser today? | **No** |
| Does **IBM ship an official browser demo** for Granite-Docling-258M? | **Yes** — static HF Space, WebGPU + Transformers.js |
| Can **Granite-Docling** emit **DocTags** in the browser? | **Yes** — official Space + `onnx-community` ONNX weights |
| Is that “full Docling in WASM”? | **No** — VLM → DocTags only; no `DocumentConverter` / classic engines |

**Short verdict: Partial — but officially demoed.**

Earlier draft said “no official Docling WASM / WebGPU product.” That was **wrong on demos**: IBM Granite + Xenova (HF Staff) ship [`granite-docling-258M-WebGPU`](https://huggingface.co/spaces/ibm-granite/granite-docling-258M-WebGPU) (`sdk: static`, `license: apache-2.0`). What remains true: this is **not** the full Python `DocumentConverter` pipeline — it is the **258M VLM emitting DocTags**, then a **JS DocTags→HTML** converter (`parser.js`).

```
Official Python Docling          Browser (IBM Space / OpenLearnia path)
─────────────────────────        ──────────────────────────────────────
DocumentConverter                ✗ not in browser
  classic layout/OCR/tables      ✗
  VLM → DocTags                  ✓ Granite-Docling ONNX + WebGPU
docling-core → MD/HTML           ≈ parser.js → HTML only (no MD in Space)
```

---

## 2. IBM WebGPU Space — inspected source

**Space:** https://huggingface.co/spaces/ibm-granite/granite-docling-258M-WebGPU  
**Tree:** https://huggingface.co/spaces/ibm-granite/granite-docling-258M-WebGPU/tree/main  
**Files:** `index.html` (~22.6 KB), `parser.js` (~14.5 KB), `assets/` (example images), `README.md`, `.gitattributes`  
**Contributors:** ibibrahim, Xenova (HF Staff) — Transformers.js / WebGPU lineage  
**Latest noted commit:** `feat: different (random) colors per label group`

### 2.1 Stack

| Piece | Value |
|-------|--------|
| Runtime | Browser-only static Space (`sdk: static`) |
| Library | `@huggingface/transformers@3.7.5` (jsDelivr CDN ESM) |
| APIs | `AutoProcessor`, `AutoModelForVision2Seq`, `RawImage`, `TextStreamer` |
| Model id | `onnx-community/granite-docling-258M-ONNX` (base: `ibm-granite/granite-docling-258M`) |
| Device | **`webgpu` only** (no WASM fallback in Space code) |
| License | Space + model card: **Apache-2.0** |

### 2.2 Model load (exact Space config)

```js
const model_id = "onnx-community/granite-docling-258M-ONNX";
processor = await AutoProcessor.from_pretrained(model_id);
model = await AutoModelForVision2Seq.from_pretrained(model_id, {
  dtype: {
    embed_tokens: "fp16",              // fp32 231 MB | fp16 116 MB
    vision_encoder: "fp32",            // 374 MB
    decoder_model_merged: "fp32",      // fp32 658 MB | q4 105 MB (q4 → repetition risk)
  },
  device: "webgpu",
  progress_callback: /* tracks 3 × *.onnx_data files */,
});
```

**Download size (Space defaults):** comments sum to **~1.15 GB** (`116 + 374 + 658`). Community “~500 MB” figures assume heavier quantization (e.g. q4 decoder); Space intentionally keeps fp32 vision + decoder for quality. First-run UX must gate on an explicit download.

### 2.3 Inference / DocTags flow (`index.html`)

1. User picks image (PNG/JPG/WEBP) or example asset.
2. Draw to hidden canvas → `RawImage.fromCanvas`.
3. Chat message: `[{ type: "image" }, { type: "text", text: prompt }]`.
4. Default prompt: **`Convert this page to docling.`**  
   Examples also use: `Convert chart to OTSL.`, `Convert this table to OTSL.`, `Convert code to text.`
5. `processor.apply_chat_template(..., { add_generation_prompt: true })`
6. `processor(text, [image], { do_image_splitting: true })`
7. `model.generate({ ...inputs, max_new_tokens: 4096, streamer })` → stream into “Docling” pane (raw **DocTags**).
8. Strip trailing `<|end_of_text|>`.
9. Regex overlays: `/<(\w+)><loc_(\d+)><loc_(\d+)><loc_(\d+)><loc_(\d+)>/g` on **500×500** grid → colored DOM boxes on preview (not crops).
10. `htmlIframe.srcdoc = doclingToHtml(fullText)` → HTML view.

**Outputs:** streaming DocTags + HTML iframe. **No Markdown export** in the Space.

### 2.4 What `parser.js` does

Apache-2.0 Space file; ~14.5 KB; authored for this demo.

| Capability | Present? |
|------------|----------|
| DocTags → HTML | **Yes** — `DoclingConverter` + `doclingToHtml()` |
| DocTags → Markdown | **No** |
| Strip `<loc_N>` for text HTML | **Yes** — `cleanupMetadataTokens` |
| Keep locs for layout overlays | Done in **`index.html`**, not parser |
| Image **crops** from bboxes | **No** — `<img alt="…" src="">` placeholders for picture/chart |
| Tables (OTSL) | **Yes** — `ched`/`rhed`/`fcel`/… → `<table>` |
| Headings / lists / code / formula | **Yes** — tag map + KaTeX in iframe |
| True AST object graph | **No** — recursive string rewrite (regex), not a typed AST |

Useful for OpenLearnia: tag map, OTSL table logic, loc stripping, heading levels, picture/chart/caption handling. Gaps vs our earlier AST sketch: no MD, no crop Blobs, no reusable typed nodes.

### 2.5 Attribution if we adapt `parser.js`

- Source: IBM Granite Space `parser.js` (Apache-2.0).
- Keep license notice + NOTICE attribution (Apache-2.0 §4).
- Prefer vendoring a copy under `projects/tools/.../lib/doctags/` with a one-line origin comment pointing at the Space URL — do **not** hotlink the Space file at runtime.

---

## 3. What Docling actually is (runtime stack)

```
┌─────────────────────────────────────────────────────────────┐
│ Official Docling (Python)                                   │
│  DocumentConverter                                          │
│   ├─ Classic pipeline: layout + OCR + table models (local)  │
│   └─ VLM pipeline: page image → Granite Docling → DocTags   │
│         └─ docling-core: DocTags → DoclingDocument          │
│              └─ export_to_markdown / html / doctags / json  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Official browser demo (IBM Space) + OpenLearnia target      │
│  Image / PDF.js page render → canvas                        │
│  Transformers.js + onnxruntime-web (WebGPU)                 │
│  onnx-community/granite-docling-258M-ONNX → DocTags         │
│  parser.js (or TS port) → HTML; (+ our MD / crops)          │
└─────────────────────────────────────────────────────────────┘
```

Model card reminder: Granite-Docling is meant to **complement** Docling, not replace the library. Browser demos inherit that scope.

---

## 4. DocTags format (unchanged essentials)

XML-like markup with semantic tags + `<loc_x0><loc_y0><loc_x1><loc_y1>` on a **500×500** grid.

```text
l = x0 * W / 500   …   b = y1 * H / 500   (TOPLEFT origin)
```

Official Python export still uses `DocTagsDocument` → `DoclingDocument.load_from_doctags` → `export_to_markdown` / HTML. Browser path reimplements serializers (Space = HTML only).

---

## 5. Architecture options (OpenLearnia ranking — revised)

### Option A — Mirror IBM Space (Transformers.js + ONNX + WebGPU) — Rank 1 for “ship Docling-like extract”

Same stack as the official demo: `AutoModelForVision2Seq` + `onnx-community/granite-docling-258M-ONNX` + `device: "webgpu"`, gate first download, adapt `parser.js`.

| Pros | Cons |
|------|------|
| Matches **official** IBM demo path | ~1 GB with Space dtypes; WebGPU-only |
| Proven prompts + streaming DocTags | Not classic Docling |
| Apache-2.0 parser to adapt | Weights still fetched (disclose / self-host CDN) |

**Professor:** “IBM already put the egg in the WebGPU basket — hatch a dedicated extract tool, don’t bury 1 GB under merge/split.”  
**Opponent:** “A gigabyte model is not a Squoosh snack. Safari/WebGPU gaps and battery burn remain; ‘privacy’ still phones HF unless you host weights.”

### Option B — AST / HTML PoC first (no model) — Rank 1 for “smallest next code”

Fixture DocTags → adapt `parser.js` → HTML; add thin `toMarkdown`; add bbox crop demo. Proves exporters before paying download tax.

### Option C — Hybrid BYO Docling Serve — Rank 3

Full Python fidelity only if user points at self-hosted Docling; keep default tools local-only.

### Option D — Third-party `btwld/docling-sdk` — Rank 4

Still useful reference (~500 MB cache claims), but **prefer official Space + onnx-community** now that IBM’s demo is the source of truth.

---

## 6. Fit to OpenLearnia / pdf-tools

- OCR remains **out of pdf-tools MVP**; candidate is a **separate** tool (`pdf-to-markdown` / `docling-extract`).
- Privacy chip must say: **model downloads to device** (HF or OpenLearnia CDN); page bytes never upload.
- Prefer opt-in download wall; never default 1 GB into the tools hub.

---

## 7. Recommended next build slice

**Copy/adapt path (concrete):**

1. **Vendor-adapt `parser.js`** (Apache-2.0) → TypeScript module `doclingToHtml` + unit self-check on HF sample DocTags. Keep attribution.
2. **Add `toMarkdown`** ourselves (Space doesn’t ship it) — headings/text/lists/tables first.
3. **Bbox crops** (Space doesn’t): reuse Space’s `/500` math from `index.html` overlays → canvas crop Blobs for `picture`/`chart`.
4. **Only then** wire Transformers.js like the Space (`model_id`, prompts, `do_image_splitting: true`, `max_new_tokens: 4096`, WebGPU) behind “Download model (~1 GB)” on a throwaway Astro page.

**Do not** rewrite the HTML converter from scratch unless license/review blocks vendoring — `parser.js` already encodes OTSL + tag quirks we’d rediscover the hard way.

Success: fixture DocTags → readable HTML (+ MD snippet) + one cropped figure. Fail: claiming “full Docling runs in WASM.”

---

## 8. Explicit non-starters

| Idea | Why not |
|------|---------|
| Claim “full Docling runs in WASM” | Only the VLM + JS serializer; classic pipeline is Python |
| Ship ~1 GB weights as default pdf-tools payload | Breaks suite load UX |
| Silent HF weight fetch | Privacy chip lies by omission |
| Brand Tesseract as Docling | Wrong quality/format |
| Skip attribution when copying `parser.js` | Apache-2.0 requires notice |

---

## 9. Professor vs opponent

**Professor:** Official Space removes “is this even real?” risk. Mirror it: dedicated extract tool, WebGPU, DocTags, adapted `parser.js`. Layout-aware local OCR is the differentiator.

**Opponent:** Space proves a demo, not a product. Half-to-one-gig download, WebGPU-only, no MD, empty image placeholders — still not Docling. Ship AST/HTML first; postpone the model until the exporters earn their keep.

**Synthesis:** Adapt official `parser.js` + fixture PoC **now**. Treat Space-equivalent Transformers.js load as **opt-in Phase 3+** engine behind an explicit download wall.

---

## References (fetched 2026-07-23)

- **[IBM Space: granite-docling-258M-WebGPU](https://huggingface.co/spaces/ibm-granite/granite-docling-258M-WebGPU)** — official browser demo ([tree](https://huggingface.co/spaces/ibm-granite/granite-docling-258M-WebGPU/tree/main), raw `index.html` / `parser.js`)
- [Granite Docling (IBM)](https://www.ibm.com/granite/docs/models/docling)
- [ibm-granite/granite-docling-258M](https://huggingface.co/ibm-granite/granite-docling-258M) (Apache-2.0)
- [onnx-community/granite-docling-258M-ONNX](https://huggingface.co/onnx-community/granite-docling-258M-ONNX) (Transformers.js)
- [docling-project/docling](https://github.com/docling-project/docling) / [docling-core](https://github.com/docling-project/docling-core)
- DocTags loc math: [docling discussion #354](https://github.com/docling-project/docling/discussions/354)
- Related: `docs/superpowers/specs/2026-07-23-pdf-tools-design.md` (OCR non-goal for MVP)
