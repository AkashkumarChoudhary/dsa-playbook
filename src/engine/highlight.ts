import { javaLanguage } from '@codemirror/lang-java';
import { classHighlighter, highlightCode } from '@lezer/highlight';
import { escapeHtml, raw, type SafeHtml } from '../core/html';

export function highlightJavaLines(code: string): string[] {
  const tree = javaLanguage.parser.parse(code);
  const lines: string[] = [];
  let current = '';
  highlightCode(
    code,
    tree,
    classHighlighter,
    (text, classes) => {
      current += classes ? `<span class="${classes}">${escapeHtml(text)}</span>` : escapeHtml(text);
    },
    () => {
      lines.push(current);
      current = '';
    },
  );
  lines.push(current);
  return lines;
}

export function codeBlock(code: string, opts: { activeLine?: number; label?: string } = {}): SafeHtml {
  const body = highlightJavaLines(code)
    .map((l, i) => {
      const n = i + 1;
      const cls = opts.activeLine === n ? 'ln active' : 'ln';
      return `<span class="${cls}" data-line="${n}">${l || ' '}</span>`;
    })
    .join('');
  const label = escapeHtml(opts.label ?? 'Java code');
  return raw(`<pre class="code" tabindex="0" aria-label="${label}"><code>${body}</code></pre>`);
}
