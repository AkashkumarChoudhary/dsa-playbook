import type { Problem } from '../content-types';
import { html, render } from '../core/html';
import { dayKey, formatDay } from '../engine/days';
import { problemLevel } from '../engine/mastery';
import { markSolvedElsewhere, tickMark } from '../engine/progress';
import { LEVEL_LABELS, isSolved, resolveDue, type TickMark } from '../engine/tracker';
import { clockOf } from './clock';
import type { PageContext } from './router-view';

const TICKS: { mark: TickMark; testid: string; label: string }[] = [
  { mark: 'understood', testid: 'track-understood', label: '1 · I understand it' },
  { mark: 'selfMarkedAlone', testid: 'track-alone', label: '2 · Mark solved alone' },
  { mark: 'canExplain', testid: 'track-explain', label: '3 · I can explain it' },
  { mark: 'fromMemory', testid: 'track-memory', label: '4 · I can code it from memory' },
];

/** The "Your progress" box on a problem page (spec §9.1, §9.2). It redraws when the store changes. */
export function mountTracker(host: HTMLElement, problem: Problem, ctx: PageContext): () => void {
  const now = clockOf(ctx);
  const el = document.createElement('div');
  el.className = 'tracker';
  host.append(el);

  const draw = () => {
    const state = ctx.store.get();
    const p = state.problems[problem.id];
    const level = problemLevel(problem.id, state, ctx.registry);
    const solved = isSolved(p);
    const due = resolveDue(p, now());
    const auto = p?.marks.solvedAlone !== undefined;
    let resolve = 'Solve it once to start the re-solve reminders.';
    if (p && solved) {
      if (p.resolveSteps >= 3) resolve = 'All 3 re-solves done.';
      else if (due) resolve = 'A re-solve is due. Solve it again from scratch, then press Submit.';
      else if (p.nextResolveAt !== undefined) resolve = `Next re-solve: ${formatDay(dayKey(p.nextResolveAt))}. ${p.resolveSteps} of 3 done.`;
    }
    // Redrawing replaces the buttons. Keep keyboard focus on the same button.
    const keep = el.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset.testid : undefined;
    render(el, html`
      <p class="tracker-level"><b data-testid="track-level">Level ${level} of 5: ${LEVEL_LABELS[level]}</b>
        ${solved ? html` <span class="tag tag-done" data-testid="track-solved">✅ Solved</span>` : null}
        ${p?.marks.selfMarkedAlone !== undefined ? html` <span class="tag">Self-marked</span>` : null}
        ${p?.solvedElsewhere !== undefined ? html` <span class="tag">Solved elsewhere</span>` : null}</p>
      <p class="muted" data-testid="track-resolve">${resolve}</p>
      <div class="tracker-buttons">
        ${TICKS.map((t) => (t.mark === 'selfMarkedAlone' && auto
          ? html`<button type="button" data-testid="${t.testid}" disabled>2 · Solved alone ✓</button>`
          : html`<button type="button" data-testid="${t.testid}" data-mark="${t.mark}" aria-pressed="${String(p?.marks[t.mark] !== undefined)}">${t.label}</button>`))}
        <button type="button" data-testid="track-elsewhere" ${solved && !due ? 'disabled' : ''}>${due ? 'I re-solved it elsewhere' : 'I solved this elsewhere'}</button>
      </div>
      <p class="muted">Level 2 is set for you when Submit passes before you open the solutions. Level 5 comes by itself at level 4 once you master the pattern.</p>`);
    if (keep) el.querySelector<HTMLElement>(`[data-testid="${keep}"]`)?.focus();
  };

  el.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!btn || btn.disabled) return;
    const mark = btn.dataset.mark as TickMark | undefined;
    if (mark) ctx.store.update((d) => tickMark(d, problem.id, mark, now()));
    else if (btn.dataset.testid === 'track-elsewhere') ctx.store.update((d) => markSolvedElsewhere(d, problem.id, now()));
  });
  draw();
  const off = ctx.store.subscribe(draw);
  return () => {
    off();
    el.remove();
  };
}
