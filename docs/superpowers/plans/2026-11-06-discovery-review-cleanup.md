# Discovery review cleanup

Correct the PR16 review findings and keep the FilaMan edition focused on discovery. The user chose to remove the unreleased Projects feature entirely. This supersedes the earlier work to repair and retain it.

- [x] Remove Projects navigation, routes, storage, 3MF/G-code import, 3D previews, sample files and exclusive dependencies. Keep pinned palettes. Route obsolete project URLs to discovery.
- [x] Clear mounted discovery state and reload on a verified account change. A presentation update preserves the current session.
- [x] Revalidate cached modes on re-entry, match stock and location on the same spool, and reset to the default inventory scope.
- [x] Preserve native multicolor striping and alpha. Remove stale UI contracts surfaced by Vue-aware type checking.
- [x] Align contributor guidance with native setup, CI, upstream review and explicit releases. Keep IdefixRC's historical attribution in the upstream adoption ledger. PR68's translations applied to the removed importer.
- [x] Verify the final branch with a fresh review, production build, Node/browser and Python suites, and the isolated FilaMan preview.
- Fold the cleanup into the PR16 feature branch via a squash merge of the follow-up PR. Update PR16 and PR204 with the final scope and evidence.
