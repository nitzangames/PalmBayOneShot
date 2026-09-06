# Original Palm Bay source recovery

## What was recovered

The original Astra 6 one-shot finished on **September 4, 2026 at 22:41:47 PDT** (`2026-09-05T05:41:47.211Z`). The public game preserved that result, but the working directory subsequently accumulated ramp fixes, pedestrians, weapons, camera changes, and multiplayer without an original-source Git checkpoint. The initial public repository therefore contained only the preserved build.

On September 6, 2026, the original source was recovered from the local build-session record. Twenty literal file patches from nineteen tool calls were replayed chronologically into an empty temporary directory. The cutoff was the original one-shot completion, including its resumed final polish pass. No later website or game-development edits were replayed. Historical tool commands were not executed; only the literal, allowlisted file patches were applied.

The original dependency lockfile survived unchanged in the retired local snapshot. Its package name and declared dependency versions match the recovered original package manifest. It was copied without changes, and `npm ci` installed the locked dependencies. No later game source, multiplayer history, credentials, or raw session logs are included.

The recovered twenty-file project is preserved under `source/`, including the original README, visual review notes, tests, and review scripts. `SOURCE_SHA256SUMS` records those exact files. This is source recovery, not a rewrite, decompilation, new polish pass, or claim that a historical Git repository existed.

## Verification

The restored source was built using Node.js 26.3.0 and npm 11.16.0, with the preserved lockfile (Vite 7.3.6, Rollup 4.63.1, esbuild 0.28.2, and Three.js 0.180.0).

- All **18 build outputs** match the preserved original game byte-for-byte: entry HTML, game JavaScript, Three.js JavaScript, stylesheet, and fourteen font files. Filenames and the complete output file set also match.
- All **9 original simulation tests** pass.
- The original **16-check browser playtest** and **10-screenshot capture suite** are included and run against the rebuilt game, covering keyboard driving, the wreck/exit/steal-again loop, jumping, and mobile controls.

To reproduce the build check:

```sh
cd source
npm ci
npm test
npm run build
cd ..
node scripts/verify-source.mjs
```

`SHA256SUMS` and the original root game files remain unchanged. The verifier validates both checksum manifests before comparing the rebuilt output against the archived file list. It does not write files or deploy anything.

## Preservation boundaries

- Root `index.html` and `assets/` remain the already-published playable archive.
- `source/` remains the exact original editable project, including its original limitations. New verification documentation and tooling live outside it.
- The existing `original-one-shot` Git tag still identifies the initial build-only archive. Source publication is recorded in a new commit and a separate `original-one-shot-source` tag, without rewriting history.
- The private multiplayer project is separate and is not part of this repository.
- Source publication does not change the game hosted at nitzan.games or the comparison page.
