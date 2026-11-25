import { html, render } from '../core/html';
import { normalize, type StoredState, type ThemeSetting } from '../core/store';
import { dayKey } from '../engine/days';
import { clockOf } from './clock';
import type { PageContext } from './router-view';

export interface SettingsDeps {
  confirm?: (message: string) => boolean;
  /** saves a text file. The default makes the browser download it. */
  download?: (fileName: string, text: string) => void;
}

const THEMES: { value: ThemeSetting; label: string }[] = [
  { value: 'system', label: 'Follow my device' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

function browserDownload(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Reads an exported progress file. It must be JSON with `version: 1`. `normalize` drops anything invalid. */
export function parseProgressFile(text: string): { ok: true; state: StoredState } | { ok: false; message: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, message: 'This file cannot be read. Pick a file you exported from this site.' };
  }
  if (typeof raw !== 'object' || raw === null || (raw as { version?: unknown }).version !== 1) {
    return { ok: false, message: 'This is not a DSA Playbook progress file.' };
  }
  return { ok: true, state: normalize(raw) };
}

/** `#/settings`: theme, export and import (spec §7.1, §12.2). Sync comes in Part 1d. */
export function mountSettings(host: HTMLElement, ctx: PageContext, deps: SettingsDeps = {}): () => void {
  const now = clockOf(ctx);
  const confirmFn = deps.confirm ?? ((m: string) => window.confirm(m));
  const download = deps.download ?? browserDownload;
  const theme = ctx.store.get().settings.theme;
  render(host, html`
    <h1>Settings</h1>
    <section aria-labelledby="set-theme"><h2 id="set-theme">Theme</h2>
      <fieldset class="theme-choice"><legend class="visually-hidden">Theme</legend>
        ${THEMES.map((t) => html`<label><input type="radio" name="theme" value="${t.value}" ${t.value === theme ? 'checked' : ''} /> ${t.label}</label>`)}
      </fieldset>
    </section>
    <section aria-labelledby="set-progress"><h2 id="set-progress">Your progress</h2>
      <p>Your progress lives in this browser. Export it to keep a copy, or to move it to another device.</p>
      <p><button type="button" data-testid="export">⬇️ Export progress</button></p>
      <p><label class="import-label">⬆️ Import progress <input type="file" accept="application/json,.json" data-testid="import-file" /></label></p>
      <p class="settings-status" data-testid="settings-status" role="status"></p>
    </section>
    <section aria-labelledby="set-sync"><h2 id="set-sync">Sync</h2>
      <p class="muted">Sync between devices comes later. Until then, use Export and Import.</p>
    </section>`);
  const status = host.querySelector('[data-testid="settings-status"]') as HTMLElement;
  // Every listener uses this signal, so cleanup removes them all.
  const ac = new AbortController();
  const { signal } = ac;

  const themeInputs = [...host.querySelectorAll<HTMLInputElement>('input[name="theme"]')];
  themeInputs.forEach((input) =>
    input.addEventListener('change', () => {
      ctx.store.update((d) => {
        d.settings.theme = input.value as ThemeSetting;
        d.settings.updatedAt = now();
      });
    }, { signal }),
  );
  // The header button, an import or another tab can change the theme. Keep the choice in step.
  const offTheme = ctx.store.subscribe((state) => {
    for (const input of themeInputs) input.checked = input.value === state.settings.theme;
  });
  host.querySelector('[data-testid="export"]')!.addEventListener('click', () => {
    download(`dsa-playbook-progress-${dayKey(now())}.json`, `${JSON.stringify(ctx.store.get(), null, 2)}\n`);
    status.textContent = 'Progress exported.';
  }, { signal });
  const fileInput = host.querySelector('[data-testid="import-file"]') as HTMLInputElement;
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      fileInput.value = '';
      status.textContent = 'This file is too big to be a progress file.';
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      if (signal.aborted) return;
      fileInput.value = '';
      status.textContent = 'This file could not be read.';
      return;
    }
    if (signal.aborted) return;
    const parsed = parseProgressFile(text);
    fileInput.value = '';
    if (!parsed.ok) {
      status.textContent = parsed.message;
      return;
    }
    if (!confirmFn('Replace all your progress with this file? This cannot be undone.')) {
      status.textContent = 'Nothing was changed.';
      return;
    }
    ctx.store.update((d) => { Object.assign(d, parsed.state); });
    status.textContent = 'Progress imported.';
  }, { signal });
  return () => {
    offTheme();
    ac.abort();
    host.innerHTML = '';
  };
}
