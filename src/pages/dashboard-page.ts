import { html, type SafeHtml } from '../core/html';
import { href } from '../core/router';
import { computeDashboard, type Counter } from '../engine/dashboard';
import { formatDay } from '../engine/days';
import type { PatternStatus } from '../engine/mastery';
import type { PageContext } from './router-view';

const STATUS: Record<PatternStatus, { emoji: string; label: string }> = {
  'not-started': { emoji: '⬜', label: 'not started' },
  learning: { emoji: '🟦', label: 'learning' },
  practicing: { emoji: '🟨', label: 'practicing' },
  mastered: { emoji: '🟩', label: 'mastered' },
  fading: { emoji: '🟧', label: 'fading' },
};

const counterText = (c: Counter) => `${c.done} of ${c.total}, ${c.left} left`;
const activityLevel = (n: number) => (n === 0 ? 0 : n <= 2 ? 1 : n <= 5 ? 2 : 3);

/** `#/dashboard` (spec §9.4). Read-only: every number comes from computeDashboard. */
export function renderDashboard(ctx: PageContext, now: number): SafeHtml {
  const d = computeDashboard(ctx.store.get(), ctx.registry, now);
  const activeDays = d.activity.filter((a) => a.count > 0).length;
  return html`
    <h1>Dashboard</h1>
    <p class="dash-headline" data-testid="dash-headline">
      <span>🏅 ${d.headline.masteredPct}% of patterns mastered</span>
      <span>🔥 ${d.headline.streak} day${d.headline.streak === 1 ? '' : 's'} in a row</span>
      <span>📌 ${d.headline.dueToday} due today</span>
    </p>

    <section aria-labelledby="dash-counters"><h2 id="dash-counters">What is done and what is left</h2>
      <div class="counter-grid">
        <div class="card" data-testid="counter-lessons"><p class="counter-label">📖 Lessons done</p><p class="counter-value">${counterText(d.lessons)}</p></div>
        <div class="card" data-testid="counter-problems"><p class="counter-label">🧪 Problems solved</p><p class="counter-value">${counterText(d.problems)}</p></div>
        <div class="card" data-testid="counter-patterns"><p class="counter-label">🧩 Patterns mastered</p><p class="counter-value">${counterText(d.patterns)}</p></div>
        <div class="card" data-testid="counter-hours"><p class="counter-label">⏱️ Hours of study (estimate)</p><p class="counter-value">${counterText(d.hours)}</p></div>
      </div>
    </section>

    <section aria-labelledby="dash-levels"><h2 id="dash-levels">Progress by level</h2>
      ${d.levels.map((l) => html`<div class="level-row" data-testid="level-${l.level}"><span>${l.title}</span><progress max="${Math.max(l.total, 1)}" value="${l.done}" aria-label="${l.title}: ${l.done} of ${l.total}"></progress><span class="muted">${l.done} of ${l.total} (${l.pct}%)</span></div>`)}
    </section>

    <section aria-labelledby="dash-map"><h2 id="dash-map">Pattern map</h2>
      <p class="muted legend">${Object.values(STATUS).map((s) => html`<span>${s.emoji} ${s.label}</span> `)}</p>
      ${d.patternMap.map((m) => html`<h3><span aria-hidden="true">${m.icon}</span> ${m.moduleTitle}</h3>
        <ul class="pattern-map">${m.patterns.map((p) => html`<li><a class="pattern-box" data-testid="pattern-box" data-status="${p.status}" href="${p.lessonBuilt ? href({ name: 'lesson', id: p.lessonId }) : href({ name: 'roadmap' })}" aria-label="${p.title}: ${STATUS[p.status].label}"><span aria-hidden="true">${STATUS[p.status].emoji}</span> ${p.title}</a></li>`)}</ul>`)}
    </section>

    <section aria-labelledby="dash-sheets"><h2 id="dash-sheets">Problem lists</h2>
      <ul>${d.sheets.map((s) => html`<li data-testid="sheet-${s.id}"><a href="${href({ name: 'sheet', id: s.id })}">${s.title}</a>: ${s.solved} of ${s.total} solved</li>`)}</ul>
    </section>

    <section aria-labelledby="dash-ready"><h2 id="dash-ready">Interview-ready score</h2>
      <div class="card" data-testid="interview-ready">
        <p class="counter-value">${d.interviewReady.score}%</p>
        <p>It is the average of two parts:</p>
        <ul>
          <li>NeetCode 150 problems at level 3 or higher: <b>${d.interviewReady.sheetShare}%</b></li>
          <li>${d.interviewReady.drillsCounted === 0
            ? html`Spot-It drills right: <b>No drills yet</b>`
            : html`Spot-It drills right, over your last ${d.interviewReady.drillsCounted} of up to 50: <b>${d.interviewReady.drillAccuracy}%</b>`}</li>
        </ul>
        ${d.interviewReady.drillsCounted === 0 ? html`<p class="muted">Your score is waiting on drills. Until you do a drill, this part counts as 0%. So your score is half of the sheet part. <a href="${href({ name: 'drills' })}">Try a Spot-It drill</a> to fill in this part.</p>` : null}
      </div>
    </section>

    <section aria-labelledby="dash-weak"><h2 id="dash-weak">Weakest patterns</h2>
      ${d.weakest.length
        ? html`<ol data-testid="weakest">${d.weakest.map((w) => html`<li>${w.title}: ${w.accuracy === null ? 'no drills yet' : `${w.accuracy}% right in the last ${w.attempts}`}${w.fading ? html` <span class="tag">🟧 fading</span>` : null}</li>`)}</ol>`
        : html`<p data-testid="weakest">No drills yet. <a href="${href({ name: 'drills' })}">Try a Spot-It drill</a>.</p>`}
    </section>

    <section aria-labelledby="dash-activity"><h2 id="dash-activity">Activity, last 12 weeks</h2>
      <div class="activity-grid" data-testid="activity" role="group" aria-label="${activeDays} active days in the last 12 weeks">${d.activity.map((a) => html`<span role="img" data-level="${activityLevel(a.count)}" aria-label="${formatDay(a.day)}: ${a.count}" title="${formatDay(a.day)}: ${a.count}"></span>`)}</div>
    </section>

    <section aria-labelledby="dash-pace"><h2 id="dash-pace">Pace</h2>
      ${d.pace
        ? html`<ul data-testid="pace">${d.pace.map((p) => html`<li>${p.title}: ${p.finishDay ? `done by about ${formatDay(p.finishDay)} (${p.left} left)` : '✅ done'}</li>`)}</ul>`
        : html`<p data-testid="pace">Not enough data yet. Learn on 3 different days in 2 weeks to see your finish dates.</p>`}
    </section>

    <section aria-labelledby="dash-milestones"><h2 id="dash-milestones">Milestones</h2>
      <ul class="milestones" data-testid="milestones">${d.milestones.map((m) => html`<li data-unlocked="${String(m.unlocked)}">${m.unlocked ? '🏆' : '🔒'} ${m.title}</li>`)}</ul>
      <p class="muted">A milestone opens when every pattern in its level is mastered.</p>
    </section>`;
}
