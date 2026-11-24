// Downloads the pinned TeaVM playground build into public/runner/teavm/ and records hashes.
// Usage: node scripts/fetch-teavm.mjs          (download + write VERSION.json)
//        node scripts/fetch-teavm.mjs --check  (verify files on disk match VERSION.json)
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE = 'https://teavm.org/playground/4/';
const FILES = ['compiler.wasm', 'compiler.wasm-runtime.js', 'compile-classlib-teavm.bin', 'runtime-classlib-teavm.bin'];
const DIR = join(process.cwd(), 'public', 'runner', 'teavm');
const sha = (buf) => createHash('sha256').update(buf).digest('hex');

if (process.argv.includes('--check')) {
  const version = JSON.parse(readFileSync(join(DIR, 'VERSION.json'), 'utf8'));
  let bad = 0;
  for (const f of FILES) {
    const got = sha(readFileSync(join(DIR, f)));
    if (got !== version.files[f].sha256) { console.error(`hash mismatch: ${f}`); bad++; }
  }
  if (bad) process.exit(1);
  console.log('TeaVM assets match VERSION.json');
} else {
  mkdirSync(DIR, { recursive: true });
  const files = {};
  for (const f of FILES) {
    const res = await fetch(SOURCE + f);
    if (!res.ok) throw new Error(`${f}: HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(join(DIR, f), buf);
    files[f] = { bytes: buf.length, sha256: sha(buf) };
    console.log(`${f}  ${buf.length} bytes`);
  }
  const version = { source: SOURCE, fetched: new Date().toISOString().slice(0, 10), license: 'TeaVM: Apache-2.0. Bundled javac: OpenJDK, GPLv2 with Classpath Exception. See THIRD_PARTY_NOTICES.md.', files };
  writeFileSync(join(DIR, 'VERSION.json'), JSON.stringify(version, null, 2) + '\n');
}
