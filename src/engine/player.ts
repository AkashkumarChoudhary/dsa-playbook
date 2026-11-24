import type { Snapshot, Trace } from './trace';

export interface Scheduler {
  setTimeout(fn: () => void, ms: number): number;
  clearTimeout(id: number): void;
}

export type Speed = 0.5 | 1 | 2;
export const BASE_DWELL_MS = 1400;

const browserScheduler: Scheduler = {
  setTimeout: (fn, ms) => window.setTimeout(fn, ms),
  clearTimeout: (id) => window.clearTimeout(id),
};

export class Player {
  private idx = 0;
  private timer: number | null = null;
  private listeners = new Set<() => void>();
  playing = false;
  speed: Speed = 1;

  constructor(
    private readonly trace: Trace,
    private readonly scheduler: Scheduler = browserScheduler,
  ) {
    if (trace.steps.length === 0) throw new Error('A trace needs at least one step');
  }

  get index(): number {
    return this.idx;
  }
  get total(): number {
    return this.trace.steps.length;
  }
  get current(): Snapshot {
    return this.trace.steps[this.idx] as Snapshot;
  }
  get atEnd(): boolean {
    return this.idx === this.total - 1;
  }

  play(): void {
    if (this.playing) return;
    if (this.atEnd) this.idx = 0;
    this.playing = true;
    this.emit();
    this.schedule();
  }

  pause(): void {
    if (!this.playing) return;
    this.playing = false;
    this.clear();
    this.emit();
  }

  toggle(): void {
    if (this.playing) this.pause();
    else this.play();
  }

  next(): void {
    this.stopSilently();
    if (!this.atEnd) this.idx++;
    this.emit();
  }

  back(): void {
    this.stopSilently();
    if (this.idx > 0) this.idx--;
    this.emit();
  }

  reset(): void {
    this.stopSilently();
    this.idx = 0;
    this.emit();
  }

  setSpeed(s: Speed): void {
    this.speed = s;
    if (this.playing) this.schedule();
    this.emit();
  }

  onChange(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  dispose(): void {
    this.clear();
    this.playing = false;
    this.listeners.clear();
  }

  private stopSilently(): void {
    this.playing = false;
    this.clear();
  }

  private schedule(): void {
    this.clear();
    this.timer = this.scheduler.setTimeout(() => {
      this.timer = null;
      if (!this.playing) return;
      if (!this.atEnd) this.idx++;
      if (this.atEnd) this.playing = false;
      this.emit();
      if (this.playing) this.schedule();
    }, BASE_DWELL_MS / this.speed);
  }

  private clear(): void {
    if (this.timer !== null) {
      this.scheduler.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private emit(): void {
    for (const cb of this.listeners) cb();
  }
}
