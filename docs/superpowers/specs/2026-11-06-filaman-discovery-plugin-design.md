# FilaMan Discovery plugin design

Date: 2026-11-06. Status: approved to proceed to implementation planning. Repository changes and implementation remain deferred to execution of the plan.

## Intent and agreed scope

Build a FilaMan-specific edition of Filament Swatch, distributed as an installable plugin. Its primary job is visual discovery. FilaMan remains the authority for inventory, the color catalog, permissions, settings, and editing.

The user chose:

- A maintained FilaMan edition with both **Inventory** and **Color catalog** modes.
- The native FilaMan API behind a small adapter, replacing the Spoolman compatibility dependency.
- Existing Swatch discovery tools, color wheel, harmony logic, selectors, grid/carousel, and palette interactions. Do not port FilaMan's HSV selector or design a replacement color-search control.
- FilaMan appearance and source labels, working native manufacturer logos with no separate Swatch logo-submission flow, and language controlled by FilaMan, including French; remove the plugin language selector.
- Currency managed and synchronized with FilaMan.
- Transparency support for native alpha-bearing colors.
- Spool numbers linked to their native FilaMan pages and compact spool graphics showing remaining fill.
- Automatic upstream change/update PRs, rather than automatic deployment of upstream changes.
- The FilaMan edition's What's New and release links belong to the user's repository, with upstream contributions included and credited when shipped.
- Maintenance boundaries that keep FilaMan integration separate from reusable Swatch behavior.

The corner-spool presentation, currency edge cases, and release boundaries below are design decisions proposed for approval, not additional user requests.

## Approaches considered

| Approach | Benefit | Cost | Decision |
| --- | --- | --- | --- |
| Continue the shared Spoolman-compatible embedding | Smallest change to upstream Swatch | Loses native alpha and logo information and retains Spoolman assumptions | Retain existing work as a separate compatibility option; not the selected product |
| FilaMan-specific Swatch plugin | Reuses the working discovery interface while using native data and settings | A focused fork must follow upstream changes | Selected by the user |
| Port visualization into native Manage Colors | One native frontend | Larger port and weaker reuse of upstream releases | Deferred |

Manage Colors stays a management screen. The plugin is a separate discovery destination; native management pages can link to it later without moving CRUD into the plugin.

## User experience

Keep the product identity **Filament Swatch**; identify all native source badges and source descriptions as **FilaMan**. Historical attribution and license notices retain their original names. The FilaMan edition has no standalone server picker, independent language/currency/theme selector, runtime analytics, or external inventory source selector.

### Inventory

One item represents one native filament, retaining its manufacturer, material, ordered color assignments, and associated spools. All registered filaments are the default inventory view, including filaments without a physical spool. Retain the existing inventory-scope mechanism for all spools/on-hand views; native statuses determine availability. Archived spools remain identifiable and do not count as on-hand. Do not redefine FilaMan's status semantics from display strings or assumed numeric IDs.

Use the current text search, filters, sorting, visual layouts, wheel, and harmonies. Manufacturer, material, location and single/multicolor filtering retain their existing purpose. Manufacturer logos appear consistently on inventory cards and filament detail headers. Local pin/palette interactions remain discovery helpers.

### Color catalog

One item represents one native color record, including unused colors. Preserve its native name, exact color and alpha, identity and usage information. Do not fabricate a manufacturer, material, spool, price or stock level for a catalog color. Hide controls and detail sections that do not apply in this mode. The existing wheel and harmony tools work against the active mode's items.

Do not collapse different color IDs just because their RGB values match. Alpha-bearing and opaque records with the same RGB remain distinct. Native `usage_count` counts color-assignment links; label it as usage, not a count of distinct filaments or physical spools. Derive a distinct-filament count from native assignments only when presenting that specific quantity.

Switching modes clears selections that cannot apply in the destination mode, keeps host settings, and cannot turn a catalog color into an inventory filament. Keep separate search/filter state per mode and persist the mode in the URL so reload and browser navigation restore it. Cross-mode palette items use namespaced identities and remain distinguishable.

### Native navigation and editing

