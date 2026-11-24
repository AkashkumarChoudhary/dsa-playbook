import { describe, expect, it } from 'vitest';
import { codeBlock, highlightJavaLines } from '../../../src/engine/highlight';
import { createCodePanel } from '../../../src/engine/pieces/code-panel';

describe('highlight', () => {
  it('returns one entry per line and marks keywords', () => {
    const lines = highlightJavaLines('class A {\n  return 1;\n}');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('tok-keyword');
    expect(lines.join('')).not.toContain('<script');
  });
  it('escapes code text', () => {
    expect(highlightJavaLines('String s = "<b>";').join('')).toContain('&lt;b&gt;');
  });
  it('codeBlock marks the active line', () => {
    const out = codeBlock('a\nb', { activeLine: 2 }).__html;
    expect(out).toContain('data-line="2"');
    expect(out).toMatch(/class="ln active" data-line="2"/);
  });
});

describe('createCodePanel', () => {
  it('highlights the line for a marker', () => {
    const panel = createCodePanel('int a; // @L:one\nint b; // @L:two');
    panel.setActive('two');
    expect(panel.el.querySelector('.ln.active')?.getAttribute('data-line')).toBe('2');
    panel.setActive(null);
    expect(panel.el.querySelector('.ln.active')).toBeNull();
    expect(panel.el.textContent).not.toContain('@L:');
  });
});
