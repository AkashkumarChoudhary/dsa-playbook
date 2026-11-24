import type { Lesson, Pattern, Problem } from '../content-types';
import { html, raw } from '../core/html';
import type { CardProgress } from '../core/store';
import { isDue } from './leitner';

/** The 8 card kinds of spec §9.5. */
export type CardKind = 'spot' | 'hook' | 'template' | 'bigo' | 'trap' | 'explain' | 'edges' | 'reallife';

export const KIND_LABEL: Record<CardKind, string> = {
  spot: 'Spot it', hook: 'Memory hook', template: 'Template', bigo: 'Big-O', trap: 'Trap', explain: 'Explain it', edges: 'Edge cases', reallife: 'Real life',
};

/** A flashcard made from content. Front and back are trusted HTML. */
export interface Card {
  /** `<sourceId>:<kind>`, or `<sourceId>:<kind>-<index>` for list fields. Never shifts. */
  id: string;
  kind: CardKind;
  sourceId: string;
  moduleId: string;
  patternIds: string[];
  /** the lesson or problem title */
  title: string;
  front: string;
  back: string;
  /** Java to show under the back as a code block */
  backCode?: string;
}

export const WEAK_DECK_SIZE = 20;
/** About 10 minutes at about 20 seconds a card. */
export const INTERVIEW_DECK_SIZE = 30;

export function problemCards(p: Problem): Card[] {
  const base = { sourceId: p.id, moduleId: p.moduleId, patternIds: [...p.patternIds], title: p.title };
  const optimal = p.approaches.find((a) => a.level === 'optimal');
  const keyClue = p.spot.clues.find((c) => c.kind === 'bottleneck') ?? p.spot.clues[0];
  return [
    {
      ...base, id: `${p.id}:spot`, kind: 'spot',
      front: html`<div class="card-statement">${raw(p.statement)}</div><ul class="card-limits">${p.limits.map((l) => html`<li><code>${l}</code></li>`)}</ul><p><b>Which idea fits?</b></p>`.__html,
      back: html`<p><b>${p.spot.options[p.spot.answer] ?? ''}</b></p>${keyClue ? html`<p>Key clue: ${keyClue.text}</p>` : null}`.__html,
    },
    {
      ...base, id: `${p.id}:hook`, kind: 'hook',
      front: html`<p><b>${p.title}</b>: what is the memory hook?</p>`.__html,
      back: html`<p><b>${p.hook}</b></p>${optimal ? html`<p>Optimal: ${optimal.time} time, ${optimal.space} space.</p>` : null}`.__html,
    },
    {
      ...base, id: `${p.id}:explain`, kind: 'explain',
      front: html`<p><b>${p.title}</b>: explain the answer in 30 seconds.</p>`.__html,
      back: html`<p>${p.explain30}</p>`.__html,
    },
    {
      ...base, id: `${p.id}:edges`, kind: 'edges',
      front: html`<p><b>${p.title}</b>: name the edge cases.</p>`.__html,
      back: html`<ul>${p.edgeCases.map((e) => html`<li>${e}</li>`)}</ul>`.__html,
    },
  ];
}

export function lessonCards(l: Lesson, pattern?: Pattern): Card[] {
  const base = { sourceId: l.id, moduleId: l.moduleId, patternIds: pattern ? [pattern.id] : [], title: l.title };
  return [
    {
      ...base, id: `${l.id}:template`, kind: 'template',
      front: html`<p>Write the template: <b>${l.template.title}</b></p>`.__html,
      back: html`<p>${l.template.title}</p>`.__html,
      backCode: l.template.java,
    },
    ...l.complexityFacts.map((f, i): Card => ({
      ...base, id: `${l.id}:bigo-${i}`, kind: 'bigo',
      front: html`<p>${f.q}</p>`.__html,
      back: html`<p><b>${f.a}</b></p><p>${f.why}</p>`.__html,
    })),
    ...l.traps.map((t, i): Card => ({
      ...base, id: `${l.id}:trap-${i}`, kind: 'trap',
      front: html`<p>${t.looksLike}</p><p><b>Which idea fits?</b></p>`.__html,
      back: html`<p><b>${t.butIs}</b></p><p>${t.why}</p>`.__html,
    })),
    ...l.realLife.map((r, i): Card => ({
      ...base, id: `${l.id}:reallife-${i}`, kind: 'reallife',
      front: html`<p>${r.text}</p><p><b>Which idea is this?</b></p>`.__html,
      back: html`<p><b>${pattern?.title ?? l.title}</b></p><p>${l.summary}</p>`.__html,
    })),
  ];
}

