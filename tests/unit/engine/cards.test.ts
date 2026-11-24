import { describe, expect, it } from 'vitest';
import { contentInput } from '../../../content';
import type { Lesson, Pattern, Problem } from '../../../src/content-types';
import { buildRegistry } from '../../../src/core/registry';
import type { CardProgress } from '../../../src/core/store';
import { deckCards, deckTitle, generateCards, lessonCards, problemCards, type Card } from '../../../src/engine/cards';

const lesson = {
  id: 'l', moduleId: 'm1', title: 'Lesson L', summary: 'Why it works.',
  template: { title: 'Seen set', java: 'Set<Integer> seen = new HashSet<>();' },
  complexityFacts: [{ q: 'Add?', a: 'O(1)', why: 'One bucket.' }, { q: 'Pairs?', a: 'O(n²)', why: 'Two loops.' }],
  traps: [{ looksLike: 'Looks like <b>this</b>.', butIs: 'But it is that.', why: 'Because.' }],
  realLife: [{ text: 'A sign-up form.', tier: 'educational' }],
} as unknown as Lesson;

const problem = {
  id: 'p', moduleId: 'm2', title: 'Problem P', patternIds: ['hashing'],
  statement: '<p>Find a <code>repeat</code>.</p>', limits: ['1 ≤ n ≤ 10'],
  spot: { prompt: 'Which?', options: ['Pairs', 'Seen set'], answer: 1, clues: [{ kind: 'size', text: 'Big n.' }, { kind: 'bottleneck', text: 'Repeated search.' }] },
  approaches: [{ level: 'optimal', time: 'O(n)', space: 'O(n)' }],
  hook: 'Seen it? Set.', explain30: 'Walk once with a set.', edgeCases: ['One item.', 'All same.'],
} as unknown as Problem;

const pattern: Pattern = { id: 'hashing', moduleId: 'm2', lessonId: 'l', title: 'HashSet: seen it before?' };