Spool `#17` is an ordinary, keyboard-accessible link to `/spools/17`. When embedded, navigate the top-level FilaMan window so the native spool page does not load inside the Swatch iframe. A normal modified click must still support opening a new tab. Construct same-origin paths from validated native IDs; do not take arbitrary target URLs from inventory strings.

Filament detail can link to `/filaments/<id>`. Catalog items link to `/filaments/colors`, the existing Manage Colors destination. Do not assume that page already supports opening a particular color editor by query parameter. Inventory/color/spool editing remains in native FilaMan screens; returning or refocusing the plugin refreshes affected data without discarding discovery state.

Keep browser-local pinned palettes. The FilaMan edition omits the inherited Projects feature, including project storage, file import and 3D previews.

## Architecture and maintenance boundaries

Keep the current Vue/Vite application and plugin packaging. Use four small integration boundaries, not a configurable provider framework:

1. **Native data adapter:** fetch FilaMan records and map them into the data the discovery views need.
2. **Host context and presentation adapter:** resolve effective language, currency and theme; translate plugin keys; format numbers/prices; map FilaMan theme tokens.
3. **Visual integration:** resolve native manufacturer logos and reuse the native spool renderer.
4. **Plugin wrapper/release tooling:** serve the built application, enforce static-path containment, and produce versioned installable ZIPs.

Keep transport, native field names, pagination, authentication handling, status interpretation, URLs and logo resolution out of the wheel/harmony components. Introduce only the small shared item shape needed by the two real modes. Do not retain Spoolman wire types as the new domain model or fake catalog colors as filaments full of empty/default properties.

Items have a kind, native ID and namespaced key (`filament:17` versus `color:17`), display name, ordered color samples, and applicable metadata. Inventory items may carry manufacturer, material, money and spool summaries; catalog items carry usage information. Color samples retain native IDs/assignment positions where available and canonical RGBA independently of any RGB value derived for math.

This confines native changes, but it does not make upstream UI merges free: changes to shared view props, selection, color math or rendering still require review. Prefer narrow FilaMan components/styles and small call-site changes over wholesale rewrites of upstream views.

### Native API adapter

Use same-origin browser requests to existing native endpoints:

| Data | Native surface | Treatment |
| --- | --- | --- |
| Filaments | `/api/v1/filaments` and detail responses | Native IDs, designation, manufacturer, assignments and explicit price metadata |
| Colors | `/api/v1/colors` | Native color IDs, names, hex and usage counts |
| Spools/statuses | `/api/v1/spools`, `/api/v1/spools/statuses` | Native relationships, statuses and authoritative metrics |
| Locations/manufacturers | Existing `/api/v1` resources as needed | Join by ID; use provided native logo URLs |
| User context | `/api/v1/me` and effective host state | Existing session/permissions and language |
| Application settings | `/api/v1/app-settings/public-info` | FilaMan display currency |

Native list responses are paginated. Load all relevant pages, with cancellation and bounded concurrency, before claiming a complete list or computing global filters/harmonies. Share one inventory snapshot between views and fetch the catalog when first needed. Avoid per-card requests. Catalog discovery must remain available if the user can read colors but lacks inventory permission; load each mode independently.

Use FilaMan's normal session and permission behavior; never embed an API key or add a privileged proxy. Route expired sessions through the native login flow and distinguish forbidden, empty, loading and failed states. Refresh/retry failures cannot silently become an empty inventory. Cancel stale requests and prevent an older response from replacing a newer mode/filter snapshot.

The plugin does not write inventory through this adapter. It does not require SpoolmanAPI, call `/spoolman`, change the compatibility API contract, or create a second inventory store. Unsupported host capabilities produce an actionable error, not fallback to a saved standalone server.

### Language and theme

FilaMan's effective host language is authoritative after its user-profile synchronization. Support `en`, `de` and `fr` throughout the plugin. Reuse relevant existing FilaMan wording through an explicit key map and retain bundled, reviewed plugin dictionaries for Swatch-specific strings. No runtime machine translation and no blind equivalence between unrelated host/upstream keys. Missing keys fall back to English; unsupported languages also fall back to English. French is a complete supported dictionary, not that fallback.

