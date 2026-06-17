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
| `projects/tools/livewallpaper/` | [openlearnia/live-wallpaper](https://github.com/openlearnia/live-wallpaper) |
| `projects/tools/markdown-editor/` | [openlearnia/markdown-editor](https://github.com/openlearnia/markdown-editor) |
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

### Website

```powershell
cd website
npm install
npm run build
```

Open a PR against [openlearnia/website](https://github.com/openlearnia/website).

## Code of conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
