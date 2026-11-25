import type { Sheet } from '../content-types';
import { html, type SafeHtml } from '../core/html';
import { href } from '../core/router';
import { isSolved } from '../engine/tracker';
import { comingTag, problemTag } from './progress-tags';
import type { PageContext } from './router-view';

/** `#/sheets/:id`: the list in its own order, with progress or "coming in Part N" (spec §15). */
export function renderSheet(sheet: Sheet, ctx: PageContext): SafeHtml {
  const { registry } = ctx;
  const state = ctx.store.get();
  const solved = sheet.problemIds.filter((id) => isSolved(state.problems[id])).length;
  return html`
    <h1>${sheet.title}</h1>
    <p class="muted">${sheet.credit}</p>
    <p data-testid="sheet-progress"><b>${solved} of ${sheet.problemIds.length} solved.</b></p>
    <ol class="sheet-list">${sheet.problemIds.map((id) => {
      const p = registry.roadmapProblem(id);
      if (!p) return null;
      return p.built
        ? html`<li data-testid="sheet-row"><a href="${href({ name: 'problem', id: p.id })}">${p.title}</a> <span class="tag">${p.difficulty}</span> ${problemTag(state, p.id, registry)}</li>`
        : html`<li data-testid="sheet-row">${p.title} <span class="tag">${p.difficulty}</span> ${comingTag(p.part)} <a href="${p.url}" target="_blank" rel="noopener">Open the original</a></li>`;
    })}</ol>`;
}
