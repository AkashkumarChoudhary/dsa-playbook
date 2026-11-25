import type { Catalog, Lesson, Module, Problem } from '../src/content-types';
import { buildRegistry, type ContentInput, type Registry } from '../src/core/registry';
import type { Card } from '../src/engine/cards';
import { parseMarkers } from '../src/engine/markers';
import { argExpression, toJavaLiteral } from '../src/lab/java-literals';
import { cardFingerprint } from './card-lock';
import { countWords, sentences, stripHtml } from './text';
import { TOPIC_TERMS } from './topic-order';

export interface Issue {
  level: 'error' | 'warn';
  where: string;
  message: string;
}

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PLACEHOLDER = /\b(TODO|TBD|lorem|rest of code)\b/i;
const PREVIEW = /you will learn/i;

export function formatIssues(issues: Issue[]): string {
  return issues.map((i) => `${i.level.toUpperCase()} ${i.where}: ${i.message}`).join('\n');
}

function prose(issues: Issue[], where: string, text: string, moduleOrder: number) {
  const plain = stripHtml(text);
  if (plain.includes('—')) issues.push({ level: 'error', where, message: 'uses an em dash (—). Use a full stop or a comma.' });
  if (plain.includes(';')) issues.push({ level: 'error', where, message: 'uses a semicolon. Split it into two sentences.' });
  if (PLACEHOLDER.test(text)) issues.push({ level: 'error', where, message: 'contains placeholder text.' });
  for (const s of sentences(text)) {
    const n = countWords(s);
    if (n > 30) issues.push({ level: 'error', where, message: `sentence has ${n} words (max 30): "${s.slice(0, 60)}…"` });
    else if (n > 20) issues.push({ level: 'warn', where, message: `sentence has ${n} words (aim for 20): "${s.slice(0, 60)}…"` });
  }
  const previews = sentences(text).filter((s) => PREVIEW.test(s));
  {
    for (const t of TOPIC_TERMS) {
      if (t.module > moduleOrder && t.pattern.test(plain) && !previews.some((s) => t.pattern.test(s))) {
        issues.push({ level: 'error', where, message: `uses "${t.label}" (taught in Module ${t.module}) without a "you will learn" preview.` });
      }
    }
  }
}

/** These fields go into the page through raw(), with no escaping, so they must not carry code. */
const UNSAFE_HTML: [RegExp, string][] = [
  [/<script/i, 'a <script> tag'],
  [/<iframe/i, 'an <iframe> tag'],
  [/<[^>]*\son[a-z]+\s*=/i, 'an on…= event attribute'],
  [/javascript:/i, 'a javascript: link'],
];

function safeHtml(issues: Issue[], where: string, fields: Record<string, string>) {
  for (const [name, value] of Object.entries(fields)) {
    for (const [pattern, what] of UNSAFE_HTML) {
      if (pattern.test(value)) issues.push({ level: 'error', where: `${where} ${name}`, message: `HTML has ${what}. Raw HTML must not run code.` });
    }
  }
}

function required(issues: Issue[], where: string, fields: Record<string, unknown>) {
  for (const [name, v] of Object.entries(fields)) {
    if (typeof v !== 'string' || v.trim() === '') issues.push({ level: 'error', where, message: `"${name}" is empty.` });
  }
}

