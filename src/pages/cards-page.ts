import { html, raw, render } from '../core/html';
import { href } from '../core/router';
import { deckCards, deckTitle, KIND_LABEL, type Card } from '../engine/cards';
import { dayKey } from '../engine/days';
import { codeBlock } from '../engine/highlight';
import { RATINGS, type Rating } from '../engine/leitner';
import { reviewCard, startedModules } from '../engine/progress';
import { clockOf } from './clock';
import type { PageContext } from './router-view';

const RATING_LABEL: Record<Rating, string> = { again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy' };

/** `#/cards` (deck picker) and `#/cards/:deck` (review), spec §9.5. */
export function mountCardsPage(host: HTMLElement, ctx: PageContext, deck?: string): () => void {
  const now = clockOf(ctx);
  const { registry } = ctx;
  const state = ctx.store.get();
  const started = startedModules(state, (id) => registry.roadmapLesson(id)?.moduleId);
  const today = dayKey(now());
  const moduleTitle = (id: string) => registry.roadmapModule(id)?.title;

  if (!deck) {
    const count = (d: string) => deckCards(d, registry.cards, state.cards, started, today)?.length ?? 0;
    const decks = [
      { id: 'due', note: 'Mixed from every module you started.' },
      { id: 'weak', note: 'The cards you missed most.' },
      { id: 'interview', note: 'Memory hooks and traps. About 10 minutes.' },
      ...registry.roadmap.filter((m) => started.has(m.id)).map((m) => ({ id: `module-${m.id}`, note: 'Every card of this module.' })),
    ];
    render(host, html`
      <h1>Flashcards</h1>
      ${started.size === 0
        ? html`<p>Open a lesson first. Cards come from the modules you start.</p>`
        : html`<p class="muted">Flip a card, then say how well you knew it. Cards you know come back less often.</p>
          <ul class="deck-list">${decks.map((d) => html`<li><a class="card deck-link" data-testid="deck-${d.id}" href="${href({ name: 'cards', deck: d.id })}"><b>${deckTitle(d.id, moduleTitle)}</b> <span class="tag">${count(d.id)} card${count(d.id) === 1 ? '' : 's'}</span><br /><span class="muted">${d.note}</span></a></li>`)}</ul>`}`);
    return () => { host.innerHTML = ''; };
  }

  const title = deckTitle(deck, moduleTitle);
  const cards = title ? deckCards(deck, registry.cards, state.cards, started, today) : null;
  if (!title || !cards) {
    render(host, html`<h1>Deck not found</h1><p><a href="${href({ name: 'cards' })}">See all decks</a></p>`);
    return () => { host.innerHTML = ''; };
  }

  let index = 0;
  let flipped = false;
  const leftText = (n: number) => (deck === 'due' ? `${n} left today` : `${n} left in this deck`);

  const draw = () => {
    const card: Card | undefined = cards[index];
    if (!card) {
      render(host, html`<h1>${title}</h1><p data-testid="cards-left">${leftText(0)}</p>
        <p class="callout" data-testid="cards-done" tabindex="-1">All done for now. 🎉</p>
        <p><a class="button" href="${href({ name: 'cards' })}">Back to the decks</a></p>`);
      (host.querySelector('[data-testid="cards-done"]') as HTMLElement).focus({ preventScroll: true });
      return;
    }
    render(host, html`
      <h1>${title}</h1>
      <p data-testid="cards-left" aria-live="polite">${leftText(cards.length - index)}</p>
      <div class="flashcard${flipped ? ' flipped' : ''}" data-testid="flashcard" tabindex="-1" role="group" aria-label="Flashcard">
        <p class="card-kind"><span class="tag">${KIND_LABEL[card.kind]}</span> <span class="muted">${card.title}</span></p>
        <div class="card-front">${raw(card.front)}</div>
        ${flipped ? html`<div class="card-back">${raw(card.back)}${card.backCode ? codeBlock(card.backCode, { label: `${card.title} template in Java` }) : null}</div>` : null}
      </div>
      ${flipped
        ? html`<p class="muted">How well did you know it? Keys 1 to 4 work too.</p>
          <div class="rate-buttons">${RATINGS.map((r, i) => html`<button type="button" data-testid="rate-${r}" data-rating="${r}">${i + 1} · ${RATING_LABEL[r]}</button>`)}</div>`
        : html`<p><button type="button" class="primary" data-testid="card-flip">Show the answer</button> <span class="muted">or press Space</span></p>`}`);
    (host.querySelector('[data-testid="flashcard"]') as HTMLElement).focus({ preventScroll: true });
  };

  const flip = () => {
    if (flipped || !cards[index]) return;
    flipped = true;
    draw();
  };
  const rate = (rating: Rating) => {
    const card = cards[index];
    if (!flipped || !card) return;
    ctx.store.update((d) => reviewCard(d, card.id, rating, now()));
    index++;
    flipped = false;
    draw();
  };

  const ac = new AbortController();
  host.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const rating = target.closest<HTMLElement>('[data-rating]')?.dataset.rating as Rating | undefined;
    if (rating) rate(rating);
    else if (target.closest('[data-testid="card-flip"], [data-testid="flashcard"]')) flip();
  }, { signal: ac.signal });
  const onKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === ' ' && tag !== 'BUTTON' && tag !== 'A' && !flipped) {
      e.preventDefault();
      flip();
    } else if (['1', '2', '3', '4'].includes(e.key)) {
      rate(RATINGS[Number(e.key) - 1]!);
    }
  };
  document.addEventListener('keydown', onKey);
  draw();
  return () => {
    ac.abort();
    document.removeEventListener('keydown', onKey);
    host.innerHTML = '';
  };
}
