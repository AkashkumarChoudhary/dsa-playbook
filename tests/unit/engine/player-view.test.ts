import { describe, expect, it } from 'vitest';
import { mountPlayerView, mountVizGroup } from '../../../src/engine/player-view';
import { createRecorder, parseIntList, type TraceDef } from '../../../src/engine/trace';

const countTrace: TraceDef<{ nums: number[] }> = {
  id: 't/count', maxSteps: 50,
  inputFields: [{ name: 'nums', label: 'nums', placeholder: '1, 2, 3' }],
  parseInput: (f) => {
    const r = parseIntList(f.nums ?? '', { min: -9, max: 9, minLength: 1, maxLength: 5 });
    return r.ok ? { ok: true, value: { nums: r.value } } : r;
  },
  formatInput: (i) => ({ nums: i.nums.join(', ') }),
  fromArgs: (a) => ({ nums: a[0] as number[] }),
  run: ({ nums }) => {
    const rec = createRecorder();
    nums.forEach((v, i) => rec.step({ line: 'loop', vars: { i: String(i) }, views: [{ kind: 'array', id: 'a', label: 'nums', values: nums, pointers: [{ name: 'i', index: i }], marks: [] }], note: `Look at ${v}.` }));
    return rec.finish(nums.length);
  },
};
const java = 'class Solution {\n  int f(int[] a) { // @L:loop\n    return a.length;\n  }\n}';

describe('mountPlayerView', () => {
  it('renders the first step and steps with buttons and keys', () => {
    const host = document.createElement('div');
    const v = mountPlayerView(host, { trace: countTrace, java, input: { nums: [4, 5, 6] }, title: 'Count', reducedMotion: true });
    expect(host.querySelector('.player-count')!.textContent).toBe('Step 1 of 3');
    expect(host.querySelector('.player-note')!.textContent).toBe('Look at 4.');
    expect(host.querySelector('.code-panel .ln.active')!.getAttribute('data-line')).toBe('2');
    (host.querySelector('[data-action="next"]') as HTMLButtonElement).click();
    expect(host.querySelector('.player-count')!.textContent).toBe('Step 2 of 3');
    v.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(host.querySelector('.player-count')!.textContent).toBe('Step 1 of 3');
    (host.querySelector('[data-action="speed-2"]') as HTMLButtonElement).click();
    expect(v.player().speed).toBe(2);
    v.dispose();
    expect(host.innerHTML).toBe('');
  });

  it('runs own input and shows plain errors', () => {
    const host = document.createElement('div');
    mountPlayerView(host, { trace: countTrace, java, input: { nums: [4] }, title: 'Count', reducedMotion: true });
    const input = host.querySelector<HTMLInputElement>('.player-input input[name="nums"]')!;
    expect(input.value).toBe('4');
    input.value = '1, x';
    (host.querySelector('[data-action="run-input"]') as HTMLButtonElement).click();
    expect(host.querySelector('.player-input .error')!.textContent).toContain('Use whole numbers');
    input.value = '7, 8';
    (host.querySelector('[data-action="run-input"]') as HTMLButtonElement).click();
    expect(host.querySelector('.player-input .error')!.textContent).toBe('');
    expect(host.querySelector('.player-count')!.textContent).toBe('Step 1 of 2');
  });
});

describe('mountVizGroup', () => {
  it('switches between traces with tabs', () => {
    const host = document.createElement('div');
    const dispose = mountVizGroup(host, [
      { label: 'One', trace: countTrace, java, input: { nums: [1] } },
      { label: 'Two', trace: countTrace, java, input: { nums: [1, 2] } },
    ], { reducedMotion: true });
    const tabs = host.querySelectorAll<HTMLButtonElement>('.viz-tabs button');
    expect(tabs[0]!.getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelector('.player-count')!.textContent).toBe('Step 1 of 1');
    tabs[1]!.click();
    expect(tabs[1]!.getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelector('.player-count')!.textContent).toBe('Step 1 of 2');
    dispose();
  });
});
