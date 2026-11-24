import type { ArrayView } from '../trace';

export interface Piece<V> {
  el: HTMLElement;
  update(view: V): void;
}

/** Box size that fits the longest value. rem (not em) keeps it the same in cells and in the smaller pointer text. */
function cellSize(values: ArrayView['values']): string {
  const chars = Math.max(1, ...values.map((v) => String(v).length));
  return `max(2.75rem, calc(${chars} * 0.65rem + 1rem))`;
}

export function createArrayPiece(): Piece<ArrayView> {
  const el = document.createElement('figure');
  el.className = 'piece piece-array';
  el.setAttribute('role', 'img');
  const caption = document.createElement('figcaption');
  const track = document.createElement('div');
  track.className = 'arr-track';
  const cellsEl = document.createElement('div');
  cellsEl.className = 'arr-cells';
  const ptrLayer = document.createElement('div');
  ptrLayer.className = 'arr-ptrs';
  track.append(cellsEl, ptrLayer);
  el.append(caption, track);

  let cells: HTMLElement[] = [];
  const pointers = new Map<string, HTMLElement>();

  function rebuild(n: number) {
    cellsEl.innerHTML = '';
    cells = [];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div');
      c.className = 'cell';
      c.dataset.index = String(i);
      c.innerHTML = `<span class="idx">${i}</span><span class="val"></span>`;
      cellsEl.append(c);
      cells.push(c);
    }
    track.style.setProperty('--n', String(n));
  }

  return {
    el,
    update(view) {
      caption.textContent = view.label;
      if (view.values.length !== cells.length) rebuild(view.values.length);
      // Long numbers need wider boxes. Pointers read the same --cell, so they still line up.
      track.style.setProperty('--cell', cellSize(view.values));
      view.values.forEach((v, i) => {
        const c = cells[i] as HTMLElement;
        (c.querySelector('.val') as HTMLElement).textContent = String(v);
        c.className = 'cell';
      });
      for (const m of view.marks) cells[m.index]?.classList.add(`mark-${m.color}`);

      const rowAt = new Map<number, number>();
      const keep = new Set<string>();
      for (const p of view.pointers) {
        keep.add(p.name);
        let ptr = pointers.get(p.name);
        if (!ptr) {
          ptr = document.createElement('div');
          ptr.className = 'ptr';
          ptr.dataset.name = p.name;
          ptr.innerHTML = `<span class="ptr-arrow" aria-hidden="true">▲</span><b></b>`;
          (ptr.querySelector('b') as HTMLElement).textContent = p.name;
          ptrLayer.append(ptr);
          pointers.set(p.name, ptr);
        }
        const row = rowAt.get(p.index) ?? 0;
        rowAt.set(p.index, row + 1);
        ptr.style.setProperty('--i', String(p.index));
        ptr.style.setProperty('--row', String(row));
      }
      for (const [name, ptr] of pointers) {
        if (!keep.has(name)) {
          ptr.remove();
          pointers.delete(name);
        }
      }
      const rows = Math.max(1, ...[...rowAt.values()]);
      track.style.setProperty('--ptr-rows', String(rows));
      el.setAttribute('aria-label', `${view.label}: ${view.values.join(', ')}`);
    },
  };
}
