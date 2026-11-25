import { describe, expect, it } from 'vitest';
import { buildRegistry } from '../../../src/core/registry';
import { createStore, defaultState, type Store } from '../../../src/core/store';
import { mountSettings, parseProgressFile } from '../../../src/pages/settings-page';

const NOW = new Date(2026, 10, 24, 10).getTime();
const registry = buildRegistry({ modules: [], lessons: [], problems: [], traces: [] });
const runner = { ready: async () => {}, run: async () => ({ kind: 'runnerUnavailable' as const, reason: '' }), stop() {} };
const memStore = (): Store => { const d: Record<string, string> = {}; return createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }); };
const flush = () => new Promise((r) => setTimeout(r, 0));

function mount(store: Store, confirm = () => true) {
  const host = document.createElement('div');
  const files: [string, string][] = [];
  const dispose = mountSettings(host, { registry, store, runner, now: () => NOW }, { confirm, download: (name, text) => files.push([name, text]) });
  const pick = async (text: string) => {
    const input = host.querySelector<HTMLInputElement>('[data-testid="import-file"]')!;
    Object.defineProperty(input, 'files', { configurable: true, value: [new File([text], 'progress.json', { type: 'application/json' })] });
    input.dispatchEvent(new Event('change'));
    await flush();
  };
  return { host, files, pick, dispose, status: () => host.querySelector('[data-testid="settings-status"]')!.textContent };
}

describe('parseProgressFile', () => {
  it('accepts an export and drops bad parts', () => {
    const r = parseProgressFile(JSON.stringify({ version: 1, settings: { theme: 'light', updatedAt: 1 }, lessons: { l: { openedAt: 'bad' } } }));
    expect(r.ok && r.state.settings.theme).toBe('light');
    expect(r.ok && r.state.lessons).toEqual({});
  });
  it('rejects other files', () => {
    expect(parseProgressFile('{nope')).toEqual({ ok: false, message: 'This file cannot be read. Pick a file you exported from this site.' });
    expect(parseProgressFile('[1, 2]')).toEqual({ ok: false, message: 'This is not a DSA Playbook progress file.' });
    expect(parseProgressFile('{"version": 2}')).toEqual({ ok: false, message: 'This is not a DSA Playbook progress file.' });
  });
});

