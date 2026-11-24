import { html, type SafeHtml } from '../core/html';

export function renderNotFound(): SafeHtml {
  return html`<h1>Page not found</h1><p>This page does not exist. <a href="#/">Go to the start</a>.</p>`;
}
