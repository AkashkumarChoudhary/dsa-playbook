import { afterEach, describe, expect, it, vi } from 'vitest';
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
// A form only sends when it is in the page, like in a real browser.
const attached = () => document.body.appendChild(document.createElement('div'));
afterEach(() => { document.body.innerHTML = ''; });

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
    const host = attached();
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

describe('keys and the own-input form', () => {
  it('leaves Space on a focused button to that button', () => {
    const host = document.createElement('div');
    const v = mountPlayerView(host, { trace: countTrace, java, input: { nums: [4, 5, 6] }, title: 'Count', reducedMotion: true });
    const next = host.querySelector<HTMLButtonElement>('[data-action="next"]')!;
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    next.dispatchEvent(space);
    // The browser's own Space action on a button is a click. It must not be cancelled.
    expect(space.defaultPrevented).toBe(false);
    expect(v.player().playing).toBe(false);
    next.click();
    expect(host.querySelector('.player-count')!.textContent).toBe('Step 2 of 3');
    expect(v.player().playing).toBe(false);
  });

  it('plays with Space on the player, and ignores keys with Ctrl, Alt or Meta', () => {
    const host = document.createElement('div');
    const v = mountPlayerView(host, { trace: countTrace, java, input: { nums: [4, 5, 6] }, title: 'Count', reducedMotion: true });
    v.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true, bubbles: true }));
    v.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true }));
    v.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', metaKey: true, bubbles: true }));
    expect(host.querySelector('.player-count')!.textContent).toBe('Step 1 of 3');
    v.el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    expect(v.player().playing).toBe(true);
    v.dispose();
  });

  it('does not take over from autoplay when the learner only presses Tab', () => {
    let cb: (e: unknown[]) => void = () => {};
    vi.stubGlobal('IntersectionObserver', class {
      constructor(c: (e: unknown[]) => void) { cb = c; }
      observe() {}
      disconnect() {}
    });
    const host = document.createElement('div');
    const v = mountPlayerView(host, { trace: countTrace, java, input: { nums: [1, 2, 3] }, title: 'Count', reducedMotion: false });
    v.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    cb([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(v.player().playing).toBe(true);
    v.dispose();
    vi.unstubAllGlobals();
  });

  it('puts the picture, the step sentence and the buttons before the code', () => {
    const host = document.createElement('div');
    const v = mountPlayerView(host, { trace: countTrace, java, input: { nums: [4] }, title: 'Count', reducedMotion: true });
    expect([...v.el.children].map((c) => c.className)).toEqual(['player-head', 'player-stage', 'player-note', 'player-controls', 'player-side', 'player-input']);
  });

  it('runs the own input when the form is sent, without reloading the page', () => {
    const host = document.createElement('div');
    mountPlayerView(host, { trace: countTrace, java, input: { nums: [4] }, title: 'Count', reducedMotion: true });
    const form = host.querySelector<HTMLFormElement>('form.player-input')!;
    expect(form.querySelector('[data-action="run-input"]')!.getAttribute('type')).toBe('submit');
    host.querySelector<HTMLInputElement>('.player-input input[name="nums"]')!.value = '1, 2, 3, 4';
    const submit = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submit);
    expect(submit.defaultPrevented).toBe(true);
    expect(host.querySelector('.player-count')!.textContent).toBe('Step 1 of 4');
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

describe('autoplay and errors', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('autoplays once, respects the user, and disconnects', () => {
    let cb: (e: unknown[]) => void = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal('IntersectionObserver', class {
      constructor(c: (e: unknown[]) => void) { cb = c; }
      observe() {}
      disconnect = disconnect;
    });
    const host = document.createElement('div');
    const v = mountPlayerView(host, { trace: countTrace, java, input: { nums: [1, 2, 3] }, title: 'Count', reducedMotion: false });
    const inView = { isIntersecting: true, intersectionRatio: 1 };
    const out = { isIntersecting: false, intersectionRatio: 0 };
    cb([inView]);
    expect(v.player().playing).toBe(true);
    (host.querySelector('[data-action="play"]') as HTMLButtonElement).click();
    expect(v.player().playing).toBe(false);
    cb([out]);
    cb([inView]);
    expect(v.player().playing).toBe(false);
    v.dispose();
    expect(disconnect).toHaveBeenCalled();
  });

  it('shows a plain error when run throws', () => {
    const bad: TraceDef<{ nums: number[] }> = { ...countTrace, run: (i) => { if (i.nums[0] === 9) throw new Error('boom'); return countTrace.run(i); } };
    const host = attached();
    mountPlayerView(host, { trace: bad, java, input: { nums: [4] }, title: 'Count', reducedMotion: true });
    host.querySelector<HTMLInputElement>('input[name="nums"]')!.value = '9';
    (host.querySelector('[data-action="run-input"]') as HTMLButtonElement).click();
    expect(host.querySelector('.player-input .error')!.textContent).toContain('Could not run');
    expect(host.querySelector('.player-count')!.textContent).toBe('Step 1 of 1');
  });
});
