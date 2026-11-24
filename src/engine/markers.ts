export interface MarkedSource {
  code: string;
  lines: Record<string, number>;
}

const MARKER = /\s*\/\/\s*@L:([a-z][a-zA-Z0-9-]*)\s*$/;

export function parseMarkers(src: string): MarkedSource {
  const lines: Record<string, number> = {};
  const out = src.replace(/\r\n/g, '\n').split('\n').map((line, i) => {
    const m = MARKER.exec(line);
    if (!m) return line;
    const name = m[1] as string;
    if (name in lines) throw new Error(`Duplicate line marker "${name}" on line ${i + 1}`);
    lines[name] = i + 1;
    return line.slice(0, m.index);
  });
  return { code: out.join('\n'), lines };
}
