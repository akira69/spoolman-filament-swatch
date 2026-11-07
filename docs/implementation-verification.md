# Native edition verification

Edition: 1.1.0. Upstream source: 935d3496df98faaec18e38aa4eba18c43d246c2f.

- Native production build, Vue-aware type check, 41 Node/browser tests and eight
  Python wrapper/package tests pass. Coverage includes complete paging, 401 login
  versus 403 mode isolation, revoked cache/detail access, account switching,
  per-user host-reload restoration, history and query navigation, French bootstrap
  text, RGBA zero, native logos and links, localized prices, and packaging/updater recovery.
- FilaMan Default, Light and Dark palettes use live host tokens, flat surfaces,
  semantic alpha borders and shared typography/radii. Browser checks cover token
  parity and identical rendered opaque swatch pixels across all three themes;
  RGBA/checkerboard and multicolor behavior remain intact.
- Accessible mode tabs use bundled icons and the local core UI font. Detail
  headers use native wide logo slots and aligned material/source metadata;
  corner reels meet rounded card edges. A 1,392-color regression verifies the
  compact minimap, reachable final card and scrollable desktop/mobile details.
  Background refresh retains clickable cards; revoked permissions still clear them.
  A small Include transparency checkbox separates RGB display from alpha preview,
  with checkerboard limited to transparent segments/center and no data mutation.
  Missing hues stay empty; each color occupies at most 30 degrees near its actual hue.
- Compact readouts place native links/status in the header, show opacity only
  below 100%, keep common metrics in one row, and display muted RGB labels with
  theme-foreground values. Pin/source actions sit below full-width title buttons;
  keyboard opening works in board/carousel, and mobile toolbar actions avoid
  the core hamburger. Fresh copied data also migrates and runs under exact PR204.
- Core PR204 is based on upstream devel c8c76c4f97d28c3ea9165f000edcdc756d3228ed:
  19 frontend tests, 24 backend installer tests and static build pass. The existing
  shared renderer is reused; stock released-core compatibility is not claimed.
- Fresh read-only source snapshot: 33 filaments, 38 spools, 1,392 colors. Isolated
  HTTP ZIP installation and upgrade each converged over 16 fresh connections.
  Native inventory/catalog load with SpoolmanAPI inactive. Every photo/profile
  link and spool-event count matches the snapshot; the source instance is unchanged.
- Scoped Ruff passes with N999 excluded only because the source packaging
  directory is named filaman-plugin. Official actionlint passes all four owned
  workflows. New adapter/context/updater scope has zero jscpd clones.
- Live upstream dry-run reports unchanged at the pinned source; it changes no
  fork main or source marker. Local Git fixtures exercise conflict/reconciliation,
  squash ancestry, dependency-only changes, adopted overlap and publication retry.
- One independent whole-branch review identified 16 actionable findings. The
  correction pass fixes permissions, prices, router history, lifecycle and full
  host reloads, catalog affordances, semantic themes, native validity,
  type contracts and updater trust/recovery. Saved pre-fix production assets and
  pure regression tests reproduced the material failures before correction.

No feature PR is merged and no release tag is published. Scheduled updates begin
only when the workflow reaches the default branch; a no-change upstream cannot
exercise a real new-source update. Upstream PR53 remains draft/rework, with its
standalone URL regression squash-fixed and all 13 original regressions passing.
Real Spoolman/external-service submission evidence remains outstanding there.

Public PR screenshots show the isolated copy of the actual FilaMan data.
Database files and credentials remain outside source commits. Qwen drafted the
README usage guide and contributor prose. Codex verified the commands and
policies. Token savings unmeasured.

## Discovery review cleanup

The native edition removes the unreleased Projects feature, its file importer,
3D previews, storage, sample files and exclusive dependencies. Pinned palettes
remain part of discovery. Old Projects URLs redirect to discovery.

On a verified account switch, Swatch clears the mounted view and starts a clean
launch before loading the new account's filters and pins. Switching between
discovery modes revalidates cached data and clears inaccessible records after
a 403. Inventory filters require a single spool to satisfy both location and
stock scope, and Reset returns to the default inventory scope. Native multicolor
swatches preserve their striped or gradient rendering and alpha.

The follow-up independent review found no blocking issues. The carousel's
remaining weight now uses the host locale for decimal formatting.

The final ZIP upgraded the isolated preview on port 8087. Sixteen fresh
requests served the new bundle. The copied database still exposed 33 filaments,
38 spools and 1,392 colors. Chromium verified host fonts and theme tokens in
Default, Light and Dark, plus native detail links and scrollable catalog details
at desktop and mobile widths.