function checkLesson(issues: Issue[], l: Lesson, order: number, input: ContentInput) {
  const w = `lesson ${l.id}`;
  if (!ID.test(l.id)) issues.push({ level: 'error', where: w, message: 'id must be lowercase kebab-case.' });
  required(issues, w, { title: l.title, summary: l.summary, example: l.example, everyday: l.everyday, deep: l.deep, 'spot.size': l.spot.size, 'spot.words': l.spot.words, 'spot.shape': l.spot.shape, 'spot.bottleneck': l.spot.bottleneck, 'template.title': l.template.title, 'template.java': l.template.java });
  if (PLACEHOLDER.test(l.template.java)) issues.push({ level: 'error', where: w, message: 'template java contains placeholder text.' });
  safeHtml(issues, w, { example: l.example, everyday: l.everyday, deep: l.deep });
  if (l.steps.length < 3 || l.steps.length > 6) issues.push({ level: 'error', where: w, message: `needs 3 to 6 steps, has ${l.steps.length}.` });
  if (l.quiz.length !== 3) issues.push({ level: 'error', where: w, message: `needs exactly 3 quiz questions, has ${l.quiz.length}.` });
  l.quiz.forEach((q, i) => {
    if (q.options.length < 2 || q.answer < 0 || q.answer >= q.options.length) issues.push({ level: 'error', where: `${w} quiz ${i + 1}`, message: 'answer must point at one of at least 2 options.' });
  });
  if (l.traps.length < 1) issues.push({ level: 'error', where: w, message: 'needs at least one trap.' });
  if (l.realLife.length < 1) issues.push({ level: 'error', where: w, message: 'needs at least one real-life use.' });
  l.realLife.forEach((r, i) => { if (r.tier === 'confirmed' && !r.source) issues.push({ level: 'error', where: `${w} realLife ${i + 1}`, message: 'a confirmed claim needs a source name.' }); });
  if (l.mistakes.length < 2 || l.mistakes.length > 3) issues.push({ level: 'error', where: w, message: 'needs 2 or 3 mistakes.' });
  if (l.interview.length < 2 || l.interview.length > 3) issues.push({ level: 'error', where: w, message: 'needs 2 or 3 interview points.' });
  if (l.complexityFacts.length < 1) issues.push({ level: 'error', where: w, message: 'needs at least one Big-O fact.' });

  const simple = [l.summary, l.example, l.everyday, ...l.steps.flatMap((s) => [s.title, s.text])].join('\n');
  const words = countWords(simple);
  if (words > 400) issues.push({ level: 'error', where: w, message: `simple part has ${words} words (max 400, aim for 350). Move detail to Go deeper.` });
  else if (words > 350) issues.push({ level: 'warn', where: w, message: `simple part has ${words} words (aim for 350).` });

  const texts: [string, string][] = [
    ['summary', l.summary], ['example', l.example], ['everyday', l.everyday], ['deep', l.deep],
    ...l.steps.map((s, i): [string, string] => [`step ${i + 1}`, `${s.title}. ${s.text}`]),
    ['spot.size', l.spot.size], ['spot.words', l.spot.words], ['spot.shape', l.spot.shape], ['spot.bottleneck', l.spot.bottleneck],
    ...l.traps.map((t, i): [string, string] => [`trap ${i + 1}`, `${t.looksLike} ${t.butIs} ${t.why}`]),
    ...l.complexityFacts.map((f, i): [string, string] => [`complexity fact ${i + 1}`, `${f.q} ${f.a} ${f.why}`]),
    ...l.realLife.map((r, i): [string, string] => [`realLife ${i + 1}`, r.text]),
    ...l.mistakes.map((m, i): [string, string] => [`mistake ${i + 1}`, m]),
    ...l.interview.map((m, i): [string, string] => [`interview ${i + 1}`, m]),
    ...l.quiz.map((q, i): [string, string] => [`quiz ${i + 1}`, `${q.q} ${q.options.join('. ')}. ${q.why}`]),
  ];
  for (const [name, text] of texts) prose(issues, `${w} ${name}`, text, order);

  for (const v of l.viz) {
    const def = input.traces.find((t) => t.id === v.traceId);
    if (!def) { issues.push({ level: 'error', where: w, message: `viz uses unknown trace "${v.traceId}".` }); continue; }
    try {
      const steps = def.run(v.input).steps.length;
      if (steps > def.maxSteps) issues.push({ level: 'error', where: w, message: `viz "${v.label}" makes ${steps} steps (max ${def.maxSteps}).` });
    } catch (err) {
      issues.push({ level: 'error', where: w, message: `viz "${v.label}" throws: ${String(err)}` });
    }
  }
  for (const id of l.problemIds) if (!input.problems.some((p) => p.id === id)) issues.push({ level: 'error', where: w, message: `links to unknown problem "${id}".` });
}

