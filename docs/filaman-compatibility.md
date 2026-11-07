# Native API compatibility

The edition requires authenticated same-origin FilaMan endpoints: paginated
`/api/v1/filaments`, `/colors`, `/spools` (include_archived/include_metrics),
`/locations`, `/spools/statuses`, `/me`, and `/app-settings/public-info`.
All pages must load; changing totals, duplicate IDs, auth and later-page failures
remain errors. Catalog availability is independent of inventory availability.

Synthetic contracts are in `scripts/fixtures/filaman/contracts.json`. Assignment
order and native IDs are retained; usage_count counts color assignment links.
`metrics.effective_remaining_weight_g` is authoritative even when null or zero;
raw remaining_weight_g is used only when the metric field is absent.
On-hand statuses are new/opened/drying/active; empty and archived are excluded.
Native striped/gradient style is kept separate from upstream direction labels.

The reference source instance is the photo/profile-capable PR182 image
`filaman-ui-test:pr182-da887e5d`, with the independent shell change from core
PR24 (`ae8b8fa2fcacddcc9a7930ad2e10451840db9dbe`). It must not be downgraded
through an older core. Release support is capability-tested, not inferred from
its version string. `/spool-reel.js` and `/reel-flange.webp` are optional shared
visual capabilities; discovery and textual links survive their absence.
The shared `/plugin-fonts.css` supplies the same local Space Grotesk UI faces
inside the iframe. Development also proxies it and its `/_astro/` font assets.

No FilaMan database migrations, native editing, SpoolmanAPI plugin, external
catalog service or analytics is required by this edition.

## Current release gate

Core [PR204](https://github.com/Fire-Devils/filaman-system/pull/204), based on
`devel` at `c8c76c4f97d28c3ea9165f000edcdc756d3228ed`, supplies the integration
shell, asset installer/proxy and preservation of mounted child state. A stock
released core is not yet claimed compatible with the ZIP installation path.
The existing shared renderer was merged in core commit
`4d5eabb5142b6a891d78ba7ad9df227d485e43e6`; it is not duplicated here.

The isolated source-copy preview has these capabilities staged without replacing
its photo/profile-capable backend. Final package install and upgrade each
converged across 16 fresh HTTP connections; native counts remain 33/38/1392,
photo/profile links 4/4, and SpoolmanAPI is inactive. Source data was untouched.
