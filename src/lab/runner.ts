import type { ProblemSpec, TestCase } from '../content-types';

export type TestKind = 'sample' | 'custom' | 'hidden' | 'speed';

export interface TestResult {
  id: string;
  kind: TestKind;
  pass: boolean;
  input: string;
  expected: string;
  actual: string;
  stdout: string;
  timeMs: number;
  error?: string;
}

export type RunResult =
  | { kind: 'compileError'; errors: { line: number; message: string }[] }
  | { kind: 'tests' | 'timeout' | 'stopped'; results: TestResult[]; stdout: string }
  | { kind: 'runnerUnavailable'; reason: string };

export interface RunRequest {
  code: string;
  spec: ProblemSpec;
  mode: 'samples' | 'all';
  extraTests?: TestCase[];
  timeLimitMs: number;
}

export interface JavaRunner {
  ready(onProgress?: (message: string) => void): Promise<void>;
  run(req: RunRequest): Promise<RunResult>;
  stop(): void;
}