function checkProblem(issues: Issue[], p: Problem, order: number, input: ContentInput) {
  const w = `problem ${p.id}`;
  if (!ID.test(p.id)) issues.push({ level: 'error', where: w, message: 'id must be lowercase kebab-case.' });
  required(issues, w, { title: p.title, statement: p.statement, explain30: p.explain30, hook: p.hook, 'spot.prompt': p.spot.prompt, starter: p.starter });
  if (!p.source.url.startsWith('https://')) issues.push({ level: 'error', where: w, message: 'source url must start with https://.' });
  safeHtml(issues, w, { statement: p.statement });
  if (p.limits.length < 1) issues.push({ level: 'error', where: w, message: 'needs at least one limit.' });
  if (p.examples.length < 1) issues.push({ level: 'error', where: w, message: 'needs at least one example.' });
  if (p.hints.length !== 3) issues.push({ level: 'error', where: w, message: 'needs exactly 3 hints.' });
  if (p.edgeCases.length < 2) issues.push({ level: 'error', where: w, message: 'needs at least 2 edge cases.' });
  if (p.mistakes.length < 2) issues.push({ level: 'error', where: w, message: 'needs at least 2 mistakes.' });
  if (p.spot.options.length < 2 || p.spot.answer < 0 || p.spot.answer >= p.spot.options.length) issues.push({ level: 'error', where: w, message: 'spot answer must point at one of at least 2 options.' });
  if (p.spot.clues.length < 2) issues.push({ level: 'error', where: w, message: 'spot needs at least 2 clues.' });

  const levels = p.approaches.map((a) => a.level);
  if (!levels.includes('brute')) issues.push({ level: 'error', where: w, message: 'needs a brute force approach.' });
  if (!levels.includes('optimal')) issues.push({ level: 'error', where: w, message: 'needs an optimal approach.' });
  const orderOk = levels.every((lv, i) => i === 0 || ['brute', 'better', 'optimal'].indexOf(lv) > ['brute', 'better', 'optimal'].indexOf(levels[i - 1] as string));
  if (!orderOk) issues.push({ level: 'error', where: w, message: 'approaches must be in order brute, better, optimal, with no repeats.' });
  p.approaches.forEach((a, i) => {
    const aw = `${w} ${a.level}`;
    required(issues, aw, { title: a.title, idea: a.idea, java: a.java, time: a.time, space: a.space });
    if (i < p.approaches.length - 1 && !a.nextStepRemoves) issues.push({ level: 'error', where: aw, message: 'needs "nextStepRemoves".' });
    if (PLACEHOLDER.test(a.java)) issues.push({ level: 'error', where: aw, message: 'java contains placeholder text.' });
    try { parseMarkers(a.java); } catch (err) { issues.push({ level: 'error', where: aw, message: String(err) }); }
    if (a.traceId && !input.traces.some((t) => t.id === a.traceId)) issues.push({ level: 'error', where: aw, message: `uses unknown trace "${a.traceId}".` });
    if (!a.java.includes('class Solution')) issues.push({ level: 'error', where: aw, message: 'java must define class Solution.' });
  });
  if (!p.starter.includes('class Solution') || !p.starter.includes(p.spec.method)) issues.push({ level: 'error', where: w, message: 'starter must define class Solution and the method.' });

  const s = p.spec;
  if (!/^[a-z][A-Za-z0-9]*$/.test(s.method)) issues.push({ level: 'error', where: w, message: 'spec.method must be a Java method name.' });
  if (s.samples.length < 2) issues.push({ level: 'error', where: w, message: 'needs at least 2 sample tests.' });
  if (s.hidden.length < 3) issues.push({ level: 'error', where: w, message: 'needs at least 3 hidden tests.' });
  const all = [...s.samples, ...s.hidden, ...(s.speed ? [s.speed] : [])];
  const ids = new Set<string>();
  for (const t of all) {
    const tw = `${w} test ${t.id}`;
    if (!ID.test(t.id)) issues.push({ level: 'error', where: tw, message: 'test id must be lowercase kebab-case.' });
    if (ids.has(t.id)) issues.push({ level: 'error', where: tw, message: 'duplicate test id.' });
    ids.add(t.id);
    if (t.args.length !== s.params.length) { issues.push({ level: 'error', where: tw, message: `needs ${s.params.length} argument(s).` }); continue; }
    s.params.forEach((param, k) => {
      try { (t === s.speed ? argExpression : toJavaLiteral)(t.args[k], param.type); } catch (err) { issues.push({ level: 'error', where: tw, message: `${param.name}: ${(err as Error).message}` }); }
    });
    try { toJavaLiteral(t.expected, s.returns); } catch (err) { issues.push({ level: 'error', where: tw, message: `expected: ${(err as Error).message}` }); }
  }
  if (s.speed && !(s.speed.timeLimitMs > 0)) issues.push({ level: 'error', where: w, message: 'speed.timeLimitMs must be above 0.' });

  for (const link of [...p.related, ...p.lookAlikes]) {
    if (link.id && !input.problems.some((x) => x.id === link.id)) issues.push({ level: 'error', where: w, message: `links to unknown problem "${link.id}".` });
  }

  const texts: [string, string][] = [
    ['statement', p.statement], ['explain30', p.explain30], ['hook', p.hook], ['spot.prompt', p.spot.prompt],
    ...p.spot.options.map((o, i): [string, string] => [`spot option ${i + 1}`, o]),
    ...p.spot.clues.map((c, i): [string, string] => [`spot clue ${i + 1}`, c.text]),
    ...p.hints.map((h, i): [string, string] => [`hint ${i + 1}`, h]),
    ...p.approaches.flatMap((a): [string, string][] => [[`${a.level} idea`, a.idea], ...(a.nextStepRemoves ? [[`${a.level} nextStepRemoves`, a.nextStepRemoves] as [string, string]] : [])]),
    ...p.edgeCases.map((e, i): [string, string] => [`edge case ${i + 1}`, e]),
    ...p.mistakes.map((m, i): [string, string] => [`mistake ${i + 1}`, m]),
    ...p.examples.flatMap((e, i): [string, string][] => (e.note ? [[`example ${i + 1}`, e.note]] : [])),
    ...[...p.related, ...p.lookAlikes].map((r, i): [string, string] => [`link ${i + 1}`, r.why]),
  ];
  for (const [name, text] of texts) prose(issues, `${w} ${name}`, text, order);
}

