# FilaMan Swatch

FilaMan Swatch is a native FilaMan integration plugin for visual filament discovery, providing discovery-only inventory and catalog views.

## Features

- **Discovery-only modes**: View native FilaMan inventory and color catalog.
- **Native editing**: All edits remain within FilaMan.
- **Host sync**: Language, currency, theme, follow FilaMan.
- **RGBA support**: Full transparency handling.
- **Logos**: Manufacturer logos included where available.
- **Optional reel visuals**: Shared `/spool-reel.js` renderer and `/reel-flange.webp` asset are supported but not required.

## Installation

1. Download the plugin ZIP from [releases](https://github.com/akira69/filaman-filament-swatch/releases).
2. Install via Admin → Plugins → Upload Plugin.

> No SpoolmanAPI plugin or external services required.

## Requirements

- Authenticated same-origin FilaMan endpoints:
  - `/api/v1/filaments`, `/colors`, `/spools`, `/locations`, `/spools/statuses`, `/me`, `/app-settings/public-info`
- All pages must load correctly; duplicate IDs and auth failures are errors.
- Catalog availability is independent of inventory.

The integration shell/installer currently requires [core PR204](https://github.com/Fire-Devils/filaman-system/pull/204) or the isolated patched preview. No stock released core is claimed compatible yet.

See [compatibility docs](docs/filaman-compatibility.md) for full API details.

## Development

### Setup

```bash
npm ci
```

### Run Dev Server

```bash
FILAMAN_DEV_URL=http://127.0.0.1:8087 \
VITE_HOSTED_MODE=1 \
VITE_BASE_PATH=/plugins/filament-swatch/ \
npm run dev
```

Open in browser:

```
/plugins/filament-swatch/app/swatch?filaman_hosted=1&filaman_hosted_config=/plugins/filament-swatch/hosted-config
```

### Build & Test

```bash
VITE_HOSTED_MODE=1 VITE_BASE_PATH=/plugins/filament-swatch/ npm run build
npm test
# Python environment needs FastAPI and httpx
python -m unittest discover -s tests
```

The upstream wheel interactions are retained. Pinned palettes are stored in the browser. The FilaMan edition focuses on discovery; use FilaMan to edit filaments and colors.

## Packaging

Release tag must match bundled notes:

```bash
python scripts/package-filaman-plugin.py filaman-v1.1.0
```

## Upstream Updates

- Review PRs manually; never auto-merge.
- Conflicts and adoption require manual reconciliation.
- MIT license and attribution retained.

---

**License**: [MIT](LICENSE)
**Original Project**: [Disane87/spoolman-filament-swatch](https://github.com/Disane87/spoolman-filament-swatch)
**Fork**: [akira69/filaman-filament-swatch](https://github.com/akira69/filaman-filament-swatch)
