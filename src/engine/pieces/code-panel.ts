import { codeBlock } from '../highlight';
import { parseMarkers } from '../markers';

export interface CodePanel {
  el: HTMLElement;
  setActive(marker: string | null): void;
}

export function createCodePanel(javaWithMarkers: string): CodePanel {
  const { code, lines } = parseMarkers(javaWithMarkers);
  const el = document.createElement('div');
  el.className = 'code-panel';
  el.innerHTML = codeBlock(code).__html;
  const pre = el.querySelector('pre') as HTMLElement;
  return {
    el,
    setActive(marker) {
      el.querySelectorAll('.ln.active').forEach((n) => n.classList.remove('active'));
      if (!marker) return;
      const n = lines[marker];
      if (n === undefined) return;
      const lineEl = el.querySelector<HTMLElement>(`.ln[data-line="${n}"]`);
      if (!lineEl) return;
      lineEl.classList.add('active');
      const target = lineEl.offsetTop - pre.clientHeight / 2;
      pre.scrollTop = Math.max(0, target);
    },
  };
}