function checkModule(issues: Issue[], m: Module, input: ContentInput) {
  const w = `module ${m.id}`;
  if (!ID.test(m.id)) issues.push({ level: 'error', where: w, message: 'id must be lowercase kebab-case.' });
  for (const id of m.lessonIds) {
    const l = input.lessons.find((x) => x.id === id);
    if (!l) issues.push({ level: 'error', where: w, message: `lists unknown lesson "${id}".` });
    else if (l.moduleId !== m.id) issues.push({ level: 'error', where: w, message: `lesson "${id}" says it belongs to "${l.moduleId}".` });
  }
  for (const id of m.problemIds) {
    const p = input.problems.find((x) => x.id === id);
    if (!p) issues.push({ level: 'error', where: w, message: `lists unknown problem "${id}".` });
    else if (p.moduleId !== m.id) issues.push({ level: 'error', where: w, message: `problem "${id}" says it belongs to "${p.moduleId}".` });
  }
  const texts: [string, string][] = [
    ['summary', m.summary],
    ...m.outcomes.map((o, i): [string, string] => [`outcome ${i + 1}`, o]),
    ...m.quiz.map((q, i): [string, string] => [`quiz ${i + 1}`, 'options' in q ? `${q.q} ${q.options.join('. ')}. ${q.why}` : `${q.q} ${q.answer}`]),
    ...m.cheatsheet.flatMap((c, i): [string, string][] => [[`cheatsheet ${i + 1} heading`, c.h], ...c.items.map((x, k): [string, string] => [`cheatsheet ${i + 1} item ${k + 1}`, x])]),
    ...m.glossary.map((g, i): [string, string] => [`glossary ${i + 1}`, g.def]),
  ];
  for (const [name, text] of texts) prose(issues, `${w} ${name}`, text, m.order);
  if (m.status === 'complete') {
    const mcq = m.quiz.filter((q) => !('type' in q)).length;
    const scenario = m.quiz.length - mcq;
    if (mcq < 8 || scenario < 2) issues.push({ level: 'error', where: w, message: `a complete module needs 8 or more quiz questions and 2 or more scenarios (has ${mcq} and ${scenario}).` });
    if (m.cheatsheet.length < 1) issues.push({ level: 'error', where: w, message: 'a complete module needs a cheat sheet.' });
    if (m.glossary.length < 1) issues.push({ level: 'error', where: w, message: 'a complete module needs glossary terms.' });
  }
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');

function duplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  return ids.filter((id) => (seen.has(id) ? true : (seen.add(id), false)));
}

