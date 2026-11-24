import type { HashView } from '../trace';
import type { Piece } from './array-piece';

export function createHashPiece(): Piece<HashView> {
  const el = document.createElement('figure');
  el.className = 'piece piece-hash';
  const caption = document.createElement('figcaption');
  const box = document.createElement('div');
  box.className = 'hash-box';
  el.append(caption, box);
  const chips = new Map<string, HTMLElement>();
  const empty = document.createElement('span');
  empty.className = 'hash-empty';
  empty.textContent = 'empty';

  return {
    el,
    update(view) {
      caption.textContent = view.mode === 'set' ? `${view.label} (set)` : `${view.label} (map)`;
      const keep = new Set(view.entries.map((e) => e.key));
      for (const [key, chip] of chips) {
        if (!keep.has(key)) {
          chip.remove();
          chips.delete(key);
        }
      }
      for (const e of view.entries) {
        let chip = chips.get(e.key);
        const isNew = !chip;
        if (!chip) {
          chip = document.createElement('span');
          chip.dataset.key = e.key;
          box.append(chip);
          chips.set(e.key, chip);
        }
        chip.className = isNew ? 'chip enter' : 'chip';
        chip.textContent = view.mode === 'map' ? `${e.key} → ${e.value ?? ''}` : e.key;
        if (view.highlightKey === e.key) chip.classList.add(`mark-${view.highlightColor ?? 'current'}`);
      }
      if (view.entries.length === 0) box.append(empty);
      else empty.remove();
      el.setAttribute('aria-label', `${view.label}: ${view.entries.length === 0 ? 'empty' : view.entries.map((e) => e.key).join(', ')}`);
    },
  };
}