Remove the visible plugin language selector and stop writing an independent `locale` preference. Dates, weights, counts, percentages, tooltips, accessible names and errors follow the same effective language. Existing hardcoded labels in wheel legends and other reachable views must be included in the translation inventory.

Reuse the existing same-origin shell context. A small host-context module observes the effective parent language/theme and host currency changes, and refreshes native settings on focus/visibility return and same-origin storage changes. Do not introduce a general event bus or cross-origin embedding protocol. Language/currency changes update presentation without losing mode, filters or pins; theme changes update mapped FilaMan tokens. The implementation may reuse the shell's existing reload behavior only if discovery state is restored reliably.

Keep a small FilaMan stylesheet/token mapping, including its Default/brand, dark and light themes. The iframe does not inherit parent CSS automatically: explicitly map the effective host tokens. Fix only required integration styles; preserve selector interactions and harmony calculations; wheel coverage follows the explicitly requested capped hue ranges below.

### Currency

Use the authoritative FilaMan application currency and one formatter for every reachable money display. Use `Intl.NumberFormat` with the resolved language, including `fr-FR`, and the applicable currency. Remove hardcoded euro symbols, euro-only icons and `.toFixed(2) + currency` presentation. Zero is a valid price; missing price is not zero. Honor the currency's own minor-unit conventions.

Preserve an explicit native `price_currency` where present; use the application currency when the native amount has no separate currency metadata. Changing the application setting must not silently relabel an explicitly foreign-currency amount. Display such an amount with its actual currency and do not sum unlike currencies. This is display synchronization, not exchange-rate conversion. Catalog colors have no invented price.

Re-read the setting on initial load and when focus/storage/host context changes indicate an update. If the currency is initially unknown, withhold the money label until resolved rather than assuming EUR. A failed refresh can retain the last verified setting while showing retry state. Invalid currency codes receive a safe, visibly qualified numeric/code fallback rather than crashing the view.

### Transparency

Preserve native RGB/RGBA hex input, normalize accepted short/long forms, and default a missing alpha channel to opaque. Invalid data receives the existing safe placeholder treatment and never becomes executable CSS/markup. Explicit alpha zero must remain zero, not fall through to an opaque default.

Use alpha-aware colors in cards, detail swatches, multicolor samples, palette items and wheel SVG fills. Place a neutral checkerboard behind transparent color areas so transparency is distinguishable in every theme. Labels retain exact native hex and can show localized opacity in the existing information layout. Stored color is not a prediction of printed optical appearance. Subsequent UI refinement adds a small Include transparency checkbox: the default renders underlying RGB; enabling it previews native alpha with checkerboard only beneath transparent segments and center. Missing hue slots remain gaps, with each color covering at most 30 degrees near its actual hue. Stored values and harmony/ranking algorithms remain unchanged.

RGB color metrics and existing harmony algorithms continue to compare the underlying, uncomposited RGB channels; alpha is preserved separately, never baked into RGB against the current theme. Keep the existing ranking logic rather than inventing a new opacity-distance model. Fully transparent records remain inspectable and identifiable as transparent. Do not classify opacity zero as missing, collapse it with opaque RGB, or change its identity when themes change.

Transparency support does not add a new HSV wheel, alpha range selector or replacement color filter. Native API access removes the compatibility layer's deliberate RGB-only serialization, so no SpoolmanAPI change is needed for this edition.

### Manufacturer logos

The current Swatch helper looks up root-relative bundled SVGs by normalized vendor name, and its badge is not wired consistently into all active card/detail layouts. The new adapter uses FilaMan's manufacturer identity and native `logo_url`; it does not assume uploaded names or IDs match upstream asset filenames.

Render the native logo in both card layouts and the detail header. Preserve manufacturer text and accessible meaning if the logo is absent or fails. Resolve relative assets against the host/plugin base correctly; keep source badges labelled FilaMan.

FilaMan is the single logo source and management system. Remove Swatch's logo upload/submission dialog, contribution prompts, GitHub logo-issue links and their active wiring from this edition; do not merely redirect those submissions to the user's fork. Use the existing FilaMan manufacturer management for uploading, choosing and editing logos. A missing native logo falls back to manufacturer text, not upstream filename guessing or a contribution request. Upstream attribution and ordinary project release links are separate from logo management.

