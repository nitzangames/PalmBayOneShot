# Preserved original one-shot source and build

- This repository contains the original Astra 6 one-shot playable build at the root and its recovered original editable project in `source/`, plus the prompt, integrity metadata, documentation, and third-party notices.
- `source/` was recovered from the original build-session edits, stopping at the one-shot's completion on 2026-09-04 at 22:41:47 PDT. Its build was verified byte-for-byte against the preserved game. See `SOURCE_RECOVERY.md`; do not substitute later development code or describe the recovery as a new one-shot run.
- Keep `index.html`, `assets/`, `prompt.txt`, and `licenses/` byte-for-byte consistent with `SHA256SUMS`. Do not fix, rebuild, beautify, or otherwise change the archived game as an inferred task.
- Keep the recovered original files in `source/` byte-for-byte consistent with `SOURCE_SHA256SUMS`. Installs, tests, builds into ignored `source/dist/`, and review captures into ignored `source/artifacts/` are allowed for verification. Do not change game behavior, dependencies, or source formatting as an inferred part of publication or verification.
- Run `npm ci`, `npm test`, and `npm run build` from `source/`, then `node scripts/verify-source.mjs` from the repository root. Preserve the original build-only `original-one-shot` tag; the source publication is a later recovery checkpoint, not rewritten historical development commits.
- Never copy later multiplayer, pedestrians, weapons, camera changes, development code, or private project history into this public repository. Do not change the visibility of any multiplayer repository.
- The public repository is `https://github.com/nitzangames/PalmBayOneShot`. Push additional changes only when explicitly requested.
- Do not modify or deploy the hosted one-shot game or the nitzan.games comparison page as an inferred part of repository work.
- Local verification may serve this directory and write ignored screenshots into `artifacts/`. Do not commit local secrets, credentials, dependencies, logs, or temporary review output.
- Never publish raw session logs, transcript extracts, or the local recovery extractor. Only the recovered game files and public verification metadata belong in this repository.
