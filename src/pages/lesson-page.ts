import type { Lesson } from '../content-types';
import { html, raw, render } from '../core/html';
import { href } from '../core/router';
import { codeBlock } from '../engine/highlight';
import { mountVizGroup, type VizItem } from '../engine/player-view';
import { openLesson, quizPassed, saveQuizScore } from '../engine/progress';
import { mountQuiz } from '../engine/quiz';
import { clockOf } from './clock';
import type { PageContext } from './router-view';

/** The line above the quiz: what is needed, or that the lesson is done. */
function statusText(lesson: Lesson, ctx: PageContext): string {
  const total = lesson.quiz.length;
  const needed = Array.from({ length: total + 1 }, (_, k) => k).find((k) => quizPassed(k, total)) ?? total;
  const p = ctx.store.get().lessons[lesson.id];
  if (p?.passedAt !== undefined) return `✅ Lesson done. Your best score is ${p.bestScore} of ${p.total}.`;
  const best = p && p.total > 0 ? `Your best score is ${p.bestScore} of ${p.total}. ` : '';
  return `${best}Get ${needed} of ${total} right to finish this lesson.`;
}

export function mountLessonPage(host: HTMLElement, lesson: Lesson, ctx: PageContext): () => void {
  const now = clockOf(ctx);
  ctx.store.update((d) => openLesson(d, lesson.id, now()));
  const problems = lesson.problemIds.map((id) => ctx.registry.problem(id)).filter((p) => p !== undefined);
  render(host, html`
    <article class="lesson">
      <p class="muted"><a href="${href({ name: 'module', id: lesson.moduleId })}">← ${ctx.registry.module(lesson.moduleId)?.title ?? 'Module'}</a> · ${lesson.minutes} min</p>
      <h1>${lesson.title}</h1>
      <p class="lead">${lesson.summary}</p>

      <section id="example"><h2>🔴 A small example</h2>${raw(lesson.example)}</section>
      <section id="everyday"><h2>💡 The everyday picture</h2>${raw(lesson.everyday)}</section>

      <section id="steps"><h2>⚙️ Step by step</h2>
        <ol class="picture-steps">${lesson.steps.map((s) => html`<li><span class="step-icon" aria-hidden="true">${s.icon}</span><div><b>${s.title}</b><p>${s.text}</p></div></li>`)}</ol>
        <div class="viz-host"></div>
        <details class="deep"><summary>🔬 Go deeper</summary>${raw(lesson.deep)}</details>
      </section>

      <section id="spot"><h2>🔍 How to spot it</h2>
        <dl class="clues">
          <div><dt>📏 Size</dt><dd>${lesson.spot.size}</dd></div>
          <div><dt>🔤 Words</dt><dd>${lesson.spot.words}</dd></div>
          <div><dt>🧱 Shape</dt><dd>${lesson.spot.shape}</dd></div>
          <div><dt>🔁 Bottleneck</dt><dd>${lesson.spot.bottleneck}</dd></div>
        </dl>
        ${lesson.traps.map((t) => html`<div class="callout trap"><b>❌ Trap:</b> ${t.looksLike} <b>But it is:</b> ${t.butIs} <span class="muted">${t.why}</span></div>`)}
      </section>

      <section id="template"><h2>🧩 Java template: ${lesson.template.title}</h2>${codeBlock(lesson.template.java, { label: `Java template: ${lesson.template.title}` })}
        <h3>⏱️ Big-O facts</h3>
        <div class="simple-table"><table><thead><tr><th>Question</th><th>Answer</th><th>Why</th></tr></thead>
          <tbody>${lesson.complexityFacts.map((f) => html`<tr><td>${f.q}</td><td><b>${f.a}</b></td><td>${f.why}</td></tr>`)}</tbody></table></div>
      </section>

      <section id="real-life"><h2>🌍 Where you meet this</h2>
        <ul>${lesson.realLife.map((r) => html`<li>${r.text} <span class="tag">${r.tier === 'confirmed' ? 'Confirmed' : 'Educational'}</span>${r.source ? html` <span class="muted">Source: ${r.source}</span>` : null}</li>`)}</ul>
      </section>

      <section id="mistakes"><h2>⚠️ Common mistakes</h2><ul>${lesson.mistakes.map((m) => html`<li>${m}</li>`)}</ul>
        <h3>🎤 In the interview</h3><ul>${lesson.interview.map((m) => html`<li>${m}</li>`)}</ul>
      </section>

      <section id="try-it"><h2>🧪 Try it</h2>
        <p class="lesson-status" data-testid="lesson-status" aria-live="polite"></p>
        <div class="quiz-host"></div>
        <p><button type="button" data-testid="quiz-retry" hidden>↺ Try the quiz again</button></p>
        ${problems.length ? html`<h3>Practice problems</h3><ul class="item-list">${problems.map((p) => html`<li class="card"><a href="${href({ name: 'problem', id: p.id })}">🧪 ${p.title}</a> <span class="tag">${p.difficulty}</span></li>`)}</ul>` : null}
      </section>
    </article>`);

  const items: VizItem[] = [];
  for (const v of lesson.viz) {
    const trace = ctx.registry.trace(v.traceId);
    const approach = ctx.registry.approachForTrace(v.traceId);
    if (trace && approach) items.push({ label: v.label, trace, java: approach.java, input: v.input });
  }
  const disposeViz = items.length ? mountVizGroup(host.querySelector('.viz-host') as HTMLElement, items) : () => {};
  const statusEl = host.querySelector('[data-testid="lesson-status"]') as HTMLElement;
  const retry = host.querySelector('[data-testid="quiz-retry"]') as HTMLButtonElement;
  const quizHost = host.querySelector('.quiz-host') as HTMLElement;
  statusEl.textContent = statusText(lesson, ctx);
  let disposeQuiz = () => {};
  const startQuiz = () => {
    disposeQuiz();
    retry.hidden = true;
    disposeQuiz = mountQuiz(quizHost, lesson.quiz, (score) => {
      ctx.store.update((d) => saveQuizScore(d, lesson.id, score, lesson.quiz.length, now()));
      statusEl.textContent = statusText(lesson, ctx);
      retry.hidden = false;
    });
  };
  retry.addEventListener('click', startQuiz);
  startQuiz();
  return () => {
    disposeViz();
    disposeQuiz();
    host.innerHTML = '';
  };
}
