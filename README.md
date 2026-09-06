# Palm Bay: the original one-shot

The preserved **Astra 6 one-shot** browser driving sandbox. Walk around a sunny low-poly city, steal a car, drive through traffic, crash, get out, and take another.

[Play the original game](https://nitzan.games/experiments/one-shot-gta/astra/index.html) · [Read the exact prompt](prompt.txt) · [The one-shot comparison page](https://nitzan.games/OneShotGTA.html)

## What is in this repository

This is a **build-only archive**, not the original editable source project. It contains the already-published one-shot's HTML, compiled JavaScript, styles, bundled fonts, exact prompt, and third-party notices. No build step or package installation is needed.

The game files were copied byte-for-byte from the preserved original one-shot archive. They have not been rebuilt or updated. Later multiplayer, pedestrians, weapons, camera changes, and other post-one-shot fixes are deliberately excluded.

The original prompt is in [prompt.txt](prompt.txt). It asked for an autonomous, complete browser driving sandbox with no missions, weapons, police, pedestrians, story, or music, including its own automated review and screenshot workflow.

## Run locally

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
```

On systems with GNU coreutils, `sha256sum -c SHA256SUMS` is equivalent. The manifest intentionally excludes this README and other repository metadata.

This repository preserves the original result, including its limitations. Publishing the repository does not modify the existing game or comparison page on nitzan.games.

## Third-party notices

The game bundles Three.js, DM Sans, and Barlow Condensed. Their original license and attribution files are included in [licenses/](licenses/); see [THIRD_PARTY.md](THIRD_PARTY.md) for the file mapping. These notices apply to the respective third-party components, not as a new blanket license for the entire game.