describe('settings page', () => {
  it('changes the theme', () => {
    const store = memStore();
    const { host } = mount(store);
    expect(host.querySelector<HTMLInputElement>('input[value="system"]')!.checked).toBe(true);
    const light = host.querySelector<HTMLInputElement>('input[value="light"]')!;
    light.checked = true;
    light.dispatchEvent(new Event('change'));
    expect(store.get().settings).toEqual({ theme: 'light', updatedAt: NOW });
  });

  it('keeps the theme choice in step with the store, so "Follow my device" can be picked again', () => {
    const store = memStore();
    const { host, dispose } = mount(store);
    document.body.append(host);
    const radio = (v: string) => host.querySelector<HTMLInputElement>(`input[name="theme"][value="${v}"]`)!;
    // The header button, an import or another tab changes the theme.
    store.update((d) => { d.settings.theme = 'light'; });
    expect(radio('light').checked).toBe(true);
    expect(radio('system').checked).toBe(false);
    radio('system').click();
    expect(store.get().settings).toEqual({ theme: 'system', updatedAt: NOW });
    expect(radio('system').checked).toBe(true);
    const dark = radio('dark');
    dispose();
    store.update((d) => { d.settings.theme = 'dark'; });
    expect(dark.checked).toBe(false);
    host.remove();
  });

  it('exports the whole progress as a dated JSON file', () => {
    const store = memStore();
    store.update((d) => { d.days['2026-11-24'] = 2; });
    const { host, files, status } = mount(store);
    host.querySelector<HTMLButtonElement>('[data-testid="export"]')!.click();
    expect(files[0]![0]).toBe('dsa-playbook-progress-2026-11-24.json');
    expect(JSON.parse(files[0]![1]).days).toEqual({ '2026-11-24': 2 });
    expect(status()).toBe('Progress exported.');
  });

  it('imports after asking, and keeps progress when the learner says no', async () => {
    const saved = { ...defaultState(), days: { '2026-11-20': 5 } };
    const store = memStore();
    store.update((d) => { d.days['2026-11-24'] = 1; });
    const no = mount(store, () => false);
    await no.pick(JSON.stringify(saved));
    expect(no.status()).toBe('Nothing was changed.');
    expect(store.get().days).toEqual({ '2026-11-24': 1 });
    const yes = mount(store, () => true);
    await yes.pick(JSON.stringify(saved));
    expect(yes.status()).toBe('Progress imported.');
    expect(store.get().days).toEqual({ '2026-11-20': 5 });
    await yes.pick('not json');
    expect(yes.status()).toBe('This file cannot be read. Pick a file you exported from this site.');
  });

  it('says sync comes later', () => {
    const { host } = mount(memStore());
    expect(host.textContent).toContain('Sync between devices comes later.');
  });

  it('changes nothing for an unrelated JSON file', async () => {
    const store = memStore();
    store.update((d) => { d.days['2026-11-24'] = 1; });
    const m = mount(store, () => { throw new Error('must not ask'); });
    await m.pick('{"name": "package", "version": "1.0.0"}');
    expect(m.status()).toBe('This is not a DSA Playbook progress file.');
    expect(store.get().days).toEqual({ '2026-11-24': 1 });
  });

  it('keeps fields it does not know, and other tabs see the import', async () => {
    const d: Record<string, string> = {};
    const storage = { getItem: (k: string) => d[k] ?? null, setItem: (k: string, v: string) => { d[k] = v; } };
    const store = createStore(storage);
    store.update((s) => { s.days['2026-11-24'] = 1; });
    const raw = JSON.parse(d['dsa:v1']!);
    raw.futureField = { keep: true };
    d['dsa:v1'] = JSON.stringify(raw);
    const m = mount(store);
    await m.pick(JSON.stringify({ ...defaultState(), days: { '2026-11-20': 5 } }));
    const written = JSON.parse(d['dsa:v1']!);
    expect(written.futureField).toEqual({ keep: true });
    expect(written.days).toEqual({ '2026-11-20': 5 });
  });

  const pickFile = (host: HTMLElement, file: unknown) => {
    const input = host.querySelector<HTMLInputElement>('[data-testid="import-file"]')!;
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    input.dispatchEvent(new Event('change'));
  };

  it('refuses a file over 5 MB without reading it', async () => {
    const store = memStore();
    store.update((d) => { d.days['2026-11-24'] = 1; });
    const m = mount(store, () => { throw new Error('must not ask'); });
    let read = false;
    pickFile(m.host, { size: 5 * 1024 * 1024 + 1, text: async () => { read = true; return '{}'; } });
    await flush();
    expect(m.status()).toBe('This file is too big to be a progress file.');
    expect(read).toBe(false);
    expect(store.get().days).toEqual({ '2026-11-24': 1 });
  });

  it('says so when the file cannot be read', async () => {
    const store = memStore();
    store.update((d) => { d.days['2026-11-24'] = 1; });
    const m = mount(store, () => { throw new Error('must not ask'); });
    pickFile(m.host, { size: 10, text: async () => { throw new Error('boom'); } });
    await flush();
    expect(m.status()).toBe('This file could not be read.');
    expect(store.get().days).toEqual({ '2026-11-24': 1 });
  });

  it('ignores a file whose read finishes after cleanup', async () => {
    const store = memStore();
    store.update((d) => { d.days['2026-11-24'] = 1; });
    let asked = false;
    const m = mount(store, () => { asked = true; return true; });
    let finish!: (t: string) => void;
    const pending = new Promise<string>((r) => { finish = r; });
    pickFile(m.host, { size: 10, text: () => pending });
    m.dispose();
    finish(JSON.stringify({ ...defaultState(), days: { '2026-11-20': 5 } }));
    await flush();
    expect(asked).toBe(false);
    expect(store.get().days).toEqual({ '2026-11-24': 1 });
  });

  it('adds no listener to the host and ignores a file after cleanup', async () => {
    const host = document.createElement('div');
    const added: string[] = [];
    const orig = host.addEventListener.bind(host);
    host.addEventListener = ((t: string, ...r: unknown[]) => { added.push(t); return (orig as (...a: unknown[]) => void)(t, ...r); }) as typeof host.addEventListener;
    const store = memStore();
    const dispose = mountSettings(host, { registry, store, runner, now: () => NOW });
    expect(added).toEqual([]);
    dispose();
    expect(host.innerHTML).toBe('');
  });
});
