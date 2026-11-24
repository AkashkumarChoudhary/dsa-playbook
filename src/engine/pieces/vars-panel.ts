export function createVarsPanel(): { el: HTMLElement; update(vars: Record<string, string>, changed: string[]): void } {
  const el = document.createElement('dl');
  el.className = 'vars';
  el.setAttribute('aria-label', 'Variables');
  return {
    el,
    update(vars, changed) {
      el.innerHTML = '';
      for (const [name, value] of Object.entries(vars)) {
        const row = document.createElement('div');
        row.className = changed.includes(name) ? 'var changed' : 'var';
        row.dataset.name = name;
        const dt = document.createElement('dt');
        dt.textContent = name;
        const dd = document.createElement('dd');
        dd.textContent = value;
        row.append(dt, dd);
        el.append(row);
      }
    },
  };
}
