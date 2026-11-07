# PR53 upstream submission audit

Audited 2026-11-06. Read-only code/GitHub review; this report is the only saved audit artifact. No source edits, commits, branch resets, PR updates, closures, or messages to maintainers were made.

## Decision: REWORK, keep the proposal open

PR53 has useful generic hosted-app and standalone search behavior. Do not close it merely because the fork now has a native edition. It is not ready to finalize: a concrete standalone server-selection regression needs fixing, the commit format and submission evidence are incomplete, and the contribution guide has baseline tooling mismatches. Keep the useful hosted foundation separate from native FilaMan transport/branding. Reassess readiness after the focused fix and evidence gates below. This is a recommendation; the PR was not changed.

## Immutable review anchors and live state

| Item | Verified value |
| --- | --- |
| Upstream PR | <https://github.com/Disane87/spoolman-filament-swatch/pull/53> |
| Live status | Open; mergeable `true`; mergeable state `clean` |
| PR title | `feat: support hosted Spoolman and FilaMan shells` |
| Head repository / branch | `akira69/filaman-filament-swatch`, `fix/pr26-upstream-aligned` |
| Exact head | `b864db5c03d7d0a7d02476b49467ba1bc47970db` |
| Exact live base / upstream main | `935d3496df98faaec18e38aa4eba18c43d246c2f` |
| Source worktree | `/Users/dfinch/Code/filaman-system/worktrees/swatch-hosted-fixes`; HEAD matches PR head; clean before and after review |
| Diff | 14 files, 563 insertions, 107 deletions; nine commits |
| Contribution guide | `CONTRIBUTING.md` at live base, Git blob `268cbbbd84bfb69a70d8847ddc64c704f5e620da` |
| Package manifest at base | `package.json` Git blob `979312542d0c39d560b2d15b5c14a697d7c0a6ea` |
| Current template inventory | Only `.github/PULL_REQUEST_TEMPLATE/logo-contribution.md`, blob `14a04a2b996dccc898f5e91f4599478b5a08c16a`; logo-specific and inapplicable to this code PR |
| Hosted CI | `hosted-tests`, success at exact head: <https://github.com/Disane87/spoolman-filament-swatch/actions/runs/42244199012/job/127982007284> |
| Security check | `GitGuardian Security Checks`, success at exact head: <https://github.com/Disane87/spoolman-filament-swatch/runs/127982005166> |

Live metadata, commit inventory, main SHA, guide, template and check runs were read through GitHub REST (`gh api`). `gh pr checks` initially hit a GraphQL TLS timeout; REST supplied the successful check evidence. A green hosted CI run does not prove all guide requirements were exercised.

## What the change does and where it reaches

The PR delays Vue mounting/router creation until a queried hosted configuration is loaded and validated. It supports a configurable asset base, enters the swatch route directly in hosted mode, preserves launch parameters during navigation/filter changes, uses the provided API base, hides independent server/theme controls, and avoids hosted analytics. It also connects the formerly inert navbar search to the shared filter state.

Reviewed the complete three-dot diff and connected code: `src/main.ts`; router creation and all route destinations; `useHostedMode`, `useSpoolmanUrl`, `useTheme`, `useFilaments`; the only `AppNavbar` caller (`MainApp`); `FilamentsView`, project views and detail routing; `LocaleSwitch`, `useSeo`; Spoolman, local external-filament and SpoolmanDB fetchers; hosted browser/query fixtures; Vite configuration; package/lockfile; contribution README/guide; hosted/deploy workflows; and release-test script. Expected use is a browser app for one user's inventory/catalog, not a multi-tenant API server. No native adapter implementation was audited.

