# Openlearnia PDF Tools

Privacy-first PDF utilities that run entirely in your browser — nothing is uploaded.

**Live (when deployed):** [pdf-tools.openlearnia.com](https://pdf-tools.openlearnia.com)

## Features

- Merge, split, delete pages, reorder
- Rotate 90° / 180° / 270°
- Text watermark (opacity + position)
- Images → PDF and PDF → images (ZIP)
- Page thumbnails via PDF.js
- Limits: 50 MB / 200 pages; password-protected PDFs hard-fail

## Develop

```bash
bun install
bun run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Build

```bash
bun run build
```

## Self-check

```bash
bun run self-check
```

## Deploy

See [DEPLOY.md](./DEPLOY.md).

## License

MIT — see [LICENSE](LICENSE).
