import { describe, expect, it } from 'vitest';
import { buildRegistry } from '../../../src/core/registry';
import { createStore } from '../../../src/core/store';
import { renderRoute } from '../../../src/pages/router-view';

const store = () => { const d: Record<string, string> = {}; return createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }); };
const runner = { ready: async () => {}, run: async () => ({ kind: 'runnerUnavailable' as const, reason: '' }), stop() {} };

describe('renderRoute', () => {
  it('shows the not-found page for an unknown sheet id', () => {
    const outlet = document.createElement('main');
    const registry = buildRegistry({ modules: [], lessons: [], problems: [], traces: [] });
    const page = renderRoute({ name: 'sheet', id: 'no-such-sheet' }, outlet, { registry, store: store(), runner });
    expect(page.title).toBe('Not found · DSA Playbook');
    expect(outlet.textContent).toContain('Page not found');
    expect(() => page.cleanup()).not.toThrow();
  });
});