| Delta | Upstream benefit / classification |
| --- | --- |
| Navbar search wiring, displayed query and clearing | Generic standalone and hosted bug fix; old `MainApp.handleSearch` was a no-op |
| Deferred configuration bootstrap and retryable visible error | Generic embedding benefit; prevents failed hosted launches from silently using a saved standalone server |
| Host API base and empty root-base support | Generic same-origin embedding benefit |
| Launch parameter preservation through routing/reload/filtering | Generic hosted benefit, but overly broad standalone query preservation causes finding 1 |
| Configurable Vite base / hosted index shell / no hosted analytics | Generic distributable embedding support |
| Hosted layout sizing, direct swatch entry and hidden independent controls | Generic embedding UI benefit; responsive and real-host evidence still incomplete |
| `filaman_*` parameters/globals alongside `spoolman_*` | FilaMan-specific compatibility vocabulary within the shared contract; not a native FilaMan data adapter. Keep the contract narrow/documented rather than importing the native edition into upstream |
| Parent language/theme | Initial query-based selection and globals are implemented. No in-place parent observer exists here; host-driven reload can synchronize them. Do not describe this as arbitrary live host-context observation |

## Must fix

### 1. A standalone launch link can restore the old server after the user saves a new one

**Location:** `src/composables/useFilaments.ts:327–328`, with `src/composables/useSpoolmanUrl.ts:11–20` and `MainApp.applySpoolmanUrl`.

**What this is:** The filter watcher now starts with every existing query parameter so hosted launch information survives. Standalone supports the documented `surl` query parameter, which takes precedence over saved storage whenever the app starts.

**Problem:** Open a standalone swatch URL with `surl=http://swatch.test/old`, save `http://swatch.test/new` through the server dialog, type `PLA` in navbar search, then reload. Search retains the old `surl`; startup overwrites the newly saved server with the old one. This can make a user inspect or import from the wrong inventory. The base watcher began with an empty parameter set, so the filter change removed the obsolete launch override.

**Evidence:** Reproduced both against the actual composables through Vite SSR and against the built UI through Puppeteer with synthetic same-origin API responses. The browser scenario used the real server dialog and navbar input, rather than setting application state directly:

```json
{
  "beforeReload": {
    "queryServer": "http://swatch.test/old",
    "savedServer": "http://swatch.test/new",
    "visibleCards": ["new PLA"]
  },
  "afterReload": {
    "queryServer": "http://swatch.test/old",
    "savedServer": "http://swatch.test/old",
    "visibleCards": ["old PLA"]
  }
}
```

**Small fix:** Preserve the required hosted launch keys without retaining obsolete standalone `surl`, or consume/update the launch override when saving a new server. Add the above standalone scenario as a regression that fails before the fix and passes afterward. The shared filter/query implementation is the proper scope; do not add a native-only workaround.

**If skipped:** Changing the server appears successful until reload, when a different inventory is selected again.

## Should fix before calling the upstream submission ready

### 2. One published commit does not meet the current Conventional Commits requirement

`dcae60a8ebd59c4e1b19db32562bb7e9cf8ddfad` is titled `Add hosted mode support for Spoolman shell embedding`. The other eight head-only commit subjects follow the conventional type format, and the PR title does too. The guide explicitly requires all commits to conform. Fix the original subject when preparing the coherent history, preserving backup refs and using an authorized exact lease for published rewrites; alternatively obtain maintainer agreement on a squash path. No history was rewritten during this audit.

### 3. Submission evidence remains incomplete

The PR body explicitly says local screenshots were inspected but GitHub attachment upload is pending. Its only standalone test is the landing-page route, and fixture APIs substitute for both Spoolman and external services. The existing twelve checks do not establish real standalone Spoolman/external-database behavior, source switching, mobile layout, both themes, console cleanliness, inventory failure/empty/loading/large states, or interaction after those states. The prior FilaMan compatibility integration described in the body is useful but does not satisfy those separate upstream scenarios.

## Submission requirements matrix

Source guide: <https://github.com/Disane87/spoolman-filament-swatch/blob/935d3496df98faaec18e38aa4eba18c43d246c2f/CONTRIBUTING.md>. Code/check references below refer to the pinned head unless stated otherwise.

