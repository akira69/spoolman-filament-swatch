# FilaMan discovery edition

Tracker: https://github.com/akira69/filaman-filament-swatch/issues/14

The existing fork was renamed from `akira69/spoolman-filament-swatch` to
`akira69/filaman-filament-swatch`. Repository ID 1190097923 and the fork parent
`Disane87/spoolman-filament-swatch` are unchanged. MIT attribution is retained.

The native edition starts from fork main `3218f64b9ccfe55c5d37d8b4a6c47b73f072d386`.
A separate baseline commit imports upstream `935d3496df98faaec18e38aa4eba18c43d246c2f`
and removes inherited automatic deployment; the reviewed integration is then
replayed on that ancestry. Main is unchanged pending review of the native PR.

Reviewed source anchors remain reachable: hosted `b864db5c03d7d0a7d02476b49467ba1bc47970db`,
wrapper `8edb981808943d258643268274f5fdef889fe798`, design/plan
`647f67be9df767d615b4fe4aad953b911b290ba0`, core shell
`ae8b8fa2fcacddcc9a7930ad2e10451840db9dbe` (core PR24).

Fork PR6, PR8, PR9 and PR13 will be superseded only after the native PR preserves
their required work. Upstream PR53 has an independent requirements audit; the
fork does not depend on its acceptance. No product release has been published.

Discovery retains Swatch's existing wheel and local project/palette helpers.
Native FilaMan owns editing and color selection. Extended color-search ideas
remain a separate phase-two discussion.
