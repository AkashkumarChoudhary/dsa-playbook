import { describe, expect, it } from 'vitest';
import { contentInput } from '../../../content';
import { buildRegistry } from '../../../src/core/registry';
import { createStore, type Store } from '../../../src/core/store';
import { openLesson } from '../../../src/engine/progress';
import { mountCardsPage } from '../../../src/pages/cards-page';

const NOW = new Date(2026, 10, 24, 10).getTime();
const registry = buildRegistry(contentInput);
const runner = { ready: async () => {}, run: async () => ({ kind: 'runnerUnavailable' as const, reason: '' }), stop() {} };
const memStore = (): Store => { const d: Record<string, string> = {}; return createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }); };
const startedStore = () => { const s = memStore(); s.update((d) => openLesson(d, registry.lessonIds[0]!, NOW)); return s; };
const key = (k: string) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

function mount(store: Store, deck?: string) {
  const host = document.createElement('div');
  document.body.append(host);
  const dispose = mountCardsPage(host, { registry, store, runner, now: () => NOW }, deck);
  return { host, dispose: () => { dispose(); host.remove(); } };
}

describe('deck picker', () => {
  it('asks to open a lesson first', () => {
    const { host, dispose } = mount(memStore());
    expect(host.querySelector('h1')!.textContent).toBe('Flashcards');
    expect(host.textContent).toContain('Open a lesson first.');
    dispose();
  });
  it('lists the decks with counts', () => {
    const { host, dispose } = mount(startedStore());
    const total = registry.cards.length;
    expect(host.querySelector('[data-testid="deck-due"]')!.textContent).toContain(`${total} cards`);
    expect(host.querySelector('[data-testid="deck-weak"]')!.textContent).toContain('0 cards');
    expect(host.querySelector('[data-testid="deck-interview"]')!.getAttribute('href')).toBe('#/cards/interview');
    expect(host.querySelector(`[data-testid="deck-module-${registry.modules[0]!.id}"]`)).not.toBeNull();
    dispose();
  });
});

describe('review', () => {
  it('flips with Space, rates with keys and buttons, and finishes', () => {
    const store = startedStore();
    const { host, dispose } = mount(store, 'due');
    const total = registry.cards.length;
    expect(host.querySelector('h1')!.textContent).toBe('Due today');
    expect(host.querySelector('[data-testid="cards-left"]')!.textContent).toBe(`${total} left today`);
    expect(host.querySelector('.card-back')).toBeNull();
    key('3');
    expect(Object.keys(store.get().cards)).toHaveLength(0);
    key(' ');
    expect(host.querySelector('.card-back')).not.toBeNull();
    expect(host.querySelector('.flashcard')!.classList.contains('flipped')).toBe(true);
    key('3');
    const first = registry.cards.find((c) => store.get().cards[c.id])!;
    expect(store.get().cards[first.id]).toMatchObject({ box: 2, dueDay: '2026-11-27' });
    expect(host.querySelector('[data-testid="cards-left"]')!.textContent).toBe(`${total - 1} left today`);
    for (let i = 1; i < total; i++) {
      (host.querySelector('[data-testid="card-flip"]') as HTMLButtonElement).click();
      (host.querySelector('[data-testid="rate-again"]') as HTMLButtonElement).click();
    }
    expect(host.querySelector('[data-testid="cards-done"]')).not.toBeNull();
    expect(Object.keys(store.get().cards)).toHaveLength(total);
    expect(Object.values(store.get().cards).filter((c) => c.again === 1)).toHaveLength(total - 1);
    dispose();
  });
  it('keeps focus inside the review after a rating and at the end', () => {
    const { host, dispose } = mount(startedStore(), 'due');
    const total = registry.cards.length;
    for (let i = 0; i < total; i++) {
      key(' ');
      key('1');
      expect(host.contains(document.activeElement)).toBe(true);
    }
    expect(document.activeElement).toBe(host.querySelector('[data-testid="cards-done"]'));
    dispose();
  });
  it('ignores keys with Ctrl or in a form control', () => {
    const store = startedStore();
    const { host, dispose } = mount(store, 'due');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', ctrlKey: true, bubbles: true }));
    expect(host.querySelector('.card-back')).toBeNull();
    const input = document.createElement('input');
    document.body.append(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(host.querySelector('.card-back')).toBeNull();
    input.remove();
    dispose();
  });
  it('says when a deck does not exist', () => {
    const { host, dispose } = mount(startedStore(), 'nope');
    expect(host.querySelector('h1')!.textContent).toBe('Deck not found');
    dispose();
  });
  it('stops listening to keys after it closes', () => {
    const store = startedStore();
    const { dispose } = mount(store, 'due');
    dispose();
    key(' ');
    key('3');
    expect(store.get().cards).toEqual({});
  });
});