| Requirement | Source | Verification / evidence | Result and blocker |
| --- | --- | --- | --- |
| All commits use Conventional Commits | Guide: Commit Guidelines / Submitting a PR | REST commit list and `git log base..head` | **Unmet:** first subject is nonconventional; remaining eight and PR title conform |
| TypeScript, Vue Composition API, surrounding component conventions | Guide: Code Style | Full touched-source/caller review | **Pass for reviewed delta:** TypeScript and existing `<script setup>`/Tailwind patterns; not a separate full typecheck claim |
| Proper formatting and lint | Guide: Code Style / Useful Commands | Manifest scripts/dependencies inspected; `git diff --check base...head` exit 0 | **Baseline tooling gap:** neither `lint` nor `format` script exists; ESLint/Prettier are not dev dependencies. Whitespace passes; lint/format was not invented or claimed |
| Supported Node/toolchain | Guide: Node >=18; actual lockfile/workflow | Locked Vite 7.3.6 and plugin-vue 6.0.8 require `^20.19.0 || >=22.12.0`; CI uses Node 24 | **Baseline docs mismatch:** guide minimum is stale. This audit used Node 22.23.3, which satisfies the actual engines; Node 24 success is CI evidence |
| Production build | Guide: Useful Commands; hosted workflow | Exact-head hosted CI runs `npm ci` then hosted production build | **Pass in CI:** hosted build; this read-only audit did not reinstall/build or claim a fresh standalone build |
| Hosted browser/query regressions | PR's hosted-tests workflow | `node --test scripts/hosted-mode.test.mjs scripts/hosted-query.test.mjs`; successful local rerun: 12 tests, 12 pass, 0 fail, 18.2s; exact-head CI also success | **Pass within fixture scope:** local sandbox initially blocked Chrome Crashpad; escalation enabled the successful rerun |
| Real standalone Spoolman | Guide: Testing item 1 | Requires real Spoolman version/instance and actual standalone UI actions | **Unmet/unverified:** synthetic Spoolman fixture and FilaMan's compatibility API do not prove it; finding 1 is separately reproduced in the real UI with synthetic endpoints |
| External database / source switching | Guide: Testing item 1 | Actual external catalog, all/external/Spoolman switches and reload | **Unmet/unverified:** fixture intercept returns `[]` for off-origin requests; existing tests never switch data sources |
| Different screen sizes | Guide: Testing item 1 | Inspect desktop/mobile layouts and menu/dialog interactions | **Unmet/unverified:** existing fixture fixes viewport to 1400x900; no responsive QA was performed in this audit |
| Both light and dark | Guide: Testing item 1 | Inventory/detail/projects in both themes | **Partial:** dark-class assertion exists; full light/dark manual coverage absent. Prior FilaMan light/dark check is reported in PR body, not independently rerun here |
| Console errors/warnings | Guide: Testing item 2 | Capture browser `console` warnings/errors and `pageerror` in all successful flows; classify expected config-failure diagnostics separately | **Unmet/unverified:** test fixture attaches neither listener; passing assertions do not prove console cleanliness |
| Empty/loading/error/large datasets | Guide: Testing item 3 | Empty inventory, delayed endpoints, per-source failed endpoints, realistic large catalog | **Partial:** hosted-config failure/invalid/missing/retry covered. No equivalent inventory/external edge-state coverage; fixture has two filaments |
| Navigation/reload/Back/Forward/filter launch-key retention | PR behavior contract / Task2 plan | Existing browser and composable tests | **Pass for existing cases; incomplete standalone scope:** host routes/history, query/clear/reload work; stale standalone `surl` remains a reproduced failure |
| Search/clear/reload | PR generic fix | Existing navbar browser regression and source review | **Pass for fixture inventory:** one test exercises real rendered cards, clear, query persistence and displayed text; add standalone server-switch coverage |
| Clear scope and related links | Guide: Submitting PR item 4 | Current PR body reviewed | **Partial:** summary explains shared foundation and links shell/wrapper/API dependency. Native edition now proceeds independently, so historical dependency statements should be kept accurate; none of these dependencies makes upstream closing necessary |
| Breaking-change disclosure | Guide: Breaking Changes / Submitting PR | API/caller trace; PR text | **Needs explicit review/disclosure:** internal router default export becomes `createAppRouter` and only its known caller is updated; no public package API found. Standalone behavior should be preserved after finding 1 is fixed; do not claim a breaking change is required without an actual public contract |
| Screenshots for UI changes | Guide: Submitting PR item 4; approved plan adds GitHub attachment requirement | PR body has a pending-upload sentence and no screenshot attachment URLs | **Unmet:** actual final-state images must be attached to PR, including relevant responsive/theme states; local files alone are insufficient |
| Release preview | Guide: Testing Your Commits | Inspected `scripts/test-release.mjs` to establish it only reads Git/files and prints; ran `npm run release:test` | **Fail, pre-existing:** exit 1, `Cannot read properties of undefined (reading 'sync')`; see baseline note below |
| Full image build/tag-triggered release | PR body checklist | Current body leaves checkbox unchecked | **Unverified; do not deploy as a review shortcut:** not a generic guide prerequisite, and this PR adds no release workflow. List honestly as unrun rather than running a publishing workflow |