### Spool links and fill visualization

Use the existing FilaMan visual module exposed by `/spool-reel.js`, which exports `renderSpoolReel`, and its `/reel-flange.webp` asset. Reuse that implementation rather than copying its winding/color algorithms into this fork. The native implementation already supports striped/gradient colors and alpha. Keep these native style meanings; do not equate them with upstream coaxial/longitudinal labels without an explicit renderer mapping.

Each compact spool row shows its smaller linked number on the left and a larger corner reel flush to the bottom/right edges, clipped by the rounded card boundary. Remaining amount/location stay readable beside it. This follows the subsequent explicit UI refinement; the earlier half-reel presentation is superseded.

Use the existing renderer's quarter view directly; no new winding algorithm or core rendering API is required. The corner crop must not imply a different fill fraction.

Fill comes from native `metrics.remaining_percent`, clamped for presentation to 0–100%, and native effective remaining weight is authoritative for the numeric amount. Do not assume a 1 kg spool or recompute the percentage from arbitrary capacity/used-weight fields. For null/invalid metrics, show an unknown state and an em dash for unknown weight. Since the current renderer treats null fill as visually full, do not pass null through and present that as real remaining stock: hide/dim the graphic with an explicit unknown indication. Zero must show empty, while 100% shows full winding in the chosen corner view.

Use the actual ordered colors, transparency and native multicolor style for the reel. Give the numeric/link text an accessible description of the fill; decorative SVG is hidden from assistive technology. Rendering/asset failure must leave the spool link and numeric details usable. On compact screens preserve the link and amount without horizontal overflow.

## Packaging, upstream updates and compatibility

Reuse the existing GitHub fork `akira69/spoolman-filament-swatch` and rename it to **`akira69/filaman-filament-swatch`**, retaining its parent relationship to `Disane87/spoolman-filament-swatch`, history, existing work and attribution. This is the recommended repository setup; do not create a disconnected copy or a second fork. The new name was available when checked on 2026-11-06. Renaming and PR cleanup are separate execution steps; this design update does not perform them.

The renamed fork's `main` is the maintained FilaMan product line. Keep the original repository as an `upstream` remote/tracking reference; do not use an upstream sync/force operation to overwrite the FilaMan product branch. Update local `origin` URLs, repository metadata, release/changelog links, CI references and installation documentation to the new name during the rename. GitHub's redirects are a transition convenience, not the permanent configuration.

Branch names describe the work: `feat/` for features, `fix/` for fixes, `docs/` for documentation and `chore/` for maintenance/update automation. Never create `codex/` or other assistant-branded branch names. Use `docs/filaman-discovery-design` for this design and `chore/upstream-<release-or-short-sha>` for update PRs. Replace the old wrapper proposal with a normally named feature branch when the native edition is proposed; do not rename published PR branches as a side effect of documentation changes.

