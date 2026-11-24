import { describe, expect, it } from 'vitest';

describe('test setup', () => {
  it('runs in a DOM environment', () => {
    const el = document.createElement('div');
    el.textContent = 'ok';
    expect(el.textContent).toBe('ok');
  });
});
