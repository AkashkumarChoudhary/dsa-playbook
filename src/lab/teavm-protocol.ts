export interface TeaVMDiagnostic {
  type: 'javac' | 'teavm';
  severity: 'error' | 'warning' | 'other';
  fileName: string;
  lineNumber: number;
  message: string;
}

export type CompileWorkerRequest =
  | { type: 'init'; assetBase: string }
  | { type: 'compile'; id: number; files: { name: string; content: string }[] };

export type CompileWorkerResponse =
  | { type: 'ready' }
  | { type: 'loadError'; message: string }
  | { type: 'compiled'; id: number; ok: boolean; diagnostics: TeaVMDiagnostic[]; wasm?: Int8Array };

export interface RunWorkerRequest {
  type: 'run';
  wasm: Int8Array;
  runtimeUrl: string;
}

export type RunWorkerMessage = { type: 'line'; text: string } | { type: 'done' } | { type: 'error'; message: string };