Both [Filament Swatch](https://github.com/Disane87/spoolman-filament-swatch/blob/main/LICENSE) and [FilaMan](https://github.com/Fire-Devils/filaman-system/blob/devel/LICENSE.md) currently use MIT. A modified plugin distribution is permitted with the required copyright/permission notices retained, including for reused FilaMan code. Audit dependency and bundled-asset notices separately before the first release.

Record the last integrated upstream commit and its release tag when applicable in a small tracked upstream-source record. A scheduled/manual workflow checks upstream `main` and stable release tags, and opens a review PR applying the delta from that recorded revision when new changes exist. Batch commits rather than opening a PR for every commit. Clearly mark a target that includes unreleased upstream commits; do not label it as a stable upstream release. The workflow runs from the fork's default branch; it does not assume upstream push/release events are automatically delivered to the fork.

Update the source record only alongside a fully applied delta. Use a new bot branch per update, preserve repository protections, and do not depend on force-pushing or allowing merge commits. Keep one outstanding upstream update PR; queue later changes for the next PR after it is resolved. An incremental delta tracked by source revision must work even when update PRs are squash-merged.

If changes conflict, stop automatic application, retain diagnostics for manual resolution and leave the released plugin/source marker unchanged. Avoid overlapping update PRs for the same source release. Review translation keys, dependencies/lockfiles, color helpers, changed view props, notices and asset behavior on every update.

Update PRs run adapter, context/i18n/currency, alpha, identity and browser tests, the production hosted build, plugin route/package tests and native-core integration checks. They publish a reviewable build artifact. They never automatically merge or publish the plugin. Plugin releases have their own version and `filaman-vX.Y.Z` tag; the ZIP manifest and published version agree and identify the upstream revision used.

### What's New and release ownership

The FilaMan edition's intended release source is **`akira69/filaman-filament-swatch`** after renaming the existing fork, not the original repository's release feed. Keep that identity in one edition/release metadata location used by What's New, release links and package metadata. The original repository remains the upstream code/update source, with its commit and release tag when applicable recorded separately. Until the rename occurs, the existing fork remains at `akira69/spoolman-filament-swatch`; do not describe the new URL as already live.

An upstream update PR brings the reviewed upstream release delta into the FilaMan branch and proposes a credited summary for the FilaMan release notes. The user's plugin release notes describe the FilaMan changes and upstream improvements actually included in that plugin version. Do not claim unmerged upstream commits, an unshipped newer release, or every original-project feature as changes in the installed edition.

What's New shows notes for the installed `filaman-vX.Y.Z` version. Ship those notes with the ZIP so they remain available offline; the GitHub link opens the matching release in the user's repository. A separate update check can announce newer FilaMan plugin releases, but it must not substitute the newest upstream release for the installed version's notes. Filter plugin release tags separately from upstream tags.

Reuse the existing changelog UI and sanitized note rendering. Its labels and release dates follow the FilaMan language, including French; maintainer-authored release prose may use its published language with an explicit fallback. Namespace the last-seen version by this plugin/repository so the old upstream version marker cannot suppress the FilaMan edition's notes. Release metadata requests must not include inventory or user data.

Preserve the wrapper's static path/symlink containment, package validation and license notices. The preview-only Filters modal binding fix must be included and covered in the maintained edition.

### Existing PR transition

Closing a proposal does not mean discarding its code. Preserve the hosted navigation, error handling, search, theme, test and wrapper/security improvements already reviewed; adapt them as needed to the native edition. The fork does not depend on upstream accepting PR53.

The user approved planning the fork rename and fork PR cleanup, but explicitly deferred performing them during planning. Upstream PR53 requires an evidence-based submission review, not a predetermined closure.

Disposition during execution after preservation/transition is reviewed:

| Existing proposal | Disposition |
| --- | --- |
| Original repository PR53, generic Spoolman/FilaMan hosted mode | Audit actual benefits and regressions, current `CONTRIBUTING.md`/templates/CI, scope, standalone/real-Spoolman behavior, evidence and screenshots. Rework/finalize it if the contribution is useful upstream and can meet the requirements; otherwise preserve the useful commits, close with an accurate explanation and record the decision in the user's fork. The native fork proceeds independently either way. |
| Fork PR6 and PR9, older hosted/alignment proposals | Close as superseded; retain the relevant history/code. |
| Fork PR8, prebuilt ZIP proposal | Close; release artifacts belong in GitHub Releases, not a source PR. |
| Fork PR13, current compatibility wrapper | Use its code as the starting point, then supersede it with the native edition proposal on a `feat/` branch. Preserve its route/package tests. |
| FilaMan core PR24, generic plugin shell/assets | Keep as an independent core integration prerequisite; prepare any upstream submission against `Fire-Devils/devel`. |

When cleanup is executed, record the new direction and links in a tracking issue or discussion in the user's renamed fork. A closed proposal should have a short supersession explanation and a pointer to that maintained repository/tracker; do not claim the native edition is already implemented. No PRs are closed and no public comments are posted by this design-only update.

### Triage other upstream pull requests

The user identified roughly 30 other open upstream PRs as potential sources of fixes and cleanup. At execution time, inventory the then-current open PRs and pin each reviewed head/base SHA. Triage all of them for relevance before selecting any to adopt; do not merge the queue wholesale or infer quality from a green status check.

Prioritize validated bugs/security issues, correctness and compatibility, then test/maintenance improvements that reduce the fork's work. Record each candidate's benefit, affected paths, current review/check state, conflicts, dependencies, license/asset changes and decision: adopt, defer, reject or already incorporated. Inspect the actual diff and connected code and reproduce the claimed problem for shortlisted changes. Retain credit and provenance for any adopted unmerged changes.

Import only selected, independently verified changes in isolated review branches with regression coverage. Track the upstream PR/head/patch identity so a later upstream merge is reconciled rather than applied twice. Conflicting or overlapping upstream merges require manual review. Update automation should reference this adoption ledger; it must not automatically incorporate unrelated unmerged PRs.

Initial development is verified against the existing 8083 feature build plus the plugin shell, whose database/photo support must not be downgraded. Before release, identify the first supported FilaMan release/commit providing native API shapes, the shell, asset installer support and the stable renderer module. Record that minimum and test it; do not invent a version from an unrelated checkout. Missing renderer capability can degrade to text-only spool rows with an integration warning; missing core data/shell capability blocks startup with a clear compatibility error.

Any necessary core changes are separate PRs against `Fire-Devils/devel`. No native/Spoolman API response contract is altered merely to fit a view. This design creates no new backend database tables or inventory migrations. Preview work uses copied data and preserves catalog photo/profile links and original instances.

## Acceptance and review gates

- Inventory and catalog identities stay separate across filters, pins, mode switches, reload and Back/Forward; unused catalog colors appear without fake stock or price.
- Every page is loaded for the 1,392-color preview catalog and for fixtures exceeding one inventory page. Incomplete loads and forbidden modes are never reported as complete/empty success.
- The native API is the only runtime inventory source; no compatibility-plugin installation, standalone server fallback, external catalog fetch or analytics request occurs.
- French, German and English cover all reachable labels/errors/legends and accessible names. Changing FilaMan language/theme/currency propagates and retains discovery state. No plugin settings selectors remain.
- Money tests cover zero, null, explicit foreign currency, setting changes, French formatting and currencies with different minor units; no raw amount is converted or silently re-denominated.
- RGB, short RGBA, eight-digit RGBA, explicit opaque alpha, partial alpha, zero alpha, invalid values and mixed-alpha multicolor data work in both modes and the reused reel. Theme changes never change stored identity or base RGB metrics.
- Manufacturer logos come only from native FilaMan URLs and render in both layouts and details, with missing/broken logos falling back to text under the nested plugin base. No logo-submission/upload controls or GitHub logo-contribution requests remain in the edition.
- Spool links navigate the parent to the correct native record; keyboard and modified-click behavior remain normal. Corner reels show 0/25/50/100% fill correctly; unknown metrics never look like measured full stock. The row remains usable if the module fails.
- Existing wheel/selector interactions and ranking remain regression-tested. Native striped/gradient reel rendering uses the existing shared renderer rather than a new copied implementation.
- Upstream commit/release checks open batched review PRs in the renamed fork, preserve local integration boundaries and leave the release unchanged on conflicts/test failures. Installed ZIP version matches its release tag.
- Upstream open-PR triage records a decision for every inventoried candidate and tests any adopted change; PR53 has a separate documented benefit/requirements verdict and final disposition. Neither task blocks independent native-fork development.
- What's New displays the installed FilaMan plugin version's notes and the matching release in the user's repository, works offline, credits imported upstream changes, and never presents an unshipped upstream release as installed changes.
- No discovery action writes native inventory or edits host settings. A read-only user and expired/forbidden session receive correct behavior. Database snapshots retain spool-photo links and measurements.

## Builder discretion and approval

The builder may choose exact module filenames, minimal shared item typing, pagination concurrency, context observation mechanics, corner-reel dimensions and tests using the repositories' existing tools. Do not introduce a provider registry, duplicate reel engine, new state framework or dependency for these adapters.

The user approved moving these product boundaries into a plan. This document records design intent and acceptance criteria; it does not claim that repository migration, PR decisions, the native adapter, translations, currency support, logos or reel changes are already implemented or tested. Execution follows the separate implementation plan.
