import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

async function verifyManifest(filename) {
  const entries = new Map();
  const lines = (await readFile(path.join(root, filename), 'utf8')).trim().split('\n');
  for (const line of lines) {
    const match = /^([a-f0-9]{64})  (.+)$/.exec(line);
    if (!match) throw new Error(`Invalid checksum record in ${filename}`);
    const [, expected, relative] = match;
    const absolute = path.resolve(root, relative);
    if (!absolute.startsWith(root + path.sep) || entries.has(relative)) {
      throw new Error(`Unsafe or duplicate path in ${filename}: ${relative}`);
    }
    if (sha256(await readFile(absolute)) !== expected) throw new Error(`Checksum mismatch: ${relative}`);
    entries.set(relative, expected);
  }
  return entries;
}

async function filesIn(directory, relative = '') {
  const files = [];
  for (const entry of await readdir(path.join(directory, relative), { withFileTypes: true })) {
    const name = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await filesIn(directory, name));
    else if (entry.isFile()) files.push(name);
    else throw new Error(`Unexpected non-file in build output: ${name}`);
  }
  return files.sort();
}

try {
  const archived = await verifyManifest('SHA256SUMS');
  const source = await verifyManifest('SOURCE_SHA256SUMS');
  const expectedFiles = [...archived.keys()].filter(name => name === 'index.html' || name.startsWith('assets/')).sort();
  const dist = path.join(root, 'source', 'dist');
  const actualFiles = await filesIn(dist);
  const missing = expectedFiles.filter(name => !actualFiles.includes(name));
  const extra = actualFiles.filter(name => !expectedFiles.includes(name));
  if (missing.length || extra.length) {
    throw new Error(`Build file list differs. Missing: ${missing.join(', ') || 'none'}. Extra: ${extra.join(', ') || 'none'}.`);
  }
  for (const file of expectedFiles) {
    if (sha256(await readFile(path.join(dist, file))) !== archived.get(file)) {
      throw new Error(`Rebuilt file does not match the original: ${file}`);
    }
  }
  console.log(`Verified ${archived.size} archive files and ${source.size} recovered source files.`);
  console.log(`All ${expectedFiles.length} rebuilt game files match the original byte-for-byte.`);
} catch (error) {
  console.error(`Source verification failed: ${error.message}`);
  console.error('From source/, run npm ci && npm run build, then retry from the repository root.');
  process.exitCode = 1;
}
