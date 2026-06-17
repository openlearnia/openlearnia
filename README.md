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

| Path | GitHub repo | Live | Description |
|------|-------------|------|-------------|
| `projects/tools/image-tools/` | [image-tools](https://github.com/openlearnia/image-tools) | [image-tools.openlearnia.com](https://image-tools.openlearnia.com) | Browser image utilities |
| `projects/tools/json-toolkit/` | [json-toolkit](https://github.com/openlearnia/json-toolkit) | [json-toolkit.openlearnia.com](https://json-toolkit.openlearnia.com) | Format, validate, and minify JSON in the browser |
| `projects/tools/image-metadata-viewer/` | [image-metadata-viewer](https://github.com/openlearnia/image-metadata-viewer) | [image-metadata-viewer.openlearnia.com](https://image-metadata-viewer.openlearnia.com) | Inspect image metadata and EXIF locally |
| `projects/tools/password-strength-lab/` | [password-strength-lab](https://github.com/openlearnia/password-strength-lab) | [password-strength-lab.openlearnia.com](https://password-strength-lab.openlearnia.com) | Password strength analysis and generator |
| `projects/tools/livewallpaper/` | [live-wallpaper](https://github.com/openlearnia/live-wallpaper) | [Releases](https://github.com/openlearnia/live-wallpaper/releases) | Windows live wallpaper engine |
| `projects/tools/markdown-editor/` | [markdown-editor](https://github.com/openlearnia/markdown-editor) | [markdown-editor.openlearnia.com](https://markdown-editor.openlearnia.com) | Browser Markdown workspace (OPFS) |
| `projects/tools/schema-builder/` | [schema-builder](https://github.com/openlearnia/schema-builder) | [schema-builder.openlearnia.com](https://schema-builder.openlearnia.com) | Database Lab — visual schema builder + PGLite |
| `website/` | [website](https://github.com/openlearnia/website) | [openlearnia.com](https://openlearnia.com) | Marketing site (Astro) |

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

## JSON Toolkit (quick start)

```powershell
cd projects/tools/json-toolkit
npm install
npm run dev
```

## Image Metadata Viewer (quick start)

```powershell
cd projects/tools/image-metadata-viewer
npm install
npm run dev
```

## Password Strength Lab (quick start)

```powershell
cd projects/tools/password-strength-lab
npm install
npm run dev
```

## Database Lab (quick start)

```powershell
cd projects/tools/schema-builder
npm install
npm run dev
```

Formerly split across `schema-builder` and `pglite-playground`; both are now unified in `schema-builder`.

## License

MIT — see [LICENSE](LICENSE).
