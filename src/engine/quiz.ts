import type { QuizQuestion, ScenarioQuestion } from '../content-types';
import { html, render } from '../core/html';

export function mountQuiz(host: HTMLElement, questions: QuizQuestion[], onComplete?: (score: number) => void): () => void {
  const el = document.createElement('div');
  el.className = 'quiz';
  render(el, html`${questions.map((q, i) => html`
    <fieldset class="quiz-question" data-index="${i}">
      <legend>${i + 1}. ${q.q}</legend>
      ${q.options.map((o, k) => html`<button type="button" class="quiz-option" data-q="${i}" data-k="${k}">${o}</button>`)}
      <p class="quiz-feedback" tabindex="-1" aria-live="polite"></p>
    </fieldset>`)}
    <p class="quiz-score" aria-live="polite"></p>`);
  host.append(el);
  const answered = new Map<number, boolean>();
  el.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.quiz-option');
    if (!btn) return;
    const qi = Number(btn.dataset.q);
    const k = Number(btn.dataset.k);
    const q = questions[qi];
    if (!q || answered.has(qi)) return;
    const right = k === q.answer;
    answered.set(qi, right);
    const fs = el.querySelector(`.quiz-question[data-index="${qi}"]`) as HTMLElement;
    fs.querySelectorAll<HTMLButtonElement>('.quiz-option').forEach((b, idx) => {
      b.disabled = true;
      if (idx === q.answer) b.classList.add('right');
      else if (idx === k) b.classList.add('wrong');
    });
    const feedback = fs.querySelector('.quiz-feedback') as HTMLElement;
    feedback.textContent = `${right ? '✅ Right.' : '❌ Not quite.'} ${q.why}`;
    feedback.focus();
    if (answered.size === questions.length) {
      const score = [...answered.values()].filter(Boolean).length;
      (el.querySelector('.quiz-score') as HTMLElement).textContent = `${score} of ${questions.length} right`;
      onComplete?.(score);
    }
  });
  return () => el.remove();
}

/**
 * Scenario questions (spec §7.4): the learner thinks, shows the answer, then marks themselves right or wrong.
 * `onMark` gets the number marked right and the number marked so far.
 */
export function mountScenarios(host: HTMLElement, questions: ScenarioQuestion[], onMark?: (right: number, marked: number) => void): () => void {
  const el = document.createElement('div');
  el.className = 'scenarios';
  render(el, html`${questions.map((q, i) => html`
    <div class="scenario card" data-index="${i}">
      <p><b>${i + 1}. ${q.q}</b></p>
      <button type="button" data-testid="scenario-show">Show the answer</button>
      <div class="scenario-answer" hidden>
        <p>${q.answer}</p>
        <p class="muted">Did you get it?</p>
        <button type="button" data-testid="scenario-right">✅ I got it right</button>
        <button type="button" data-testid="scenario-wrong">❌ Not this time</button>
      </div>
      <p class="scenario-result" aria-live="polite"></p>
    </div>`)}`);
  host.append(el);
  const marks = new Map<number, boolean>();
  el.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    const box = btn?.closest<HTMLElement>('.scenario');
    if (!btn || !box) return;
    const i = Number(box.dataset.index);
    if (btn.dataset.testid === 'scenario-show') {
      (box.querySelector('.scenario-answer') as HTMLElement).hidden = false;
      btn.disabled = true;
      return;
    }
    if (marks.has(i)) return;
    const right = btn.dataset.testid === 'scenario-right';
    marks.set(i, right);
    box.querySelectorAll<HTMLButtonElement>('.scenario-answer button').forEach((b) => { b.disabled = true; });
    (box.querySelector('.scenario-result') as HTMLElement).textContent = right ? 'Marked right.' : 'Marked as not yet. Try it again later.';
    onMark?.([...marks.values()].filter(Boolean).length, marks.size);
  });
  return () => el.remove();
}
