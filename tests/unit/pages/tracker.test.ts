import { describe, expect, it } from 'vitest';
import type { Problem } from '../../../src/content-types';
import { buildRegistry } from '../../../src/core/registry';
import { createStore } from '../../../src/core/store';
import { DAY_MS } from '../../../src/engine/days';
import { mountTracker } from '../../../src/pages/tracker';

const T0 = new Date(2026, 10, 24, 10).getTime();
const problem = { id: 'p', moduleId: 'm', title: 'P', patternIds: [], approaches: [] } as unknown as Problem;
const registry = buildRegistry({ modules: [], lessons: [], problems: [problem], traces: [] });
const runner = { ready: async () => {}, run: async () => ({ kind: 'runnerUnavailable' as const, reason: '' }), stop() {} };

function mount(now = T0) {
  const d: Record<string, string> = {};
  const store = createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } });
  const host = document.createElement('div');
  document.body.append(host);
  let t = now;
  const dispose = mountTracker(host, problem, { registry, store, runner, now: () => t });
  const q = (id: string) => host.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`)!;
  return { host, store, dispose, q, setNow: (v: number) => { t = v; } };
}

describe('tracker box', () => {
  it('starts at level 0', () => {
    const { q, dispose } = mount();
    expect(q('track-level').textContent).toBe('Level 0 of 5: Not started');
    expect(q('track-resolve').textContent).toBe('Solve it once to start the re-solve reminders.');
    expect(q('track-understood').getAttribute('aria-pressed')).toBe('false');
    dispose();
  });

  it('ticks levels 1, 3 and 4 and the self-marked level 2, and keeps focus', () => {
    const { q, store, dispose } = mount();
    q('track-understood').focus();
    q('track-understood').click();
    expect(q('track-level').textContent).toBe('Level 1 of 5: Understood');
    expect(q('track-understood').getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(q('track-understood'));
    q('track-alone').click();
    expect(q('track-level').textContent).toBe('Level 2 of 5: Solved alone');
    expect(q('track-level').closest('p')!.textContent).toContain('Self-marked');
    q('track-explain').click();
    q('track-memory').click();
    expect(q('track-level').textContent).toBe('Level 4 of 5: Code from memory');
    q('track-memory').click();
    expect(store.get().problems.p?.marks.fromMemory).toBeUndefined();
    dispose();
  });

  it('shows the automatic level 2 as done and not clickable', () => {
    const { q, store, dispose } = mount();
    store.update((s) => { s.problems.p = { marks: { solvedAlone: T0 }, solvedAt: T0, resolveSteps: 0, nextResolveAt: T0 + 3 * DAY_MS, updatedAt: T0 }; });
    expect(q('track-alone').disabled).toBe(true);
    expect(q('track-alone').textContent).toBe('2 · Solved alone ✓');
    expect(q('track-level').textContent).toBe('Level 2 of 5: Solved alone');
    expect(q('track-resolve').textContent).toBe('Next re-solve: 27 Nov 2026. 0 of 3 done.');
    dispose();
  });

  it('"I solved this elsewhere" counts as solved, then waits for the re-solve', () => {
    const { q, store, dispose, setNow } = mount();
    q('track-elsewhere').click();
    expect(store.get().problems.p?.solvedElsewhere).toBe(T0);
    expect(q('track-solved')).not.toBeNull();
    expect(q('track-elsewhere').disabled).toBe(true);
    setNow(T0 + 3 * DAY_MS);
    store.update(() => {});
    expect(q('track-resolve').textContent).toBe('A re-solve is due. Solve it again from scratch, then press Submit.');
    expect(q('track-elsewhere').textContent).toBe('I re-solved it elsewhere');
    q('track-elsewhere').click();
    expect(store.get().problems.p?.resolveSteps).toBe(1);
    dispose();
  });
});
