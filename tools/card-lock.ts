import { readFileSync } from 'node:fs';
import type { Card } from '../src/engine/cards';
import { stripHtml } from './text';

/** Recorded card ids. A card id holds the learner's progress, so ids must never shift. */
export const CARD_LOCK_PATH = 'content/card-ids.json';

/** The start of a card's front in plain words. It shows when an id starts to hold a different item. */
export function cardFingerprint(card: Card): string {
  return stripHtml(card.front).replace(/\s+/g, ' ').trim().slice(0, 80);
}

/** id → fingerprint, sorted by id, ready to save as JSON. */
export function cardFingerprints(cards: Card[]): Record<string, string> {
  return Object.fromEntries([...cards].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).map((c) => [c.id, cardFingerprint(c)]));
}

export type CardLock = Record<string, string>;

/** Reads the saved lock. A missing or broken file fails with one plain message. */
export function readCardLock(path: string = CARD_LOCK_PATH): CardLock {
  try {
    const data: unknown = JSON.parse(readFileSync(path, 'utf8'));
    if (typeof data !== 'object' || data === null || Array.isArray(data)) throw new Error('not an object');
    return data as CardLock;
  } catch {
    throw new Error(`${CARD_LOCK_PATH} is missing or broken. Run npm run cards:lock to create it.`);
  }
}