/** The catalog on its own: ids, links between its parts, core problems and sheets. */
function checkCatalog(issues: Issue[], c: Catalog) {
  const kinds: [string, { id: string }[]][] = [['module', c.modules], ['lesson', c.lessons], ['pattern', c.patterns], ['problem', c.problems]];
  for (const [kind, items] of kinds) {
    for (const item of items) if (!ID.test(item.id)) issues.push({ level: 'error', where: `catalog ${kind} ${item.id}`, message: 'id must be lowercase kebab-case.' });
    for (const id of duplicates(items.map((i) => i.id))) issues.push({ level: 'error', where: `catalog ${kind} ${id}`, message: 'duplicate id.' });
  }
  const moduleIds = new Set(c.modules.map((m) => m.id));
  const patternById = new Map(c.patterns.map((p) => [p.id, p]));
  for (const l of c.lessons) {
    if (!moduleIds.has(l.moduleId)) issues.push({ level: 'error', where: `catalog lesson ${l.id}`, message: `unknown module "${l.moduleId}".` });
    if (l.patternId && !patternById.has(l.patternId)) issues.push({ level: 'error', where: `catalog lesson ${l.id}`, message: `unknown pattern "${l.patternId}".` });
  }
  for (const p of c.patterns) {
    const lesson = c.lessons.find((l) => l.id === p.lessonId);
    if (!moduleIds.has(p.moduleId)) issues.push({ level: 'error', where: `catalog pattern ${p.id}`, message: `unknown module "${p.moduleId}".` });
    if (!lesson || lesson.patternId !== p.id || lesson.moduleId !== p.moduleId) issues.push({ level: 'error', where: `catalog pattern ${p.id}`, message: `lesson "${p.lessonId}" must be in module "${p.moduleId}" and name this pattern.` });
    if (!c.problems.some((x) => x.core && x.patternIds.includes(p.id))) issues.push({ level: 'error', where: `catalog pattern ${p.id}`, message: 'needs at least 1 core problem.' });
  }
  for (const p of c.problems) {
    const w = `catalog problem ${p.id}`;
    if (!moduleIds.has(p.moduleId)) issues.push({ level: 'error', where: w, message: `unknown module "${p.moduleId}".` });
    if (p.patternIds.length < 1 || p.patternIds.length > 2) issues.push({ level: 'error', where: w, message: 'needs 1 or 2 patterns.' });
    for (const id of p.patternIds) if (!patternById.has(id)) issues.push({ level: 'error', where: w, message: `unknown pattern "${id}".` });
    if (!p.url.startsWith('https://')) issues.push({ level: 'error', where: w, message: 'url must start with https://.' });
    for (const sheet of p.sheets) {
      if (!c.sheets.find((s) => s.id === sheet)?.problemIds.includes(p.id)) issues.push({ level: 'error', where: w, message: `says it is on sheet "${sheet}", but that sheet does not list it.` });
    }
  }
  const problemById = new Map(c.problems.map((p) => [p.id, p]));
  for (const s of c.sheets) {
    const w = `sheet ${s.id}`;
    for (const id of s.problemIds) {
      const p = problemById.get(id);
      if (!p) issues.push({ level: 'error', where: w, message: `lists unknown problem "${id}".` });
      else if (!p.sheets.includes(s.id)) issues.push({ level: 'error', where: w, message: `lists "${id}", but that problem does not name this sheet.` });
    }
    for (const id of duplicates(s.problemIds)) issues.push({ level: 'error', where: w, message: `lists "${id}" twice.` });
    if (s.id === 'neetcode150' && s.problemIds.length !== 150) issues.push({ level: 'error', where: w, message: `must have exactly 150 problems, has ${s.problemIds.length}.` });
  }
}

