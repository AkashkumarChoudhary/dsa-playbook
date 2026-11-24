import type { QuizQuestion } from '../content-types';
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
