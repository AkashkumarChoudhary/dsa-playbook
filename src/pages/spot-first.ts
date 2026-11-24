import type { ClueKind, SpotFirst } from '../content-types';
import { html, render } from '../core/html';

const KINDS: { kind: ClueKind; label: string }[] = [
  { kind: 'size', label: '📏 size' },
  { kind: 'words', label: '🔤 words' },
  { kind: 'shape', label: '🧱 shape' },
  { kind: 'bottleneck', label: '🔁 bottleneck' },
];

export function mountSpotFirst(host: HTMLElement, spot: SpotFirst): () => void {
  const el = document.createElement('div');
  el.className = 'spot-first card';
  render(el, html`
    <fieldset class="spot-fieldset">
      <legend><b>${spot.prompt}</b></legend>
      <div class="spot-options">${spot.options.map((o, i) => html`<label><input type="radio" name="spot-option" value="${i}" /> <span>${o}</span></label>`)}</div>
    </fieldset>
    <p class="muted">Which clues did you use?</p>
    <div class="clue-chips">${KINDS.map((k) => html`<button type="button" class="clue-chip" data-kind="${k.kind}" aria-pressed="false">${k.label}</button>`)}</div>
    <button type="button" class="primary" data-testid="spot-check">Check my answer</button>
    <div class="spot-result" data-testid="spot-result" aria-live="polite" tabindex="-1"></div>`);
  host.append(el);
  el.querySelectorAll<HTMLButtonElement>('.clue-chip').forEach((b) =>
    b.addEventListener('click', () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'))),
  );
  const result = el.querySelector('[data-testid="spot-result"]') as HTMLElement;
  el.querySelector('[data-testid="spot-check"]')!.addEventListener('click', () => {
    const picked = el.querySelector<HTMLInputElement>('input[name="spot-option"]:checked');
    if (!picked) {
      result.textContent = 'Pick an answer first. Guessing is fine.';
      return;
    }
    const right = Number(picked.value) === spot.answer;
    const used = [...el.querySelectorAll<HTMLButtonElement>('.clue-chip[aria-pressed="true"]')].map((b) => b.dataset.kind);
    render(result, html`
      <p><b>${right ? '✅ Right.' : '❌ Not this time.'}</b> The best fit is: <b>${spot.options[spot.answer] ?? ''}</b>.</p>
      <p class="muted">You used: ${used.length ? used.join(', ') : 'no clues yet'}.</p>
      <p>The clues an expert sees:</p>
      <ul>${spot.clues.map((c) => html`<li><b>${KINDS.find((k) => k.kind === c.kind)?.label ?? c.kind}:</b> ${c.text}</li>`)}</ul>`);
  });
  return () => el.remove();
}