describe('card generation (spec §9.5)', () => {
  it('makes the four problem cards with stable ids', () => {
    const cards = problemCards(problem);
    expect(cards.map((c) => c.id)).toEqual(['p:spot', 'p:hook', 'p:explain', 'p:edges']);
    expect(cards.every((c) => c.moduleId === 'm2' && c.patternIds[0] === 'hashing' && c.title === 'Problem P')).toBe(true);
    const [spot, hook, explain, edges] = cards as [Card, Card, Card, Card];
    expect(spot.front).toContain('<code>repeat</code>');
    expect(spot.front).toContain('1 ≤ n ≤ 10');
    expect(spot.back).toContain('Seen set');
    expect(spot.back).toContain('Repeated search.');
    expect(hook.back).toContain('Seen it? Set.');
    expect(hook.back).toContain('O(n) time, O(n) space');
    expect(explain.back).toContain('Walk once with a set.');
    expect(edges.back).toContain('<li>All same.</li>');
  });

  it('makes lesson cards, one per list item, numbered from 0', () => {
    const cards = lessonCards(lesson, pattern);
    expect(cards.map((c) => c.id)).toEqual(['l:template', 'l:bigo-0', 'l:bigo-1', 'l:trap-0', 'l:reallife-0']);
    expect(cards[0]!.backCode).toBe('Set<Integer> seen = new HashSet<>();');
    expect(cards[3]!.front).toContain('Looks like &lt;b&gt;this&lt;/b&gt;.');
    expect(cards[4]!.back).toContain('HashSet: seen it before?');
    expect(cards.every((c) => c.patternIds.join() === 'hashing')).toBe(true);
    expect(lessonCards(lesson).every((c) => c.patternIds.length === 0)).toBe(true);
  });

  it('puts lesson cards first', () => {
    expect(generateCards([lesson], [problem], () => pattern).map((c) => c.id)[0]).toBe('l:template');
  });

  it('keeps the ids of the real content', () => {
    const ids = buildRegistry(contentInput).cards.map((c) => c.id);
    expect(ids).toContain('contains-duplicate:spot');
    expect(ids).toContain('brute-better-optimal:trap-1');
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('decks', () => {
  const cards = [...lessonCards(lesson, pattern), ...problemCards(problem)];
  const today = '2026-11-24';
  const p = (dueDay: string, again = 0): CardProgress => ({ box: 2, dueDay, again, lastDay: '2026-11-20', updatedAt: 1 });

  it('shows only cards from started modules', () => {
    expect(deckCards('due', cards, {}, new Set(['m2']), today)!.map((c) => c.id)).toEqual(['p:spot', 'p:hook', 'p:explain', 'p:edges']);
    expect(deckCards('due', cards, {}, new Set(), today)).toEqual([]);
  });

  it('Due today: seen cards that are due, oldest first, then new cards', () => {
    const progress = { 'p:spot': p('2026-11-30'), 'p:hook': p('2026-11-24'), 'p:explain': p('2026-11-20') };
    expect(deckCards('due', cards, progress, new Set(['m2']), today)!.map((c) => c.id)).toEqual(['p:explain', 'p:hook', 'p:edges']);
  });

  it('Weak spots: the most "Again" first', () => {
    const progress = { 'p:spot': p('2026-11-30', 1), 'p:hook': p('2026-11-30', 4), 'l:bigo-0': p('2026-11-30', 2) };
    expect(deckCards('weak', cards, progress, new Set(['m1', 'm2']), today)!.map((c) => c.id)).toEqual(['p:hook', 'l:bigo-0', 'p:spot']);
  });

  it('Interview tomorrow: memory hooks and traps only, hook first', () => {
    expect(deckCards('interview', cards, {}, new Set(['m1', 'm2']), today)!.map((c) => c.id)).toEqual(['p:hook', 'l:trap-0']);
  });

  const many: Card[] = [
    ...Array.from({ length: 20 }, (_, i): Card => ({ id: `t${i}:trap-0`, kind: 'trap', sourceId: `t${i}`, moduleId: 'm1', patternIds: [], title: 'T', front: '', back: '' })),
    ...Array.from({ length: 20 }, (_, i): Card => ({ id: `h${i}:hook`, kind: 'hook', sourceId: `h${i}`, moduleId: 'm1', patternIds: [], title: 'H', front: '', back: '' })),
  ];

  it('Interview tomorrow: mixes both kinds and stops at 30', () => {
    const deck = deckCards('interview', many, {}, new Set(['m1']), today)!;
    expect(deck).toHaveLength(30);
    expect(deck.slice(0, 4).map((c) => c.kind)).toEqual(['hook', 'trap', 'hook', 'trap']);
    expect(new Set(deck.map((c) => c.kind))).toEqual(new Set(['hook', 'trap']));
  });

  it('Interview tomorrow: a due card comes before new cards', () => {
    const deck = deckCards('interview', many, { 'h7:hook': p('2026-11-20') }, new Set(['m1']), today)!;
    expect(deck[0]!.id).toBe('h7:hook');
    expect(deck[1]!.kind).toBe('hook');
  });

  it('Interview tomorrow: a due trap comes before new hooks', () => {
    const deck = deckCards('interview', many, { 't3:trap-0': p('2026-11-20') }, new Set(['m1']), today)!;
    expect(deck[0]!.id).toBe('t3:trap-0');
    expect(deck[1]!.kind).toBe('hook');
  });

  it('By module, and unknown decks', () => {
    expect(deckCards('module-m1', cards, {}, new Set(['m1']), today)!.map((c) => c.kind)).toEqual(['template', 'bigo', 'bigo', 'trap', 'reallife']);
    expect(deckCards('module-m1', cards, {}, new Set(['m2']), today)).toEqual([]);
    expect(deckCards('nope', cards, {}, new Set(['m1']), today)).toBeNull();
  });

  it('titles', () => {
    const title = (id: string) => (id === 'm1' ? 'Module One' : undefined);
    expect(deckTitle('due', title)).toBe('Due today');
    expect(deckTitle('weak', title)).toBe('Weak spots');
    expect(deckTitle('interview', title)).toBe('Interview tomorrow');
    expect(deckTitle('module-m1', title)).toBe('Module: Module One');
    expect(deckTitle('module-zz', title)).toBeNull();
    expect(deckTitle('nope', title)).toBeNull();
  });
});
