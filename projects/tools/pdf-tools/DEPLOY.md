# Deploy PDF Tools to pdf-tools.openlearnia.com

## Cloudflare Pages setup

1. Create a new Pages project: **pdf-tools**
2. Connect repository: `github.com/openlearnia/pdf-tools` (once created), or deploy from this folder manually
3. Build settings (if connecting Git):
   - **Root directory:** `.` (repo root)
   - **Build command:** `bun run build`
   - **Build output:** `dist`
4. Environment: Node.js 22 (default)

## Manual deploy (recommended ops path)

```bash
bun install
bun run build
wrangler pages deploy ./dist --project-name=pdf-tools --commit-dirty=true
```

## Custom domain

1. In Pages → **Custom domains** → add `pdf-tools.openlearnia.com`
2. Add the CNAME record Cloudflare provides to DNS

## Verify

- `https://pdf-tools.openlearnia.com/` — tool hub
- `https://pdf-tools.openlearnia.com/merge` — merge tool
- Footer links back to `https://openlearnia.com`

## Marketing site link

Ensure [openlearnia.com/tools](https://openlearnia.com/tools) lists PDF Tools with `url: https://pdf-tools.openlearnia.com`.