/** Every built module, lesson and problem must be in the catalog, with the same facts. */
function checkBuiltAgainstCatalog(issues: Issue[], input: ContentInput, c: Catalog) {
  for (const m of input.modules) {
    const cm = c.modules.find((x) => x.id === m.id);
    if (!cm) issues.push({ level: 'error', where: `module ${m.id}`, message: 'is not in the catalog (content/catalog/modules.ts).' });
    else if (cm.order !== m.order || cm.level !== m.level) issues.push({ level: 'error', where: `module ${m.id}`, message: 'order and level must match the catalog.' });
  }
  for (const l of input.lessons) {
    const cl = c.lessons.find((x) => x.id === l.id);
    if (!cl) issues.push({ level: 'error', where: `lesson ${l.id}`, message: 'is not in the catalog (content/catalog/lessons.ts).' });
    else if (cl.moduleId !== l.moduleId) issues.push({ level: 'error', where: `lesson ${l.id}`, message: `the catalog puts it in module "${cl.moduleId}".` });
  }
  for (const p of input.problems) {
    const cp = c.problems.find((x) => x.id === p.id);
    const w = `problem ${p.id}`;
    if (!cp) { issues.push({ level: 'error', where: w, message: 'is not in the catalog. Add it to docs/curriculum/problem-map.md and run npm run build:catalog.' }); continue; }
    if (cp.moduleId !== p.moduleId) issues.push({ level: 'error', where: w, message: `the catalog puts it in module "${cp.moduleId}".` });
    if (!sameSet(cp.patternIds, p.patternIds)) issues.push({ level: 'error', where: w, message: `patternIds must match the catalog (${cp.patternIds.join(', ')}).` });
    if (!sameSet(cp.sheets, p.sheets)) issues.push({ level: 'error', where: w, message: `sheets must match the catalog (${cp.sheets.join(', ') || 'none'}).` });
    if (cp.difficulty !== p.difficulty) issues.push({ level: 'error', where: w, message: `difficulty must match the catalog (${cp.difficulty}).` });
    if (cp.core !== p.core) issues.push({ level: 'error', where: w, message: `core must match the catalog (${cp.core}).` });
  }
}

const DRILL_KINDS = ['interview', 'lookalike', 'reallife'];

/** Hand-written drill items follow the writing rules. Every item, made or written, accepts known patterns. */
function checkDrills(issues: Issue[], input: ContentInput, registry: Registry) {
  const c = input.catalog;
  const orderOf = (moduleId: string) => c?.modules.find((m) => m.id === moduleId)?.order ?? input.modules.find((m) => m.id === moduleId)?.order;
  for (const id of duplicates(registry.drills.map((d) => d.id))) issues.push({ level: 'error', where: `drill ${id}`, message: 'duplicate id.' });
  for (const d of input.drills ?? []) {
    const w = `drill ${d.id}`;
    if (!ID.test(d.id)) issues.push({ level: 'error', where: w, message: 'id must be lowercase kebab-case.' });
    if (!DRILL_KINDS.includes(d.kind)) issues.push({ level: 'error', where: w, message: `kind must be one of ${DRILL_KINDS.join(', ')}.` });
    required(issues, w, { prompt: d.prompt, clueExplanation: d.clueExplanation });
    safeHtml(issues, w, { prompt: d.prompt });
    const order = orderOf(d.moduleId);
    if (order === undefined) { issues.push({ level: 'error', where: w, message: `unknown module "${d.moduleId}".` }); continue; }
    const texts: [string, string][] = [['prompt', d.prompt], ['clueExplanation', d.clueExplanation], ...(d.limits ?? []).map((l, i): [string, string] => [`limit ${i + 1}`, l])];
    for (const [name, text] of texts) prose(issues, `${w} ${name}`, text, order);
  }
  if (!c) return;
  for (const d of registry.drills) {
    if (d.acceptedPatternIds.length === 0) issues.push({ level: 'error', where: `drill ${d.id}`, message: 'needs at least one accepted pattern.' });
    for (const id of d.acceptedPatternIds) if (!c.patterns.some((p) => p.id === id)) issues.push({ level: 'error', where: `drill ${d.id}`, message: `accepts unknown pattern "${id}".` });
  }
}

