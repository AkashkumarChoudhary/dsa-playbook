import { html, raw, render } from '../core/html';
import { href } from '../core/router';
import { attemptsNewestFirst, buildSession, drillPool, DRILL_SECONDS, isCorrect, type DrillQuestion } from '../engine/drills';
import { newAttemptId, recordDrill, startedModules } from '../engine/progress';
import { clockOf } from './clock';
import type { PageContext } from './router-view';

const KIND_TAG = { interview: 'Interview', lookalike: 'Look-alike', reallife: 'Real life' } as const;

export interface DrillPageOptions {
  /** scope the drill to one module (`#/drills/<moduleId>`) */
  moduleId?: string;
  /** fixes the session order in tests. Defaults to the time. */
  seed?: number;
  seconds?: number;
}

/** `#/drills` and `#/drills/:moduleId`: Spot-It drills (spec §6.2). */
export function mountDrillsPage(host: HTMLElement, ctx: PageContext, opts: DrillPageOptions = {}): () => void {
  const now = clockOf(ctx);
  const { registry } = ctx;
  const seconds = opts.seconds ?? DRILL_SECONDS;
  const scope = opts.moduleId ? registry.roadmapModule(opts.moduleId) : undefined;
  let timer: ReturnType<typeof setInterval> | null = null;
  const stopTimer = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };
  const ac = new AbortController();
  const cleanup = () => {
    ac.abort();
    stopTimer();
    host.innerHTML = '';
  };

  if (opts.moduleId && !scope) {
    render(host, html`<h1>Drill not found</h1><p><a href="${href({ name: 'drills' })}">Start a mixed drill</a></p>`);
    return cleanup;
  }
  const title = scope ? `Spot-It drill: ${scope.title}` : 'Spot-It drill';
  const started = startedModules(ctx.store.get(), (id) => registry.roadmapLesson(id)?.moduleId);
  const pool = drillPool(registry.drills, { started, moduleId: scope?.id });
  let seed = opts.seed ?? now();

  const startScreen = () => {
    if (pool.length === 0) {
      render(host, html`<h1>${title}</h1><p>${scope ? 'This module has no drill items yet.' : html`Open a lesson first. Drills use the modules you started. <a data-testid="drill-first-module" href="${href({ name: 'module', id: registry.modules[0]!.id })}">Start with ${registry.modules[0]!.title}</a>.`}</p>`);
      return;
    }
    const n = Math.min(pool.length, 10);
    render(host, html`<h1>${title}</h1>
      <p>${n} quick question${n === 1 ? '' : 's'}. You get ${seconds} seconds for each. Pick the pattern that fits.</p>
      <p class="muted">Running out of time counts as a miss. The clues are always shown after you answer.</p>
      <p><button type="button" class="primary" data-testid="drill-start">Start</button></p>`);
  };

  let questions: DrillQuestion[] = [];
  let index = 0;
  let right = 0;

  const showQuestion = () => {
    const q = questions[index]!;
    let left = seconds;
    render(host, html`<h1 tabindex="-1">${title}</h1>
      <p class="drill-head"><span data-testid="drill-count">Question ${index + 1} of ${questions.length}</span>
        <span class="drill-timer" data-testid="drill-timer" role="timer">${left} s left</span></p>
      <div class="card drill-item">
        <p><span class="tag">${KIND_TAG[q.item.kind]}</span></p>
        <div class="drill-prompt">${raw(q.item.prompt)}</div>
        ${q.item.limits?.length ? html`<ul class="card-limits">${q.item.limits.map((l) => html`<li><code>${l}</code></li>`)}</ul>` : null}
      </div>
      <p><b>Which pattern fits?</b></p>
      <div class="drill-options">${q.options.map((o) => html`<button type="button" data-testid="drill-option" data-pattern="${o.patternId}">${o.title}</button>`)}</div>
      <div class="drill-feedback" data-testid="drill-feedback" aria-live="polite" tabindex="-1"></div>`);
    host.querySelector<HTMLElement>('h1')!.focus({ preventScroll: true });
    stopTimer();
    timer = setInterval(() => {
      left -= 1;
      const t = host.querySelector('[data-testid="drill-timer"]');
      if (t) t.textContent = `${left} s left`;
      if (left <= 0) answer(null);
    }, 1000);
  };

  const answer = (patternId: string | null) => {
    stopTimer();
    const q = questions[index];
    if (!q || host.querySelector('[data-testid="drill-next"]')) return;
    const correct = patternId !== null && isCorrect(q.item, patternId);
    if (correct) right++;
    const at = now();
    ctx.store.update((d) => recordDrill(d, newAttemptId(at), { itemId: q.item.id, patternIds: [...q.item.acceptedPatternIds], correct, at }));
    host.querySelectorAll<HTMLButtonElement>('[data-testid="drill-option"]').forEach((b) => {
      b.disabled = true;
      if (isCorrect(q.item, b.dataset.pattern ?? '')) b.classList.add('right');
      else if (b.dataset.pattern === patternId) b.classList.add('wrong');
    });
    const answers = q.item.acceptedPatternIds.map((id) => registry.pattern(id)?.title ?? id).join(' or ');
    const verdict = patternId === null ? '⏰ Time is up. That counts as a miss.' : correct ? '✅ Right.' : '❌ Not this time.';
    const last = index === questions.length - 1;
    const feedback = host.querySelector('[data-testid="drill-feedback"]') as HTMLElement;
    render(feedback, html`<p><b>${verdict}</b> The answer: <b>${answers}</b>.</p><p>${q.item.clueExplanation}</p>
      <p><button type="button" class="primary" data-testid="drill-next">${last ? 'See your score' : 'Next question'}</button></p>`);
    feedback.focus({ preventScroll: true });
  };

  const summary = () => {
    render(host, html`<h1>${title}</h1>
      <p class="callout" data-testid="drill-summary" tabindex="-1">You got ${right} of ${questions.length} right.</p>
      <p><button type="button" class="primary" data-testid="drill-again">Start another drill</button> <a href="${href({ name: 'dashboard' })}">See your dashboard</a></p>`);
    host.querySelector<HTMLElement>('[data-testid="drill-summary"]')!.focus({ preventScroll: true });
  };

  const start = () => {
    questions = buildSession({ items: pool, patterns: registry.patterns, moduleOrder: (id) => registry.roadmapModule(id)?.order, attempts: attemptsNewestFirst(ctx.store.get().drills), seed });
    seed += 1;
    index = 0;
    right = 0;
    showQuestion();
  };

  host.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!btn || btn.disabled) return;
    const id = btn.dataset.testid;
    if (id === 'drill-start' || id === 'drill-again') start();
    else if (id === 'drill-option') answer(btn.dataset.pattern ?? null);
    else if (id === 'drill-next') {
      index++;
      if (index < questions.length) showQuestion();
      else summary();
    }
  }, { signal: ac.signal });
  startScreen();
  return cleanup;
}
