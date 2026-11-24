import { createArrayPiece, type Piece } from './pieces/array-piece';
import { createCodePanel } from './pieces/code-panel';
import { createHashPiece } from './pieces/hash-piece';
import { createVarsPanel } from './pieces/vars-panel';
import { Player, type Speed } from './player';
import type { TraceDef, View } from './trace';

export interface PlayerViewOptions {
  trace: TraceDef;
  java: string;
  input: unknown;
  title: string;
  reducedMotion?: boolean;
  autoplayInView?: boolean;
}

export interface PlayerViewHandle {
  el: HTMLElement;
  player(): Player;
  dispose(): void;
}

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function button(action: string, label: string, text: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.dataset.action = action;
  b.setAttribute('aria-label', label);
  b.textContent = text;
  return b;
}

export function mountPlayerView(host: HTMLElement, opts: PlayerViewOptions): PlayerViewHandle {
  const reduced = opts.reducedMotion ?? prefersReducedMotion();
  const el = document.createElement('section');
  el.className = 'player';
  el.tabIndex = 0;
  el.setAttribute('aria-label', `Dry run: ${opts.title}. Use left and right arrow keys to step.`);

  const head = document.createElement('div');
  head.className = 'player-head';
  const h = document.createElement('h4');
  h.textContent = opts.title;
  const count = document.createElement('span');
  count.className = 'player-count';
  head.append(h, count);

  const stage = document.createElement('div');
  stage.className = 'player-stage';
  const side = document.createElement('div');
  side.className = 'player-side';
  const vars = createVarsPanel();
  const code = createCodePanel(opts.java);
  side.append(vars.el, code.el);

  const note = document.createElement('p');
  note.className = 'player-note';
  note.setAttribute('aria-live', 'polite');

  const controls = document.createElement('div');
  controls.className = 'player-controls';
  const playBtn = button('play', 'Play', '▶ Play');
  controls.append(button('reset', 'Reset', '⏮ Reset'), button('back', 'Step back', '◀ Back'), playBtn, button('next', 'Step forward', 'Step ▶'));
  const speedWrap = document.createElement('span');
  speedWrap.className = 'speed';
  speedWrap.append('Speed');
  const speedBtns = ([0.5, 1, 2] as Speed[]).map((s) => {
    const b = button(`speed-${s}`, `Speed ${s} times`, `${s}×`);
    speedWrap.append(b);
    return b;
  });
  controls.append(speedWrap);

  const form = document.createElement('div');
  form.className = 'player-input';
  const inputs = new Map<string, HTMLInputElement>();
  const initialValues = opts.trace.formatInput(opts.input);
  for (const f of opts.trace.inputFields) {
    const label = document.createElement('label');
    label.textContent = `Your own ${f.label}`;
    const input = document.createElement('input');
    input.name = f.name;
    input.placeholder = f.placeholder;
    input.value = initialValues[f.name] ?? '';
    label.append(input);
    form.append(label);
    inputs.set(f.name, input);
  }
  const runInput = button('run-input', 'Run with your input', 'Run my input');
  const error = document.createElement('p');
  error.className = 'error';
  error.setAttribute('role', 'status');
  if (opts.trace.inputFields.length > 0) form.append(runInput, error);

  el.append(head, stage, side, note, controls);
  if (opts.trace.inputFields.length > 0) el.append(form);
  host.append(el);

  const pieces = new Map<string, Piece<View>>();
  let player = new Player(opts.trace.run(opts.input));
  let off = player.onChange(draw);

  function pieceFor(view: View): Piece<View> {
    let p = pieces.get(view.id);
    if (!p) {
      p = (view.kind === 'array' ? createArrayPiece() : createHashPiece()) as Piece<View>;
      pieces.set(view.id, p);
    }
    return p;
  }

  function draw() {
    const s = player.current;
    count.textContent = `Step ${player.index + 1} of ${player.total}`;
    note.textContent = s.note;
    const shown = new Set<string>();
    s.views.forEach((view, i) => {
      const p = pieceFor(view);
      p.update(view);
      shown.add(view.id);
      // Only move the node when it is out of place. Re-inserting it would cancel the slide transitions.
      if (stage.children[i] !== p.el) stage.insertBefore(p.el, stage.children[i] ?? null);
    });
    for (const [id, p] of pieces) if (!shown.has(id)) p.el.remove();
    vars.update(s.vars, s.changed);
    code.setActive(s.line);
    playBtn.textContent = player.playing ? '⏸ Pause' : '▶ Play';
    playBtn.setAttribute('aria-label', player.playing ? 'Pause' : 'Play');
    speedBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(([0.5, 1, 2] as Speed[])[i] === player.speed)));
  }

  controls.addEventListener('click', (e) => {
    const action = (e.target as HTMLElement).closest('button')?.dataset.action;
    if (action === 'reset') player.reset();
    else if (action === 'back') player.back();
    else if (action === 'play') player.toggle();
    else if (action === 'next') player.next();
    else if (action?.startsWith('speed-')) player.setSpeed(Number(action.slice(6)) as Speed);
  });

  el.addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') { player.next(); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { player.back(); e.preventDefault(); }
    else if (e.key === ' ') { player.toggle(); e.preventDefault(); }
  });

  runInput.addEventListener('click', () => {
    const fields: Record<string, string> = {};
    for (const [name, input] of inputs) fields[name] = input.value;
    const parsed = opts.trace.parseInput(fields);
    if (!parsed.ok) { error.textContent = parsed.message; return; }
    const trace = opts.trace.run(parsed.value);
    if (trace.steps.length > opts.trace.maxSteps) { error.textContent = 'This input makes too many steps to show. Try a shorter one.'; return; }
    error.textContent = '';
    off();
    player.dispose();
    player = new Player(trace);
    off = player.onChange(draw);
    draw();
  });

  let observer: IntersectionObserver | null = null;
  if ((opts.autoplayInView ?? true) && !reduced && typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) { if (!player.atEnd) player.play(); }
        else player.pause();
      }
    }, { threshold: [0, 0.35] });
    observer.observe(el);
  }

  draw();

  return {
    el,
    player: () => player,
    dispose() {
      observer?.disconnect();
      off();
      player.dispose();
      el.remove();
    },
  };
}

export interface VizItem {
  label: string;
  trace: TraceDef;
  java: string;
  input: unknown;
}

export function mountVizGroup(host: HTMLElement, items: VizItem[], opts: { reducedMotion?: boolean; autoplayInView?: boolean } = {}): () => void {
  const tabs = document.createElement('div');
  tabs.className = 'viz-tabs';
  tabs.setAttribute('role', 'group');
  tabs.setAttribute('aria-label', 'Choose a dry run');
  const body = document.createElement('div');
  host.append(...(items.length > 1 ? [tabs] : []), body);
  let current: PlayerViewHandle | null = null;
  const buttons = items.map((item, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = item.label;
    b.addEventListener('click', () => show(i));
    tabs.append(b);
    return b;
  });
  function show(i: number) {
    const item = items[i];
    if (!item) return;
    current?.dispose();
    current = mountPlayerView(body, { trace: item.trace, java: item.java, input: item.input, title: item.label, ...opts });
    buttons.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
  }
  show(0);
  return () => {
    current?.dispose();
    tabs.remove();
    body.remove();
  };
}
