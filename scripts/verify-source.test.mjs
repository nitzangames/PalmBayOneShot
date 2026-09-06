import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const hash = text => createHash('sha256').update(text).digest('hex');
const cases = [
  { name: 'accepts exact source and build', expected: 0 },
  { name: 'rejects altered archived files', file: 'index.html', text: 'changed', expected: 1, message: /Checksum mismatch: index.html/ },
  { name: 'rejects altered source', file: 'source/main.js', text: 'changed', expected: 1, message: /Checksum mismatch: source\/main.js/ },
  { name: 'rejects altered build content', file: 'source/dist/assets/game.js', text: 'changed', expected: 1, message: /Rebuilt file does not match/ },
  { name: 'rejects extra build output', file: 'source/dist/extra.js', text: 'extra', expected: 1, message: /Extra: extra.js/ },
  { name: 'rejects missing build output', remove: 'source/dist/assets/game.js', expected: 1, message: /Missing: assets\/game.js/ },
  { name: 'rejects unsafe manifest paths', file: 'SOURCE_SHA256SUMS', text: `${hash('source')}  ../outside.js\n`, expected: 1, message: /Unsafe or duplicate path/ },
  { name: 'rejects duplicate manifest paths', file: 'SOURCE_SHA256SUMS', text: `${hash('source')}  source/main.js\n${hash('source')}  source/main.js\n`, expected: 1, message: /Unsafe or duplicate path/ },
];

for (const scenario of cases) {
  test(scenario.name, async () => {
    const fixture = await mkdtemp(path.join(tmpdir(), 'palm-source-verifier-'));
    try {
      for (const directory of ['assets', 'scripts', 'source/dist/assets']) {
        await mkdir(path.join(fixture, directory), { recursive: true });
      }
      const files = {
        'index.html': 'html', 'assets/game.js': 'game', 'source/main.js': 'source',
        'source/dist/index.html': 'html', 'source/dist/assets/game.js': 'game',
        'SHA256SUMS': `${hash('html')}  index.html\n${hash('game')}  assets/game.js\n`,
        'SOURCE_SHA256SUMS': `${hash('source')}  source/main.js\n`,
      };
      for (const [file, text] of Object.entries(files)) await writeFile(path.join(fixture, file), text);
      await copyFile(new URL('./verify-source.mjs', import.meta.url), path.join(fixture, 'scripts/verify-source.mjs'));
      if (scenario.file) await writeFile(path.join(fixture, scenario.file), scenario.text);
      if (scenario.remove) await rm(path.join(fixture, scenario.remove));
      const result = spawnSync(process.execPath, ['scripts/verify-source.mjs'], { cwd: fixture, encoding: 'utf8' });
      assert.equal(result.status, scenario.expected, result.stderr || result.stdout);
      if (scenario.message) assert.match(result.stderr, scenario.message);
      else assert.match(result.stdout, /All 2 rebuilt game files match the original byte-for-byte/);
    } finally {
      // Only this test's newly created, isolated fixture is removed.
      await rm(fixture, { recursive: true, force: true });
    }
  });
}