/**
 * Card ids hold learner progress. A list card is `<id>:<kind>-<index>`, so removing an item from the
 * middle of a list shifts every later id. The lock file records each id with the start of its front.
 */
export function checkCardIds(cards: Card[], lock: Record<string, string>): Issue[] {
  const issues: Issue[] = [];
  const now = new Map(cards.map((c) => [c.id, cardFingerprint(c)]));
  for (const id of duplicates(cards.map((c) => c.id))) issues.push({ level: 'error', where: `card ${id}`, message: 'duplicate card id.' });
  for (const [id, print] of Object.entries(lock)) {
    const current = now.get(id);
    if (current === undefined) issues.push({ level: 'warn', where: `card ${id}`, message: 'is gone, so learners lose its progress. Only remove list items from the end of a list.' });
    else if (current !== print) issues.push({ level: 'warn', where: `card ${id}`, message: 'now shows a different item. Was an item removed from the middle of a list? If you only fixed the wording, run npm run cards:lock.' });
  }
  for (const id of now.keys()) if (!(id in lock)) issues.push({ level: 'warn', where: `card ${id}`, message: 'is new. Run npm run cards:lock to record it.' });
  return issues;
}

export interface CheckOptions {
  /** the saved content/card-ids.json */
  cardLock?: Record<string, string>;
}

export function checkContent(input: ContentInput, opts: CheckOptions = {}): Issue[] {
  const issues: Issue[] = [];
  let registry: Registry;
  try {
    registry = buildRegistry(input);
  } catch (err) {
    return [{ level: 'error', where: 'registry', message: (err as Error).message }];
  }
  if (input.catalog) {
    checkCatalog(issues, input.catalog);
    checkBuiltAgainstCatalog(issues, input, input.catalog);
  }
  checkDrills(issues, input, registry);
  if (opts.cardLock) issues.push(...checkCardIds(registry.cards, opts.cardLock));
  const orderOf = (moduleId: string) => input.modules.find((m) => m.id === moduleId)?.order;
  for (const m of input.modules) checkModule(issues, m, input);
  for (const l of input.lessons) {
    const order = orderOf(l.moduleId);
    if (order === undefined) { issues.push({ level: 'error', where: `lesson ${l.id}`, message: `unknown module "${l.moduleId}".` }); continue; }
    checkLesson(issues, l, order, input);
  }
  for (const p of input.problems) {
    const order = orderOf(p.moduleId);
    if (order === undefined) { issues.push({ level: 'error', where: `problem ${p.id}`, message: `unknown module "${p.moduleId}".` }); continue; }
    checkProblem(issues, p, order, input);
  }
  const terms = new Map<string, string>();
  for (const m of input.modules) {
    for (const g of m.glossary) {
      for (const name of [g.term, ...g.aka]) {
        const key = name.toLowerCase();
        const owner = terms.get(key);
        if (owner) issues.push({ level: 'error', where: `module ${m.id}`, message: `glossary term "${name}" is already used in module ${owner}.` });
        else terms.set(key, m.id);
      }
    }
  }
  return issues;
}
