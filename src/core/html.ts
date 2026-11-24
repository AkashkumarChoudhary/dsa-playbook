export interface SafeHtml {
  readonly __html: string;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isSafe(v: unknown): v is SafeHtml {
  return typeof v === 'object' && v !== null && '__html' in v;
}

function part(v: unknown): string {
  if (v === null || v === undefined || v === false) return '';
  if (Array.isArray(v)) return v.map(part).join('');
  if (isSafe(v)) return v.__html;
  return escapeHtml(String(v));
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): SafeHtml {
  let out = strings[0] ?? '';
  for (let i = 0; i < values.length; i++) {
    out += part(values[i]) + (strings[i + 1] ?? '');
  }
  return { __html: out };
}

export function raw(s: string): SafeHtml {
  return { __html: s };
}

export function render(el: Element, content: SafeHtml): void {
  el.innerHTML = content.__html;
}
