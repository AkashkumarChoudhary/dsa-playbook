import { createOutputLimit } from './output-limit';
import type { RunWorkerMessage, RunWorkerRequest } from './teavm-protocol';

const ctx = self as unknown as {
  postMessage(m: RunWorkerMessage): void;
  onmessage: ((e: MessageEvent<RunWorkerRequest>) => void) | null;
};

let limit = createOutputLimit();

function send(text: string): void {
  for (const line of text.split('\n')) {
    for (const out of limit(line)) ctx.postMessage({ type: 'line', text: out });
  }
}

ctx.onmessage = async (e) => {
  const { wasm, runtimeUrl } = e.data;
  // The output limit covers one whole run.
  limit = createOutputLimit();
  const capture = (...args: unknown[]) => send(args.map(String).join(' '));
  console.log = capture;
  console.info = capture;
  console.error = capture;
  try {
    const rt = (await import(/* @vite-ignore */ runtimeUrl)) as {
      load(url: string): Promise<{ exports: { main(args: string[]): unknown } }>;
    };
    const url = URL.createObjectURL(new Blob([wasm.buffer as ArrayBuffer], { type: 'application/wasm' }));
    const app = await rt.load(url);
    await app.exports.main([]);
    ctx.postMessage({ type: 'done' });
  } catch (err) {
    ctx.postMessage({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
