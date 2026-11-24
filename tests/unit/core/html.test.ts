import { describe, expect, it } from 'vitest';
import { escapeHtml, html, raw, render } from '../../../src/core/html';

describe('html', () => {
  it('escapes interpolated strings', () => {
    expect(html`<p>${'<b>&"\''}</p>`.__html).toBe('<p>&lt;b&gt;&amp;&quot;&#39;</p>');
  });
  it('passes SafeHtml through and joins arrays', () => {
    const items = ['a', 'b'].map((x) => html`<li>${x}</li>`);
    expect(html`<ul>${items}</ul>`.__html).toBe('<ul><li>a</li><li>b</li></ul>');
    expect(html`<div>${raw('<i>x</i>')}</div>`.__html).toBe('<div><i>x</i></div>');
  });
  it('drops null, undefined and false', () => {
    expect(html`<p>${null}${undefined}${false}${0}</p>`.__html).toBe('<p>0</p>');
  });
  it('escapeHtml handles all five characters', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });
  it('render sets innerHTML', () => {
    const el = document.createElement('div');
    render(el, html`<span>${'hi'}</span>`);
    expect(el.innerHTML).toBe('<span>hi</span>');
  });
});
