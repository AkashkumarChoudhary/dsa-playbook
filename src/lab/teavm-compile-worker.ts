import type { CompileWorkerRequest, CompileWorkerResponse, TeaVMDiagnostic } from './teavm-protocol';

interface TeaVMCompiler {
  setSdk(b: Int8Array): void;
  setTeaVMClasslib(b: Int8Array): void;
  onDiagnostic(listener: (d: TeaVMDiagnostic) => void): unknown;
  clearSourceFiles(): void;
  clearOutputFiles(): void;
  addSourceFile(path: string, content: string): void;
  compile(): boolean;
  generateWebAssembly(o: { outputName: string; mainClass: string }): Promise<boolean>;
  getWebAssemblyOutputFile(path: string): Int8Array | null;
}

const ctx = self as unknown as {
  postMessage(m: CompileWorkerResponse, transfer?: Transferable[]): void;
  onmessage: ((e: MessageEvent<CompileWorkerRequest>) => void) | null;
};

let compiler: TeaVMCompiler | null = null;
let diags: TeaVMDiagnostic[] = [];

async function bytes(url: string): Promise<Int8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`could not load ${url} (${res.status})`);
  return new Int8Array(await res.arrayBuffer());
}

async function init(assetBase: string): Promise<void> {
  const rt = (await import(/* @vite-ignore */ `${assetBase}compiler.wasm-runtime.js`)) as {
    load(url: string): Promise<{ exports: { createCompiler(): TeaVMCompiler } }>;
  };
  const teavm = await rt.load(`${assetBase}compiler.wasm`);
  const c = teavm.exports.createCompiler();
  const [sdk, classlib] = await Promise.all([bytes(`${assetBase}compile-classlib-teavm.bin`), bytes(`${assetBase}runtime-classlib-teavm.bin`)]);
  c.setSdk(sdk);
  c.setTeaVMClasslib(classlib);
  c.onDiagnostic((d) => {
    diags.push({ type: d.type, severity: d.severity, fileName: String(d.fileName ?? ''), lineNumber: Number(d.lineNumber ?? 0), message: String(d.message ?? '') });
  });
  compiler = c;
}

ctx.onmessage = async (e) => {
  const msg = e.data;
  if (msg.type === 'init') {
    try {
      await init(msg.assetBase);
      ctx.postMessage({ type: 'ready' });
    } catch (err) {
      ctx.postMessage({ type: 'loadError', message: err instanceof Error ? err.message : String(err) });
    }
    return;
  }
  if (!compiler) {
    ctx.postMessage({ type: 'compiled', id: msg.id, ok: false, diagnostics: [{ type: 'teavm', severity: 'error', fileName: '', lineNumber: 0, message: 'The Java compiler is not loaded.' }] });
    return;
  }
  diags = [];
  compiler.clearSourceFiles();
  compiler.clearOutputFiles();
  for (const f of msg.files) compiler.addSourceFile(f.name, f.content);
  let ok = compiler.compile();
  let wasm: Int8Array | undefined;
  if (ok) {
    ok = await compiler.generateWebAssembly({ outputName: 'app', mainClass: 'Main' });
    const out = ok ? compiler.getWebAssemblyOutputFile('app.wasm') : null;
    if (out) wasm = out.slice();
    else ok = false;
  }
  ctx.postMessage({ type: 'compiled', id: msg.id, ok, diagnostics: diags, wasm }, wasm ? [wasm.buffer as ArrayBuffer] : []);
};
