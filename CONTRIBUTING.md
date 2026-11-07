# Contributing to FilaMan Swatch

This document provides guidance for contributing to the `akira69/filaman-filament-swatch` repository, a native FilaMan integration plugin for filament discovery.

## Overview

FilaMan Swatch is a discovery-only plugin that integrates with FilaMan's native API. It provides visual access to inventory and color catalog data without requiring external services or SpoolmanAPI.

## Development Setup

Use Node.js24, npm and Git. Python3.12 is needed for wrapper/package tests.
Use an authenticated, isolated FilaMan instance with the integration shell from [core PR204](https://github.com/Fire-Devils/filaman-system/pull/204); stock released-core compatibility is not yet claimed.

1. Clone your fork of `akira69/filaman-filament-swatch`.
2. Install dependencies:
   ```bash
   npm ci
   ```

3. Run the development server:
   ```bash
   FILAMAN_DEV_URL=http://127.0.0.1:8087 \
   VITE_HOSTED_MODE=1 \
   VITE_BASE_PATH=/plugins/filament-swatch/ \
   npm run dev
   ```

4. Sign in to the isolated FilaMan instance first. Open the dev server on the same host name (`127.0.0.1` in this example), so its proxy receives the authenticated cookie:
   ```
   http://127.0.0.1:5173/plugins/filament-swatch/app/swatch?filaman_hosted=1&filaman_hosted_config=/plugins/filament-swatch/hosted-config
   ```

## Build and Test

Build for production:
```bash
VITE_HOSTED_MODE=1 VITE_BASE_PATH=/plugins/filament-swatch/ npm run build
```

Run component type checking and browser/module regressions:
```bash
npm run check
npm test
```

Python tests require FastAPI and httpx:
```bash
python -m pip install fastapi httpx
python -m unittest discover -s tests
```

## Code Quality

- `npm run check` invokes `vue-tsc --noEmit`, including Vue component scripts and templates.
- Follow Conventional Commits: `fix(filters): match stock at the selected location`, for example.
- Squash fixes into coherent commits.
- Preserve unrelated work and create backup refs before rewriting history. Rewrite published history only when explicitly authorized and allowed by repository policy, using an exact force-with-lease. Protected branches use normal PR merges.
- Follow [FilaMan UI standards](https://github.com/Fire-Devils/filaman-system/blob/devel/docs/ui-style-guide.md); retain editing links to native FilaMan pages.

## Branching Strategy

- Use `feat/`, `fix/`, `docs/`, or `chore/` prefixes.
- Do not use `codex/` or assistant-branded names.
- Native PRs target this repository's `main`, not Disane87's repository.
- Follow-up fixes to open native PR16 target `feat/filaman-discovery`.

## Release Process

Releases are explicitly created by maintainers using `filaman-vX.Y.Z` tags. Commit types do not publish releases. Package metadata and bundled release notes must match the tag; the packager rejects stale bundles. Update PRs never release automatically. The release process includes:

1. Building with `VITE_HOSTED_MODE=1` and `VITE_BASE_PATH=/plugins/filament-swatch/`.
2. Running all tests.
3. Packaging with:
   ```bash
   python scripts/package-filaman-plugin.py filaman-v1.1.0
   ```
4. Publishing to GitHub releases.

## Upstream Updates

- The update workflow proposes Disane87 changes as review PRs. Do not rebase native development directly onto `Disane87/main`.
- Review update PRs manually; never auto-merge.
- Conflicts, dependencies and already-adopted changes require manual reconciliation. Record actual adoptions and their pinned source in `docs/upstream-adoptions.json`; advance `upstream-source.json` only after the full delta is reconciled.
- MIT license and attribution retained.

## Testing

Test themes (Default/Light/Dark), locales/currency, alpha zero and striped/gradient colors, account switching, permissions, paging/large catalogs, mobile/keyboard/scroll, and ZIP install+upgrade on isolated data copies. Never require production DB writes.

## Repository Details

- **Origin**: `akira69/filaman-filament-swatch`
- **Contributions Target**: `main` branch
- **Native PRs**: Target `feat/filaman-discovery` for follow-ups to open PR16
- **Upstream Changes**: Arrive through reviewed bot update PRs

## PR Checklist

- [ ] Follow conventional commits
- [ ] Squash fixes into coherent commits
- [ ] Preserve unrelated work
- [ ] Do not force-push protected history
- [ ] `npm run check` passes
- [ ] Run all tests before submitting
- [ ] Wrapper/package tests pass when the package or backend wrapper changes
- [ ] Verify hosted build with correct VITE settings
- [ ] Relevant theme, locale, account, permission, keyboard and scroll cases are exercised
- [ ] Screenshots represent the tested UI and data; database files and credentials are excluded
- [ ] Retain MIT notices, source provenance and contributor credit

## Ownership and scope

Native API integration is in `src/api/filaman.ts`; host presentation and formatting live in `src/filaman`. Keep native adaptations separate from reusable color/search helpers where practical.

Vue I18n dictionaries cover English, German and French. New visible strings need keys in each supported locale. Language, theme and currency follow FilaMan; do not add independent selectors. Supporting another language also requires extending the host mapping and formatting support.

FilaMan manages manufacturer logos. Submit generic upstream fixes in separate PRs with a narrow scope. Keep the native plugin focused on inventory and catalog discovery.

See [compatibility](docs/filaman-compatibility.md), [design](docs/superpowers/specs/2026-11-06-filaman-discovery-plugin-design.md), [verification and limits](docs/implementation-verification.md), and the [upstream adoption ledger](docs/upstream-adoptions.json).
