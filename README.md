# Crossword Garden

A frontend-only crossword PWA for HSC Logic. React, TypeScript, Vite, native IndexedDB and Workbox. No account, server, API key, remote font or runtime service. All icons and illustrations are local; typography uses system fonts.

## Develop

Use Node.js 24 LTS or newer, npm, and a modern browser.

```sh
npm ci
npm run dev
```

```sh
npm run typecheck
npm run lint
npm run validate
npm test
npm run build
npm run preview
```

`npm run dev` does not register a service worker. Test installation/offline behavior with the production preview on localhost or an HTTPS deployment.

## Puzzle content

`public/puzzles.json` is the committed immutable content: exactly **150 puzzles**, **50 Easy**, **50 Medium**, **50 Hard**, across ten themes. Easy grids are 9×9 with six entries; Medium 11×11 with eight; Hard 13×13 with ten. Original curated banks live in `scripts/banks.mjs`. Easy uses direct definitions and shorter words; Medium and Hard use more inferential clues, larger grids and broader vocabulary. These are compact, sparse interlocking crosswords; rotational symmetry and fully checked letters are not required.

Each puzzle includes a stable ID, content version, title, theme, difficulty, width, height, solution cells (null means blocked) and numbered Across/Down entries with coordinates, answer and clue. All runtime generation is avoided.

```sh
npm run generate
npm run validate
```

Generation is deterministic with a fixed seed. It rejects placements with side adjacency, conflicting crossings or unconnected words. Validation independently checks counts, distribution, IDs, dimensions, answers, clues, exact solution agreement, numbering, runs, crossings, connectedness, orphan cells, duplicate entries, duplicate grids and duplicate answer sets. CI stops before deployment on any failure.

To edit a clue without changing a grid, edit the matching final entry in `public/puzzles.json` and its bank source. To redesign content, edit the banks, regenerate, inspect the diff and validate. **Do not casually regenerate already published grids:** player letters use grid coordinates. Preserve IDs and grid coordinates for compatible corrections. For changed grids, assign a new ID and decide explicitly how old progress should be handled. Import rejects mismatched content versions rather than guessing a migration.

## Gameplay and local data

Click a cell or clue. Type physical keys or use the A–Z keyboard. Space or a second click toggles direction at crossings. Arrow keys skip blocks; Enter selects the next clue. Typing stops at the final cell. Backspace clears the current cell; on an empty cell it moves back within the word. Delete clears in place. Crossing letters are shared. Pencil letters are italic. Incorrect checked letters have a dot and underline; revealed letters have a corner marker. Checks and reveals mark statistics as assisted.

The timer pauses manually, while the page is hidden, while instructions/confirmation dialogs are open, and after completion. Progress, selection, direction, pencil marks, check/reveal counts, elapsed time and favorites save to IndexedDB after changes. Writes are serialized. The database is separate from the service worker cache, so application updates retain progress.

Settings supports light/dark/system appearance, larger text and keyboard visibility. Backup exports include a format identifier and schema version. Imports validate size, types, puzzle IDs, content versions, coordinates, letters, counters and completion consistency before presenting replacement confirmation. Invalid imports change nothing. Clear-progress has its own confirmation and retains settings.

Storage is local to this origin/browser/profile. There is no cross-device synchronization. Browser data clearing, storage eviction or uninstall behavior can erase it. Export regularly. If storage is full or unavailable, a visible recovery banner offers backup export and retry; the current session remains usable in memory. Avoid playing simultaneously in multiple tabs: there is no cross-tab merge.

## GitHub Pages and base paths

**One setting: `BASE_PATH`, with a leading and trailing slash.** Default `/` is for root/custom-domain hosting.

```sh
BASE_PATH=/crossword-garden/ npm run build
BASE_PATH=/crossword-garden/ npm run preview
# Root or custom domain:
BASE_PATH=/ npm run build
```

Vite assets, JSON fetches, manifest scope/start URL/ID and service worker registration share that setting. In-app navigation uses hashes (`#/play/...`), so deep-link refreshes work on Pages without server rewrites. Serve the build from its configured path; do not move a root build into a subfolder.

The Pages workflow runs type checking, lint, independent puzzle validation, unit tests, production Chromium tests under `/garden/`, then builds the deploy artifact. It uses official checkout/setup-node/upload-pages-artifact/deploy-pages actions. Enable **Settings → Pages → Build and deployment → GitHub Actions**. Push to `main` or run the workflow manually. The default deployment path is `/<repository-name>/`. For a custom domain or a `username.github.io` repository, set repository Actions variable **`BASE_PATH` to `/`**. Configure the custom domain in Pages settings and DNS; if needed add its `CNAME` to `public/`. No live deployment is made by local build commands.

## Installation and offline behavior

A first online visit downloads the whole collection and application assets (about 556 KiB uncompressed). A service worker atomically precaches the shell, navigation fallback, JS/CSS, puzzle JSON, manifest and local icons. The worker verifies every precache item and its build identity before the UI reports **Ready offline**. Settings offers retry/verification. Preparation is an indeterminate status; byte-level download progress is not exposed by Workbox.

After readiness, use airplane mode, reopen the installed app, browse all 150 puzzles, play, check, reveal, reload and resume. Installation requires HTTPS (localhost works for testing). Chromium may show an install button. Safari: Share → Add to Home Screen. Other browsers: Install/Add to Home Screen from their menu. Install prompts depend on browser support and engagement rules.

Updates download in the background, wait, then display a user-controlled **Update & reload** action. No automatic takeover interrupts play. Service-worker caches and IndexedDB are separate. If a download is interrupted, the previous activated worker remains usable; reconnect and use retry. Offline readiness is verified at startup and on demand, not a permanent guarantee against later browser cache eviction.

## Browser verification

```sh
npx playwright install chromium
BASE_PATH=/garden/ npm run build
BASE_PATH=/garden/ npm run test:browser
```

Tests launch a production preview, verify the repository subpath, readiness, offline reload/restoration, all 150 playable boards offline, offline content fetch, touch-size phone layout (390×844), tablet (768×1024), desktop (1440×1000), dark mode/large text and user-approved service worker replacement without progress loss. Tests run sequentially because update testing temporarily rebuilds the entire production artifact with a new build identity, restoring the original directory in a `finally` block. Touch input, saved pencil/pause state, solving, completion, reset confirmation and an exported-backup import are also exercised.

Unit tests independently exercise puzzle validation (including corrupt fixtures), navigation, crossing preservation, typing/deletion, pencil/check/reveal/completion, real IndexedDB API behavior using fake-indexeddb and backup rejection. See `IMPLEMENTATION.md` for checks actually executed.

## Limits

Solutions must be bundled for offline checks; they can be inspected. No cheating prevention is claimed. Desktop Chromium automated tests cannot establish native installation or platform-specific iOS/Safari behavior; test installation on target devices before a public release. No telemetry, competitive scoring, paid services, or account system. Progress is not merged across tabs/devices. Compact puzzles intentionally contain unchecked letters and short answer counts.
