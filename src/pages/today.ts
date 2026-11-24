import { html, type SafeHtml } from '../core/html';
import { href } from '../core/router';
import { deckCards } from '../engine/cards';
import { dayKey, daysBetween, streak } from '../engine/days';
import { hasProgress, lastOpened, startedModules } from '../engine/progress';
import { isSolved } from '../engine/tracker';
import type { ProblemProgress } from '../core/store';
import { renderHome } from './home';
import type { PageContext } from './router-view';

/** A re-solve is due when its calendar day has come, so compare day keys and not raw milliseconds. */
function resolveDueToday(p: Readonly<ProblemProgress> | undefined, today: string): boolean {
  return p !== undefined && isSolved(p) && p.resolveSteps < 3 && p.nextResolveAt !== undefined && daysBetween(dayKey(p.nextResolveAt), today) >= 0;
}

/** `#/` (spec §7.1): cards due, problems to solve again, one mixed drill, and where to continue. */
export function renderToday(ctx: PageContext, now: number): SafeHtml {
  const { registry } = ctx;
  const state = ctx.store.get();
  if (!hasProgress(state)) return renderHome(registry);
  const today = dayKey(now);
  const started = startedModules(state, (id) => registry.roadmapLesson(id)?.moduleId);
  const due = deckCards('due', registry.cards, state.cards, started, today)?.length ?? 0;
  const resolves = registry.allProblems.filter((p) => p.built && resolveDueToday(state.problems[p.id], today));
  const last = lastOpened(state);
  const lastLesson = last?.kind === 'lesson' ? registry.lesson(last.id) : undefined;
  const lastProblem = last?.kind === 'problem' ? registry.problem(last.id) : undefined;
  const days = streak(state.days, today);
  return html`
    <h1>Today</h1>
    <p class="muted">🔥 ${days} day${days === 1 ? '' : 's'} in a row. <a href="${href({ name: 'dashboard' })}">See your dashboard</a>.</p>
    <div class="today-grid">
      <section class="card" data-testid="today-cards"><h2>🃏 Flashcards</h2>
        ${due > 0
          ? html`<p>${due} card${due === 1 ? ' is' : 's are'} due today.</p><p><a class="button primary" href="${href({ name: 'cards', deck: 'due' })}">Review cards</a></p>`
          : html`<p>No cards are due. Come back tomorrow.</p>`}
      </section>
      <section class="card" data-testid="today-resolve"><h2>🔁 Solve again</h2>
        ${resolves.length
          ? html`<p>Solve these again from scratch:</p><ul>${resolves.map((p) => html`<li><a href="${href({ name: 'problem', id: p.id })}">${p.title}</a></li>`)}</ul>`
          : html`<p>Nothing to solve again today.</p>`}
      </section>
      <section class="card" data-testid="today-drill"><h2>🎯 Spot-It drill</h2>
        <p>Up to 10 quick questions from the modules you started. You get 60 seconds for each.</p>
        <p><a class="button" href="${href({ name: 'drills' })}">Start a mixed drill</a></p>
      </section>
      <section class="card" data-testid="today-continue"><h2>▶️ Continue</h2>
        ${lastLesson
          ? html`<p>Pick up where you left off: <a href="${href({ name: 'lesson', id: lastLesson.id })}">📖 ${lastLesson.title}</a></p>`
          : lastProblem
            ? html`<p>Pick up where you left off: <a href="${href({ name: 'problem', id: lastProblem.id })}">🧪 ${lastProblem.title}</a></p>`
            : html`<p><a href="${href({ name: 'roadmap' })}">Pick a module on the roadmap</a>.</p>`}
      </section>
    </div>`;
}
