# Contributing to Openlearnia

Thank you for contributing. This umbrella repo ([openlearnia/openlearnia](https://github.com/openlearnia/openlearnia)) gives you one clone of the full workspace; each tool and the website are **git submodules** with their own remotes.

## Clone the workspace

```bash
git clone --recurse-submodules https://github.com/openlearnia/openlearnia.git
cd openlearnia
```

Update submodules after pulling umbrella changes:

```bash
git pull --recurse-submodules
# or
git pull
git submodule update --init --recursive
```

## Where to work

| Path | Remote repo |
|------|-------------|
| `projects/tools/image-tools/` | [openlearnia/image-tools](https://github.com/openlearnia/image-tools) |
| `projects/tools/json-toolkit/` | [openlearnia/json-toolkit](https://github.com/openlearnia/json-toolkit) |
| `projects/tools/image-metadata-viewer/` | [openlearnia/image-metadata-viewer](https://github.com/openlearnia/image-metadata-viewer) |
| `projects/tools/password-strength-lab/` | [openlearnia/password-strength-lab](https://github.com/openlearnia/password-strength-lab) |
| `projects/tools/livewallpaper/` | [openlearnia/live-wallpaper](https://github.com/openlearnia/live-wallpaper) |
| `projects/tools/markdown-editor/` | [openlearnia/markdown-editor](https://github.com/openlearnia/markdown-editor) |
| `projects/tools/pglite-playground/` | [openlearnia/pglite-playground](https://github.com/openlearnia/pglite-playground) |
| `projects/tools/schema-builder/` | [openlearnia/schema-builder](https://github.com/openlearnia/schema-builder) |
| `website/` | [openlearnia/website](https://github.com/openlearnia/website) |

Submodules checkout a **detached HEAD** at the commit pinned by the umbrella. Before starting work, check out a branch inside the submodule:

```bash
cd projects/tools/image-tools
git checkout main
git pull origin main
```

## Workflow

1. **Change code** in the submodule directory (feature branch → PR on that repo's GitHub).
2. After your PR merges, **pin the new commit** in the umbrella:

```bash
cd projects/tools/image-tools   # or whichever submodule changed
git checkout main
git pull origin main

cd ../..   # back to umbrella root
git add projects/tools/image-tools
git commit -m "Bump image-tools submodule"
git push origin main
```

On another machine: `git pull --recurse-submodules` to get the same submodule SHAs.

## Per-project quick starts

### Live Wallpaper

```powershell
cd projects/tools/livewallpaper
dotnet build LiveWallpaper.sln -c Release
dotnet test LiveWallpaper.sln -c Release
```

Open a PR against [openlearnia/live-wallpaper](https://github.com/openlearnia/live-wallpaper).

### Image Tools

```powershell
cd projects/tools/image-tools
bun install
bun run dev
```

Open a PR against [openlearnia/image-tools](https://github.com/openlearnia/image-tools).

### Markdown Editor

```powershell
cd projects/tools/markdown-editor
bun install
bun run dev
```

Open a PR against [openlearnia/markdown-editor](https://github.com/openlearnia/markdown-editor).

### JSON Toolkit

```powershell
cd projects/tools/json-toolkit
npm install
npm run dev
```

Open a PR against [openlearnia/json-toolkit](https://github.com/openlearnia/json-toolkit).

### Image Metadata Viewer

```powershell
cd projects/tools/image-metadata-viewer
npm install
npm run dev
```

Open a PR against [openlearnia/image-metadata-viewer](https://github.com/openlearnia/image-metadata-viewer).

### Password Strength Lab

```powershell
cd projects/tools/password-strength-lab
npm install
npm run dev
```

Open a PR against [openlearnia/password-strength-lab](https://github.com/openlearnia/password-strength-lab).

### Schema Builder

```powershell
cd projects/tools/schema-builder
npm install
npm run dev
```

Open a PR against [openlearnia/schema-builder](https://github.com/openlearnia/schema-builder).

### PGLite Playground

```powershell
cd projects/tools/pglite-playground
npm install
npm run dev
```

Open a PR against [openlearnia/pglite-playground](https://github.com/openlearnia/pglite-playground).

### Website

```powershell
cd website
npm install
npm run build
```

Open a PR against [openlearnia/website](https://github.com/openlearnia/website).

## Cloudflare Pages deploy

All browser/web submodules use `wrangler.toml` at repo root and deploy via GitHub Actions with org secrets `CF_API_TOKEN` and `CF_ACCOUNT_ID`. Create a matching Pages project name in Cloudflare for each tool (see each repo's `wrangler.toml` `name` field).

**Exception:** `live-wallpaper` is a Windows desktop app — it uses `build.yml` + `release.yml` (GitHub Releases), not Cloudflare Pages.

## Code of conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