/** Every card, lessons first, in content order. */
export function generateCards(lessons: Lesson[], problems: Problem[], patternOfLesson: (lessonId: string) => Pattern | undefined): Card[] {
  return [...lessons.flatMap((l) => lessonCards(l, patternOfLesson(l.id))), ...problems.flatMap(problemCards)];
}

/**
 * The cards of one deck. Only cards from started modules appear (spec §9.5).
 * Returns null for a deck name it does not know.
 */
export function deckCards(deck: string, cards: Card[], progress: Readonly<Record<string, CardProgress>>, started: ReadonlySet<string>, today: string): Card[] | null {
  const open = cards.filter((c) => started.has(c.moduleId));
  if (deck === 'due') {
    const due = open.filter((c) => isDue(progress[c.id], today));
    const dueDay = (c: Card) => progress[c.id]?.dueDay ?? '';
    const seen = due.filter((c) => progress[c.id]).sort((a, b) => (dueDay(a) < dueDay(b) ? -1 : dueDay(a) > dueDay(b) ? 1 : 0));
    return [...seen, ...due.filter((c) => !progress[c.id])];
  }
  if (deck === 'weak') {
    const again = (c: Card) => progress[c.id]?.again ?? 0;
    return open.filter((c) => again(c) > 0).sort((a, b) => again(b) - again(a)).slice(0, WEAK_DECK_SIZE);
  }
  if (deck === 'interview') return interviewDeck(open, progress, today);
  if (deck.startsWith('module-')) {
    const moduleId = deck.slice('module-'.length);
    return open.filter((c) => c.moduleId === moduleId);
  }
  return null;
}

/**
 * Hooks and traps in three tiers: due (oldest first), new, then the rest.
 * Inside each tier they alternate hook, trap, hook, trap. Capped at INTERVIEW_DECK_SIZE.
 */
function interviewDeck(open: Card[], progress: Readonly<Record<string, CardProgress>>, today: string): Card[] {
  const pool = open.filter((c) => c.kind === 'hook' || c.kind === 'trap');
  const tierOf = (c: Card) => {
    const p = progress[c.id];
    if (!p) return 1;
    return isDue(p, today) ? 0 : 2;
  };
  const dueDay = (c: Card) => progress[c.id]?.dueDay ?? '';
  const out: Card[] = [];
  for (const tier of [0, 1, 2]) {
    const inTier = pool.filter((c) => tierOf(c) === tier);
    if (tier === 0) inTier.sort((x, y) => (dueDay(x) < dueDay(y) ? -1 : dueDay(x) > dueDay(y) ? 1 : 0));
    const hooks = inTier.filter((c) => c.kind === 'hook');
    const traps = inTier.filter((c) => c.kind === 'trap');
    for (let i = 0; i < Math.max(hooks.length, traps.length); i++) {
      for (const c of [hooks[i], traps[i]]) if (c) out.push(c);
    }
  }
  return out.slice(0, INTERVIEW_DECK_SIZE);
}

/** The deck's title, or null when the deck or its module does not exist. */
export function deckTitle(deck: string, moduleTitle: (moduleId: string) => string | undefined): string | null {
  if (deck === 'due') return 'Due today';
  if (deck === 'weak') return 'Weak spots';
  if (deck === 'interview') return 'Interview tomorrow';
  if (deck.startsWith('module-')) {
    const title = moduleTitle(deck.slice('module-'.length));
    return title ? `Module: ${title}` : null;
  }
  return null;
}
