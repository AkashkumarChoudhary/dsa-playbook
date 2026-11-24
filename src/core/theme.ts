import type { Store, ThemeSetting } from './store';

export type ResolvedTheme = 'dark' | 'light';

export interface ThemeControl {
  current(): ResolvedTheme;
  toggle(): void;
}

export function resolveTheme(setting: ThemeSetting, prefersLight: boolean): ResolvedTheme {
  if (setting === 'system') return prefersLight ? 'light' : 'dark';
  return setting;
}

export function initTheme(win: Window, store: Store): ThemeControl {
  const mql = typeof win.matchMedia === 'function' ? win.matchMedia('(prefers-color-scheme: light)') : null;
  const current = (): ResolvedTheme => resolveTheme(store.get().settings.theme, mql?.matches ?? false);
  const apply = () => {
    win.document.documentElement.dataset.theme = current();
  };
  apply();
  mql?.addEventListener?.('change', apply);
  store.subscribe(apply);
  return {
    current,
    toggle() {
      const next: ThemeSetting = current() === 'dark' ? 'light' : 'dark';
      store.update((s) => {
        s.settings.theme = next;
        s.settings.updatedAt = Date.now();
      });
    },
  };
}
