# Openlearnia

Open-source tools and learning projects from [openlearnia.com](https://openlearnia.com).

This repository is the **umbrella dev workspace** for the [openlearnia](https://github.com/openlearnia) organization. Each project is a [git submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules) pointing at its own GitHub repo.

**Clone (recommended):**

```bash
git clone --recurse-submodules https://github.com/openlearnia/openlearnia.git
cd openlearnia
```

If you already cloned without submodules:

```bash
git submodule update --init --recursive
```

## Repositories

| Path | GitHub repo | Description |
|------|-------------|-------------|
| `projects/tools/image-tools/` | [image-tools](https://github.com/openlearnia/image-tools) | Browser image utilities (image.openlearnia.com) |
| `projects/tools/livewallpaper/` | [live-wallpaper](https://github.com/openlearnia/live-wallpaper) | Windows live wallpaper engine |
| `projects/tools/markdown-editor/` | [markdown-editor](https://github.com/openlearnia/markdown-editor) | Browser Markdown workspace (OPFS) |
| `website/` | [website](https://github.com/openlearnia/website) | Marketing site (Astro) |

See [CONTRIBUTING.md](CONTRIBUTING.md) for day-to-day workflow (branch, commit, bump submodule SHAs).

## Live Wallpaper (quick start)

```powershell
cd projects/tools/livewallpaper
dotnet build LiveWallpaper.sln -c Release
dotnet test LiveWallpaper.sln -c Release
```

## Image Tools (quick start)

```powershell
cd projects/tools/image-tools
bun install
bun run dev
```

## Website (quick start)

```powershell
cd website
npm install
npm run dev
```

## Markdown Editor (quick start)

```powershell
cd projects/tools/markdown-editor
bun install
bun run dev
```

## License

MIT — see [LICENSE](LICENSE).
