# FilaMan Discovery Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Maintain the existing fork as `akira69/filaman-filament-swatch`, delivering a native FilaMan discovery plugin with inventory/catalog modes, synchronized host presentation, transparency, native logos/spool visuals, and reviewed upstream updates.

**Architecture:** Preserve the existing Vue/Vite discovery UI and wheel. Isolate native transport/mapping, host context/formatting, visual integrations and packaging; use the native API and shared FilaMan reel module. The FilaMan database is authoritative and editing stays in native FilaMan screens.

**Tech Stack:** Existing Vue 3, TypeScript, Vue I18n, Vite, node:test/Puppeteer, Python standard library/FastAPI wrapper tests, GitHub Actions, FilaMan native API and renderer. No new state, provider, translation or rendering framework.

**Spec:** [Approved design](../specs/2026-11-06-filaman-discovery-plugin-design.md).

**Execution status:** Implemented and locally verified; see [verification](../../implementation-verification.md) and [transition tracker](https://github.com/akira69/filaman-filament-swatch/issues/14). Core PR204 remains a release dependency. Feature PRs remain unmerged and no tag/release is published. The original planning-only text below records the approved execution gates; repository/PR results are tracked in the transition records.


## Global Constraints

- Never create `codex/` or other assistant-branded branches. Use `feat/`, `fix/`, `docs/`, `chore/`, `test/` or `refactor/` according to purpose.
- Reuse and rename the existing fork; preserve its parent relationship, source history, useful commits and MIT notices.
- Keep the current wheel/selector interactions and ranking; do not port the FilaMan HSV selector or invent a new opacity-distance metric.
- Runtime inventory comes only from same-origin native `/api/v1`; no SpoolmanAPI dependency, saved-server fallback, external catalog fetch or analytics.
- Both inventory and color catalog discovery are required; inventory/color/spool editing remains in native FilaMan.
- FilaMan controls language (`en`, `de`, `fr`), theme and currency. No plugin settings selectors. Preserve explicit foreign currency; do not convert or silently re-denominate amounts.
- Use native logos only; remove logo-submission/upload/contribution UI from the edition.
- Preserve RGBA, including alpha zero. Native metrics determine remaining fill; unknown must not look measured/full.
- Reuse `/spool-reel.js` and `/reel-flange.webp`. Half-reel means a cropped view, not fixed 50% fill.
- Preserve existing browser-local palette/project data; no implicit migration or new backend project store.
- Upstream changes become tested review PRs, never automatic merges/releases. Unmerged upstream PR adoption is selective and separate from the updater.
- Core PRs target `Fire-Devils/devel`. Never downgrade the preview database through an older core without photo/profile support.
- Back up before rewriting history; fold fixes/tests into logical commits. Published rewrites require exact leases and existing authorization; keep branch protection intact.
- Keep artifacts/databases/screenshots outside source commits. Only publication of images through the GitHub attachment mechanism satisfies PR screenshot requirements.

## Review Focus

1. One mode is forbidden or a later page fails: the other mode remains usable, and incomplete results never appear as a complete/empty dataset. Covered in Tasks 4–5.
2. Currency changes while legacy project costs lack currency metadata: no silent reinterpretation or unlike-currency total. Covered in Task 7.
3. Two records share RGB but differ in alpha/identity: mode switching, pins and imports cannot collapse or misidentify them. Covered in Tasks 5–6.
4. A shared reel module is absent or returns a full-looking null rendering: text/link survives, unknown fill is explicit. Covered in Task 8.
5. An adopted unmerged PR later lands upstream under different commit IDs: the update PR must reconcile rather than duplicate the fix. Covered in Tasks 3 and 10.

## Workspaces and evidence

The current design checkout is an existing linked worktree at `worktrees/swatch-wrapper-fixes` on `docs/filaman-discovery-design`. Do not move it or rename directories merely because GitHub's repository name changes. At execution, use the platform worktree tool if new isolation is needed and honor the workspace's `worktrees/` location preference.

Preserve these initial review anchors, then re-read live heads before any mutation: hosted foundation `b864db5c03d7d0a7d02476b49467ba1bc47970db`; wrapper `8edb981808943d258643268274f5fdef889fe798`; core shell `ae8b8fa2fcacddcc9a7930ad2e10451840db9dbe`; reviewed upstream `935d3496df98faaec18e38aa4eba18c43d246c2f`. These are evidence, not permission to reset a changed branch.

Store immutable PR snapshots, guideline copies, test logs, previews and private database backups under the existing workspace's ignored `_pr_artifacts/filaman-discovery/`. Track source provenance and public decisions in repository docs and the fork's transition issue; never copy credentials or private data into either.

### Shared verification commands

Run commands from the plugin repository unless a task names the core checkout. Use Node 24 as in current hosted CI and an activated Python environment containing FastAPI/httpx. Task 4 adds `npm test` as `node --test scripts/*.test.mjs`; it runs after the hosted build. Browser fixtures intercept only external/native API boundaries and exercise the real built UI. Real-core integration in Task 11 is additional evidence, not substituted by those fixtures.

```sh
npm ci
VITE_HOSTED_MODE=1 VITE_BASE_PATH=/plugins/filament-swatch/ npm run build
npm test
python -m unittest discover -s tests
uvx ruff check filaman-plugin scripts/package-filaman-plugin.py tests
git diff --check
```

Before Task 4 creates the edition test command, run the existing explicit `node --test scripts/hosted-mode.test.mjs scripts/hosted-query.test.mjs` instead. For changed-source duplication, use the workspace's `jscpd@5` command on the touched paths and connected helpers; compare clones to the actual base and do not refactor unrelated legacy duplication. No nonexistent package script counts as a completed check.

## Task 1: Preserve work and rename the existing fork

**Files/resources:** Git refs/remotes; GitHub repository settings; `docs/filaman-transition.md` (new); edition `README.md` identity. Metadata consumers are finished in Tasks 9–10.

**Consumes:** The existing fork and the four anchors above. **Produces:** Renamed repository with unchanged numeric repository ID/parent, preserved source refs, an explicit native-edition baseline, and a transition tracker URL.

- [ ] Read live repo identity, main/PR heads, rulesets, branch/worktree status and destination-name availability. Back up descriptions/settings/ref SHAs. Preserve task-owned source heads before closing anything; leave unrelated work intact.
- [ ] Confirm a clean baseline: install the existing lockfile, build the hosted bundle and run the existing script tests plus Python route/package tests. Record failures by name; do not call an unconfigured lint command a passing check.
- [ ] Rename `akira69/spoolman-filament-swatch` to `akira69/filaman-filament-swatch` through the supported GitHub API/CLI. Compare numeric repo ID, fork parent, history, PRs and releases against the saved state. Update local `origin`; add/verify `upstream` points to the original. Do not change branch rules or main's contents as part of renaming.
- [ ] Open a tracking issue in the renamed fork explaining the native edition, retained attribution, design/plan, old proposal links and pending PR53 review. Update `docs/filaman-transition.md` with that URL and verified migration facts.
- [ ] Prepare `feat/filaman-discovery` from the actual fork integration target. If the old fork main needs an upstream baseline refresh, stage that as a separate coherent commit/PR, then create the feature branch from its final published head. Replay only the reviewed hosted/wrapper delta onto that head; do not recreate the old three-dot ancestry problem by comparing copied snapshots with unrelated parents. Preserve source SHAs and verify the intended tree/diff.
- [ ] Keep inherited Pages/semantic-release deployment disabled for the fork product line until Task 9 replaces it with the plugin release policy. Do not blindly sync/force upstream over fork main. Commit migration documentation separately from product features.

Verification: repo identity/parent unchanged; old work reachable; source worktrees preserved; remote URLs correct; no unintended release fired. Record actual target/baseline SHAs for all following tasks.

## Task 2: Audit PR53 and finalize its upstream disposition

**Files/resources:** Original repository PR53 and its current diff/base; `CONTRIBUTING.md`; `.github/PULL_REQUEST_TEMPLATE/`; workflow/check results; `docs/upstream-pr53-decision.md` (new); regression files on a separate `fix/` branch if warranted.

**Consumes:** Preserved hosted source and live upstream guidance. **Produces:** A concrete keep/rework/close decision with evidence, while the native fork proceeds independently.

- [ ] Pin the actual PR head/base and fetch the current contribution instructions/templates. Trace bootstrap, router/filter queries, search, theme and standalone callers. Separate useful generic fixes from FilaMan-specific behavior and from pre-existing upstream defects.
- [ ] Build a requirements matrix: requirement, source, verification command/scenario, evidence, result and blocker. Current guidance calls for Conventional Commits, TypeScript/Composition API, available lint/format checks, manual real-Spoolman/external-database tests, responsive/light/dark tests, console/edge-state checks, clear scope, breaking-change disclosure and UI screenshots.
- [ ] Verify real standalone/Spoolman behavior, not only the FilaMan compatibility fixture. Exercise source switching, empty/loading/failure/large datasets, search, hosted navigation/reload/Back/Forward and error isolation. Existing browser regressions run with `node --test scripts/hosted-mode.test.mjs scripts/hosted-query.test.mjs` after the hosted production build. Run `npm run release:test` only after reading the script and confirming dry-run behavior.
- [ ] Record tooling mismatches honestly: the inspected guide requests `npm run lint`, but the inspected package has no lint script; its stated Node minimum also predates the current Vite toolchain. Use actual lockfile/tool requirements, verify available checks, and resolve/document these baseline gaps without unrelated tooling expansion.
- [ ] For any actionable regression, first write/watch a failing test, implement the smallest generic fix on the upstream proposal's own branch, then rerun applicable standalone/hosted checks. Preserve history/backups and use a protection-compatible PR update path. Keep native-adapter/branding changes out of PR53.
- [ ] Capture final-state evidence and satisfy the actual screenshot requirement before declaring the UI contribution ready. If GitHub attachment upload remains unavailable, record it as unmet; local screenshots alone are insufficient.
- [ ] Decide: keep/finalize PR53 if it has demonstrated upstream value and meets submission requirements; narrow/rework it if that makes the contribution coherent; otherwise close it after preserving the useful code. Do not close solely because the fork exists or leave it indefinitely undecided. Record the reason and verification limits in the fork tracker; update PR status/text accurately without implying a native edition already ships.

Verification: `docs/upstream-pr53-decision.md` has an explicit disposition and complete requirements matrix. The native branch retains required fixes whichever disposition is selected. This task can proceed independently of Tasks 4–9.

## Task 3: Triage upstream's open PRs and freeze native contracts

**Files:** `docs/upstream-pr-triage.md`, `docs/upstream-adoptions.json`, `docs/filaman-compatibility.md` (new); sanitized `scripts/fixtures/filaman/` contract fixtures (new).

**Consumes:** The then-current upstream PR inventory and supported native core. **Produces:** A decision for every inventoried PR, pinned adoption provenance, a compatibility baseline and API fixtures for Tasks 4–8.

- [ ] Inventory all currently open upstream PRs (roughly 30 reported by the user; do not hardcode that count). Record URLs, head/base SHAs, authors, affected paths, claims, review/check status, dependencies, licensing/assets, conflicts and relevance to this edition.
- [ ] Rank correctness/security/compatibility first, then tests and cleanup that reduce maintenance. Give every PR a decision: adopt, defer, reject or already incorporated, with a short concrete reason. Do not automatically import every cleanup or green PR.
- [ ] For each shortlisted PR, inspect connected code and reproduce its claimed defect on its pinned base. Adopt only the smallest verified patch in isolation with a regression that fails before adoption and passes after. Retain authorship/credit and record `{pr, headSha, baseSha, patchId, localCommit, decision, reason}` in the adoption ledger. Resolve dependencies explicitly and avoid importing overlapping changes twice.
- [ ] Capture native `/api/v1/filaments`, `/colors`, `/spools`, `/spools/statuses`, `/me`, manufacturer/logo and app-settings response shapes from supported source/tests, including paging, color assignment order/IDs, price/price_currency/weight basis, statuses and metrics. Fixtures must be synthetic and hand-checkable, not exports of the real database/users.
- [ ] Record an initial core commit/image with photo/profile fields, shell/assets support and renderer availability. Establish the first releasable supported core version/commit through capability tests; do not infer it from another checkout's version stamp. Identify any separate core PR required against `Fire-Devils/devel`.
- [ ] Commit triage/contracts as one logical documentation/fixture change; keep each selected behavior fix and its regression in its own coherent feature/fix commit. Later update tests must cover an adopted PR landing upstream with a different SHA.

Verification: every inventoried PR has a decision; adopted patches have reproductions/provenance; native fixtures include nulls, RGBA, mixed currencies, duplicate identities and at least two pages. No unreviewed upstream PR is a runtime dependency.

## Task 4: Implement the native API boundary and hosted startup

**Files:** new `src/types/discovery.ts`, `src/api/filaman.ts`, `scripts/native-api.test.mjs`, `scripts/fixtures/filaman/*.json`; modify `src/main.ts`, `src/composables/useHostedMode.ts`, `src/composables/useFilaments.ts`, `filaman-plugin/router.py`, `tests/test_filaman_plugin.py`, `scripts/hosted-mode.test.mjs`, `scripts/hosted-query.test.mjs`, `vite.config.ts`, `package.json`, developer setup in `README.md`.

**Interfaces:** `DiscoveryMode = 'inventory' | 'catalog'`; `DiscoveryColor` retains native color ID when present, assignment position, canonical hex and display name. `InventoryItem`/`CatalogItem` have discriminated kinds, numeric `nativeId`, namespaced string `id` (`filament:17`/`color:17`, retaining upstream's view-identity property), name, ordered colors and only applicable metadata. Keep a primary `colorHex` view projection for existing color algorithms, without inventing catalog inventory fields. `InventorySnapshot = {items: InventoryItem[]}` and `CatalogSnapshot = {items: CatalogItem[]}`. `NativeSpoolSummary` contains `id: number`, `href: string`, `archived: boolean`, `onHand: boolean`, `location: string|null`, `remainingPercent: number|null`, `remainingWeightG: number|null`; inventory items contain their associated summaries. `loadInventory(signal?: AbortSignal): Promise<InventorySnapshot>`; `loadCatalog(signal?: AbortSignal): Promise<CatalogSnapshot>`; `loadNativeSettings(signal?: AbortSignal): Promise<{language: string; currency: string}>`. Snapshots contain complete mapped items. Keep wire DTOs/status interpretation internal to `src/api/filaman.ts`.

- [ ] Write failing node:test cases using Vite's existing SSR module loading and a controlled fetch boundary: two pages yield all literal expected IDs; page-two 500 rejects; 401 and 403 remain distinguishable; cancellation propagates; no per-item requests; null manufacturer/price/color links map safely. Native `filament:17` and `color:17` must be distinct. Assert exact requested native paths and no `/spoolman` or external source requests.
- [ ] Run `node --test scripts/native-api.test.mjs` and observe failures against the current implementation. No new test framework dependency; extract a small test utility only when repeated setup actually warrants it.
- [ ] Implement typed native pagination/mapping using the captured contracts. Bound concurrent page requests, validate consumed fields, preserve assignment order/IDs, explicit price currency and authoritative metrics. Do not silently turn transport failures into empty arrays or fabricate catalog inventory fields.
- [ ] Introduce a native-edition hosted-config contract with `contract_version: 2`, `mode: 'hosted'`, `app_key: 'filaman'`, `api_base_path: '/api/v1'`, and the existing plugin app base. Keep the core shell URL/launch parameter compatibility; only this edition's bootstrap interprets its native contract. Validate configuration before mounting; missing/unsupported config shows a translated retry error and never loads saved standalone inventory.
- [ ] Update development proxying using an explicit `FILAMAN_DEV_URL` target: native `/api` and `/auth`, the exact hosted-config route, `/spool-reel.js` and `/reel-flange.webp`. Do not proxy the entire plugin app base away from Vite's own assets. Test that the native development paths reach the configured test backend and document starting the edition against that isolated host; no baked-in production instance URL.
- [ ] Rewire the existing composable's loading boundary while retaining inexpensive compatibility projections for upstream views until Task 5 generalizes their item types. Guard source-dependent behavior explicitly; a native item must still show its spools. Refocus edition tests on native startup; standalone/upstream-host tests remain on PR53's separate source, not a promise that the edition supports both products.
- [ ] Add explicit package test commands for the script tests/build fixture order. Run native API tests, existing query/navigation checks, Python route tests and the hosted build; commit adapter/startup with its tests.

Expected: complete native results, authenticated errors preserved, native-only startup, and unchanged wrapper containment/deep-link behavior. Do not change any server API contract to satisfy the adapter.

## Task 5: Add inventory/catalog modes using the existing discovery UI

**Files:** modify `src/composables/useFilaments.ts`, `src/views/MainApp.vue`, `src/views/FilamentsView.vue`, `src/router/index.ts`, `src/components/AppNavbar.vue`, `src/components/FilterModal.vue`, `src/components/FilamentBoard.vue`, `src/components/FilamentCarousel.vue`, `src/components/FilamentCard.vue`; update item-type consumers in `src/components/filament-detail/FilamentDetailPanel.vue`, `FilamentDetailHeader.vue`, `FilamentDetailInfo.vue`, `FilamentSpoolsList.vue`, `FilamentColorWheel.vue`, `FilamentColorHarmonies.vue` (all six in that directory), `src/components/PaletteDrawer.vue`, `src/api/projects.ts`, `src/types/project.ts`; add `scripts/discovery-modes.test.mjs` and browser cases in `scripts/hosted-mode.test.mjs`.

**Consumes:** Task 4 snapshots/item types. **Produces:** `setDiscoveryMode(mode: DiscoveryMode): void`, active `filtered`/item collection and separate per-mode filter state in the existing shared composable. Use `/app/swatch?mode=inventory|catalog`; preserve existing host/query parameters and ordinary browser history.

- [ ] Write failing tests: catalog loads once on first use and contains unused records; inventory denied does not block readable catalog; a partial load remains error/retry, not zero success. Duplicate RGB records and same-number color/filament keys remain separate. A canceled slow catalog request cannot replace a newer inventory snapshot.
- [ ] Add browser failures for mode switch/reload/Back/Forward, per-mode filters, native-only source badges, catalog hiding stock/material/manufacturer/price controls, and preserving mode/filters/pins across context updates. Assert rendered content and navigation rather than source strings.
- [ ] Implement the two modes with existing cards, layouts, wheel/harmony components and filters. Hide only inapplicable metadata; do not fake empty vendor/material fields as real values. Preserve current selection/ranking behavior against the active mode's items and mode-qualified pin identities.
- [ ] Include the preview's confirmed filter-modal fix: templates consume the unwrapped injected ref, and a script-side close handler updates `.value`. Test opening, applying a real material filter, closing and reset restoring the original count.
- [ ] Refresh native data on return from editing/focus while retaining discovery state. Existing browser-local projects remain intact; unknown legacy IDs/currencies must not silently bind to a new native record. Restrict any identity rebinding to explicit selection of a verified native item.
- [ ] Run pure mode/query tests plus hosted browser build/tests. Commit the two-mode behavior and regressions without replacing the selector or introducing a second discovery implementation.

## Task 6: Preserve transparency through data, color math and visuals

**Files:** modify `src/lib/colorUtils.ts`, `src/lib/swatchUtils.ts`, `src/types/discovery.ts`, native mappings, active card/detail/palette rendering; add `scripts/alpha-colors.test.mjs`; extend browser cases.

**Interfaces:** `normalizeColor(value: unknown): {hex: string; rgbHex: string; alpha: number} | null`. Accepted input is RGB/RGBA short/long hex; `hex` retains canonical RGBA semantics, `rgbHex` supplies underlying RGB to existing math, and alpha is a number in [0,1]. Keep existing color helper exports working via this shared boundary rather than duplicating parsers.

- [ ] Write literal cases: `#F008` -> RGBA `#FF000088`, RGB `#FF0000`, alpha `136/255`; `#FF000000` retains zero; `#FF0000` is opaque; malformed CSS/markup input is rejected. Same RGB/different alpha preserves separate native identities. Verify multicolor order and mixed opacity.
- [ ] Watch tests fail, then fix normalization and adapt hue/distance/luminance callers to consume underlying RGB without compositing against the theme. Preserve the existing harmony ranking; do not add an opacity-distance algorithm.
- [ ] Add checkerboard backing and alpha-aware fills in both layouts, detail/palette and wheel SVG. Test opaque, partial, zero and invalid colors in light/dark/brand themes; zero alpha remains a real color record, not gray/missing. Display native hex/opacity in existing information patterns, not a new filter control.
- [ ] Run alpha and mode tests, hosted browser tests and production build. Commit parsing/math/rendering together with its regressions.

## Task 7: Synchronize language, currency, theme and edition labels

**Files:** new `src/filaman/context.ts`, `src/filaman/i18n.ts`, `src/filaman/format.ts`, `src/styles/filaman.css`, `src/locales/fr.json`, `scripts/host-context.test.mjs`; modify `src/main.ts`, existing `en.json`/`de.json`, navbar/detail/source components, `src/lib/sourceUtils.ts`, all reachable project/import cost views, `src/types/project.ts` and `src/api/projects.ts` only for non-destructive identity/currency handling.

**Interfaces:** reactive `HostContext = {language: 'en'|'de'|'fr'; currency: string|null; theme: string}` with `startHostContext(): {context, stop}`; `formatMoney(amount: number|null|undefined, amountCurrency: string|null|undefined, context: HostContext): string`; shared localized number/date/weight formatters. Context consumes Task 4's settings and same-origin host signals; Vue I18n remains the translator.

- [ ] Write failing tests for initial user-profile language versus stale launch storage, parent language/theme changes, cross-tab currency updates and focus refresh without lost mode/filter/pins. Unknown language uses English; French loads real translations. Missing translation keys fall back visibly to English, not raw keys.
- [ ] Test money literals: zero versus null; USD/EUR setting changes; `fr-FR` decimal/grouping/currency conventions; JPY versus three-minor-unit currency; explicit foreign currency remains explicit; an unlabelled legacy project cost stays unknown until recomputed; unlike currencies cannot form a single total. Invalid codes do not crash and unresolved initial currency never silently becomes EUR.
- [ ] Implement the thin context observer with reliable teardown/cancellation. Read native profile/settings before claiming authoritative initial context; do not let the host's initial hardcoded HTML language override an already-loaded user preference. Follow subsequent effective host changes. Use one formatter for every reachable monetary display, including zero values and project/import screens; remove euro-only formatting/icons.
- [ ] Map existing FilaMan terminology explicitly, bundle reviewed Swatch-specific en/de/fr messages, preserve interpolation placeholders, and translate hardcoded wheel legends/errors/accessibility text. Remove the locale selector/independent locale persistence from the edition.
- [ ] Map effective FilaMan theme tokens into the iframe through the small stylesheet/context boundary. Remove standalone server/theme/currency controls and replace source labels with FilaMan, without altering historical attribution. No broad CSS redesign or new wheel geometry.
- [ ] Run context/money and full browser tests in all three languages/themes; verify existing browser storage was not deleted. Commit settings/translation/format integration coherently.

## Task 8: Wire native logos, spool links and shared fill rendering

**Files:** modify `src/components/VendorLogoBadge.vue`, `src/components/FilamentCard.vue`, `src/components/FilamentBoard.vue`, `src/components/filament-detail/FilamentDetailHeader.vue`, `src/components/filament-detail/FilamentSpoolsList.vue`, `src/lib/logoUtils.ts`; new `src/filaman/spool-visuals.ts`, `src/components/filament-detail/FilamanSpoolReel.vue`, `scripts/native-visuals.test.mjs`; remove edition wiring of `src/components/LogoUploadDialog.vue`/`src/lib/githubPrGenerator.ts`, `.github/ISSUE_TEMPLATE/logo-request.md`, `.github/PULL_REQUEST_TEMPLATE/logo-contribution.md`, and logo-contribution links in `README.md`/`docs/CONTRIBUTING_LOGOS.md`.

**Interfaces:** `loadSpoolRenderer(): Promise<{renderSpoolReel: (fraction: number, colors: string[], style: 'striped'|'gradient', options: {view: 'full'}) => string}>`; a single cached same-origin `/spool-reel.js` import. The Vue wrapper receives a native spool summary/colors, handles unavailable data/module, and crops the full view to a half reel. Native links use validated IDs and top-level navigation.

- [ ] Write failing browser tests using real fixture relationships: native logo URL appears in both layouts/detail; broken/missing logo leaves text; no logo-submission controls/contribution requests exist. Spool 17 links to `/spools/17`, ordinary click navigates the parent, modified click opens a tab, and keyboard activation works.
- [ ] Assert the renderer receives literal fractions 0/.25/.5/1 from native percentages, exact ordered RGBA colors and native striped/gradient style. Null/invalid percentage does not call a full-looking null renderer; unknown state preserves the link and numeric fallback. Module failure and missing flange asset must not break discovery.
- [ ] Implement native logo props/call sites, removing name-derived asset guesses and active contribution flows. Implement the linked spool row and the clipped full-view wrapper; do not copy winding algorithms or assume a 1000g denominator. The adapter maps `metrics.remaining_percent` to `remainingPercent` and the authoritative `metrics.effective_remaining_weight_g` to `remainingWeightG`; only when the effective metric field is absent may it use native `remaining_weight_g`. Explicit null remains unknown and zero remains zero. Keep native style meanings separate from upstream display labels.
- [ ] Test responsive layouts, accessible descriptions, alpha checkerboards, SVG ID collisions across multiple rows, and lack of horizontal overflow. Verify source-visible text/numbers remain usable with renderer loading disabled.
- [ ] Run visuals + alpha/browser tests and the current core's renderer tests. If the target core lacks the shared module, prepare the smallest independent core PR against `devel`; never downgrade the database or silently claim the bonus is complete. Commit plugin integration and required core change separately.

## Task 9: Own packaging, repository metadata and What's New

**Files:** new `src/filaman/release.ts`, `src/filaman/release-notes.json`, `scripts/release-notes.test.mjs`, `docs/releases/`; modify `src/components/ChangelogModal.vue`, `package.json`/lockfile root metadata, `filaman-plugin/plugin.json`, README/contribution links, `scripts/package-filaman-plugin.py`, Python package tests and release workflows. Review inherited semantic-release/Pages config.

**Interfaces:** edition metadata has one repository identity `akira69/filaman-filament-swatch`, installed plugin version/tag and upstream SHA/release provenance. `getInstalledReleaseNotes(): ReleaseNotes` reads bundled notes for that installed tag; a separate explicit update check may identify newer plugin releases.

- [ ] Write failing tests: installed `filaman-v1.0.1` shows that version's notes even if upstream/newer fork tags exist; offline notes remain available; links point to the matching fork release; last-seen state is plugin/repo/version qualified; dates use the effective host language; HTML notes stay sanitized. No inventory/user data enters release requests.
- [ ] Implement fork metadata and changelog source, keeping upstream attribution separate. Remove original-repository product issue/release/contribution links where they misdirect FilaMan users; preserve license/source credit. Bundle reviewed release prose with the installed build, with explicit language fallback.
- [ ] Keep the package script's validated tag-to-manifest version stamping, static containment and hidden-placeholder exclusion. Extend tests to check bundled installed-version notes/provenance and intentional ZIP contents; no source ZIP committed.
- [ ] Replace inherited automatic Pages/upstream semantic-release publication with the plugin-owned tag release path. Reconcile package/manifest version roles rather than making every `main` push create an upstream-style release. Both metadata and lockfile updates must be intentional and limited.
- [ ] Build and stage a ZIP locally and validate with the native installer on the copied core. Run all Python tests, release-note tests, hosted build/browser tests. Commit package/changelog work; real release tagging happens only at Task 11's release gate.

## Task 10: Generate reviewed upstream update PRs

**Files:** new `scripts/sync-upstream.mjs`, `scripts/upstream-sync.test.mjs`, `upstream-source.json`, `.github/workflows/upstream-update.yml`; modify native/plugin CI workflows and adoption ledger handling.

**Interfaces:** `upstream-source.json` records `{repository, commit, releaseTag}` where releaseTag may be null. `scripts/sync-upstream.mjs --dry-run --fixtures <directory>` evaluates an isolated local-Git fixture without network/writes to the real repo; normal execution uses the pinned source/provenance and creates a new `chore/upstream-*` branch/review PR. No force update of fork main or published bot heads.

- [ ] Write failing temporary-Git fixture tests for: no change -> no PR; new commits -> one delta; a stable tag on the already-integrated SHA -> no duplicate code; one pending update -> later changes queued; clean update -> marker advances only with complete patch; conflict -> main/marker unchanged; squash-merged previous update -> next delta still correct; adopted PR later merged/squashed upstream -> no duplicated implementation and conflicts routed to manual reconciliation.
- [ ] Implement the smallest incremental updater around standard Git/GitHub APIs. Read pinned SHAs, not mutable PR titles. Apply reviewed deltas from the source record, reconcile the adoption ledger, preserve local integration files/credit, and label unreleased targets accurately. Keep failed/conflicting output as artifacts, not a falsely successful partial marker update.
- [ ] Add scheduled/default-branch and manual workflow triggers with minimum permissions. Verify fork Actions settings permit PR creation. PR creation must cause the intended checks to run: account for GitHub's suppression of most downstream events created by `GITHUB_TOKEN`; use supported PR creation triggering or explicitly invoke the validation workflow on the new branch. Never expose privileged tokens while executing unreviewed upstream code.
- [ ] Require the hosted build, native contract/context/alpha/browser suites and Python route/package checks on update PRs. Produce a build artifact and a proposed credited changelog summary; do not auto-merge, tag, publish, or re-enable upstream deployment workflows.
- [ ] Run local fixture tests and workflow syntax validation. Exercise manual dry-run against upstream and a disposable fork branch/PR only after Task 1's rename/settings are verified. Confirm unchanged fork main and no duplicate PR before enabling the schedule. Commit updater/CI with its tests.

## Task 11: Final native integration, release readiness and old fork PR cleanup

**Files/resources:** all prior tests; `docs/filaman-compatibility.md`, transition/adoption/PR53 decision records; native edition PR body; fork PR6/8/9/13 status; copied preview and release artifact.

**Consumes:** Completed Tasks 1–10 and their evidence. **Produces:** A reviewed native plugin PR/releasable artifact and an accurate transition record. No dependency on PR53 merging.

- [ ] Take a fresh consistent read-only snapshot of the selected source instance (the earlier 8083 preview contained 33 filaments/38 spools/1392 colors; do not assume those counts remain current). Preserve all catalog photo/profile links and measurements. Use the same/newer capable core with narrowly staged shell changes and isolated copied data; disable copied hardware integrations/outbound activity. Never modify the source instance.
- [ ] Install the actual ZIP via authenticated HTTP, including upgrade and four-worker convergence. Verify native API-only discovery with SpoolmanAPI inactive/uninstalled in this copy. Compare inventory/photo-link counts and representative images against the snapshot. Remove only test accounts/data created by this run.
- [ ] Exercise both modes, multi-page loading, read-only permissions, session expiration, filter open/apply/reset, navigation/reload, native edit-and-return refresh, en/de/fr, brand/dark/light, currency changes, logos, opacity zero/partial/multicolor, spool links and half-reel fill. Use synthetic RGBA/mixed-currency fixtures as the real snapshot may have no assigned transparent filament.
- [ ] Run the complete defined plugin test command, Python suite and production build; run required core checks on any changed core scope. Run `git diff --check`, changed-scope Ruff and duplication checks. Capture/inspect final screenshots and upload them into the PR body as required; keep local captures/private DB files untracked.
- [ ] Perform an independent whole-change review using the approved execution workflow. Fix critical/important findings with failing regressions and keep tests with their behavior. Record any residual limitations and the actual supported core release/commit, including renderer capability.
- [ ] Update the native edition PR's scope, dependencies, validation and screenshots. Preserve useful old PR heads and link the tracker, then close superseded fork PR6/8/9 and PR13 once the native replacement preserves their required work. Keep FilaMan core PR24 unless a verified replacement supersedes it. Apply PR53's separately documented decision, not an automatic close rule.
- [ ] Confirm branch names, fork identity, upstream source marker, adoption ledger, release-note/version/manifest agreement and owned workflow policy. Keep unmerged feature PRs in their appropriate review state; do not merge or tag merely because local checks passed. A real release uses the approved tested commit/tag and verifies the produced ZIP after publication.

## Planned commit boundaries and dependency order

Migration/decision/triage records are distinct from behavior changes. Keep adapter/startup, mode handling, alpha support, host presentation, native visuals, release ownership and update automation in coherent commits with their regressions. Fold follow-up fixes into the relevant logical commit, preserving backup refs/exact leases for any authorized published rewrite. Shared test infrastructure earns a separate commit only if actually shared.

Task 1 precedes remote cleanup/automation. Tasks 2 and 3 are independent audits, but selected adoptions/contracts from Task 3 precede native mapping. Tasks 4 -> 5 -> 6 provide the common item/data foundation; Tasks 7 and 8 depend on it, Task 9 supplies release ownership, Task 10 depends on the provenance/CI/release rules, and Task 11 verifies the combined result. No task may silently advance through a failed gate or claim checks that were not run.

## Plan self-review and handoff

- Spec coverage: both modes, preserved selector, native identity/pagination/auth, French/host language, currency edge cases, alpha, logos/submission removal, links/reel, packaging/What's New, upstream PR selection/update provenance, PR53 requirements decision and deferred repository cleanup each have an owning task.
- Interface consistency: native snapshots/item kinds are defined in Task 4; mode state consumes them in Task 5; color normalization in Task 6 feeds rendering; Task 7 owns context/formatters; Task 8 only calls the native renderer; Tasks 9–10 share installed/upstream provenance without conflating their versions.
- Review-focus cases are pinned to the explicit tests above. No implementation tests have been executed by writing this plan.
- Planning is complete when this file and the amended spec are reviewed and committed. Repository rename, PR closures, PR53 rework, upstream adoption, automation and product implementation remain future execution tasks.

Recommended execution: **native/inline**, task by task, with a final independent reviewer. The tasks share the same core types, settings and UI, so parallel implementation would create unnecessary overlapping edits. Subagent-driven execution remains available if the user prefers a review gate for each task. The user's request for planning is not an instruction to start execution in this turn.
