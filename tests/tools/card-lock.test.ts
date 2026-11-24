import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { contentInput } from '../../content';
import { buildRegistry } from '../../src/core/registry';
import { CARD_LOCK_PATH, cardFingerprints, readCardLock } from '../../tools/card-lock';

// Runs only through `npm run cards:lock`, which sets CARDS_LOCK=write.
it.runIf(process.env.CARDS_LOCK === 'write')('records every card id in content/card-ids.json', () => {
  writeFileSync(CARD_LOCK_PATH, `${JSON.stringify(cardFingerprints(buildRegistry(contentInput).cards), null, 2)}\n`);
});

const MESSAGE = 'content/card-ids.json is missing or broken. Run npm run cards:lock to create it.';

function messageOf(path: string): string {
  try {
    readCardLock(path);
  } catch (err) {
    return (err as Error).message;
  }
  return 'did not throw';
}

function lockFile(text: string): string {
  const path = join(mkdtempSync(join(tmpdir(), 'lock-')), 'card-ids.json');
  writeFileSync(path, text);
  return path;
}

it('readCardLock fails with a plain message when the file is missing', () => {
  expect(messageOf(join(tmpdir(), 'no-such-dir', 'card-ids.json'))).toBe(MESSAGE);
});

it('readCardLock fails with a plain message when the JSON is broken', () => {
  expect(messageOf(lockFile('{ nope'))).toBe(MESSAGE);
});

it('readCardLock fails with a plain message when the JSON is not an object', () => {
  expect(messageOf(lockFile('[]'))).toBe(MESSAGE);
  expect(messageOf(lockFile('null'))).toBe(MESSAGE);
});

it('readCardLock reads a valid lock', () => {
  expect(readCardLock(lockFile('{"a:b":"x"}'))).toEqual({ 'a:b': 'x' });
});
