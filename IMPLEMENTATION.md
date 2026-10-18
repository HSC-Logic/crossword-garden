# Implementation and verification

## Delivered

- React 19 + TypeScript 6 + Vite 8 frontend, pinned dependencies and npm lockfile.
- Warm cream/forest-green interface with local botanical SVG illustration, actual puzzle-grid previews, responsive home/library/player/statistics/settings, system/light/dark appearance and enlarged text.
- Exactly 150 committed original puzzles: 50 Easy (9×9, six entries), 50 Medium (11×11, eight entries), 50 Hard (13×13, ten entries). Total 1,200 clued entries; ten curated themes. Larger difficulties start with longer vocabulary and inferential clues. Unique answer sets and grids, connected answers, valid runs and conventional numbering independently verified.
- Physical/touch keyboards, immediate focus after clue selection, arrows, direction switching, shared crossing letters, boundary-aware typing/deletion, saved pencil/pause state, checks/reveals, completion dialog, manual/visibility pause, reset confirmation, board zoom/pan.
- Search/difficulty/theme/status filters, favorites, random uncompleted puzzle, Continue Playing, filled-cell/time/hint state, completion and best-time statistics with assistance labels.
- Serialized native IndexedDB persistence, commit status, unload protection during pending saves, backup export, strict versioned import/replacement review and separate clear-progress confirmation.
- Workbox injectManifest PWA: local precache, active-worker manifest verification tied to the build version, failed-download retry/cache repair, local icons including maskable PNG, explicit update activation and save-before-update.
- Hash routes and one BASE_PATH setting throughout Vite/assets/data/manifest/service-worker scope. Official Pages deployment workflow with blocking checks.

## Checks actually executed

- `npm run generate`: 150 puzzles and 1,200 entries generated deterministically.
- `npm run validate`: passed all 150, exactly 50 per difficulty; structural invariants, crossings, complete declared runs, connectedness, numbering, uniqueness and metadata.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: seven tests passed; includes invalid puzzle fixtures, keyboard/deletion/crossings, pencil/hints/completion, IndexedDB roundtrip/write ordering, and invalid/malicious backup rejection.
- `BASE_PATH=/garden/ npm run build`: passed. 15 precached entries, about 556 KiB uncompressed.
- `BASE_PATH=/garden/ npm run test:browser`: four production Chromium tests cover all 150 boards while offline; offline reload and reopening a new page; exact letter/selection/pencil/pause restore; touch keyboard; phone 390×844, tablet 768×1024, desktop 1440×1000 without page overflow; dark/enlarged settings; full rebuild service-worker update with unchanged progress; physical-keyboard solve/completion; backup export/import and confirmations; reset cancel/confirm; incomplete-cache detection and repair.
- Visual screenshots inspected for desktop home and phone gameplay. Mobile keyboard changed to ordinary flow to keep hint/reset controls unobscured.
- `npm run build` (root path): passed; production-browser smoke test confirmed readiness, offline reload and all 150 library cards at `/`.
- `git diff --check`: passed.
- npm installation audit: zero vulnerabilities at installation time.

## Corrections made during verification

A rapid reload test exposed pending IndexedDB commits: added a saved-state indicator and unload protection; update activation now awaits a committed snapshot. A physical-keyboard solve exposed an animation-frame focus gap after clue selection: board focus now returns synchronously. A cache-removal test exercises truthful readiness and repair rather than treating service-worker installation alone as success.

## Remaining limitations

Native PWA installation/airplane-mode process reopening on physical iOS/Android devices and Safari/Firefox have not been manually verified. Chromium tests use offline browser networking and a new page, not a native app process restart. GitHub Actions is configured but has not run remotely; no live site was deployed. System fonts deliberately require no downloadable font assets. Progress stays on one browser/device; multiple-tab simultaneous edits are not merged. Browser eviction/data clearing can remove content and progress; backups remain necessary. Solutions are inspectable, as required for offline hints. Clues use original curated banks across distinct generated answer sets; compact grids intentionally have unchecked letters and do not enforce symmetry. Download status is indeterminate rather than byte-level. A harmless upstream Workbox/Vite `inlineDynamicImports` deprecation warning appears during production builds.
