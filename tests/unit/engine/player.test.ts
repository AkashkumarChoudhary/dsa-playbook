import { describe, expect, it, vi } from 'vitest';
import { BASE_DWELL_MS, Player, type Scheduler } from '../../../src/engine/player';
import type { Trace } from '../../../src/engine/trace';

function fakeScheduler() {
  let id = 0;
  const timers = new Map<number, { fn: () => void; ms: number }>();
  const s: Scheduler & { runNext(): number | undefined; pending(): number } = {
    setTimeout(fn, ms) { timers.set(++id, { fn, ms }); return id; },
    clearTimeout(t) { timers.delete(t); },
    runNext() {
      const first = timers.entries().next();
      if (first.done) return undefined;
      const [key, t] = first.value;
      timers.delete(key);
      t.fn();
      return t.ms;
    },
    pending: () => timers.size,
  };
  return s;
}

const trace = (n: number): Trace => ({
  steps: Array.from({ length: n }, (_, i) => ({ line: 'l', vars: {}, changed: [], views: [], note: `step ${i}` })),
  result: null,
});

describe('Player', () => {
  it('steps forward and back and stops at the ends', () => {
    const p = new Player(trace(3), fakeScheduler());
    expect(p.index).toBe(0);
    p.back();
    expect(p.index).toBe(0);
    p.next(); p.next(); p.next();
    expect(p.index).toBe(2);
    expect(p.atEnd).toBe(true);
    p.back();
    expect(p.current.note).toBe('step 1');
    p.reset();
    expect(p.index).toBe(0);
  });

  it('plays with dwell time by speed and stops at the end', () => {
    const sch = fakeScheduler();
    const p = new Player(trace(3), sch);
    const changes = vi.fn();
    p.onChange(changes);
    p.play();
    expect(p.playing).toBe(true);
    expect(sch.runNext()).toBe(BASE_DWELL_MS);
    expect(p.index).toBe(1);
    p.setSpeed(2);
    expect(sch.runNext()).toBe(BASE_DWELL_MS / 2);
    expect(p.index).toBe(2);
    expect(p.playing).toBe(false);
    expect(sch.pending()).toBe(0);
    expect(changes).toHaveBeenCalled();
  });

  it('manual step pauses playback, and play at the end restarts', () => {
    const sch = fakeScheduler();
    const p = new Player(trace(2), sch);
    p.play();
    p.next();
    expect(p.playing).toBe(false);
    expect(sch.pending()).toBe(0);
    expect(p.atEnd).toBe(true);
    p.play();
    expect(p.index).toBe(0);
    expect(p.playing).toBe(true);
  });

  it('rejects an empty trace', () => {
    expect(() => new Player(trace(0), fakeScheduler())).toThrow('A trace needs at least one step');
  });
});
