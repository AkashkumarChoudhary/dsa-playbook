export interface RawTestOutput {
  id: string;
  finished: boolean;
  ok: boolean;
  actual?: unknown;
  error?: string;
  ms: number;
  stdout: string;
}

interface EndLine {
  id: string;
  ok: boolean;
  ms: number;
  actual?: unknown;
  error?: string;
}

const END = '@@END ';

export function parseHarnessOutput(lines: string[], ids: string[]): { tests: RawTestOutput[]; stray: string } {
  const byId = new Map<string, RawTestOutput>();
  const stray: string[] = [];
  let current: RawTestOutput | null = null;
  const addText = (text: string) => {
    if (current) current.stdout += (current.stdout ? '\n' : '') + text;
    else stray.push(text);
  };
  for (const line of lines) {
    if (line.startsWith('@@BEGIN ')) {
      const id = line.slice(8).trim();
      current = { id, finished: false, ok: false, ms: 0, stdout: '' };
      byId.set(id, current);
      continue;
    }
    const at = line.indexOf(END);
    if (at >= 0) {
      let data: EndLine;
      try {
        data = JSON.parse(line.slice(at + END.length)) as EndLine;
      } catch {
        addText(line);
        continue;
      }
      // Learner code may print without a newline, so the end line can arrive glued to its text.
      if (at > 0) addText(line.slice(0, at));
      const t = byId.get(data.id) ?? { id: data.id, finished: false, ok: false, ms: 0, stdout: '' };
      t.finished = true;
      t.ok = data.ok;
      t.ms = data.ms;
      t.actual = data.actual;
      t.error = data.error;
      byId.set(data.id, t);
      current = null;
      continue;
    }
    addText(line);
  }
  const tests = ids.map((id) => byId.get(id) ?? { id, finished: false, ok: false, ms: 0, stdout: '' });
  return { tests, stray: stray.join('\n') };
}
