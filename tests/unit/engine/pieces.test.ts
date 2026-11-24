import { describe, expect, it } from 'vitest';
import { createArrayPiece } from '../../../src/engine/pieces/array-piece';
import { createHashPiece } from '../../../src/engine/pieces/hash-piece';
import { createVarsPanel } from '../../../src/engine/pieces/vars-panel';

describe('array piece', () => {
  it('renders cells, marks and persistent pointers', () => {
    const p = createArrayPiece();
    p.update({ kind: 'array', id: 'a', label: 'nums', values: [3, 8, 1], pointers: [{ name: 'i', index: 0 }], marks: [{ index: 0, color: 'current' }] });
    expect(p.el.querySelectorAll('.cell')).toHaveLength(3);
    expect(p.el.querySelector('.cell[data-index="0"]')!.classList.contains('mark-current')).toBe(true);
    const ptr = p.el.querySelector<HTMLElement>('.ptr[data-name="i"]')!;
    expect(ptr.style.getPropertyValue('--i')).toBe('0');
    p.update({ kind: 'array', id: 'a', label: 'nums', values: [3, 8, 1], pointers: [{ name: 'i', index: 2 }], marks: [] });
    expect(p.el.querySelector('.ptr[data-name="i"]')).toBe(ptr);
    expect(ptr.style.getPropertyValue('--i')).toBe('2');
    expect(p.el.querySelector('.cell[data-index="0"]')!.classList.contains('mark-current')).toBe(false);
    expect(p.el.getAttribute('aria-label')).toBe('nums: 3, 8, 1');
  });
  it('stacks pointers on the same index and removes old ones', () => {
    const p = createArrayPiece();
    p.update({ kind: 'array', id: 'a', label: 'a', values: [1, 2], pointers: [{ name: 'i', index: 1 }, { name: 'j', index: 1 }], marks: [] });
    expect(p.el.querySelector<HTMLElement>('.ptr[data-name="j"]')!.style.getPropertyValue('--row')).toBe('1');
    p.update({ kind: 'array', id: 'a', label: 'a', values: [1, 2], pointers: [{ name: 'i', index: 0 }], marks: [] });
    expect(p.el.querySelector('.ptr[data-name="j"]')).toBeNull();
  });
});

describe('hash piece', () => {
  it('shows entries, new chips and the highlight', () => {
    const p = createHashPiece();
    p.update({ kind: 'hash', id: 's', label: 'seen', mode: 'set', entries: [] });
    expect(p.el.textContent).toContain('empty');
    p.update({ kind: 'hash', id: 's', label: 'seen', mode: 'set', entries: [{ key: '3' }], highlightKey: '3', highlightColor: 'current' });
    const chip = p.el.querySelector('.chip[data-key="3"]')!;
    expect(chip.classList.contains('enter')).toBe(true);
    expect(chip.classList.contains('mark-current')).toBe(true);
    p.update({ kind: 'hash', id: 's', label: 'seen', mode: 'set', entries: [{ key: '3' }, { key: '8' }] });
    expect(p.el.querySelector('.chip[data-key="3"]')!.classList.contains('enter')).toBe(false);
    expect(p.el.querySelectorAll('.chip')).toHaveLength(2);
  });
  it('shows key and value in map mode', () => {
    const p = createHashPiece();
    p.update({ kind: 'hash', id: 'm', label: 'count', mode: 'map', entries: [{ key: 'a', value: '2' }] });
    expect(p.el.querySelector('.chip')!.textContent).toBe('a → 2');
  });
});

describe('vars panel', () => {
  it('renders vars and marks changed ones', () => {
    const v = createVarsPanel();
    v.update({ i: '0', j: '1' }, ['j']);
    expect(v.el.querySelector('.var[data-name="i"]')!.textContent).toContain('0');
    expect(v.el.querySelector('.var[data-name="j"]')!.classList.contains('changed')).toBe(true);
    expect(v.el.querySelector('.var[data-name="i"]')!.classList.contains('changed')).toBe(false);
  });
});
