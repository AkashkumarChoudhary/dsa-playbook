import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Problem } from '../src/content-types';
import { parseMarkers } from '../src/engine/markers';
import { generateHarness } from '../src/lab/harness';
import { parseHarnessOutput } from '../src/lab/parse-output';
import { buildResults, planTests } from '../src/lab/results';

export interface VerifyIssue {
  problemId: string;
  approach: string;
  testId?: string;
  message: string;
}

function run(cmd: string, args: string[], cwd: string, timeout: number): { ok: true; out: string } | { ok: false; out: string } {
  try {
    const out = execFileSync(cmd, args, { cwd, timeout, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
    return { ok: true, out };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message: string };
    return { ok: false, out: `${e.stderr ?? ''}${e.stdout ?? ''}`.trim() || e.message };
  }
}

function compile(dir: string, files: Record<string, string>): { ok: boolean; out: string } {
  mkdirSync(join(dir, 'out'), { recursive: true });
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
  return run('javac', ['--release', '21', '-encoding', 'UTF-8', '-d', 'out', ...Object.keys(files)], dir, 120_000);
}

export function verifyProblemOnJdk(problem: Problem, workDir: string): VerifyIssue[] {
  const issues: VerifyIssue[] = [];
  const spec = problem.spec;

  const starterDir = join(workDir, problem.id, 'starter');
  mkdirSync(starterDir, { recursive: true });
  const starter = compile(starterDir, { 'Solution.java': problem.starter, 'Main.java': generateHarness(spec, spec.samples) });
  if (!starter.ok) issues.push({ problemId: problem.id, approach: 'starter', message: `javac failed: ${starter.out}` });

  for (const approach of problem.approaches) {
    const dir = join(workDir, problem.id, approach.level);
    mkdirSync(dir, { recursive: true });
    const all = planTests(spec, 'all');
    const planned = approach.level === 'optimal' ? all : all.filter((t) => t.kind !== 'speed');
    const compiled = compile(dir, { 'Solution.java': parseMarkers(approach.java).code, 'Main.java': generateHarness(spec, planned) });
    if (!compiled.ok) {
      issues.push({ problemId: problem.id, approach: approach.level, message: `javac failed: ${compiled.out}` });
      continue;
    }
    const exec = run('java', ['-Xss64m', '-cp', 'out', 'Main'], dir, 120_000);
    const parsed = parseHarnessOutput(exec.out.split('\n'), planned.map((p) => p.id));
    const results = buildResults(spec, planned, parsed.tests, exec.ok ? 'Did not finish.' : `The program stopped: ${exec.out.slice(0, 300)}`);
    for (const r of results) {
      if (!r.pass) {
        issues.push({ problemId: problem.id, approach: approach.level, testId: r.id, message: r.error ?? `expected ${r.expected}, got ${r.actual}` });
      }
    }
  }
  return issues;
}