## Existing baseline limitations, not regressions introduced by this PR

- `npm run release:test` fails because `conventional-commits-parser` 6.2.1 has no imported default `.sync` parser. Script blob is **identical** at base and head: `e869b9e40b6299141e080cff97180bc474bbedb5`. The safe analysis command printed package version `1.16.0` and found 22 commits since tag `v1.16.0` before failing. This is not evidence of any successful release analysis and should not be hidden by a green hosted test.
- Guide-only lint/format commands and stale Node minimum predate this PR. Resolve or document them without introducing unrelated tooling expansion.
- The filter modal's injected-ref template handling, swallowed per-endpoint inventory/external errors, and use of `history.replaceState({})` are already present in the base. Do not present them as new PR53 regressions. They still matter when checking the proposed user flows: an API failure can appear as an empty source because the base loader converts rejections to empty arrays.
- The standalone search fix is generic value, not a new native-edition dependency. External catalog behavior and standalone settings remain upstream behavior to preserve.

## Minimal path to finalize

1. On PR53's own upstream-proposal branch, add a failing standalone server-switch/search/reload regression and fix stale `surl` handling in the shared query path. Preserve hosted navigation/query tests.
2. Fold follow-up fixes/tests into coherent existing logical commits, correct the first subject, and preserve all source heads before any authorized history rewrite.
3. Re-run hosted build/tests and standalone build; manually verify real Spoolman and real external source switching with named versions/data sizes, empty/loading/failure/large states, desktop/mobile, light/dark, search, reload/history, and console diagnostics. Record what is actually tested.
4. Attach inspected final-state screenshots to GitHub; update PR scope, dependency wording, breaking-change statement and test evidence. Document guide/tool mismatches and the pre-existing release-preview failure honestly.
5. Keep/finalize when those checks demonstrate readiness. Close only if a later explicit review concludes the generic contribution is no longer wanted or a coherent narrowed proposal cannot be sustained; preserve useful code first. The native fork's existence is not that conclusion.

Verdict: rework finding 1 and the unmet submission items before treating PR53 as ready; keep it open meanwhile.

Not checked: real Spoolman/external services, responsive manual QA, full console audit, fresh builds/Node24 locally, native edition implementation, published screenshots, image/release execution. Main risk: standalone server selection can silently revert on reload until finding 1 is fixed.

## Implemented disposition

Keep PR53 open as draft for rework. The stale standalone `surl` regression was
fixed with a failing-then-passing regression and squash-integrated via fork
[PR15](https://github.com/akira69/filaman-filament-swatch/pull/15). Corrected head:
`0638277846fb9e2ed85a4fb901cd59abcb280b74`. Hosted production build and all 13
original standalone/hosted/query tests passed. PR53 title/body now state its
generic scope and the unmet real-service/manual/screenshot requirements. It is
not declared submission-ready; native fork work proceeds independently.
