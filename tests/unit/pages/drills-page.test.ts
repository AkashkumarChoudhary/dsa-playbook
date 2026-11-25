import { afterEach, describe, expect, it, vi } from 'vitest';
import { contentInput } from '../../../content';
import { buildRegistry } from '../../../src/core/registry';
import { createStore, type Store } from '../../../src/core/store';
import { openLesson } from '../../../src/engine/progress';
import { mountDrillsPage } from '../../../src/pages/drills-page';

const NOW = new Date(2026, 10, 24, 10).getTime();
const registry = buildRegistry(contentInput);
const moduleId = registry.modules[0]!.id;
const runner = { ready: async () => {}, run: async () => ({ kind: 'runnerUnavailable' as const, reason: '' }), stop() {} };
const memStore = (): Store => { const d: Record<string, string> = {}; return createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }); };
const startedStore = () => { const s = memStore(); s.update((d) => openLesson(d, registry.lessonIds[0]!, NOW)); return s; };

function mount(store: Store, opts: { moduleId?: string } = {}) {
  const host = document.createElement('div');
  document.body.append(host);
  const dispose = mountDrillsPage(host, { registry, store, runner, now: () => NOW }, { ...opts, seed: 7 });
  const q = (id: string) => host.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`)!;
  return { host, q, dispose: () => { dispose(); host.remove(); } };
}
const currentItem = (host: HTMLElement) => {
  const prompt = host.querySelector('.drill-prompt')!.innerHTML;
  return registry.drills.find((d) => d.prompt === prompt)!;
};

afterEach(() => vi.useRealTimers());

describe('drills page', () => {
  it('asks to open a lesson first', () => {
    const { host, dispose } = mount(memStore());
    expect(host.querySelector('h1')!.textContent).toBe('Spot-It drill');
    expect(host.textContent).toContain('Open a lesson first.');
    dispose();
  });

  it('runs a full session: right, wrong, time out, then the score', () => {
    vi.useFakeTimers();
    const store = startedStore();
    const { host, q, dispose } = mount(store);
    const n = Math.min(10, registry.drills.length);
    q('drill-start').click();
    expect(q('drill-count').textContent).toBe(`Question 1 of ${n}`);
    expect(q('drill-timer').textContent).toBe('60 s left');
    const options = host.querySelectorAll('[data-testid="drill-option"]');
    expect(options.length).toBeGreaterThanOrEqual(4);

    const first = currentItem(host);
    host.querySelector<HTMLButtonElement>(`[data-testid="drill-option"][data-pattern="${first.acceptedPatternIds[0]}"]`)!.click();
    expect(q('drill-feedback').textContent).toContain('✅ Right.');
    expect(q('drill-feedback').textContent).toContain(first.clueExplanation);
    expect(Object.values(store.get().drills)).toEqual([{ itemId: first.id, patternIds: first.acceptedPatternIds, correct: true, at: NOW }]);
    q('drill-next').click();

    const second = currentItem(host);
    [...host.querySelectorAll<HTMLButtonElement>('[data-testid="drill-option"]')].find((b) => !second.acceptedPatternIds.includes(b.dataset.pattern!))!.click();
    expect(q('drill-feedback').textContent).toContain('❌ Not this time.');
    q('drill-next').click();

    vi.advanceTimersByTime(30_000);
    expect(q('drill-timer').textContent).toBe('30 s left');
    vi.advanceTimersByTime(30_000);
    expect(q('drill-feedback').textContent).toContain('⏰ Time is up.');
    expect(Object.values(store.get().drills).filter((a) => !a.correct)).toHaveLength(2);
    for (let i = 3; i < n; i++) {
      q('drill-next').click();
      host.querySelector<HTMLButtonElement>('[data-testid="drill-option"]')!.click();
    }
    q('drill-next').click();
    expect(q('drill-summary').textContent).toMatch(new RegExp(`^You got \\d+ of ${n} right\\.$`));
    expect(Object.keys(store.get().drills)).toHaveLength(n);
    dispose();
  });

  it('scopes a drill to one module, even before it is started', () => {
    const { host, q, dispose } = mount(memStore(), { moduleId });
    expect(host.querySelector('h1')!.textContent).toBe(`Spot-It drill: ${registry.modules[0]!.title}`);
    q('drill-start').click();
    expect(currentItem(host).moduleId).toBe(moduleId);
    dispose();
  });

  it('says when the module does not exist', () => {
    const { host, dispose } = mount(memStore(), { moduleId: 'no-such-module' });
    expect(host.querySelector('h1')!.textContent).toBe('Drill not found');
    dispose();
  });

  it('links to the first module when nothing is started', () => {
    const { host, dispose } = mount(memStore());
    expect(host.querySelector('[data-testid="drill-first-module"]')!.getAttribute('href')).toBe(`#/m/${moduleId}`);
    dispose();
  });

  it('records one attempt after a remount on the same host', () => {
    const store = startedStore();
    const host = document.createElement('div');
    document.body.append(host);
    const ctx = { registry, store, runner, now: () => NOW };
    mountDrillsPage(host, ctx, { seed: 7 })();
    mountDrillsPage(host, ctx, { seed: 7 });
    host.querySelector<HTMLButtonElement>('[data-testid="drill-start"]')!.click();
    host.querySelector<HTMLButtonElement>('[data-testid="drill-option"]')!.click();
    expect(Object.keys(store.get().drills)).toHaveLength(1);
    host.remove();
  });

  it('keeps focus off the body after Start, Next and See your score', () => {
    const store = startedStore();
    const { host, q, dispose } = mount(store);
    const n = Math.min(10, registry.drills.length);
    q('drill-start').click();
    expect(document.activeElement).not.toBe(document.body);
    for (let i = 0; i < n; i++) {
      host.querySelector<HTMLButtonElement>('[data-testid="drill-option"]')!.click();
      q('drill-next').click();
      expect(document.activeElement).not.toBe(document.body);
    }
    expect(document.activeElement).toBe(q('drill-summary'));
    dispose();
  });
});
