import { html, type SafeHtml } from '../core/html';
import type { Registry } from '../core/registry';
import type { StoredState } from '../core/store';
import { lessonDone, problemLevel } from '../engine/mastery';
import { LEVEL_LABELS, isSolved } from '../engine/tracker';

/** "coming in Part 2" for content that is planned but not built. */
export function comingTag(part: string): SafeHtml {
  return html`<span class="tag tag-coming">${part ? `coming in Part ${part}` : 'coming later'}</span>`;
}

export function lessonTag(state: Readonly<StoredState>, lessonId: string): SafeHtml | null {
  if (lessonDone(state, lessonId)) return html`<span class="tag tag-done">✅ Done</span>`;
  if (state.lessons[lessonId]) return html`<span class="tag">📖 Started</span>`;
  return null;
}

export function problemTag(state: Readonly<StoredState>, problemId: string, registry: Registry): SafeHtml | null {
  const level = problemLevel(problemId, state, registry);
  const solved = isSolved(state.problems[problemId]);
  if (!solved && level === 0) return null;
  return html`${solved ? html`<span class="tag tag-done">✅ Solved</span>` : null}${level > 0 ? html` <span class="tag">Level ${level}: ${LEVEL_LABELS[level]}</span>` : null}`;
}
