# Palm Bay: the original one-shot

The preserved **Astra 6 one-shot** browser driving sandbox. Walk around a sunny low-poly city, steal a car, drive through traffic, crash, get out, and take another.

[Play the original game](https://nitzan.games/experiments/one-shot-gta/astra/index.html) · [Read the exact prompt](prompt.txt) · [The one-shot comparison page](https://nitzan.games/OneShotGTA.html)

## What is in this repository

This repository contains **both the complete original editable source and the preserved playable build**:

- [`source/`](source/): the original JavaScript, styles, entry HTML, package manifest and lockfile, Vite configuration, simulation tests, browser playtest, screenshot tool, README, and visual review notes.
- Root `index.html` and `assets/`: the unchanged, already-published playable game. This copy needs only a static HTTP server, with no build step or package installation.
- [`prompt.txt`](prompt.txt), licenses, and checksum manifests: the exact original prompt, third-party notices, and integrity records.

The source was recovered from the original build-session edits on September 6, 2026. A clean build reproduces **all 18 published game files byte-for-byte**, including their hashed filenames. See [source recovery and verification](SOURCE_RECOVERY.md) for provenance and boundaries. No later multiplayer code was used as replacement source.

The game files were copied byte-for-byte from the preserved original one-shot archive. They have not been rebuilt or updated. Later multiplayer, pedestrians, weapons, camera changes, and other post-one-shot fixes are deliberately excluded.

The original prompt is in [prompt.txt](prompt.txt). It asked for an autonomous, complete browser driving sandbox with no missions, weapons, police, pedestrians, story, or music, including its own automated review and screenshot workflow.

## Run from source

Use Node.js 22.12 or newer, or Node.js 20.19 or newer within the Node 20 release line.

```sh
git clone https://github.com/nitzangames/PalmBayOneShot.git
cd PalmBayOneShot/source
npm ci
npm run dev -- --host 127.0.0.1
```

Open http://127.0.0.1:5173. To build and verify the original result:

```sh
# From source/
npm test
npm run build
cd ..
node scripts/verify-source.mjs
```

The verifier checks the archived files, the recovered source files, and an exact file-by-file comparison of `source/dist/` with the preserved game. It fails on changed, missing, or extra build files. Build output stays in `source/dist/`; it never overwrites the root archive or deploys anything.

The new verifier has its own regression tests: `node --test scripts/verify-source.test.mjs` from the repository root. These are separate from the original game's tests.

The original [source README](source/README.md) documents all controls and review tools. With the dev server running, use another terminal in `source/`:

```sh
npx playwright install chromium
npm run test:browser
npm run capture
```

Use `GAME_URL` for a different dev/preview URL and `BROWSER_EXECUTABLE` for an already-installed standalone Chromium. Generated screenshots and reports are ignored by Git. The original [visual review notes](source/artifacts/REVIEW.md) are preserved separately from newly generated captures.

## Run the preserved build without installing dependencies

Clone this repository, then serve it over HTTP:

```sh
git clone https://github.com/nitzangames/PalmBayOneShot.git
cd PalmBayOneShot
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000 in a browser with WebGL 2 enabled. Use a web server rather than opening `index.html` as a file, because the game uses JavaScript modules. Any ordinary static HTTP server can serve the same files.

- WASD / arrows: walk or drive
- E: enter or leave the nearest car
- Shift: run on foot
- Space: handbrake
- C: change camera
- Mouse drag: look around
- Escape: pause and controls
- M: toggle sound effects

The original game also includes touch driving controls and a `window.game` inspection/time-stepping interface for browser review.

## Archive integrity

[SHA256SUMS](SHA256SUMS) records all original game files, the prompt, and their third-party notices. Check them from the repository root:

```sh
shasum -a 256 -c SHA256SUMS
shasum -a 256 -c SOURCE_SHA256SUMS
```

On systems with GNU coreutils, `sha256sum -c` is equivalent. [SOURCE_SHA256SUMS](SOURCE_SHA256SUMS) records the recovered original project, including its lockfile. Both manifests intentionally exclude this root README and new recovery/verification tooling.

This repository preserves the original result, including its limitations. Publishing the repository does not modify the existing game or comparison page on nitzan.games.

## Third-party notices

The game bundles Three.js, DM Sans, and Barlow Condensed. Their original license and attribution files are included in [licenses/](licenses/); see [THIRD_PARTY.md](THIRD_PARTY.md) for the file mapping. These notices apply to the respective third-party components, not as a new blanket license for the entire game.
