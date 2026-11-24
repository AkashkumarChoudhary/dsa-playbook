# Part 1a: Engine, Java Lab and Model Lesson Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the site shell, the dry-run player, the in-browser Java lab (TeaVM), the lesson and problem pages, CI/CD, and the model lesson `brute-better-optimal` with the model problem Contains Duplicate, ready for owner review.

**Architecture:** Vite + strict TypeScript single-page app with hash routes. There is no UI framework: pages are rendered with an escaping `html` template tag, and stateful widgets (player, lab) are small classes or functions that own their DOM. Content (modules, lessons, problems, traces, Java files) lives in `content/` as typed TS objects and raw `.java` files, collected by one registry. Java runs in two module workers: a persistent compile worker (teavm-javac → WasmGC) and a throwaway run worker per run. A generated Java harness prints one JSON line per test, and the same harness runs on a real JDK in CI.

**Tech Stack:** Vite 8, TypeScript 7 (strict), Vitest 5 + happy-dom 21, Playwright 1.65, CodeMirror 6 (`codemirror`, `@codemirror/lang-java`), `@lezer/highlight` 1.2, TeaVM teavm-javac (self-hosted, `playground/4` build), JDK 21 (CI and tools), GitHub Actions + GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-23-dsa-playbook-design.md`. Java runner decision: `docs/decisions/0001-java-runner.md`.

## Global Constraints

- Repo dir `/home/akashkumar/Documents/Learning/repos/dsa`, GitHub `AkashkumarChoudhary/dsa-playbook`, Pages base path **`/dsa-playbook/`**.
- **No `git commit` / `git push` in this plan.** The owner will decide the commit plan. Tasks end with a **Checkpoint** line instead.
- TypeScript `strict: true`. No UI framework. No external images: use emoji, CSS and inline SVG only.
- Hash routes only: `#/`, `#/m/:id`, `#/l/:id`, `#/p/:id`.
- Works from a **360 px** phone to desktop, with no sideways page scroll. Dark and light themes. Dark is the default, and the site follows the system setting until the user toggles. `prefers-reduced-motion` means no movement and no autoplay.
- Animation: only slides, fades and color changes, `--dur: 300ms`. Same colors everywhere: current (blue), discarded (grey), range (yellow), answer (green), conflict (red).
- Lesson and problem prose follow `CONTENT-RULES.md`:
  - Sentences of 20 words or fewer. More than 20 is a warning, more than 30 is an error.
  - Simple part about 350 words or fewer. More than 350 is a warning, more than 400 is an error.
  - **No em dashes (—) and no semicolons in prose.**
  - Plain words, with every new term explained the first time.
  - No topic used before it is taught unless the text says "you will learn".
- LocalStorage key `dsa:v1`. Only add fields to the stored state. Never rename them.
- Java lab: the user writes `class Solution`. The harness is generated. Optimal solutions must pass every test including the speed test. Brute and better solutions must pass every test except the speed test.
- TeaVM assets are self-hosted under `public/runner/teavm/` with `THIRD_PARTY_NOTICES.md` and a credit line in the lab.
- Ids never change once published. Ids are lowercase kebab-case.

---

## File structure (created by this plan)

```
package.json, tsconfig.json, vite.config.ts, vitest.tools.config.ts, playwright.config.ts, index.html
.github/workflows/ci.yml
AGENTS.md  CONTENT-RULES.md  THIRD_PARTY_NOTICES.md  README.md
scripts/fetch-teavm.mjs                     download + hash-check TeaVM assets
public/runner/teavm/                        compiler.wasm, compiler.wasm-runtime.js, *.bin, VERSION.json
src/
  main.ts                                   boot
  global.d.ts                               window.__dsa typing
  content-types.ts                          Module, Lesson, Problem, ProblemSpec, ...
  core/html.ts                              html``, raw(), escapeHtml()
  core/registry.ts                          buildRegistry(), allRoutes()
  core/router.ts                            parseRoute(), href(), startRouter()
  core/store.ts                             createStore() (local-first state)
  core/theme.ts                             initTheme()
  engine/markers.ts                         parseMarkers() for // @L:name
  engine/highlight.ts                       highlightJavaLines(), codeBlock()
  engine/trace.ts                           Snapshot/Trace/TraceDef types, createRecorder(), parseIntList()
  engine/player.ts                          Player state machine
  engine/pieces/array-piece.ts              array + pointers view
  engine/pieces/hash-piece.ts               set / map view
  engine/pieces/vars-panel.ts               variables view
  engine/pieces/code-panel.ts               Java code with active line
  engine/player-view.ts                     mountPlayerView(), mountVizGroup()
  engine/quiz.ts                            mountQuiz()
  lab/java-literals.ts                      toJavaLiteral(), isGenerator()
  lab/harness.ts                            generateHarness()
  lab/parse-output.ts                       parseHarnessOutput()
  lab/compare.ts                            compareValues()
  lab/format.ts                             formatValue(), formatArgs()
  lab/results.ts                            planTests(), buildResults()
  lab/runner.ts                             JavaRunner types
  lab/teavm-protocol.ts                     worker message types
  lab/teavm-compile-worker.ts               compiler worker
  lab/teavm-run-worker.ts                   run worker
  lab/teavm-runner.ts                       TeaVMRunner, mapCompileErrors()
  lab/editor.ts                             createEditor() (CodeMirror)
  lab/lab-view.ts                           mountLab()
  pages/shell.ts                            top bar, sidebar, outlet
  pages/home.ts, module-page.ts, not-found.ts
  pages/lesson-page.ts                      mountLessonPage()
  pages/spot-first.ts                       mountSpotFirst()
  pages/problem-page.ts                     mountProblemPage()
  pages/router-view.ts                      renderRoute()
  styles/*.css
content/
  index.ts                                  contentInput (all content)
  modules/01-foundations/module.ts
  modules/01-foundations/lessons/brute-better-optimal.ts
  modules/01-foundations/problems/contains-duplicate/{problem.ts, spec.json, Starter.java, Brute.java, Better.java, Optimal.java, trace.ts}
tools/
  text.ts                                   stripHtml(), countWords(), sentences()
  topic-order.ts                            TOPIC_TERMS
  content-check.ts                          checkContent()
  verify-java.ts                            verifyProblemOnJdk()
tests/
  unit/**.test.ts                           Vitest (happy-dom)
  content/traces.test.ts                    trace correctness
  tools/*.test.ts                           content check + JDK checks (node env)
  e2e/*.spec.ts                             Playwright
```

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.tools.config.ts`, `playwright.config.ts`, `index.html`, `src/main.ts`, `src/global.d.ts`, `tests/unit/scaffold.test.ts`, `tests/e2e/boot.spec.ts`
- Modify: `.gitignore` (already exists; leave as is)

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `preview`, `typecheck`, `test`, `check:content`, `verify:java`, `e2e`, `test:e2e`, `ci`. Vite base `/dsa-playbook/`. Vitest default env `happy-dom`, including `tests/unit/**` and `tests/content/**`. Tools config (env `node`) including `tests/tools/**`.

- [ ] **Step 1: Install packages**

Run in `/home/akashkumar/Documents/Learning/repos/dsa`:

```bash
npm init -y
npm pkg set name=dsa-playbook private=true type=module
npm pkg delete main
npm i codemirror@^6 @codemirror/lang-java@^6 @codemirror/state@^6 @codemirror/view@^6 @codemirror/commands@^6 @lezer/highlight@^1.2
npm i -D typescript@^7 vite@^8 vitest@^5 happy-dom@^21 @playwright/test@^1.65 @types/node@^24
```

- [ ] **Step 2: Add scripts**

```bash
npm pkg set scripts.dev="vite" \
  scripts.build="vite build" \
  scripts.preview="vite preview --port 4173 --strictPort" \
  scripts.typecheck="tsc --noEmit" \
  scripts.test="vitest run" \
  scripts.check:content="vitest run -c vitest.tools.config.ts content-check" \
  scripts.verify:java="vitest run -c vitest.tools.config.ts verify-java" \
  scripts.e2e="playwright test" \
  scripts.test:e2e="npm run build && playwright test" \
  scripts.ci="npm run typecheck && npm run check:content && npm test && npm run verify:java && npm run test:e2e"
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client", "node"]
  },
  "include": ["src", "content", "tools", "tests", "vite.config.ts", "vitest.tools.config.ts", "playwright.config.ts"]
}
```

- [ ] **Step 4: Write `vite.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/dsa-playbook/',
  build: { target: 'es2022' },
  worker: { format: 'es' },
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.ts', 'tests/content/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Write `vitest.tools.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/tools/**/*.test.ts'],
    testTimeout: 300_000,
    hookTimeout: 300_000,
  },
});
```

- [ ] **Step 6: Write `playwright.config.ts`**

Locally, the cached Playwright Chromium may not match the installed version, so local runs use system Google Chrome (`channel: 'chrome'`). CI installs the matching Chromium.

```ts
import { defineConfig, devices } from '@playwright/test';

const channel = process.env.CI ? undefined : 'chrome';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173/dsa-playbook/', channel },
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173/dsa-playbook/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel } }],
});
```

- [ ] **Step 7: Write `index.html`**

```html
<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>DSA Playbook</title>
    <meta name="description" content="Learn DSA from zero to interview-ready. Spot the pattern, watch the dry run, write Java." />
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧩</text></svg>" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 8: Write `src/global.d.ts` and a temporary `src/main.ts`**

`src/global.d.ts`:

```ts
export {};

declare global {
  interface Window {
    __dsa?: { routes: string[] };
  }
}
```

`src/main.ts` (replaced in Task 17):

```ts
const app = document.getElementById('app');
if (app) app.innerHTML = '<main><h1>DSA Playbook</h1></main>';
```

- [ ] **Step 9: Write the scaffold tests**

`tests/unit/scaffold.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

describe('test setup', () => {
  it('runs in a DOM environment', () => {
    const el = document.createElement('div');
    el.textContent = 'ok';
    expect(el.textContent).toBe('ok');
  });
});
```

`tests/e2e/boot.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('the site boots', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(page).toHaveTitle(/DSA Playbook/);
});
```

- [ ] **Step 10: Run everything**

Run: `npm run typecheck && npm test && npm run test:e2e`
Expected: typecheck passes, 1 unit test passes, 1 e2e test passes.

If Vite 8, Vitest 5 or TypeScript 7 reject an option above, fix the config to the nearest working equivalent and note the change in the task report. Do not downgrade a major version without telling the owner.

**Checkpoint:** scaffold builds and tests run.

---

### Task 2: Safe HTML helper

**Files:**
- Create: `src/core/html.ts`
- Test: `tests/unit/core/html.test.ts`

**Interfaces:**
- Produces:
  - `interface SafeHtml { readonly __html: string }`
  - `escapeHtml(s: string): string`
  - `html(strings, ...values): SafeHtml`. Escapes strings and numbers. Passes `SafeHtml` through. Joins arrays. Drops `null`, `undefined` and `false`.
  - `raw(s: string): SafeHtml` (for trusted content HTML from `content/`)
  - `render(el: Element, content: SafeHtml): void`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { escapeHtml, html, raw, render } from '../../../src/core/html';

describe('html', () => {
  it('escapes interpolated strings', () => {
    expect(html`<p>${'<b>&"\''}</p>`.__html).toBe('<p>&lt;b&gt;&amp;&quot;&#39;</p>');
  });
  it('passes SafeHtml through and joins arrays', () => {
    const items = ['a', 'b'].map((x) => html`<li>${x}</li>`);
    expect(html`<ul>${items}</ul>`.__html).toBe('<ul><li>a</li><li>b</li></ul>');
    expect(html`<div>${raw('<i>x</i>')}</div>`.__html).toBe('<div><i>x</i></div>');
  });
  it('drops null, undefined and false', () => {
    expect(html`<p>${null}${undefined}${false}${0}</p>`.__html).toBe('<p>0</p>');
  });
  it('escapeHtml handles all five characters', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });
  it('render sets innerHTML', () => {
    const el = document.createElement('div');
    render(el, html`<span>${'hi'}</span>`);
    expect(el.innerHTML).toBe('<span>hi</span>');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/core/html.test.ts`
Expected: FAIL (cannot resolve `src/core/html`).

- [ ] **Step 3: Implement `src/core/html.ts`**

```ts
export interface SafeHtml {
  readonly __html: string;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isSafe(v: unknown): v is SafeHtml {
  return typeof v === 'object' && v !== null && '__html' in v;
}

function part(v: unknown): string {
  if (v === null || v === undefined || v === false) return '';
  if (Array.isArray(v)) return v.map(part).join('');
  if (isSafe(v)) return v.__html;
  return escapeHtml(String(v));
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): SafeHtml {
  let out = strings[0] ?? '';
  for (let i = 0; i < values.length; i++) {
    out += part(values[i]) + (strings[i + 1] ?? '');
  }
  return { __html: out };
}

export function raw(s: string): SafeHtml {
  return { __html: s };
}

export function render(el: Element, content: SafeHtml): void {
  el.innerHTML = content.__html;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/core/html.test.ts`
Expected: PASS (5 tests).

**Checkpoint:** html helper done.

---

### Task 3: Content types and registry

**Files:**
- Create: `src/content-types.ts`, `src/engine/trace.ts` (types only in this task, helpers come in Task 7), `src/core/registry.ts`, `content/index.ts`
- Test: `tests/unit/core/registry.test.ts`

**Interfaces:**
- Produces (`src/content-types.ts`): the types below, used by every later task.
- Produces (`src/core/registry.ts`):
  - `interface ContentInput { modules: Module[]; lessons: Lesson[]; problems: Problem[]; traces: TraceDef[] }`
  - `interface Registry { modules: Module[]; lessonIds: string[]; problemIds: string[]; module(id): Module | undefined; lesson(id): Lesson | undefined; problem(id): Problem | undefined; trace(id): TraceDef | undefined; approachForTrace(traceId): Approach | undefined }`
  - `buildRegistry(input: ContentInput): Registry`. Sorts modules by `order` and throws `Error('Duplicate <kind> id: <id>')` on duplicates.
  - `allRoutes(registry: Registry): string[]`, which returns `['#/', '#/m/<id>'…, '#/l/<id>'…, '#/p/<id>'…]`.
- Produces (`content/index.ts`): `export const contentInput: ContentInput`. Empty for now and filled in Task 20.

- [ ] **Step 1: Write `src/engine/trace.ts` (types part)**

```ts
export type MarkColor = 'current' | 'discarded' | 'range' | 'answer' | 'conflict';

export interface ArrayView {
  kind: 'array';
  id: string;
  label: string;
  values: (number | string)[];
  pointers: { name: string; index: number }[];
  marks: { index: number; color: MarkColor }[];
}

export interface HashView {
  kind: 'hash';
  id: string;
  label: string;
  mode: 'set' | 'map';
  entries: { key: string; value?: string }[];
  highlightKey?: string;
  highlightColor?: MarkColor;
}

export type View = ArrayView | HashView;

export interface Snapshot {
  /** name of a `// @L:name` marker in the Java source */
  line: string;
  vars: Record<string, string>;
  /** names of vars whose value changed since the previous step */
  changed: string[];
  views: View[];
  /** one plain sentence for this step */
  note: string;
}

export interface Trace {
  steps: Snapshot[];
  result: unknown;
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; message: string };

export interface InputField {
  name: string;
  label: string;
  placeholder: string;
}

// eslint-style note: `any` lets the registry hold traces with different input types.
export interface TraceDef<I = any> {
  id: string;
  maxSteps: number;
  inputFields: InputField[];
  parseInput(fields: Record<string, string>): ParseResult<I>;
  formatInput(input: I): Record<string, string>;
  fromArgs(args: unknown[]): I;
  run(input: I): Trace;
}
```

- [ ] **Step 2: Write `src/content-types.ts`**

```ts
import type { TraceDef } from './engine/trace';

export type { TraceDef };

export type Level = 'basics' | 'core' | 'hard' | 'advanced' | 'interview';
export type Tier = 'confirmed' | 'educational';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ClueKind = 'size' | 'words' | 'shape' | 'bottleneck';

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface ScenarioQuestion {
  type: 'scenario';
  q: string;
  answer: string;
}

export interface GlossaryTerm {
  term: string;
  aka: string[];
  def: string;
}

export interface Module {
  id: string;
  order: number;
  level: Level;
  icon: string;
  title: string;
  summary: string;
  /** 'building' relaxes module-level minimums in the content check */
  status: 'building' | 'complete';
  outcomes: string[];
  lessonIds: string[];
  problemIds: string[];
  quiz: (QuizQuestion | ScenarioQuestion)[];
  cheatsheet: { h: string; items: string[] }[];
  glossary: GlossaryTerm[];
}

export interface PictureStep {
  icon: string;
  title: string;
  text: string;
}

export interface SpotClues {
  size: string;
  words: string;
  shape: string;
  bottleneck: string;
}

export interface Trap {
  looksLike: string;
  butIs: string;
  why: string;
}

export interface RealLife {
  text: string;
  tier: Tier;
  /** required when tier is 'confirmed'; a plain source name, no URL */
  source?: string;
}

export interface ComplexityFact {
  q: string;
  a: string;
  why: string;
}

export interface VizRef {
  label: string;
  traceId: string;
  input: unknown;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  minutes: number;
  summary: string;
  /** trusted HTML */
  example: string;
  /** trusted HTML */
  everyday: string;
  steps: PictureStep[];
  viz: VizRef[];
  /** trusted HTML for "Go deeper" */
  deep: string;
  spot: SpotClues;
  traps: Trap[];
  template: { title: string; java: string };
  complexityFacts: ComplexityFact[];
  realLife: RealLife[];
  mistakes: string[];
  interview: string[];
  quiz: QuizQuestion[];
  problemIds: string[];
}

export type JavaType =
  | 'int'
  | 'long'
  | 'double'
  | 'boolean'
  | 'char'
  | 'String'
  | 'int[]'
  | 'int[][]'
  | 'char[][]'
  | 'String[]'
  | 'List<Integer>'
  | 'List<String>'
  | 'List<List<Integer>>'
  | 'List<List<String>>';

export type CompareMode = 'exact' | 'unorderedList' | 'unorderedNested' | 'float';

export type ArgGenerator = { gen: 'intRange'; n: number } | { gen: 'intConst'; n: number; value: number };

export interface Param {
  name: string;
  type: JavaType;
}

export interface TestCase {
  id: string;
  args: unknown[];
  expected: unknown;
}

export interface SpeedTest extends TestCase {
  timeLimitMs: number;
}

export interface ProblemSpec {
  className: 'Solution';
  method: string;
  params: Param[];
  returns: JavaType;
  compare: CompareMode;
  samples: TestCase[];
  hidden: TestCase[];
  speed?: SpeedTest;
}

export interface Approach {
  level: 'brute' | 'better' | 'optimal';
  title: string;
  idea: string;
  /** raw Java source with optional // @L:name markers */
  java: string;
  time: string;
  space: string;
  /** what repeated work the next approach removes; required on all but the last */
  nextStepRemoves?: string;
  traceId?: string;
}

export interface SpotFirst {
  prompt: string;
  options: string[];
  answer: number;
  clues: { kind: ClueKind; text: string }[];
}

export interface ProblemLink {
  title: string;
  why: string;
  /** set when the problem exists on this site */
  id?: string;
}

export interface Problem {
  id: string;
  moduleId: string;
  title: string;
  patternIds: string[];
  difficulty: Difficulty;
  core: boolean;
  sheets: string[];
  source: { name: string; url: string };
  /** trusted HTML */
  statement: string;
  limits: string[];
  examples: { input: string; output: string; note?: string }[];
  spot: SpotFirst;
  hints: [string, string, string];
  approaches: Approach[];
  edgeCases: string[];
  mistakes: string[];
  explain30: string;
  hook: string;
  related: ProblemLink[];
  lookAlikes: ProblemLink[];
  spec: ProblemSpec;
  starter: string;
}
```

- [ ] **Step 3: Write the failing registry test**

`tests/unit/core/registry.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { allRoutes, buildRegistry, type ContentInput } from '../../../src/core/registry';
import type { Lesson, Module, Problem } from '../../../src/content-types';
import type { TraceDef } from '../../../src/engine/trace';

const mod = (id: string, order: number): Module => ({
  id, order, level: 'basics', icon: '🧱', title: id, summary: 's', status: 'building',
  outcomes: [], lessonIds: [], problemIds: [], quiz: [], cheatsheet: [], glossary: [],
});

const trace: TraceDef = {
  id: 'p1/optimal', maxSteps: 10, inputFields: [],
  parseInput: () => ({ ok: true, value: {} }), formatInput: () => ({}), fromArgs: () => ({}),
  run: () => ({ steps: [], result: null }),
};

const problem = {
  id: 'p1', moduleId: 'b', title: 'P1',
  approaches: [{ level: 'optimal', title: 'o', idea: 'i', java: 'class Solution {}', time: 'O(n)', space: 'O(1)', traceId: 'p1/optimal' }],
} as unknown as Problem;

const lesson = { id: 'l1', moduleId: 'b', title: 'L1' } as unknown as Lesson;

const input = (): ContentInput => ({ modules: [mod('b', 2), mod('a', 1)], lessons: [lesson], problems: [problem], traces: [trace] });

describe('buildRegistry', () => {
  it('sorts modules by order and finds items by id', () => {
    const r = buildRegistry(input());
    expect(r.modules.map((m) => m.id)).toEqual(['a', 'b']);
    expect(r.module('b')?.order).toBe(2);
    expect(r.lesson('l1')?.title).toBe('L1');
    expect(r.problem('p1')?.title).toBe('P1');
    expect(r.trace('p1/optimal')?.maxSteps).toBe(10);
    expect(r.approachForTrace('p1/optimal')?.level).toBe('optimal');
    expect(r.lesson('missing')).toBeUndefined();
  });
  it('throws on duplicate ids', () => {
    const i = input();
    i.lessons.push({ ...lesson });
    expect(() => buildRegistry(i)).toThrow('Duplicate lesson id: l1');
  });
  it('lists every route', () => {
    expect(allRoutes(buildRegistry(input()))).toEqual(['#/', '#/m/a', '#/m/b', '#/l/l1', '#/p/p1']);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx vitest run tests/unit/core/registry.test.ts`
Expected: FAIL (cannot resolve `src/core/registry`).

- [ ] **Step 5: Implement `src/core/registry.ts`**

```ts
import type { Approach, Lesson, Module, Problem } from '../content-types';
import type { TraceDef } from '../engine/trace';

export interface ContentInput {
  modules: Module[];
  lessons: Lesson[];
  problems: Problem[];
  traces: TraceDef[];
}

export interface Registry {
  modules: Module[];
  /** every lesson id, including lessons not yet listed by a module */
  lessonIds: string[];
  /** every problem id, including problems not yet listed by a module */
  problemIds: string[];
  module(id: string): Module | undefined;
  lesson(id: string): Lesson | undefined;
  problem(id: string): Problem | undefined;
  trace(id: string): TraceDef | undefined;
  approachForTrace(traceId: string): Approach | undefined;
}

function indexById<T extends { id: string }>(kind: string, items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    if (map.has(item.id)) throw new Error(`Duplicate ${kind} id: ${item.id}`);
    map.set(item.id, item);
  }
  return map;
}

export function buildRegistry(input: ContentInput): Registry {
  const modules = indexById('module', input.modules);
  const lessons = indexById('lesson', input.lessons);
  const problems = indexById('problem', input.problems);
  const traces = indexById('trace', input.traces);
  const approachByTrace = new Map<string, Approach>();
  for (const p of input.problems) {
    for (const a of p.approaches) if (a.traceId) approachByTrace.set(a.traceId, a);
  }
  return {
    modules: [...modules.values()].sort((a, b) => a.order - b.order),
    lessonIds: [...lessons.keys()],
    problemIds: [...problems.keys()],
    module: (id) => modules.get(id),
    lesson: (id) => lessons.get(id),
    problem: (id) => problems.get(id),
    trace: (id) => traces.get(id),
    approachForTrace: (id) => approachByTrace.get(id),
  };
}

export function allRoutes(registry: Registry): string[] {
  return [
    '#/',
    ...registry.modules.map((m) => `#/m/${m.id}`),
    ...registry.lessonIds.map((id) => `#/l/${id}`),
    ...registry.problemIds.map((id) => `#/p/${id}`),
  ];
}
```

- [ ] **Step 6: Write `content/index.ts`**

```ts
import type { ContentInput } from '../src/core/registry';

export const contentInput: ContentInput = {
  modules: [],
  lessons: [],
  problems: [],
  traces: [],
};
```

- [ ] **Step 7: Run tests and typecheck**

Run: `npx vitest run tests/unit/core/registry.test.ts && npm run typecheck`
Expected: PASS (3 tests), typecheck clean.

**Checkpoint:** content model and registry done.

---

### Task 4: Hash router

**Files:**
- Create: `src/core/router.ts`
- Test: `tests/unit/core/router.test.ts`

**Interfaces:**
- Produces:
  - `type Route = { name: 'home' } | { name: 'module'; id: string } | { name: 'lesson'; id: string } | { name: 'problem'; id: string } | { name: 'notFound'; path: string }`
  - `parseRoute(hash: string): Route`
  - `href(route: Exclude<Route, { name: 'notFound' }>): string`
  - `startRouter(win: Window, onRoute: (r: Route) => void): () => void`. Fires once immediately, then on every `hashchange`. Returns a stop function.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { href, parseRoute, startRouter } from '../../../src/core/router';

describe('parseRoute', () => {
  it.each([
    ['', { name: 'home' }],
    ['#', { name: 'home' }],
    ['#/', { name: 'home' }],
    ['#/m/foundations', { name: 'module', id: 'foundations' }],
    ['#/l/brute-better-optimal', { name: 'lesson', id: 'brute-better-optimal' }],
    ['#/p/contains-duplicate/', { name: 'problem', id: 'contains-duplicate' }],
    ['#/x/y', { name: 'notFound', path: '/x/y' }],
    ['#/l/Bad_Id', { name: 'notFound', path: '/l/Bad_Id' }],
  ])('%s', (hash, route) => {
    expect(parseRoute(hash)).toEqual(route);
  });
});

describe('href', () => {
  it('builds hashes', () => {
    expect(href({ name: 'home' })).toBe('#/');
    expect(href({ name: 'module', id: 'a' })).toBe('#/m/a');
    expect(href({ name: 'lesson', id: 'b' })).toBe('#/l/b');
    expect(href({ name: 'problem', id: 'c' })).toBe('#/p/c');
  });
});

describe('startRouter', () => {
  it('fires now and on hashchange, and can stop', () => {
    window.location.hash = '#/m/a';
    const seen = vi.fn();
    const stop = startRouter(window, seen);
    expect(seen).toHaveBeenLastCalledWith({ name: 'module', id: 'a' });
    window.location.hash = '#/l/b';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(seen).toHaveBeenLastCalledWith({ name: 'lesson', id: 'b' });
    stop();
    window.location.hash = '#/p/c';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(seen).not.toHaveBeenLastCalledWith({ name: 'problem', id: 'c' });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/core/router.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/core/router.ts`**

```ts
export type Route =
  | { name: 'home' }
  | { name: 'module'; id: string }
  | { name: 'lesson'; id: string }
  | { name: 'problem'; id: string }
  | { name: 'notFound'; path: string };

const ITEM = /^\/(m|l|p)\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/;

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  if (path === '/') return { name: 'home' };
  const m = ITEM.exec(path);
  if (m) {
    const id = m[2] as string;
    if (m[1] === 'm') return { name: 'module', id };
    if (m[1] === 'l') return { name: 'lesson', id };
    return { name: 'problem', id };
  }
  return { name: 'notFound', path };
}

export function href(route: Exclude<Route, { name: 'notFound' }>): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'module':
      return `#/m/${route.id}`;
    case 'lesson':
      return `#/l/${route.id}`;
    case 'problem':
      return `#/p/${route.id}`;
  }
}

export function startRouter(win: Window, onRoute: (r: Route) => void): () => void {
  const fire = () => onRoute(parseRoute(win.location.hash));
  win.addEventListener('hashchange', fire);
  fire();
  return () => win.removeEventListener('hashchange', fire);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/unit/core/router.test.ts`
Expected: PASS.

**Checkpoint:** router done.

---

### Task 5: Local store and theme

**Files:**
- Create: `src/core/store.ts`, `src/core/theme.ts`
- Test: `tests/unit/core/store.test.ts`, `tests/unit/core/theme.test.ts`

**Interfaces:**
- Produces (`store.ts`):
  - `type ThemeSetting = 'system' | 'dark' | 'light'`
  - `interface SavedCode { source: string; updatedAt: number }`
  - `interface StoredState { version: 1; settings: { theme: ThemeSetting; updatedAt: number }; code: Record<string, SavedCode> }`
  - `STORAGE_KEY = 'dsa:v1'`
  - `defaultState(): StoredState`
  - `normalize(raw: unknown): StoredState`. Fills missing fields, drops bad values, and always returns a valid state.
  - `interface KeyValueStorage { getItem(k: string): string | null; setItem(k: string, v: string): void }`
  - `interface Store { get(): Readonly<StoredState>; update(mutator: (draft: StoredState) => void): void; subscribe(cb: (s: Readonly<StoredState>) => void): () => void }`
  - `createStore(storage: KeyValueStorage): Store`. Bad JSON is copied to `dsa:corrupt:<time>` and the store starts fresh. Write errors such as a full quota are logged with `console.warn`, and the in-memory state still updates.
- Produces (`theme.ts`):
  - `type ResolvedTheme = 'dark' | 'light'`
  - `resolveTheme(setting: ThemeSetting, prefersLight: boolean): ResolvedTheme`
  - `interface ThemeControl { current(): ResolvedTheme; toggle(): void }`
  - `initTheme(win: Window, store: Store): ThemeControl`. Sets `document.documentElement.dataset.theme`.

- [ ] **Step 1: Write the failing store test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { createStore, defaultState, normalize, STORAGE_KEY, type KeyValueStorage } from '../../../src/core/store';

function memory(initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
}

describe('normalize', () => {
  it('returns defaults for junk', () => {
    expect(normalize(null)).toEqual(defaultState());
    expect(normalize(42)).toEqual(defaultState());
  });
  it('keeps valid fields and drops bad ones', () => {
    const s = normalize({ version: 1, settings: { theme: 'light', updatedAt: 5 }, code: { a: { source: 'x', updatedAt: 1 }, b: { source: 3 } } });
    expect(s.settings).toEqual({ theme: 'light', updatedAt: 5 });
    expect(s.code).toEqual({ a: { source: 'x', updatedAt: 1 } });
  });
  it('rejects an unknown theme', () => {
    expect(normalize({ settings: { theme: 'pink', updatedAt: 1 } }).settings.theme).toBe('system');
  });
});

describe('createStore', () => {
  it('loads, updates, saves and notifies', () => {
    const storage = memory({ [STORAGE_KEY]: JSON.stringify({ version: 1, settings: { theme: 'dark', updatedAt: 1 }, code: {} }) });
    const store = createStore(storage);
    expect(store.get().settings.theme).toBe('dark');
    const cb = vi.fn();
    const off = store.subscribe(cb);
    store.update((s) => { s.code.p = { source: 'class Solution {}', updatedAt: 2 }; });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(JSON.parse(storage.data[STORAGE_KEY]!).code.p.source).toBe('class Solution {}');
    off();
    store.update((s) => { s.settings.theme = 'light'; });
    expect(cb).toHaveBeenCalledTimes(1);
  });
  it('backs up corrupt data and starts fresh', () => {
    const storage = memory({ [STORAGE_KEY]: '{not json' });
    const store = createStore(storage);
    expect(store.get()).toEqual(defaultState());
    expect(Object.keys(storage.data).some((k) => k.startsWith('dsa:corrupt:'))).toBe(true);
  });
  it('keeps working when saving fails', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = createStore({ getItem: () => null, setItem: () => { throw new Error('full'); } });
    store.update((s) => { s.settings.theme = 'light'; });
    expect(store.get().settings.theme).toBe('light');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/core/store.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/core/store.ts`**

```ts
export type ThemeSetting = 'system' | 'dark' | 'light';

export interface SavedCode {
  source: string;
  updatedAt: number;
}

export interface StoredState {
  version: 1;
  settings: { theme: ThemeSetting; updatedAt: number };
  code: Record<string, SavedCode>;
}

export const STORAGE_KEY = 'dsa:v1';

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface Store {
  get(): Readonly<StoredState>;
  update(mutator: (draft: StoredState) => void): void;
  subscribe(cb: (s: Readonly<StoredState>) => void): () => void;
}

export function defaultState(): StoredState {
  return { version: 1, settings: { theme: 'system', updatedAt: 0 }, code: {} };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const THEMES: ThemeSetting[] = ['system', 'dark', 'light'];

export function normalize(raw: unknown): StoredState {
  const state = defaultState();
  if (!isObj(raw)) return state;
  if (isObj(raw.settings)) {
    const t = raw.settings.theme;
    if (typeof t === 'string' && (THEMES as string[]).includes(t)) state.settings.theme = t as ThemeSetting;
    if (typeof raw.settings.updatedAt === 'number') state.settings.updatedAt = raw.settings.updatedAt;
  }
  if (isObj(raw.code)) {
    for (const [id, v] of Object.entries(raw.code)) {
      if (isObj(v) && typeof v.source === 'string' && typeof v.updatedAt === 'number') {
        state.code[id] = { source: v.source, updatedAt: v.updatedAt };
      }
    }
  }
  return state;
}

export function createStore(storage: KeyValueStorage): Store {
  let state: StoredState;
  const text = storage.getItem(STORAGE_KEY);
  try {
    state = normalize(text ? JSON.parse(text) : null);
  } catch {
    if (text) {
      try {
        storage.setItem(`dsa:corrupt:${Date.now()}`, text);
      } catch {
        /* nothing else we can do */
      }
    }
    state = defaultState();
  }
  const listeners = new Set<(s: Readonly<StoredState>) => void>();

  function save() {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('DSA Playbook could not save progress in this browser.', err);
    }
  }

  return {
    get: () => state,
    update(mutator) {
      const draft = structuredClone(state);
      mutator(draft);
      state = draft;
      save();
      for (const cb of listeners) cb(state);
    },
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}
```

- [ ] **Step 4: Run to verify the store test passes**

Run: `npx vitest run tests/unit/core/store.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing theme test**

```ts
import { describe, expect, it } from 'vitest';
import { createStore } from '../../../src/core/store';
import { initTheme, resolveTheme } from '../../../src/core/theme';

describe('resolveTheme', () => {
  it('uses the system only for "system"', () => {
    expect(resolveTheme('system', true)).toBe('light');
    expect(resolveTheme('system', false)).toBe('dark');
    expect(resolveTheme('dark', true)).toBe('dark');
    expect(resolveTheme('light', false)).toBe('light');
  });
});

describe('initTheme', () => {
  it('applies the theme and toggles it', () => {
    const data: Record<string, string> = {};
    const store = createStore({ getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } });
    const theme = initTheme(window, store);
    const first = theme.current();
    expect(document.documentElement.dataset.theme).toBe(first);
    theme.toggle();
    const second = theme.current();
    expect(second).not.toBe(first);
    expect(document.documentElement.dataset.theme).toBe(second);
    expect(store.get().settings.theme).toBe(second);
  });
});
```

- [ ] **Step 6: Implement `src/core/theme.ts`**

```ts
import type { Store, ThemeSetting } from './store';

export type ResolvedTheme = 'dark' | 'light';

export interface ThemeControl {
  current(): ResolvedTheme;
  toggle(): void;
}

export function resolveTheme(setting: ThemeSetting, prefersLight: boolean): ResolvedTheme {
  if (setting === 'system') return prefersLight ? 'light' : 'dark';
  return setting;
}

export function initTheme(win: Window, store: Store): ThemeControl {
  const mql = typeof win.matchMedia === 'function' ? win.matchMedia('(prefers-color-scheme: light)') : null;
  const current = (): ResolvedTheme => resolveTheme(store.get().settings.theme, mql?.matches ?? false);
  const apply = () => {
    win.document.documentElement.dataset.theme = current();
  };
  apply();
  mql?.addEventListener?.('change', apply);
  store.subscribe(apply);
  return {
    current,
    toggle() {
      const next: ThemeSetting = current() === 'dark' ? 'light' : 'dark';
      store.update((s) => {
        s.settings.theme = next;
        s.settings.updatedAt = Date.now();
      });
    },
  };
}
```

- [ ] **Step 7: Run both tests**

Run: `npx vitest run tests/unit/core/store.test.ts tests/unit/core/theme.test.ts`
Expected: PASS.

**Checkpoint:** store and theme done.

---

### Task 6: Java line markers, highlighting and code panel

**Files:**
- Create: `src/engine/markers.ts`, `src/engine/highlight.ts`, `src/engine/pieces/code-panel.ts`
- Test: `tests/unit/engine/markers.test.ts`, `tests/unit/engine/highlight.test.ts`

**Interfaces:**
- Produces:
  - `interface MarkedSource { code: string; lines: Record<string, number> }` (1-based line numbers)
  - `parseMarkers(src: string): MarkedSource`. Strips ` // @L:name` from line ends and throws on duplicate names.
  - `highlightJavaLines(code: string): string[]`, one HTML string per line using `tok-*` classes
  - `codeBlock(code: string, opts?: { activeLine?: number; label?: string }): SafeHtml`, which renders `<pre class="code"><code><span class="ln" data-line="n">…</span>…</code></pre>`
  - `interface CodePanel { el: HTMLElement; setActive(marker: string | null): void }`
  - `createCodePanel(javaWithMarkers: string): CodePanel`

- [ ] **Step 1: Write the failing tests**

`tests/unit/engine/markers.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseMarkers } from '../../../src/engine/markers';

describe('parseMarkers', () => {
  it('strips markers and records 1-based lines', () => {
    const src = 'class A {\n  int x = 1; // @L:init\n  void f() {} //   @L:call-f\n}\n';
    const m = parseMarkers(src);
    expect(m.lines).toEqual({ init: 2, 'call-f': 3 });
    expect(m.code).toBe('class A {\n  int x = 1;\n  void f() {}\n}\n');
  });
  it('keeps normal comments', () => {
    expect(parseMarkers('int a; // count\n').code).toBe('int a; // count\n');
  });
  it('throws on duplicates', () => {
    expect(() => parseMarkers('a // @L:x\nb // @L:x')).toThrow('Duplicate line marker "x" on line 2');
  });
  it('normalizes Windows line endings', () => {
    expect(parseMarkers('a // @L:x\r\nb').code).toBe('a\nb');
  });
});
```

`tests/unit/engine/highlight.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { codeBlock, highlightJavaLines } from '../../../src/engine/highlight';
import { createCodePanel } from '../../../src/engine/pieces/code-panel';

describe('highlight', () => {
  it('returns one entry per line and marks keywords', () => {
    const lines = highlightJavaLines('class A {\n  return 1;\n}');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('tok-keyword');
    expect(lines.join('')).not.toContain('<script');
  });
  it('escapes code text', () => {
    expect(highlightJavaLines('String s = "<b>";').join('')).toContain('&lt;b&gt;');
  });
  it('codeBlock marks the active line', () => {
    const out = codeBlock('a\nb', { activeLine: 2 }).__html;
    expect(out).toContain('data-line="2"');
    expect(out).toMatch(/class="ln active" data-line="2"/);
  });
});

describe('createCodePanel', () => {
  it('highlights the line for a marker', () => {
    const panel = createCodePanel('int a; // @L:one\nint b; // @L:two');
    panel.setActive('two');
    expect(panel.el.querySelector('.ln.active')?.getAttribute('data-line')).toBe('2');
    panel.setActive(null);
    expect(panel.el.querySelector('.ln.active')).toBeNull();
    expect(panel.el.textContent).not.toContain('@L:');
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run tests/unit/engine/markers.test.ts tests/unit/engine/highlight.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement `src/engine/markers.ts`**

```ts
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
```

- [ ] **Step 4: Implement `src/engine/highlight.ts`**

```ts
import { javaLanguage } from '@codemirror/lang-java';
import { classHighlighter, highlightCode } from '@lezer/highlight';
import { escapeHtml, raw, type SafeHtml } from '../core/html';

export function highlightJavaLines(code: string): string[] {
  const tree = javaLanguage.parser.parse(code);
  const lines: string[] = [];
  let current = '';
  highlightCode(
    code,
    tree,
    classHighlighter,
    (text, classes) => {
      current += classes ? `<span class="${classes}">${escapeHtml(text)}</span>` : escapeHtml(text);
    },
    () => {
      lines.push(current);
      current = '';
    },
  );
  lines.push(current);
  return lines;
}

export function codeBlock(code: string, opts: { activeLine?: number; label?: string } = {}): SafeHtml {
  const body = highlightJavaLines(code)
    .map((l, i) => {
      const n = i + 1;
      const cls = opts.activeLine === n ? 'ln active' : 'ln';
      return `<span class="${cls}" data-line="${n}">${l || ' '}</span>`;
    })
    .join('');
  const label = escapeHtml(opts.label ?? 'Java code');
  return raw(`<pre class="code" tabindex="0" aria-label="${label}"><code>${body}</code></pre>`);
}
```

- [ ] **Step 5: Implement `src/engine/pieces/code-panel.ts`**

```ts
import { codeBlock } from '../highlight';
import { parseMarkers } from '../markers';

export interface CodePanel {
  el: HTMLElement;
  setActive(marker: string | null): void;
}

export function createCodePanel(javaWithMarkers: string): CodePanel {
  const { code, lines } = parseMarkers(javaWithMarkers);
  const el = document.createElement('div');
  el.className = 'code-panel';
  el.innerHTML = codeBlock(code).__html;
  const pre = el.querySelector('pre') as HTMLElement;
  return {
    el,
    setActive(marker) {
      el.querySelectorAll('.ln.active').forEach((n) => n.classList.remove('active'));
      if (!marker) return;
      const n = lines[marker];
      if (n === undefined) return;
      const lineEl = el.querySelector<HTMLElement>(`.ln[data-line="${n}"]`);
      if (!lineEl) return;
      lineEl.classList.add('active');
      const target = lineEl.offsetTop - pre.clientHeight / 2;
      pre.scrollTop = Math.max(0, target);
    },
  };
}
```

- [ ] **Step 6: Run to verify they pass**

Run: `npx vitest run tests/unit/engine/markers.test.ts tests/unit/engine/highlight.test.ts`
Expected: PASS.

**Checkpoint:** markers and code panel done.

---

### Task 7: Trace recorder and input parsing

**Files:**
- Modify: `src/engine/trace.ts` (add helpers below the types from Task 3)
- Test: `tests/unit/engine/trace.test.ts`

**Interfaces:**
- Produces:
  - `createRecorder(): { step(s: Omit<Snapshot, 'changed'>): void; finish(result: unknown): Trace }`. Deep-copies each step. `changed` lists vars that differ from the previous step, and is empty on the first step.
  - `parseIntList(text: string, opts: { min: number; max: number; minLength: number; maxLength: number }): ParseResult<number[]>`. Accepts `3, 8, 1`, `[3,8,1]` or `3 8 1`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { createRecorder, parseIntList, type ArrayView } from '../../../src/engine/trace';

const view = (values: number[]): ArrayView => ({ kind: 'array', id: 'a', label: 'a', values, pointers: [], marks: [] });

describe('createRecorder', () => {
  it('tracks changed vars and copies steps', () => {
    const rec = createRecorder();
    const values = [1, 2];
    rec.step({ line: 'a', vars: { i: '0', x: '1' }, views: [view(values)], note: 'one' });
    values[0] = 99;
    rec.step({ line: 'b', vars: { i: '1', x: '1' }, views: [view(values)], note: 'two' });
    const t = rec.finish(true);
    expect(t.result).toBe(true);
    expect(t.steps[0]!.changed).toEqual([]);
    expect(t.steps[1]!.changed).toEqual(['i']);
    expect((t.steps[0]!.views[0] as ArrayView).values[0]).toBe(1);
  });
});

describe('parseIntList', () => {
  const opts = { min: -10, max: 10, minLength: 1, maxLength: 4 };
  it('accepts common formats', () => {
    expect(parseIntList('3, 8, 1', opts)).toEqual({ ok: true, value: [3, 8, 1] });
    expect(parseIntList('[3,8,-1]', opts)).toEqual({ ok: true, value: [3, 8, -1] });
    expect(parseIntList('3 8 1', opts)).toEqual({ ok: true, value: [3, 8, 1] });
  });
  it('rejects bad input with a plain message', () => {
    expect(parseIntList('3, x', opts)).toEqual({ ok: false, message: 'Use whole numbers separated by commas, like 3, 8, 1, 8.' });
    expect(parseIntList('', opts)).toEqual({ ok: false, message: 'Use between 1 and 4 numbers.' });
    expect(parseIntList('1,2,3,4,5', opts)).toEqual({ ok: false, message: 'Use between 1 and 4 numbers.' });
    expect(parseIntList('11', opts)).toEqual({ ok: false, message: 'Each number must be between -10 and 10.' });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/engine/trace.test.ts`
Expected: FAIL (`createRecorder` is not exported).

- [ ] **Step 3: Append the helpers to `src/engine/trace.ts`**

```ts
export function createRecorder(): {
  step(s: Omit<Snapshot, 'changed'>): void;
  finish(result: unknown): Trace;
} {
  const steps: Snapshot[] = [];
  let prev: Record<string, string> | null = null;
  return {
    step(s) {
      const before = prev;
      const changed = before === null ? [] : Object.keys(s.vars).filter((k) => before[k] !== s.vars[k]);
      steps.push(structuredClone({ ...s, changed }));
      prev = { ...s.vars };
    },
    finish(result) {
      return { steps, result };
    },
  };
}

const fmt = (n: number) => n.toLocaleString('en-US');

export function parseIntList(
  text: string,
  opts: { min: number; max: number; minLength: number; maxLength: number },
): ParseResult<number[]> {
  const cleaned = text.trim().replace(/^\[/, '').replace(/\]$/, '').trim();
  const parts = cleaned === '' ? [] : cleaned.split(/[\s,]+/).filter((p) => p !== '');
  if (parts.length < opts.minLength || parts.length > opts.maxLength) {
    return { ok: false, message: `Use between ${opts.minLength} and ${opts.maxLength} numbers.` };
  }
  if (!parts.every((p) => /^-?\d+$/.test(p))) {
    return { ok: false, message: 'Use whole numbers separated by commas, like 3, 8, 1, 8.' };
  }
  const values = parts.map(Number);
  if (values.some((v) => v < opts.min || v > opts.max)) {
    return { ok: false, message: `Each number must be between ${fmt(opts.min)} and ${fmt(opts.max)}.` };
  }
  return { ok: true, value: values };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/unit/engine/trace.test.ts`
Expected: PASS.

**Checkpoint:** trace helpers done.

---

### Task 8: Player state machine

**Files:**
- Create: `src/engine/player.ts`
- Test: `tests/unit/engine/player.test.ts`

**Interfaces:**
- Consumes: `Trace`, `Snapshot` from `src/engine/trace.ts`.
- Produces:
  - `interface Scheduler { setTimeout(fn: () => void, ms: number): number; clearTimeout(id: number): void }`
  - `type Speed = 0.5 | 1 | 2`
  - `BASE_DWELL_MS = 1400`
  - `class Player { constructor(trace: Trace, scheduler?: Scheduler); readonly index; readonly total; readonly current: Snapshot; readonly atEnd; playing: boolean; speed: Speed; play(); pause(); toggle(); next(); back(); reset(); setSpeed(s: Speed); onChange(cb: () => void): () => void; dispose() }`.
  - Manual `next`, `back` and `reset` pause playback. `play()` at the end restarts from step 0. Playing stops by itself at the last step.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { BASE_DWELL_MS, Player, type Scheduler } from '../../../src/engine/player';
import type { Trace } from '../../../src/engine/trace';

function fakeScheduler() {
  let id = 0;
  const timers = new Map<number, { fn: () => void; ms: number }>();
  const s: Scheduler & { runNext(): number | undefined; pending(): number } = {
    setTimeout(fn, ms) { timers.set(++id, { fn, ms }); return id; },
    clearTimeout(t) { timers.delete(t); },
    runNext() {
      const first = timers.entries().next();
      if (first.done) return undefined;
      const [key, t] = first.value;
      timers.delete(key);
      t.fn();
      return t.ms;
    },
    pending: () => timers.size,
  };
  return s;
}

const trace = (n: number): Trace => ({
  steps: Array.from({ length: n }, (_, i) => ({ line: 'l', vars: {}, changed: [], views: [], note: `step ${i}` })),
  result: null,
});

describe('Player', () => {
  it('steps forward and back and stops at the ends', () => {
    const p = new Player(trace(3), fakeScheduler());
    expect(p.index).toBe(0);
    p.back();
    expect(p.index).toBe(0);
    p.next(); p.next(); p.next();
    expect(p.index).toBe(2);
    expect(p.atEnd).toBe(true);
    p.back();
    expect(p.current.note).toBe('step 1');
    p.reset();
    expect(p.index).toBe(0);
  });

  it('plays with dwell time by speed and stops at the end', () => {
    const sch = fakeScheduler();
    const p = new Player(trace(3), sch);
    const changes = vi.fn();
    p.onChange(changes);
    p.play();
    expect(p.playing).toBe(true);
    expect(sch.runNext()).toBe(BASE_DWELL_MS);
    expect(p.index).toBe(1);
    p.setSpeed(2);
    expect(sch.runNext()).toBe(BASE_DWELL_MS / 2);
    expect(p.index).toBe(2);
    expect(p.playing).toBe(false);
    expect(sch.pending()).toBe(0);
    expect(changes).toHaveBeenCalled();
  });

  it('manual step pauses playback, and play at the end restarts', () => {
    const sch = fakeScheduler();
    const p = new Player(trace(2), sch);
    p.play();
    p.next();
    expect(p.playing).toBe(false);
    expect(sch.pending()).toBe(0);
    expect(p.atEnd).toBe(true);
    p.play();
    expect(p.index).toBe(0);
    expect(p.playing).toBe(true);
  });

  it('rejects an empty trace', () => {
    expect(() => new Player(trace(0), fakeScheduler())).toThrow('A trace needs at least one step');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/engine/player.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/engine/player.ts`**

```ts
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
    return () => this.listeners.delete(cb);
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/unit/engine/player.test.ts`
Expected: PASS (4 tests).

**Checkpoint:** player logic done.

---

### Task 9: Visual pieces (array, hash, variables)

**Files:**
- Create: `src/engine/pieces/array-piece.ts`, `src/engine/pieces/hash-piece.ts`, `src/engine/pieces/vars-panel.ts`, `src/styles/player.css`
- Test: `tests/unit/engine/pieces.test.ts`

**Interfaces:**
- Consumes: `ArrayView`, `HashView` from `src/engine/trace.ts`.
- Produces:
  - `interface Piece<V> { el: HTMLElement; update(view: V): void }`
  - `createArrayPiece(): Piece<ArrayView>`. Cells `.cell` carry `data-index` and a mark class `mark-<color>`. Pointers `.ptr[data-name]` persist between updates so they slide, with their position in CSS var `--i` and stacking row in `--row`.
  - `createHashPiece(): Piece<HashView>`. Chips `.chip[data-key]`. New chips get class `enter`. The highlighted chip gets `mark-<color>`. The empty state text is `empty`.
  - `createVarsPanel(): { el: HTMLElement; update(vars: Record<string, string>, changed: string[]): void }`. Rows `.var[data-name]`, and changed rows get class `changed`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { createArrayPiece } from '../../../src/engine/pieces/array-piece';
import { createHashPiece } from '../../../src/engine/pieces/hash-piece';
import { createVarsPanel } from '../../../src/engine/pieces/vars-panel';

describe('array piece', () => {
  it('renders cells, marks and persistent pointers', () => {
    const p = createArrayPiece();
    p.update({ kind: 'array', id: 'a', label: 'nums', values: [3, 8, 1], pointers: [{ name: 'i', index: 0 }], marks: [{ index: 0, color: 'current' }] });
    expect(p.el.querySelectorAll('.cell')).toHaveLength(3);
    expect(p.el.querySelector('.cell[data-index="0"]')!.classList.contains('mark-current')).toBe(true);
    const ptr = p.el.querySelector<HTMLElement>('.ptr[data-name="i"]')!;
    expect(ptr.style.getPropertyValue('--i')).toBe('0');
    p.update({ kind: 'array', id: 'a', label: 'nums', values: [3, 8, 1], pointers: [{ name: 'i', index: 2 }], marks: [] });
    expect(p.el.querySelector('.ptr[data-name="i"]')).toBe(ptr);
    expect(ptr.style.getPropertyValue('--i')).toBe('2');
    expect(p.el.querySelector('.cell[data-index="0"]')!.classList.contains('mark-current')).toBe(false);
    expect(p.el.getAttribute('aria-label')).toBe('nums: 3, 8, 1');
  });
  it('stacks pointers on the same index and removes old ones', () => {
    const p = createArrayPiece();
    p.update({ kind: 'array', id: 'a', label: 'a', values: [1, 2], pointers: [{ name: 'i', index: 1 }, { name: 'j', index: 1 }], marks: [] });
    expect(p.el.querySelector<HTMLElement>('.ptr[data-name="j"]')!.style.getPropertyValue('--row')).toBe('1');
    p.update({ kind: 'array', id: 'a', label: 'a', values: [1, 2], pointers: [{ name: 'i', index: 0 }], marks: [] });
    expect(p.el.querySelector('.ptr[data-name="j"]')).toBeNull();
  });
});

describe('hash piece', () => {
  it('shows entries, new chips and the highlight', () => {
    const p = createHashPiece();
    p.update({ kind: 'hash', id: 's', label: 'seen', mode: 'set', entries: [] });
    expect(p.el.textContent).toContain('empty');
    p.update({ kind: 'hash', id: 's', label: 'seen', mode: 'set', entries: [{ key: '3' }], highlightKey: '3', highlightColor: 'current' });
    const chip = p.el.querySelector('.chip[data-key="3"]')!;
    expect(chip.classList.contains('enter')).toBe(true);
    expect(chip.classList.contains('mark-current')).toBe(true);
    p.update({ kind: 'hash', id: 's', label: 'seen', mode: 'set', entries: [{ key: '3' }, { key: '8' }] });
    expect(p.el.querySelector('.chip[data-key="3"]')!.classList.contains('enter')).toBe(false);
    expect(p.el.querySelectorAll('.chip')).toHaveLength(2);
  });
  it('shows key and value in map mode', () => {
    const p = createHashPiece();
    p.update({ kind: 'hash', id: 'm', label: 'count', mode: 'map', entries: [{ key: 'a', value: '2' }] });
    expect(p.el.querySelector('.chip')!.textContent).toBe('a → 2');
  });
});

describe('vars panel', () => {
  it('renders vars and marks changed ones', () => {
    const v = createVarsPanel();
    v.update({ i: '0', j: '1' }, ['j']);
    expect(v.el.querySelector('.var[data-name="i"]')!.textContent).toContain('0');
    expect(v.el.querySelector('.var[data-name="j"]')!.classList.contains('changed')).toBe(true);
    expect(v.el.querySelector('.var[data-name="i"]')!.classList.contains('changed')).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/engine/pieces.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement `src/engine/pieces/array-piece.ts`**

```ts
import type { ArrayView } from '../trace';

export interface Piece<V> {
  el: HTMLElement;
  update(view: V): void;
}

export function createArrayPiece(): Piece<ArrayView> {
  const el = document.createElement('figure');
  el.className = 'piece piece-array';
  el.setAttribute('role', 'img');
  const caption = document.createElement('figcaption');
  const track = document.createElement('div');
  track.className = 'arr-track';
  const cellsEl = document.createElement('div');
  cellsEl.className = 'arr-cells';
  const ptrLayer = document.createElement('div');
  ptrLayer.className = 'arr-ptrs';
  track.append(cellsEl, ptrLayer);
  el.append(caption, track);

  let cells: HTMLElement[] = [];
  const pointers = new Map<string, HTMLElement>();

  function rebuild(n: number) {
    cellsEl.innerHTML = '';
    cells = [];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div');
      c.className = 'cell';
      c.dataset.index = String(i);
      c.innerHTML = `<span class="idx">${i}</span><span class="val"></span>`;
      cellsEl.append(c);
      cells.push(c);
    }
    track.style.setProperty('--n', String(n));
  }

  return {
    el,
    update(view) {
      caption.textContent = view.label;
      if (view.values.length !== cells.length) rebuild(view.values.length);
      view.values.forEach((v, i) => {
        const c = cells[i] as HTMLElement;
        (c.querySelector('.val') as HTMLElement).textContent = String(v);
        c.className = 'cell';
      });
      for (const m of view.marks) cells[m.index]?.classList.add(`mark-${m.color}`);

      const rowAt = new Map<number, number>();
      const keep = new Set<string>();
      for (const p of view.pointers) {
        keep.add(p.name);
        let ptr = pointers.get(p.name);
        if (!ptr) {
          ptr = document.createElement('div');
          ptr.className = 'ptr';
          ptr.dataset.name = p.name;
          ptr.innerHTML = `<span class="ptr-arrow" aria-hidden="true">▲</span><b></b>`;
          (ptr.querySelector('b') as HTMLElement).textContent = p.name;
          ptrLayer.append(ptr);
          pointers.set(p.name, ptr);
        }
        const row = rowAt.get(p.index) ?? 0;
        rowAt.set(p.index, row + 1);
        ptr.style.setProperty('--i', String(p.index));
        ptr.style.setProperty('--row', String(row));
      }
      for (const [name, ptr] of pointers) {
        if (!keep.has(name)) {
          ptr.remove();
          pointers.delete(name);
        }
      }
      const rows = Math.max(1, ...[...rowAt.values()]);
      track.style.setProperty('--ptr-rows', String(rows));
      el.setAttribute('aria-label', `${view.label}: ${view.values.join(', ')}`);
    },
  };
}
```

- [ ] **Step 4: Implement `src/engine/pieces/hash-piece.ts`**

```ts
import type { HashView } from '../trace';
import type { Piece } from './array-piece';

export function createHashPiece(): Piece<HashView> {
  const el = document.createElement('figure');
  el.className = 'piece piece-hash';
  const caption = document.createElement('figcaption');
  const box = document.createElement('div');
  box.className = 'hash-box';
  el.append(caption, box);
  const chips = new Map<string, HTMLElement>();
  const empty = document.createElement('span');
  empty.className = 'hash-empty';
  empty.textContent = 'empty';

  return {
    el,
    update(view) {
      caption.textContent = view.mode === 'set' ? `${view.label} (set)` : `${view.label} (map)`;
      const keep = new Set(view.entries.map((e) => e.key));
      for (const [key, chip] of chips) {
        if (!keep.has(key)) {
          chip.remove();
          chips.delete(key);
        }
      }
      for (const e of view.entries) {
        let chip = chips.get(e.key);
        const isNew = !chip;
        if (!chip) {
          chip = document.createElement('span');
          chip.dataset.key = e.key;
          box.append(chip);
          chips.set(e.key, chip);
        }
        chip.className = isNew ? 'chip enter' : 'chip';
        chip.textContent = view.mode === 'map' ? `${e.key} → ${e.value ?? ''}` : e.key;
        if (view.highlightKey === e.key) chip.classList.add(`mark-${view.highlightColor ?? 'current'}`);
      }
      if (view.entries.length === 0) box.append(empty);
      else empty.remove();
      el.setAttribute('aria-label', `${view.label}: ${view.entries.length === 0 ? 'empty' : view.entries.map((e) => e.key).join(', ')}`);
    },
  };
}
```

- [ ] **Step 5: Implement `src/engine/pieces/vars-panel.ts`**

```ts
export function createVarsPanel(): { el: HTMLElement; update(vars: Record<string, string>, changed: string[]): void } {
  const el = document.createElement('dl');
  el.className = 'vars';
  el.setAttribute('aria-label', 'Variables');
  return {
    el,
    update(vars, changed) {
      el.innerHTML = '';
      for (const [name, value] of Object.entries(vars)) {
        const row = document.createElement('div');
        row.className = changed.includes(name) ? 'var changed' : 'var';
        row.dataset.name = name;
        const dt = document.createElement('dt');
        dt.textContent = name;
        const dd = document.createElement('dd');
        dd.textContent = value;
        row.append(dt, dd);
        el.append(row);
      }
    },
  };
}
```

- [ ] **Step 6: Write `src/styles/player.css`**

```css
.player { border: 1px solid var(--line); border-radius: var(--radius); background: var(--card); padding: 1rem; display: grid; gap: 0.75rem; outline: none; }
.player:focus-visible { box-shadow: 0 0 0 3px var(--accent); }
.player-head { display: flex; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; align-items: baseline; }
.player-head h4 { margin: 0; font-size: 1rem; }
.player-count { color: var(--muted); font-size: 0.875rem; }
.player-stage { display: grid; gap: 1rem; overflow-x: auto; padding-bottom: 0.25rem; }
.player-side { display: grid; gap: 0.75rem; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 900px) { .player-side { grid-template-columns: minmax(10rem, 14rem) minmax(0, 1fr); } }
.player-note { margin: 0; padding: 0.6rem 0.8rem; border-left: 4px solid var(--accent); background: var(--bg-2); border-radius: 6px; min-height: 2.6rem; }
.player-controls { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; }
.player-controls .speed { margin-left: auto; display: flex; gap: 0.25rem; align-items: center; color: var(--muted); font-size: 0.875rem; }
.player-controls button[aria-pressed='true'] { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
.player-input { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: end; font-size: 0.875rem; }
.player-input label { display: grid; gap: 0.2rem; }
.player-input input { min-width: 12rem; }
.player-input .error { color: var(--bad); flex-basis: 100%; margin: 0; }
.viz-tabs { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.5rem; }

.piece { margin: 0; }
.piece figcaption { font-family: var(--mono); font-size: 0.8rem; color: var(--muted); margin-bottom: 0.3rem; }
.arr-track { --cell: 2.75rem; position: relative; width: calc(var(--n) * var(--cell)); }
.arr-cells { display: grid; grid-template-columns: repeat(var(--n), var(--cell)); }
.cell { height: var(--cell); border: 1px solid var(--line); display: grid; place-items: center; position: relative; font-family: var(--mono); font-weight: 600; background: var(--bg-2); transition: background-color var(--dur), color var(--dur); }
.cell .idx { position: absolute; top: -1.15rem; font-size: 0.7rem; color: var(--muted); font-weight: 400; }
.cell.mark-current { background: var(--mark-current); color: #fff; }
.cell.mark-discarded { background: var(--mark-discarded); color: #fff; opacity: 0.75; }
.cell.mark-range { background: var(--mark-range); color: #fff; }
.cell.mark-answer { background: var(--mark-answer); color: #fff; }
.cell.mark-conflict { background: var(--mark-conflict); color: #fff; }
.arr-ptrs { position: relative; height: calc(var(--ptr-rows, 1) * 1.6rem + 0.3rem); }
.ptr { position: absolute; top: calc(var(--row) * 1.6rem); left: 0; width: var(--cell); text-align: center; font-family: var(--mono); font-size: 0.8rem; color: var(--accent); transform: translateX(calc(var(--i) * var(--cell))); transition: transform var(--dur) ease; line-height: 1; }
.ptr b { display: block; }
.ptr-arrow { display: block; font-size: 0.7rem; }

.hash-box { display: flex; flex-wrap: wrap; gap: 0.4rem; min-height: 2.4rem; padding: 0.5rem; border: 1px dashed var(--line); border-radius: 8px; background: var(--bg-2); }
.hash-empty { color: var(--muted); font-style: italic; font-size: 0.875rem; }
.chip { font-family: var(--mono); padding: 0.2rem 0.55rem; border-radius: 999px; border: 1px solid var(--line); background: var(--card); transition: background-color var(--dur), color var(--dur); }
.chip.enter { animation: chip-in var(--dur) ease; }
.chip.mark-current { background: var(--mark-current); color: #fff; border-color: transparent; }
.chip.mark-answer { background: var(--mark-answer); color: #fff; border-color: transparent; }
.chip.mark-conflict { background: var(--mark-conflict); color: #fff; border-color: transparent; }
@keyframes chip-in { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: none; } }

.vars { margin: 0; display: grid; gap: 0.25rem; align-content: start; font-family: var(--mono); font-size: 0.875rem; }
.var { display: flex; justify-content: space-between; gap: 0.5rem; padding: 0.25rem 0.5rem; border-radius: 6px; background: var(--bg-2); }
.var dt { color: var(--muted); }
.var dd { margin: 0; font-weight: 600; }
.var.changed { animation: var-flash calc(var(--dur) * 3) ease; outline: 1px solid var(--accent); }
@keyframes var-flash { from { background: var(--accent); color: var(--on-accent); } to { background: var(--bg-2); } }

@media (prefers-reduced-motion: reduce) {
  .ptr, .cell, .chip { transition: none; }
  .chip.enter, .var.changed { animation: none; }
}
```

- [ ] **Step 7: Run to verify it passes**

Run: `npx vitest run tests/unit/engine/pieces.test.ts`
Expected: PASS (5 tests).

**Checkpoint:** visual pieces done.

---

### Task 10: Player view (controls, keyboard, own input, tabs)

**Files:**
- Create: `src/engine/player-view.ts`
- Test: `tests/unit/engine/player-view.test.ts`

**Interfaces:**
- Consumes: `Player` (Task 8), pieces (Task 9), `createCodePanel` (Task 6), `TraceDef` (Task 3).
- Produces:
  - `interface PlayerViewOptions { trace: TraceDef; java: string; input: unknown; title: string; reducedMotion?: boolean; autoplayInView?: boolean }`
  - `interface PlayerViewHandle { el: HTMLElement; player(): Player; dispose(): void }`
  - `mountPlayerView(host: HTMLElement, opts: PlayerViewOptions): PlayerViewHandle`. Buttons carry `data-action` values `reset`, `back`, `play`, `next` and `speed-0.5`, `speed-1`, `speed-2`. The step counter is `.player-count` with text `Step N of M`. The note is `.player-note` with `aria-live="polite"`. The own-input form is `.player-input`, with an input per field `name=<field>`, a button `data-action="run-input"` and an error at `.player-input .error`.
  - `interface VizItem { label: string; trace: TraceDef; java: string; input: unknown }`
  - `mountVizGroup(host: HTMLElement, items: VizItem[], opts?: { reducedMotion?: boolean; autoplayInView?: boolean }): () => void`. Tab buttons `.viz-tabs button` have `aria-pressed`. One player is shown at a time.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { mountPlayerView, mountVizGroup } from '../../../src/engine/player-view';
import { createRecorder, parseIntList, type TraceDef } from '../../../src/engine/trace';

const countTrace: TraceDef<{ nums: number[] }> = {
  id: 't/count', maxSteps: 50,
  inputFields: [{ name: 'nums', label: 'nums', placeholder: '1, 2, 3' }],
  parseInput: (f) => {
    const r = parseIntList(f.nums ?? '', { min: -9, max: 9, minLength: 1, maxLength: 5 });
    return r.ok ? { ok: true, value: { nums: r.value } } : r;
  },
  formatInput: (i) => ({ nums: i.nums.join(', ') }),
  fromArgs: (a) => ({ nums: a[0] as number[] }),
  run: ({ nums }) => {
    const rec = createRecorder();
    nums.forEach((v, i) => rec.step({ line: 'loop', vars: { i: String(i) }, views: [{ kind: 'array', id: 'a', label: 'nums', values: nums, pointers: [{ name: 'i', index: i }], marks: [] }], note: `Look at ${v}.` }));
    return rec.finish(nums.length);
  },
};
const java = 'class Solution {\n  int f(int[] a) { // @L:loop\n    return a.length;\n  }\n}';

describe('mountPlayerView', () => {
  it('renders the first step and steps with buttons and keys', () => {
    const host = document.createElement('div');
    const v = mountPlayerView(host, { trace: countTrace, java, input: { nums: [4, 5, 6] }, title: 'Count', reducedMotion: true });
    expect(host.querySelector('.player-count')!.textContent).toBe('Step 1 of 3');
    expect(host.querySelector('.player-note')!.textContent).toBe('Look at 4.');
    expect(host.querySelector('.code-panel .ln.active')!.getAttribute('data-line')).toBe('2');
    (host.querySelector('[data-action="next"]') as HTMLButtonElement).click();
    expect(host.querySelector('.player-count')!.textContent).toBe('Step 2 of 3');
    v.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(host.querySelector('.player-count')!.textContent).toBe('Step 1 of 3');
    (host.querySelector('[data-action="speed-2"]') as HTMLButtonElement).click();
    expect(v.player().speed).toBe(2);
    v.dispose();
    expect(host.innerHTML).toBe('');
  });

  it('runs own input and shows plain errors', () => {
    const host = document.createElement('div');
    mountPlayerView(host, { trace: countTrace, java, input: { nums: [4] }, title: 'Count', reducedMotion: true });
    const input = host.querySelector<HTMLInputElement>('.player-input input[name="nums"]')!;
    expect(input.value).toBe('4');
    input.value = '1, x';
    (host.querySelector('[data-action="run-input"]') as HTMLButtonElement).click();
    expect(host.querySelector('.player-input .error')!.textContent).toContain('Use whole numbers');
    input.value = '7, 8';
    (host.querySelector('[data-action="run-input"]') as HTMLButtonElement).click();
    expect(host.querySelector('.player-input .error')!.textContent).toBe('');
    expect(host.querySelector('.player-count')!.textContent).toBe('Step 1 of 2');
  });
});

describe('mountVizGroup', () => {
  it('switches between traces with tabs', () => {
    const host = document.createElement('div');
    const dispose = mountVizGroup(host, [
      { label: 'One', trace: countTrace, java, input: { nums: [1] } },
      { label: 'Two', trace: countTrace, java, input: { nums: [1, 2] } },
    ], { reducedMotion: true });
    const tabs = host.querySelectorAll<HTMLButtonElement>('.viz-tabs button');
    expect(tabs[0]!.getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelector('.player-count')!.textContent).toBe('Step 1 of 1');
    tabs[1]!.click();
    expect(tabs[1]!.getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelector('.player-count')!.textContent).toBe('Step 1 of 2');
    dispose();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/engine/player-view.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/engine/player-view.ts`**

```ts
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/unit/engine/player-view.test.ts && npm run typecheck`
Expected: PASS, typecheck clean.

**Checkpoint:** player view done.

---

### Task 11: Java literals and the test harness

**Files:**
- Create: `src/lab/java-literals.ts`, `src/lab/harness.ts`
- Test: `tests/unit/lab/java-literals.test.ts`, `tests/unit/lab/harness.test.ts`

**Interfaces:**
- Consumes: `JavaType`, `ArgGenerator`, `ProblemSpec` from `src/content-types.ts`.
- Produces:
  - `class LiteralError extends Error`
  - `isGenerator(v: unknown): v is ArgGenerator`
  - `toJavaLiteral(value: unknown, type: JavaType): string`. Throws `LiteralError` with a plain message.
  - `argExpression(value: unknown, type: JavaType): string`. A literal, or a `HarnessGen.*` call for a generator.
  - `interface HarnessTest { id: string; args: unknown[] }`
  - `generateHarness(spec: ProblemSpec, tests: HarnessTest[]): string`. Returns a full `Main.java`.
  - Output protocol, one line each: `@@BEGIN <id>` then `@@END {"id":"…","ok":true,"ms":N,"actual":<json>}` or `@@END {"id":"…","ok":false,"ms":N,"error":"<class>: <message>"}`.

- [ ] **Step 1: Write the failing literal test**

```ts
import { describe, expect, it } from 'vitest';
import { argExpression, isGenerator, LiteralError, toJavaLiteral } from '../../../src/lab/java-literals';

describe('toJavaLiteral', () => {
  it.each([
    [5, 'int', '5'],
    [-2147483648, 'int', '-2147483648'],
    [9007199254740991, 'long', '9007199254740991L'],
    [2, 'double', '2.0'],
    [2.5, 'double', '2.5'],
    [true, 'boolean', 'true'],
    ['a', 'char', "'a'"],
    ["'", 'char', "'\\''"],
    ['hi "x"\n', 'String', '"hi \\"x\\"\\n"'],
    ['é', 'String', '"\\u00e9"'],
    [[1, 2], 'int[]', 'new int[]{1, 2}'],
    [[], 'int[]', 'new int[]{}'],
    [[[1], [2, 3]], 'int[][]', 'new int[][]{{1}, {2, 3}}'],
    [[['a', 'b']], 'char[][]', "new char[][]{{'a', 'b'}}"],
    [['x'], 'String[]', 'new String[]{"x"}'],
    [[1, 2], 'List<Integer>', 'new ArrayList<Integer>(Arrays.<Integer>asList(1, 2))'],
    [[], 'List<String>', 'new ArrayList<String>()'],
    [[[1], []], 'List<List<Integer>>', 'new ArrayList<List<Integer>>(Arrays.<List<Integer>>asList(new ArrayList<Integer>(Arrays.<Integer>asList(1)), new ArrayList<Integer>()))'],
  ] as const)('%j as %s', (value, type, out) => {
    expect(toJavaLiteral(value, type)).toBe(out);
  });

  it('rejects wrong values with plain messages', () => {
    expect(() => toJavaLiteral(1.5, 'int')).toThrow(LiteralError);
    expect(() => toJavaLiteral(2147483648, 'int')).toThrow('Expected an int');
    expect(() => toJavaLiteral('ab', 'char')).toThrow('Expected one character');
    expect(() => toJavaLiteral([1, 'x'], 'int[]')).toThrow('Expected an int');
    expect(() => toJavaLiteral({}, 'String')).toThrow('Expected a string');
  });
});

describe('generators', () => {
  it('detects and expands generators', () => {
    expect(isGenerator({ gen: 'intRange', n: 3 })).toBe(true);
    expect(isGenerator([1, 2])).toBe(false);
    expect(argExpression({ gen: 'intRange', n: 100000 }, 'int[]')).toBe('HarnessGen.intRange(100000)');
    expect(argExpression({ gen: 'intConst', n: 5, value: -1 }, 'int[]')).toBe('HarnessGen.intConst(5, -1)');
    expect(() => argExpression({ gen: 'intRange', n: 3 }, 'String')).toThrow('only make int[]');
    expect(argExpression([1], 'int[]')).toBe('new int[]{1}');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/lab/java-literals.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lab/java-literals.ts`**

```ts
import type { ArgGenerator, JavaType } from '../content-types';

export class LiteralError extends Error {}

const INT_MIN = -2147483648;
const INT_MAX = 2147483647;

function show(v: unknown): string {
  return JSON.stringify(v) ?? String(v);
}

function escapeJavaChar(ch: string): string {
  const code = ch.charCodeAt(0);
  if (ch === '\\') return '\\\\';
  if (ch === '"') return '\\"';
  if (ch === "'") return "\\'";
  if (ch === '\n') return '\\n';
  if (ch === '\r') return '\\r';
  if (ch === '\t') return '\\t';
  if (code < 0x20 || code > 0x7e) return `\\u${code.toString(16).padStart(4, '0')}`;
  return ch;
}

function escapeJavaString(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i] as string;
    out += ch === "'" ? "'" : escapeJavaChar(ch);
  }
  return out;
}

function intLit(v: unknown): string {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < INT_MIN || v > INT_MAX) {
    throw new LiteralError(`Expected an int, got ${show(v)}`);
  }
  return String(v);
}

function stringLit(v: unknown): string {
  if (typeof v !== 'string') throw new LiteralError(`Expected a string, got ${show(v)}`);
  return `"${escapeJavaString(v)}"`;
}

function charLit(v: unknown): string {
  if (typeof v !== 'string' || v.length !== 1) throw new LiteralError(`Expected one character, got ${show(v)}`);
  return `'${escapeJavaChar(v)}'`;
}

function arr(v: unknown, what: string): unknown[] {
  if (!Array.isArray(v)) throw new LiteralError(`Expected ${what}, got ${show(v)}`);
  return v;
}

function list(elemType: string, items: string[]): string {
  if (items.length === 0) return `new ArrayList<${elemType}>()`;
  return `new ArrayList<${elemType}>(Arrays.<${elemType}>asList(${items.join(', ')}))`;
}

export function toJavaLiteral(value: unknown, type: JavaType): string {
  switch (type) {
    case 'int':
      return intLit(value);
    case 'long':
      if (typeof value !== 'number' || !Number.isSafeInteger(value)) throw new LiteralError(`Expected a long, got ${show(value)}`);
      return `${value}L`;
    case 'double': {
      if (typeof value !== 'number' || !Number.isFinite(value)) throw new LiteralError(`Expected a double, got ${show(value)}`);
      const s = String(value);
      return /[.eE]/.test(s) ? s : `${s}.0`;
    }
    case 'boolean':
      if (typeof value !== 'boolean') throw new LiteralError(`Expected true or false, got ${show(value)}`);
      return String(value);
    case 'char':
      return charLit(value);
    case 'String':
      return stringLit(value);
    case 'int[]':
      return `new int[]{${arr(value, 'an array of ints').map(intLit).join(', ')}}`;
    case 'int[][]':
      return `new int[][]{${arr(value, 'an array of int arrays').map((row) => `{${arr(row, 'an array of ints').map(intLit).join(', ')}}`).join(', ')}}`;
    case 'char[][]':
      return `new char[][]{${arr(value, 'a grid of characters').map((row) => `{${arr(row, 'a row of characters').map(charLit).join(', ')}}`).join(', ')}}`;
    case 'String[]':
      return `new String[]{${arr(value, 'an array of strings').map(stringLit).join(', ')}}`;
    case 'List<Integer>':
      return list('Integer', arr(value, 'a list of ints').map(intLit));
    case 'List<String>':
      return list('String', arr(value, 'a list of strings').map(stringLit));
    case 'List<List<Integer>>':
      return list('List<Integer>', arr(value, 'a list of int lists').map((row) => list('Integer', arr(row, 'a list of ints').map(intLit))));
    case 'List<List<String>>':
      return list('List<String>', arr(value, 'a list of string lists').map((row) => list('String', arr(row, 'a list of strings').map(stringLit))));
  }
}

export function isGenerator(v: unknown): v is ArgGenerator {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && 'gen' in v;
}

export function argExpression(value: unknown, type: JavaType): string {
  if (!isGenerator(value)) return toJavaLiteral(value, type);
  if (type !== 'int[]') throw new LiteralError(`Generators can only make int[] values, not ${type}`);
  if (!Number.isInteger(value.n) || value.n < 0) throw new LiteralError(`Generator size must be a whole number, got ${show(value.n)}`);
  if (value.gen === 'intRange') return `HarnessGen.intRange(${value.n})`;
  return `HarnessGen.intConst(${value.n}, ${intLit(value.value)})`;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/unit/lab/java-literals.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing harness test**

```ts
import { describe, expect, it } from 'vitest';
import type { ProblemSpec } from '../../../src/content-types';
import { generateHarness } from '../../../src/lab/harness';

const spec: ProblemSpec = {
  className: 'Solution', method: 'containsDuplicate',
  params: [{ name: 'nums', type: 'int[]' }], returns: 'boolean', compare: 'exact',
  samples: [], hidden: [],
};

describe('generateHarness', () => {
  it('makes one method per test with typed arguments', () => {
    const java = generateHarness(spec, [{ id: 's1', args: [[1, 2, 1]] }, { id: 'speed', args: [{ gen: 'intRange', n: 10 }] }]);
    expect(java).toContain('public class Main');
    expect(java).toContain('t0();');
    expect(java).toContain('t1();');
    expect(java).toContain('int[] a0 = new int[]{1, 2, 1};');
    expect(java).toContain('int[] a0 = HarnessGen.intRange(10);');
    expect(java).toContain('new Solution().containsDuplicate(a0)');
    expect(java).toContain('System.out.println("@@BEGIN s1");');
    expect(java).toContain('catch (Throwable e)');
    expect(java).toContain('final class HarnessJson');
  });
  it('rejects bad ids and wrong argument counts', () => {
    expect(() => generateHarness(spec, [{ id: 'Bad Id', args: [[1]] }])).toThrow('Test id');
    expect(() => generateHarness(spec, [{ id: 's1', args: [] }])).toThrow('expected 1 argument');
  });
});
```

- [ ] **Step 6: Implement `src/lab/harness.ts`**

```ts
import type { ProblemSpec } from '../content-types';
import { argExpression, LiteralError } from './java-literals';

export interface HarnessTest {
  id: string;
  args: unknown[];
}

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const HELPERS = String.raw`final class HarnessJson {
    private HarnessJson() {}

    static String str(String s) {
        StringBuilder b = new StringBuilder("\"");
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '"') b.append("\\\"");
            else if (c == '\\') b.append("\\\\");
            else if (c == '\n') b.append("\\n");
            else if (c == '\r') b.append("\\r");
            else if (c == '\t') b.append("\\t");
            else if (c < 0x20) {
                String h = Integer.toHexString(c);
                b.append("\\u");
                for (int k = h.length(); k < 4; k++) b.append('0');
                b.append(h);
            } else b.append(c);
        }
        return b.append('"').toString();
    }

    static String num(double d) {
        if (Double.isNaN(d) || Double.isInfinite(d)) return str(String.valueOf(d));
        return String.valueOf(d);
    }

    static String of(Object o) {
        if (o == null) return "null";
        if (o instanceof String) return str((String) o);
        if (o instanceof Character) return str(String.valueOf(o));
        if (o instanceof Boolean || o instanceof Integer || o instanceof Long || o instanceof Short || o instanceof Byte) return String.valueOf(o);
        if (o instanceof Double || o instanceof Float) return num(((Number) o).doubleValue());
        StringBuilder b = new StringBuilder("[");
        if (o instanceof int[]) { int[] a = (int[]) o; for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(a[i]); } return b.append(']').toString(); }
        if (o instanceof long[]) { long[] a = (long[]) o; for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(a[i]); } return b.append(']').toString(); }
        if (o instanceof double[]) { double[] a = (double[]) o; for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(num(a[i])); } return b.append(']').toString(); }
        if (o instanceof boolean[]) { boolean[] a = (boolean[]) o; for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(a[i]); } return b.append(']').toString(); }
        if (o instanceof char[]) { char[] a = (char[]) o; for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(str(String.valueOf(a[i]))); } return b.append(']').toString(); }
        if (o instanceof Object[]) { Object[] a = (Object[]) o; for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(of(a[i])); } return b.append(']').toString(); }
        if (o instanceof Iterable) { boolean first = true; for (Object x : (Iterable<?>) o) { if (!first) b.append(','); b.append(of(x)); first = false; } return b.append(']').toString(); }
        return str(String.valueOf(o));
    }
}

final class HarnessGen {
    private HarnessGen() {}

    static int[] intRange(int n) {
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = i;
        return a;
    }

    static int[] intConst(int n, int value) {
        int[] a = new int[n];
        Arrays.fill(a, value);
        return a;
    }
}
`;

function testMethod(spec: ProblemSpec, t: HarnessTest, i: number): string {
  if (!ID.test(t.id)) throw new LiteralError(`Test id "${t.id}" must be lowercase letters, digits and dashes`);
  if (t.args.length !== spec.params.length) {
    throw new LiteralError(`Test ${t.id}: expected ${spec.params.length} argument(s), got ${t.args.length}`);
  }
  const decls = spec.params
    .map((p, k) => `            ${p.type} a${k} = ${argExpression(t.args[k], p.type)};`)
    .join('\n');
  const call = spec.params.map((_, k) => `a${k}`).join(', ');
  return `    static void t${i}() {
        System.out.println("@@BEGIN ${t.id}");
        long start = 0L;
        try {
${decls}
            start = System.nanoTime();
            Object result = new Solution().${spec.method}(${call});
            long ms = (System.nanoTime() - start) / 1000000L;
            System.out.println("@@END {\\"id\\":\\"${t.id}\\",\\"ok\\":true,\\"ms\\":" + ms + ",\\"actual\\":" + HarnessJson.of(result) + "}");
        } catch (Throwable e) {
            long ms = start == 0L ? 0L : (System.nanoTime() - start) / 1000000L;
            String message = e.getClass().getName() + (e.getMessage() == null ? "" : ": " + e.getMessage());
            System.out.println("@@END {\\"id\\":\\"${t.id}\\",\\"ok\\":false,\\"ms\\":" + ms + ",\\"error\\":" + HarnessJson.str(message) + "}");
        }
    }`;
}

export function generateHarness(spec: ProblemSpec, tests: HarnessTest[]): string {
  const methods = tests.map((t, i) => testMethod(spec, t, i)).join('\n\n');
  const calls = tests.map((_, i) => `        t${i}();`).join('\n');
  return `import java.util.*;

public class Main {
    public static void main(String[] args) {
${calls}
    }

${methods}
}

${HELPERS}`;
}
```

- [ ] **Step 7: Run to verify it passes**

Run: `npx vitest run tests/unit/lab/harness.test.ts tests/unit/lab/java-literals.test.ts`
Expected: PASS.

**Checkpoint:** harness generator done. Task 13 runs it for real on the JDK.

---

### Task 12: Output parsing, comparing, formatting and test planning

**Files:**
- Create: `src/lab/parse-output.ts`, `src/lab/compare.ts`, `src/lab/format.ts`, `src/lab/runner.ts`, `src/lab/results.ts`
- Test: `tests/unit/lab/results.test.ts`

**Interfaces:**
- Produces (`parse-output.ts`):
  - `interface RawTestOutput { id: string; finished: boolean; ok: boolean; actual?: unknown; error?: string; ms: number; stdout: string }`
  - `parseHarnessOutput(lines: string[], ids: string[]): { tests: RawTestOutput[]; stray: string }`
- Produces (`compare.ts`): `compareValues(mode: CompareMode, expected: unknown, actual: unknown): boolean`
- Produces (`format.ts`): `formatValue(v: unknown): string`, `formatArgs(spec: ProblemSpec, args: unknown[]): string`
- Produces (`runner.ts`):
  - `type TestKind = 'sample' | 'custom' | 'hidden' | 'speed'`
  - `interface TestResult { id: string; kind: TestKind; pass: boolean; input: string; expected: string; actual: string; stdout: string; timeMs: number; error?: string }`
  - `type RunResult = { kind: 'compileError'; errors: { line: number; message: string }[] } | { kind: 'tests' | 'timeout' | 'stopped'; results: TestResult[]; stdout: string } | { kind: 'runnerUnavailable'; reason: string }`
  - `interface RunRequest { code: string; spec: ProblemSpec; mode: 'samples' | 'all'; extraTests?: TestCase[]; timeLimitMs: number }`
  - `interface JavaRunner { ready(onProgress?: (message: string) => void): Promise<void>; run(req: RunRequest): Promise<RunResult>; stop(): void }`

  This refines spec §10.3. `timeout` carries the results that finished, and `stopped` is added for the Stop button.
- Produces (`results.ts`):
  - `interface PlannedTest { id: string; kind: TestKind; args: unknown[]; expected: unknown; timeLimitMs?: number }`
  - `planTests(spec: ProblemSpec, mode: 'samples' | 'all', extra?: TestCase[]): PlannedTest[]`. Order: samples, custom, hidden, speed.
  - `buildResults(spec: ProblemSpec, planned: PlannedTest[], raw: RawTestOutput[], notFinished: string): TestResult[]`
  - `TOO_SLOW(ms: number, limit: number): string`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import type { ProblemSpec } from '../../../src/content-types';
import { compareValues } from '../../../src/lab/compare';
import { formatArgs, formatValue } from '../../../src/lab/format';
import { parseHarnessOutput } from '../../../src/lab/parse-output';
import { buildResults, planTests } from '../../../src/lab/results';

const spec: ProblemSpec = {
  className: 'Solution', method: 'f', params: [{ name: 'nums', type: 'int[]' }], returns: 'boolean', compare: 'exact',
  samples: [{ id: 's1', args: [[1, 1]], expected: true }],
  hidden: [{ id: 'h1', args: [[1]], expected: false }],
  speed: { id: 'speed', args: [{ gen: 'intRange', n: 100000 }], expected: false, timeLimitMs: 50 },
};

describe('parseHarnessOutput', () => {
  it('reads results, stdout per test and stray lines', () => {
    const out = parseHarnessOutput([
      'hello before', '@@BEGIN s1', 'debug 1', '@@END {"id":"s1","ok":true,"ms":3,"actual":true}',
      '@@BEGIN h1', '@@END {"id":"h1","ok":false,"ms":0,"error":"java.lang.RuntimeException: boom"}', '@@BEGIN speed',
    ], ['s1', 'h1', 'speed', 'never']);
    expect(out.stray).toBe('hello before');
    expect(out.tests[0]).toEqual({ id: 's1', finished: true, ok: true, ms: 3, actual: true, error: undefined, stdout: 'debug 1' });
    expect(out.tests[1]!.error).toBe('java.lang.RuntimeException: boom');
    expect(out.tests[2]!.finished).toBe(false);
    expect(out.tests[3]!.finished).toBe(false);
  });
});

describe('compareValues', () => {
  it('compares by mode', () => {
    expect(compareValues('exact', [1, 2], [1, 2])).toBe(true);
    expect(compareValues('exact', [1, 2], [2, 1])).toBe(false);
    expect(compareValues('unorderedList', [1, 2], [2, 1])).toBe(true);
    expect(compareValues('unorderedNested', [[1, 2], [3]], [[3], [2, 1]])).toBe(true);
    expect(compareValues('unorderedList', [[1, 2]], [[2, 1]])).toBe(false);
    expect(compareValues('float', 0.1 + 0.2, 0.3)).toBe(true);
    expect(compareValues('float', [1.000001], [1])).toBe(true);
    expect(compareValues('float', 1.1, 1)).toBe(false);
    expect(compareValues('unorderedList', 1, 1)).toBe(false);
  });
});

describe('format', () => {
  it('formats values and arguments', () => {
    expect(formatValue([1, 2])).toBe('[1,2]');
    expect(formatValue(null)).toBe('null');
    expect(formatArgs(spec, [[1, 2]])).toBe('nums = [1,2]');
    expect(formatArgs(spec, [{ gen: 'intRange', n: 100000 }])).toBe('nums = 100,000 numbers: 0, 1, 2, … 99,999');
    expect(formatArgs(spec, [{ gen: 'intConst', n: 5, value: 7 }])).toBe('nums = 5 copies of 7');
  });
});

describe('planTests and buildResults', () => {
  it('orders tests by kind', () => {
    expect(planTests(spec, 'samples').map((t) => t.id)).toEqual(['s1']);
    expect(planTests(spec, 'all', [{ id: 'c1', args: [[2]], expected: false }]).map((t) => `${t.kind}:${t.id}`))
      .toEqual(['sample:s1', 'custom:c1', 'hidden:h1', 'speed:speed']);
  });
  it('marks wrong, crashed, slow and unfinished tests', () => {
    const planned = planTests(spec, 'all');
    const raw = parseHarnessOutput([
      '@@BEGIN s1', '@@END {"id":"s1","ok":true,"ms":1,"actual":false}',
      '@@BEGIN h1', '@@END {"id":"h1","ok":false,"ms":0,"error":"java.lang.NullPointerException"}',
      '@@BEGIN speed', '@@END {"id":"speed","ok":true,"ms":900,"actual":false}',
    ], planned.map((p) => p.id)).tests;
    const r = buildResults(spec, planned, raw, 'Did not finish.');
    expect(r[0]).toMatchObject({ id: 's1', pass: false, expected: 'true', actual: 'false', input: 'nums = [1,1]' });
    expect(r[1]).toMatchObject({ id: 'h1', pass: false, error: 'java.lang.NullPointerException' });
    expect(r[2]).toMatchObject({ id: 'speed', pass: false });
    expect(r[2]!.error).toContain('Looks too slow for these limits');
    const unfinished = buildResults(spec, planned, parseHarnessOutput([], planned.map((p) => p.id)).tests, 'Did not finish.');
    expect(unfinished.every((t) => !t.pass && t.error === 'Did not finish.')).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/lab/results.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement `src/lab/parse-output.ts`**

```ts
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

export function parseHarnessOutput(lines: string[], ids: string[]): { tests: RawTestOutput[]; stray: string } {
  const byId = new Map<string, RawTestOutput>();
  const stray: string[] = [];
  let current: RawTestOutput | null = null;
  for (const line of lines) {
    if (line.startsWith('@@BEGIN ')) {
      const id = line.slice(8).trim();
      current = { id, finished: false, ok: false, ms: 0, stdout: '' };
      byId.set(id, current);
      continue;
    }
    if (line.startsWith('@@END ')) {
      let data: EndLine;
      try {
        data = JSON.parse(line.slice(6)) as EndLine;
      } catch {
        stray.push(line);
        continue;
      }
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
    if (current) current.stdout += (current.stdout ? '\n' : '') + line;
    else stray.push(line);
  }
  const tests = ids.map((id) => byId.get(id) ?? { id, finished: false, ok: false, ms: 0, stdout: '' });
  return { tests, stray: stray.join('\n') };
}
```

- [ ] **Step 4: Implement `src/lab/compare.ts`**

```ts
import type { CompareMode } from '../content-types';

const json = (v: unknown) => JSON.stringify(v);

function sortedCopy(a: unknown[]): unknown[] {
  return [...a].sort((x, y) => {
    const sx = json(x);
    const sy = json(y);
    return sx < sy ? -1 : sx > sy ? 1 : 0;
  });
}

function floatEqual(a: unknown, b: unknown): boolean {
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) <= 1e-5 * Math.max(1, Math.abs(a), Math.abs(b));
  }
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => floatEqual(x, b[i]));
  return json(a) === json(b);
}

export function compareValues(mode: CompareMode, expected: unknown, actual: unknown): boolean {
  switch (mode) {
    case 'exact':
      return json(expected) === json(actual);
    case 'float':
      return floatEqual(expected, actual);
    case 'unorderedList':
      return Array.isArray(expected) && Array.isArray(actual) && json(sortedCopy(expected)) === json(sortedCopy(actual));
    case 'unorderedNested': {
      if (!Array.isArray(expected) || !Array.isArray(actual)) return false;
      const norm = (a: unknown[]) => sortedCopy(a.map((x) => (Array.isArray(x) ? sortedCopy(x) : x)));
      return json(norm(expected)) === json(norm(actual));
    }
  }
}
```

- [ ] **Step 5: Implement `src/lab/format.ts`**

```ts
import type { ArgGenerator, ProblemSpec } from '../content-types';
import { isGenerator } from './java-literals';

const n = (x: number) => x.toLocaleString('en-US');

export function formatValue(v: unknown): string {
  return JSON.stringify(v) ?? 'null';
}

function describeGenerator(g: ArgGenerator): string {
  if (g.gen === 'intRange') return `${n(g.n)} numbers: 0, 1, 2, … ${n(g.n - 1)}`;
  return `${n(g.n)} copies of ${g.value}`;
}

export function formatArgs(spec: ProblemSpec, args: unknown[]): string {
  return spec.params
    .map((p, i) => {
      const a = args[i];
      return `${p.name} = ${isGenerator(a) ? describeGenerator(a) : formatValue(a)}`;
    })
    .join(', ');
}
```

- [ ] **Step 6: Implement `src/lab/runner.ts`**

```ts
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
```

- [ ] **Step 7: Implement `src/lab/results.ts`**

```ts
import type { ProblemSpec, TestCase } from '../content-types';
import { compareValues } from './compare';
import { formatArgs, formatValue } from './format';
import type { RawTestOutput } from './parse-output';
import type { TestKind, TestResult } from './runner';

export interface PlannedTest {
  id: string;
  kind: TestKind;
  args: unknown[];
  expected: unknown;
  timeLimitMs?: number;
}

export const TOO_SLOW = (ms: number, limit: number) =>
  `Looks too slow for these limits. It took ${ms} ms and the limit is ${limit} ms.`;

export function planTests(spec: ProblemSpec, mode: 'samples' | 'all', extra: TestCase[] = []): PlannedTest[] {
  const plan: PlannedTest[] = spec.samples.map((t) => ({ ...t, kind: 'sample' as const }));
  plan.push(...extra.map((t) => ({ ...t, kind: 'custom' as const })));
  if (mode === 'all') {
    plan.push(...spec.hidden.map((t) => ({ ...t, kind: 'hidden' as const })));
    if (spec.speed) plan.push({ ...spec.speed, kind: 'speed' });
  }
  return plan;
}

export function buildResults(spec: ProblemSpec, planned: PlannedTest[], raw: RawTestOutput[], notFinished: string): TestResult[] {
  return planned.map((p, i) => {
    const r = raw[i];
    const base = { id: p.id, kind: p.kind, input: formatArgs(spec, p.args), expected: formatValue(p.expected), stdout: r?.stdout ?? '', timeMs: r?.ms ?? 0 };
    if (!r || !r.finished) return { ...base, pass: false, actual: '', error: notFinished };
    if (!r.ok) return { ...base, pass: false, actual: '', error: r.error ?? 'The code threw an error.' };
    const correct = compareValues(spec.compare, p.expected, r.actual);
    if (correct && p.kind === 'speed' && p.timeLimitMs !== undefined && r.ms > p.timeLimitMs) {
      return { ...base, pass: false, actual: formatValue(r.actual), error: TOO_SLOW(r.ms, p.timeLimitMs) };
    }
    return { ...base, pass: correct, actual: formatValue(r.actual) };
  });
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `npx vitest run tests/unit/lab/results.test.ts && npm run typecheck`
Expected: PASS, typecheck clean.

**Checkpoint:** result handling done.

---

### Task 13: JDK verification tool

**Files:**
- Create: `tools/verify-java.ts`
- Test: `tests/tools/verify-java-harness.test.ts`

**Interfaces:**
- Consumes: `generateHarness` (Task 11), `planTests`, `buildResults` (Task 12), `parseHarnessOutput`, `parseMarkers` (Task 6), `Problem`.
- Produces:
  - `interface VerifyIssue { problemId: string; approach: string; testId?: string; message: string }`
  - `verifyProblemOnJdk(problem: Problem, workDir: string): VerifyIssue[]`. Compiles the starter alone with a stub harness. Then for each approach it compiles `Solution.java` + `Main.java` with `javac --release 21`, runs `java -Xss64m -cp out Main` with a 120 s timeout, and checks the results.
  - The optimal approach runs `planTests(spec,'all')`. Brute and better approaches run the same list without the speed test.

- [ ] **Step 1: Write the failing test (fixture problem, no real content needed)**

```ts
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Problem } from '../../src/content-types';
import { verifyProblemOnJdk } from '../../tools/verify-java';

const good = `import java.util.*;
class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>(); // @L:init
        for (int n : nums) if (!seen.add(n)) return true;
        return false;
    }
}`;
const slow = `class Solution {
    public boolean containsDuplicate(int[] nums) {
        for (int i = 0; i < nums.length; i++) for (int j = i + 1; j < nums.length; j++) if (nums[i] == nums[j]) return true;
        return false;
    }
}`;
const wrong = `class Solution { public boolean containsDuplicate(int[] nums) { return false; } }`;

function fixture(approaches: Problem['approaches']): Problem {
  return {
    id: 'fixture', starter: 'import java.util.*;\nclass Solution {\n    public boolean containsDuplicate(int[] nums) {\n        return false;\n    }\n}\n',
    approaches,
    spec: {
      className: 'Solution', method: 'containsDuplicate', params: [{ name: 'nums', type: 'int[]' }], returns: 'boolean', compare: 'exact',
      samples: [{ id: 's1', args: [[1, 2, 3, 1]], expected: true }, { id: 's2', args: [[1, 2, 3]], expected: false }],
      hidden: [{ id: 'h1', args: [[7]], expected: false }],
      // 200,000 numbers: about 2 × 10^10 pair checks for the slow version, so it clearly misses 2 s.
      speed: { id: 'speed', args: [{ gen: 'intRange', n: 200000 }], expected: false, timeLimitMs: 2000 },
    },
  } as unknown as Problem;
}

const work = () => mkdtempSync(join(tmpdir(), 'dsa-verify-'));

describe('verifyProblemOnJdk', () => {
  it('passes a correct optimal and a slow brute force', () => {
    const issues = verifyProblemOnJdk(fixture([
      { level: 'brute', title: 'b', idea: 'i', java: slow, time: 'O(n^2)', space: 'O(1)', nextStepRemoves: 'x' },
      { level: 'optimal', title: 'o', idea: 'i', java: good, time: 'O(n)', space: 'O(n)' },
    ]), work());
    expect(issues).toEqual([]);
  });
  it('reports a wrong answer and a compile error', () => {
    const issues = verifyProblemOnJdk(fixture([
      { level: 'brute', title: 'b', idea: 'i', java: 'class Solution { oops }', time: 'O(1)', space: 'O(1)', nextStepRemoves: 'x' },
      { level: 'optimal', title: 'o', idea: 'i', java: wrong, time: 'O(1)', space: 'O(1)' },
    ]), work());
    expect(issues.some((i) => i.approach === 'brute' && i.message.startsWith('javac failed'))).toBe(true);
    expect(issues.some((i) => i.approach === 'optimal' && i.testId === 's1')).toBe(true);
  });
  it('reports an optimal that is too slow for the speed test', () => {
    const issues = verifyProblemOnJdk(fixture([{ level: 'optimal', title: 'o', idea: 'i', java: slow, time: 'O(n)', space: 'O(1)' }]), work());
    expect(issues.some((i) => i.testId === 'speed')).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run verify:java`
Expected: FAIL (cannot resolve `tools/verify-java`).

- [ ] **Step 3: Implement `tools/verify-java.ts`**

```ts
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run verify:java`
Expected: PASS (3 tests). This needs `javac` and `java` 21 on PATH.

**Checkpoint:** JDK verification works on a fixture.

---

### Task 14: TeaVM runner (assets, workers, orchestrator)

**Files:**
- Create: `scripts/fetch-teavm.mjs`, `public/runner/teavm/*` (downloaded), `src/lab/teavm-protocol.ts`, `src/lab/teavm-compile-worker.ts`, `src/lab/teavm-run-worker.ts`, `src/lab/teavm-runner.ts`
- Test: `tests/unit/lab/teavm-runner.test.ts`

**Interfaces:**
- Consumes: `JavaRunner`, `RunRequest`, `RunResult` (Task 12), `planTests`, `buildResults`, `parseHarnessOutput`, `generateHarness`.
- Produces (`teavm-protocol.ts`):
  - `interface TeaVMDiagnostic { type: 'javac' | 'teavm'; severity: 'error' | 'warning' | 'other'; fileName: string; lineNumber: number; message: string }`
  - `type CompileWorkerRequest = { type: 'init'; assetBase: string } | { type: 'compile'; id: number; files: { name: string; content: string }[] }`
  - `type CompileWorkerResponse = { type: 'ready' } | { type: 'loadError'; message: string } | { type: 'compiled'; id: number; ok: boolean; diagnostics: TeaVMDiagnostic[]; wasm?: Int8Array }`
  - `type RunWorkerRequest = { type: 'run'; wasm: Int8Array; runtimeUrl: string }`
  - `type RunWorkerMessage = { type: 'line'; text: string } | { type: 'done' } | { type: 'error'; message: string }`
- Produces (`teavm-runner.ts`):
  - `interface WorkerLike { postMessage(msg: unknown, transfer?: Transferable[]): void; terminate(): void; onmessage: ((ev: MessageEvent) => void) | null; onerror: ((ev: Event) => void) | null }`
  - `interface TeaVMRunnerDeps { createCompileWorker(): WorkerLike; createRunWorker(): WorkerLike; supportsWasmGC(): boolean; assetBase: string; setTimeout(fn: () => void, ms: number): number; clearTimeout(id: number): void }`
  - `supportsWasmGC(): boolean`
  - `defaultTeaVMDeps(): TeaVMRunnerDeps`
  - `mapCompileErrors(diags: TeaVMDiagnostic[], spec: ProblemSpec): { line: number; message: string }[]`
  - `signature(spec: ProblemSpec): string`, for example `public boolean containsDuplicate(int[] nums)`
  - `class TeaVMRunner implements JavaRunner { constructor(deps?: TeaVMRunnerDeps) }`
  - Messages: `UNSUPPORTED_BROWSER`, `NOT_FINISHED_TIMEOUT`, `NOT_FINISHED_STOPPED`

- [ ] **Step 1: Write `scripts/fetch-teavm.mjs` and download the assets**

```js
// Downloads the pinned TeaVM playground build into public/runner/teavm/ and records hashes.
// Usage: node scripts/fetch-teavm.mjs          (download + write VERSION.json)
//        node scripts/fetch-teavm.mjs --check  (verify files on disk match VERSION.json)
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE = 'https://teavm.org/playground/4/';
const FILES = ['compiler.wasm', 'compiler.wasm-runtime.js', 'compile-classlib-teavm.bin', 'runtime-classlib-teavm.bin'];
const DIR = join(process.cwd(), 'public', 'runner', 'teavm');
const sha = (buf) => createHash('sha256').update(buf).digest('hex');

if (process.argv.includes('--check')) {
  const version = JSON.parse(readFileSync(join(DIR, 'VERSION.json'), 'utf8'));
  let bad = 0;
  for (const f of FILES) {
    const got = sha(readFileSync(join(DIR, f)));
    if (got !== version.files[f].sha256) { console.error(`hash mismatch: ${f}`); bad++; }
  }
  if (bad) process.exit(1);
  console.log('TeaVM assets match VERSION.json');
} else {
  mkdirSync(DIR, { recursive: true });
  const files = {};
  for (const f of FILES) {
    const res = await fetch(SOURCE + f);
    if (!res.ok) throw new Error(`${f}: HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(join(DIR, f), buf);
    files[f] = { bytes: buf.length, sha256: sha(buf) };
    console.log(`${f}  ${buf.length} bytes`);
  }
  const version = { source: SOURCE, fetched: new Date().toISOString().slice(0, 10), license: 'TeaVM: Apache-2.0. Bundled javac: OpenJDK, GPLv2 with Classpath Exception. See THIRD_PARTY_NOTICES.md.', files };
  writeFileSync(join(DIR, 'VERSION.json'), JSON.stringify(version, null, 2) + '\n');
}
```

Run: `node scripts/fetch-teavm.mjs && node scripts/fetch-teavm.mjs --check`
Expected: four files listed (about 4.9 MB, 17 KB, 0.2 MB, 2.4 MB), then `TeaVM assets match VERSION.json`.

- [ ] **Step 2: Write `src/lab/teavm-protocol.ts`**

```ts
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
```

- [ ] **Step 3: Write the failing orchestrator test (fake workers)**

```ts
import { describe, expect, it } from 'vitest';
import type { ProblemSpec } from '../../../src/content-types';
import type { CompileWorkerRequest, RunWorkerRequest } from '../../../src/lab/teavm-protocol';
import { mapCompileErrors, NOT_FINISHED_TIMEOUT, signature, TeaVMRunner, UNSUPPORTED_BROWSER, type TeaVMRunnerDeps, type WorkerLike } from '../../../src/lab/teavm-runner';

const spec: ProblemSpec = {
  className: 'Solution', method: 'containsDuplicate', params: [{ name: 'nums', type: 'int[]' }], returns: 'boolean', compare: 'exact',
  samples: [{ id: 's1', args: [[1, 1]], expected: true }], hidden: [],
};

class FakeWorker implements WorkerLike {
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  sent: unknown[] = [];
  terminated = false;
  constructor(private reply: (msg: any, w: FakeWorker) => void) {}
  postMessage(msg: unknown) { this.sent.push(msg); queueMicrotask(() => this.reply(msg, this)); }
  terminate() { this.terminated = true; }
  emit(data: unknown) { this.onmessage?.({ data } as MessageEvent); }
}

function deps(over: Partial<TeaVMRunnerDeps> & { compile?: (m: CompileWorkerRequest, w: FakeWorker) => void; run?: (m: RunWorkerRequest, w: FakeWorker) => void } = {}) {
  const timers: (() => void)[] = [];
  const runWorkers: FakeWorker[] = [];
  const d: TeaVMRunnerDeps = {
    supportsWasmGC: () => true,
    assetBase: '/x/',
    createCompileWorker: () => new FakeWorker(over.compile ?? ((m, w) => {
      if (m.type === 'init') w.emit({ type: 'ready' });
      else w.emit({ type: 'compiled', id: m.id, ok: true, diagnostics: [], wasm: new Int8Array([1]) });
    })),
    createRunWorker: () => { const w = new FakeWorker(over.run ?? ((_m, w) => { w.emit({ type: 'line', text: '@@BEGIN s1' }); w.emit({ type: 'line', text: '@@END {"id":"s1","ok":true,"ms":1,"actual":true}' }); w.emit({ type: 'done' }); })); runWorkers.push(w); return w; },
    setTimeout: (fn) => { timers.push(fn); return timers.length; },
    clearTimeout: () => {},
    ...over,
  };
  return { d, timers, runWorkers };
}

const req = { code: 'class Solution {}', spec, mode: 'samples' as const, timeLimitMs: 5000 };

describe('TeaVMRunner', () => {
  it('compiles, runs and returns test results', async () => {
    const { d, runWorkers } = deps();
    const r = await new TeaVMRunner(d).run(req);
    expect(r.kind).toBe('tests');
    if (r.kind === 'tests') expect(r.results[0]).toMatchObject({ id: 's1', pass: true, actual: 'true' });
    expect(runWorkers[0]!.terminated).toBe(true);
  });

  it('reports compile errors with lines from Solution.java', async () => {
    const { d } = deps({ compile: (m, w) => {
      if (m.type === 'init') w.emit({ type: 'ready' });
      else w.emit({ type: 'compiled', id: m.id, ok: false, diagnostics: [{ type: 'javac', severity: 'error', fileName: 'Solution.java', lineNumber: 4, message: 'illegal start of expression' }] });
    } });
    const r = await new TeaVMRunner(d).run(req);
    expect(r).toEqual({ kind: 'compileError', errors: [{ line: 4, message: 'illegal start of expression' }] });
  });

  it('times out an endless program and keeps finished results', async () => {
    const { d, timers } = deps({ run: (_m, w) => { w.emit({ type: 'line', text: '@@BEGIN s1' }); } });
    const p = new TeaVMRunner(d).run(req);
    await new Promise((r) => setTimeout(r, 0));
    timers.forEach((fn) => fn());
    const r = await p;
    expect(r.kind).toBe('timeout');
    if (r.kind === 'timeout') expect(r.results[0]!.error).toBe(NOT_FINISHED_TIMEOUT);
  });

  it('can be stopped', async () => {
    const { d } = deps({ run: () => {} });
    const runner = new TeaVMRunner(d);
    const p = runner.run(req);
    await new Promise((r) => setTimeout(r, 0));
    runner.stop();
    expect((await p).kind).toBe('stopped');
  });

  it('says when the browser cannot run Java', async () => {
    const { d } = deps({ supportsWasmGC: () => false });
    expect(await new TeaVMRunner(d).run(req)).toEqual({ kind: 'runnerUnavailable', reason: UNSUPPORTED_BROWSER });
  });
});

describe('mapCompileErrors', () => {
  it('explains a missing method when only the harness fails', () => {
    expect(signature(spec)).toBe('public boolean containsDuplicate(int[] nums)');
    expect(mapCompileErrors([{ type: 'javac', severity: 'error', fileName: 'Main.java', lineNumber: 9, message: 'cannot find symbol' }], spec))
      .toEqual([{ line: 0, message: 'Keep this method in class Solution: public boolean containsDuplicate(int[] nums)' }]);
    expect(mapCompileErrors([], spec)[0]!.message).toContain('could not be built');
  });
});
```

- [ ] **Step 4: Run to verify it fails**

Run: `npx vitest run tests/unit/lab/teavm-runner.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 5: Implement `src/lab/teavm-runner.ts`**

```ts
import type { ProblemSpec } from '../content-types';
import { generateHarness } from './harness';
import { parseHarnessOutput } from './parse-output';
import { buildResults, planTests, type PlannedTest } from './results';
import type { JavaRunner, RunRequest, RunResult } from './runner';
import type { CompileWorkerRequest, CompileWorkerResponse, RunWorkerMessage, RunWorkerRequest, TeaVMDiagnostic } from './teavm-protocol';

export interface WorkerLike {
  postMessage(msg: unknown, transfer?: Transferable[]): void;
  terminate(): void;
  onmessage: ((ev: MessageEvent) => void) | null;
  onerror: ((ev: Event) => void) | null;
}

export interface TeaVMRunnerDeps {
  createCompileWorker(): WorkerLike;
  createRunWorker(): WorkerLike;
  supportsWasmGC(): boolean;
  assetBase: string;
  setTimeout(fn: () => void, ms: number): number;
  clearTimeout(id: number): void;
}

export const UNSUPPORTED_BROWSER = 'This browser cannot run Java here yet. Update your browser, or copy your code to LeetCode.';
export const NOT_FINISHED_TIMEOUT = 'Did not finish in time. Check for an endless loop, or a solution that is too slow.';
export const NOT_FINISHED_STOPPED = 'Stopped before it finished.';
const COMPILE_TIMEOUT_MS = 60_000;

export function supportsWasmGC(): boolean {
  try {
    return typeof WebAssembly === 'object' && WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 95, 1, 120, 0]));
  } catch {
    return false;
  }
}

export function defaultTeaVMDeps(): TeaVMRunnerDeps {
  return {
    createCompileWorker: () => new Worker(new URL('./teavm-compile-worker.ts', import.meta.url), { type: 'module' }) as unknown as WorkerLike,
    createRunWorker: () => new Worker(new URL('./teavm-run-worker.ts', import.meta.url), { type: 'module' }) as unknown as WorkerLike,
    supportsWasmGC,
    assetBase: new URL(`${import.meta.env.BASE_URL}runner/teavm/`, window.location.origin).href,
    setTimeout: (fn, ms) => window.setTimeout(fn, ms),
    clearTimeout: (id) => window.clearTimeout(id),
  };
}

export function signature(spec: ProblemSpec): string {
  return `public ${spec.returns} ${spec.method}(${spec.params.map((p) => `${p.type} ${p.name}`).join(', ')})`;
}

export function mapCompileErrors(diags: TeaVMDiagnostic[], spec: ProblemSpec): { line: number; message: string }[] {
  if (diags.length === 0) return [{ line: 0, message: 'The code could not be built. Check that it is valid Java.' }];
  const fromSolution = diags
    .filter((d) => !d.fileName.endsWith('Main.java'))
    .map((d) => ({ line: d.type === 'javac' ? d.lineNumber : 0, message: d.message }));
  if (fromSolution.length > 0) return fromSolution;
  return [{ line: 0, message: `Keep this method in class Solution: ${signature(spec)}` }];
}

type Compiled = Extract<CompileWorkerResponse, { type: 'compiled' }>;

export class TeaVMRunner implements JavaRunner {
  private compileWorker: WorkerLike | null = null;
  private readyPromise: Promise<void> | null = null;
  private unavailable: string | null = null;
  private nextId = 1;
  private pending = new Map<number, (m: Compiled) => void>();
  private stopActive: (() => void) | null = null;
  private readonly deps: TeaVMRunnerDeps;

  constructor(deps?: TeaVMRunnerDeps) {
    this.deps = deps ?? defaultTeaVMDeps();
  }

  ready(onProgress?: (message: string) => void): Promise<void> {
    if (!this.readyPromise) this.readyPromise = this.load(onProgress);
    return this.readyPromise;
  }

  private load(onProgress?: (message: string) => void): Promise<void> {
    if (!this.deps.supportsWasmGC()) {
      this.unavailable = UNSUPPORTED_BROWSER;
      return Promise.resolve();
    }
    onProgress?.('Loading Java for the first time. This is about 7.5 MB and happens once.');
    return new Promise((resolve) => {
      const w = this.deps.createCompileWorker();
      this.compileWorker = w;
      w.onmessage = (ev) => {
        const m = ev.data as CompileWorkerResponse;
        if (m.type === 'ready') resolve();
        else if (m.type === 'loadError') {
          this.unavailable = `Java could not load: ${m.message}`;
          resolve();
        } else {
          const cb = this.pending.get(m.id);
          if (cb) {
            this.pending.delete(m.id);
            cb(m);
          }
        }
      };
      w.onerror = () => {
        this.unavailable = 'Java could not load. Check your connection and reload the page.';
        resolve();
      };
      w.postMessage({ type: 'init', assetBase: this.deps.assetBase } satisfies CompileWorkerRequest);
    });
  }

  async run(req: RunRequest): Promise<RunResult> {
    await this.ready();
    if (this.unavailable || !this.compileWorker) return { kind: 'runnerUnavailable', reason: this.unavailable ?? UNSUPPORTED_BROWSER };
    const planned = planTests(req.spec, req.mode, req.extraTests);
    const harness = generateHarness(req.spec, planned);
    const compiled = await this.compile([
      { name: 'Solution.java', content: req.code },
      { name: 'Main.java', content: harness },
    ]);
    if (compiled === 'timeout') {
      this.compileWorker?.terminate();
      this.compileWorker = null;
      this.readyPromise = null;
      return { kind: 'runnerUnavailable', reason: 'The Java compiler stopped responding. Reload the page and try again.' };
    }
    if (!compiled.ok || !compiled.wasm) {
      return { kind: 'compileError', errors: mapCompileErrors(compiled.diagnostics.filter((d) => d.severity === 'error'), req.spec) };
    }
    return this.execute(compiled.wasm, req, planned);
  }

  stop(): void {
    this.stopActive?.();
  }

  private compile(files: { name: string; content: string }[]): Promise<Compiled | 'timeout'> {
    const id = this.nextId++;
    return new Promise((resolve) => {
      const timer = this.deps.setTimeout(() => {
        this.pending.delete(id);
        resolve('timeout');
      }, COMPILE_TIMEOUT_MS);
      this.pending.set(id, (m) => {
        this.deps.clearTimeout(timer);
        resolve(m);
      });
      this.compileWorker?.postMessage({ type: 'compile', id, files } satisfies CompileWorkerRequest);
    });
  }

  private execute(wasm: Int8Array, req: RunRequest, planned: PlannedTest[]): Promise<RunResult> {
    return new Promise((resolve) => {
      const worker = this.deps.createRunWorker();
      const lines: string[] = [];
      let settled = false;
      let timer = 0;
      const finish = (kind: 'tests' | 'timeout' | 'stopped', crash?: string) => {
        if (settled) return;
        settled = true;
        this.deps.clearTimeout(timer);
        worker.terminate();
        this.stopActive = null;
        const parsed = parseHarnessOutput(lines, planned.map((p) => p.id));
        const reason = kind === 'timeout' ? NOT_FINISHED_TIMEOUT : kind === 'stopped' ? NOT_FINISHED_STOPPED : (crash ?? 'The program stopped before this test.');
        resolve({ kind, results: buildResults(req.spec, planned, parsed.tests, reason), stdout: parsed.stray });
      };
      timer = this.deps.setTimeout(() => finish('timeout'), req.timeLimitMs);
      worker.onmessage = (ev) => {
        const m = ev.data as RunWorkerMessage;
        if (m.type === 'line') lines.push(m.text);
        else if (m.type === 'done') finish('tests');
        else finish('tests', `The program crashed: ${m.message}`);
      };
      worker.onerror = () => finish('tests', 'The program crashed before it finished.');
      this.stopActive = () => finish('stopped');
      const msg: RunWorkerRequest = { type: 'run', wasm, runtimeUrl: `${this.deps.assetBase}compiler.wasm-runtime.js` };
      worker.postMessage(msg, [wasm.buffer as ArrayBuffer]);
    });
  }
}
```

- [ ] **Step 6: Implement the two workers**

`src/lab/teavm-compile-worker.ts`:

```ts
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
```

`src/lab/teavm-run-worker.ts`:

```ts
import type { RunWorkerMessage, RunWorkerRequest } from './teavm-protocol';

const ctx = self as unknown as {
  postMessage(m: RunWorkerMessage): void;
  onmessage: ((e: MessageEvent<RunWorkerRequest>) => void) | null;
};

function send(text: string): void {
  for (const line of text.split('\n')) ctx.postMessage({ type: 'line', text: line });
}

ctx.onmessage = async (e) => {
  const { wasm, runtimeUrl } = e.data;
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
```

- [ ] **Step 7: Run unit tests and typecheck**

Run: `npx vitest run tests/unit/lab/teavm-runner.test.ts && npm run typecheck && npm run build`
Expected: PASS (6 tests), typecheck clean, and the build emits two worker chunks plus `dist/runner/teavm/*`. The real browser run is tested in Task 21.

**Checkpoint:** runner done (unit level).

---

### Task 15: Code editor and Java lab view

**Files:**
- Create: `src/lab/editor.ts`, `src/lab/lab-view.ts`, `src/styles/lab.css`
- Test: `tests/unit/lab/lab-view.test.ts`

**Interfaces:**
- Consumes: `JavaRunner`, `RunResult` (Task 12), `Store` (Task 5), `Problem`, `toJavaLiteral` (Task 11), `TeaVM` credit text.
- Produces:
  - `interface CodeEditor { getValue(): string; setValue(v: string): void; focus(): void; destroy(): void }`
  - `createEditor(parent: HTMLElement, doc: string, onChange: (v: string) => void): CodeEditor`
  - `interface LabDeps { runner: JavaRunner; store: Store; makeEditor?: typeof createEditor; confirm?: (msg: string) => boolean }`
  - `interface LabHandle { loadCode(src: string): void; dispose(): void }`
  - `mountLab(host: HTMLElement, problem: Problem, deps: LabDeps): LabHandle`
  - Test ids:
    - Buttons: `lab-run`, `lab-submit`, `lab-stop`, `lab-reset`, `lab-add-test`
    - `lab-status` (aria-live), `lab-results`, `lab-console`
    - Rows `test-row` with `data-pass` and `data-kind`
    - `lab-fallback` when the runner is unavailable
  - Saves code to `store.code[problem.id]` 400 ms after the last edit.

- [ ] **Step 1: Implement `src/lab/editor.ts`**

```ts
import { indentWithTab } from '@codemirror/commands';
import { java } from '@codemirror/lang-java';
import { EditorState } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { basicSetup, EditorView } from 'codemirror';

export interface CodeEditor {
  getValue(): string;
  setValue(v: string): void;
  focus(): void;
  destroy(): void;
}

export function createEditor(parent: HTMLElement, doc: string, onChange: (v: string) => void): CodeEditor {
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [
        basicSetup,
        java(),
        keymap.of([indentWithTab]),
        EditorView.contentAttributes.of({ 'aria-label': 'Java code editor. Press Escape then Tab to leave.' }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChange(u.state.doc.toString());
        }),
      ],
    }),
  });
  return {
    getValue: () => view.state.doc.toString(),
    setValue: (v) => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: v } }),
    focus: () => view.focus(),
    destroy: () => view.destroy(),
  };
}
```

- [ ] **Step 2: Write the failing lab test (fake runner and fake editor)**

```ts
import { describe, expect, it, vi } from 'vitest';
import type { Problem } from '../../../src/content-types';
import { createStore } from '../../../src/core/store';
import { mountLab } from '../../../src/lab/lab-view';
import type { JavaRunner, RunRequest, RunResult } from '../../../src/lab/runner';

const problem = {
  id: 'contains-duplicate', title: 'Contains Duplicate', source: { name: 'LeetCode 217', url: 'https://leetcode.com/problems/contains-duplicate/' },
  starter: 'class Solution {}',
  spec: { className: 'Solution', method: 'containsDuplicate', params: [{ name: 'nums', type: 'int[]' }], returns: 'boolean', compare: 'exact', samples: [{ id: 's1', args: [[1, 1]], expected: true }], hidden: [{ id: 'h1', args: [[1]], expected: false }] },
} as unknown as Problem;

function fakeEditor() {
  let value = '';
  let change: (v: string) => void = () => {};
  const api = {
    make: (_p: HTMLElement, doc: string, onChange: (v: string) => void) => { value = doc; change = onChange; return { getValue: () => value, setValue: (v: string) => { value = v; change(v); }, focus() {}, destroy() {} }; },
    type: (v: string) => { value = v; change(v); },
    get value() { return value; },
  };
  return api;
}

function fakeRunner(result: RunResult): JavaRunner & { last?: RunRequest } {
  const r: JavaRunner & { last?: RunRequest } = { ready: async () => {}, run: async (req) => { r.last = req; return result; }, stop: vi.fn() };
  return r;
}

const memStore = () => { const d: Record<string, string> = {}; return createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }); };
const flush = () => new Promise((r) => setTimeout(r, 0));

describe('mountLab', () => {
  it('runs samples and shows pass and fail rows', async () => {
    const host = document.createElement('div');
    const ed = fakeEditor();
    const runner = fakeRunner({ kind: 'tests', stdout: 'hi', results: [
      { id: 's1', kind: 'sample', pass: true, input: 'nums = [1,1]', expected: 'true', actual: 'true', stdout: '', timeMs: 1 },
      { id: 'h1', kind: 'hidden', pass: false, input: 'nums = [1]', expected: 'false', actual: 'true', stdout: '', timeMs: 1 },
    ] });
    mountLab(host, problem, { runner, store: memStore(), makeEditor: ed.make });
    (host.querySelector('[data-testid="lab-run"]') as HTMLButtonElement).click();
    await flush();
    expect(runner.last?.mode).toBe('samples');
    const rows = host.querySelectorAll('[data-testid="test-row"]');
    expect(rows).toHaveLength(2);
    expect(rows[0]!.getAttribute('data-pass')).toBe('true');
    expect(rows[1]!.getAttribute('data-pass')).toBe('false');
    expect(host.querySelector('[data-testid="lab-status"]')!.textContent).toContain('1 of 2 passed');
    expect(host.querySelector('[data-testid="lab-console"]')!.textContent).toBe('hi');
  });

  it('shows compile errors with line numbers', async () => {
    const host = document.createElement('div');
    mountLab(host, problem, { runner: fakeRunner({ kind: 'compileError', errors: [{ line: 4, message: 'illegal start of expression' }] }), store: memStore(), makeEditor: fakeEditor().make });
    (host.querySelector('[data-testid="lab-submit"]') as HTMLButtonElement).click();
    await flush();
    expect(host.querySelector('[data-testid="lab-results"]')!.textContent).toContain('Line 4: illegal start of expression');
  });

  it('shows the fallback when Java cannot run', async () => {
    const host = document.createElement('div');
    mountLab(host, problem, { runner: fakeRunner({ kind: 'runnerUnavailable', reason: 'No WasmGC' }), store: memStore(), makeEditor: fakeEditor().make });
    (host.querySelector('[data-testid="lab-run"]') as HTMLButtonElement).click();
    await flush();
    const fb = host.querySelector('[data-testid="lab-fallback"]')!;
    expect(fb.textContent).toContain('No WasmGC');
    expect(fb.querySelector('a')!.getAttribute('href')).toBe('https://leetcode.com/problems/contains-duplicate/');
  });

  it('saves code, loads code and resets', async () => {
    vi.useFakeTimers();
    const store = memStore();
    const ed = fakeEditor();
    const host = document.createElement('div');
    const lab = mountLab(host, problem, { runner: fakeRunner({ kind: 'tests', results: [], stdout: '' }), store, makeEditor: ed.make, confirm: () => true });
    ed.type('class Solution { int x; }');
    vi.advanceTimersByTime(500);
    expect(store.get().code['contains-duplicate']?.source).toBe('class Solution { int x; }');
    lab.loadCode('class Solution { /* optimal */ }');
    expect(ed.value).toBe('class Solution { /* optimal */ }');
    (host.querySelector('[data-testid="lab-reset"]') as HTMLButtonElement).click();
    expect(ed.value).toBe('class Solution {}');
    vi.useRealTimers();
  });

  it('adds a custom test and rejects a bad one', async () => {
    const host = document.createElement('div');
    const runner = fakeRunner({ kind: 'tests', results: [], stdout: '' });
    mountLab(host, problem, { runner, store: memStore(), makeEditor: fakeEditor().make });
    const nums = host.querySelector<HTMLInputElement>('input[name="custom-nums"]')!;
    const expected = host.querySelector<HTMLInputElement>('input[name="custom-expected"]')!;
    nums.value = '[1, 2'; expected.value = 'false';
    (host.querySelector('[data-testid="lab-add-test"]') as HTMLButtonElement).click();
    expect(host.querySelector('.custom-error')!.textContent).toContain('nums');
    nums.value = '[1, 2]';
    (host.querySelector('[data-testid="lab-add-test"]') as HTMLButtonElement).click();
    (host.querySelector('[data-testid="lab-run"]') as HTMLButtonElement).click();
    await flush();
    expect(runner.last?.extraTests).toEqual([{ id: 'c1', args: [[1, 2]], expected: false }]);
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npx vitest run tests/unit/lab/lab-view.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement `src/lab/lab-view.ts`**

```ts
import type { Problem, TestCase } from '../content-types';
import { html, render } from '../core/html';
import type { Store } from '../core/store';
import { createEditor } from './editor';
import { LiteralError, toJavaLiteral } from './java-literals';
import type { JavaRunner, RunResult, TestResult } from './runner';

export interface LabDeps {
  runner: JavaRunner;
  store: Store;
  makeEditor?: typeof createEditor;
  confirm?: (msg: string) => boolean;
}

export interface LabHandle {
  loadCode(src: string): void;
  dispose(): void;
}

const NOTICES_URL = 'https://github.com/AkashkumarChoudhary/dsa-playbook/blob/main/THIRD_PARTY_NOTICES.md';

function row(t: TestResult) {
  const label = t.kind === 'sample' ? 'Example' : t.kind === 'custom' ? 'Your test' : t.kind === 'speed' ? 'Speed test' : 'Hidden test';
  return html`<li data-testid="test-row" data-pass="${String(t.pass)}" data-kind="${t.kind}" class="${t.pass ? 'pass' : 'fail'}">
    <div class="test-head"><span aria-hidden="true">${t.pass ? '✅' : '❌'}</span> <b>${label} ${t.id}</b> <span class="muted">${t.timeMs} ms</span></div>
    <div class="test-io"><span>Input</span><code>${t.input}</code><span>Expected</span><code>${t.expected}</code>${t.actual ? html`<span>Got</span><code>${t.actual}</code>` : null}</div>
    ${t.error ? html`<p class="test-error">${t.error}</p>` : null}
    ${t.stdout ? html`<pre class="test-stdout">${t.stdout}</pre>` : null}
  </li>`;
}

export function mountLab(host: HTMLElement, problem: Problem, deps: LabDeps): LabHandle {
  const makeEditor = deps.makeEditor ?? createEditor;
  const confirmFn = deps.confirm ?? ((m: string) => window.confirm(m));
  const el = document.createElement('section');
  el.className = 'lab';
  el.setAttribute('aria-label', 'Java lab');
  render(el, html`
    <div class="lab-head"><h3>🧪 Java lab</h3><span class="lab-clock" aria-label="Time spent">⏱ 00:00</span></div>
    <div class="lab-editor"></div>
    <div class="lab-buttons">
      <button type="button" data-testid="lab-run">▶ Run examples</button>
      <button type="button" data-testid="lab-submit" class="primary">✅ Submit all tests</button>
      <button type="button" data-testid="lab-stop" disabled>■ Stop</button>
      <button type="button" data-testid="lab-reset">↺ Reset</button>
    </div>
    <p class="lab-status" data-testid="lab-status" aria-live="polite">Write your code, then run the examples.</p>
    <div class="lab-results" data-testid="lab-results"></div>
    <details class="lab-custom"><summary>➕ Add your own test</summary>
      <div class="custom-fields">
        ${problem.spec.params.map((p) => html`<label>${p.name} (${p.type}) <input name="custom-${p.name}" placeholder="JSON, for example [1, 2, 3]" /></label>`)}
        <label>expected (${problem.spec.returns}) <input name="custom-expected" placeholder="JSON, for example true" /></label>
        <button type="button" data-testid="lab-add-test">Add test</button>
      </div>
      <p class="custom-error" role="status"></p>
      <ul class="custom-list"></ul>
    </details>
    <details class="lab-console-wrap"><summary>Console output</summary><pre data-testid="lab-console"></pre></details>
    <p class="lab-credit muted">Java runs in your browser with TeaVM and OpenJDK javac. <a href="${NOTICES_URL}" target="_blank" rel="noopener">Notices</a></p>
  `);
  host.append(el);

  const $ = <T extends HTMLElement>(sel: string) => el.querySelector(sel) as T;
  const runBtn = $<HTMLButtonElement>('[data-testid="lab-run"]');
  const submitBtn = $<HTMLButtonElement>('[data-testid="lab-submit"]');
  const stopBtn = $<HTMLButtonElement>('[data-testid="lab-stop"]');
  const resetBtn = $<HTMLButtonElement>('[data-testid="lab-reset"]');
  const status = $('[data-testid="lab-status"]');
  const results = $('[data-testid="lab-results"]');
  const consoleEl = $('[data-testid="lab-console"]');
  const clock = $('.lab-clock');
  const customError = $('.custom-error');
  const customList = $('.custom-list');

  const saved = deps.store.get().code[problem.id]?.source;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let startedAt: number | null = null;
  let clockTimer: ReturnType<typeof setInterval> | null = null;
  const custom: TestCase[] = [];

  const editor = makeEditor($('.lab-editor'), saved ?? problem.starter, (value) => {
    if (startedAt === null) {
      startedAt = Date.now();
      clockTimer = setInterval(() => {
        const s = Math.floor((Date.now() - (startedAt ?? Date.now())) / 1000);
        clock.textContent = `⏱ ${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      }, 1000);
    }
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      deps.store.update((st) => { st.code[problem.id] = { source: value, updatedAt: Date.now() }; });
    }, 400);
  });

  function busy(on: boolean) {
    runBtn.disabled = on;
    submitBtn.disabled = on;
    stopBtn.disabled = !on;
  }

  function show(result: RunResult) {
    consoleEl.textContent = '';
    if (result.kind === 'runnerUnavailable') {
      status.textContent = 'Java cannot run in this browser.';
      render(results, html`<div class="lab-fallback" data-testid="lab-fallback"><p>${result.reason}</p>
        <p><button type="button" class="copy-code">📋 Copy code</button> <a href="${problem.source.url}" target="_blank" rel="noopener">Open on ${problem.source.name}</a></p></div>`);
      results.querySelector('.copy-code')?.addEventListener('click', () => void navigator.clipboard?.writeText(editor.getValue()));
      return;
    }
    if (result.kind === 'compileError') {
      status.textContent = 'The code did not compile.';
      render(results, html`<ul class="compile-errors">${result.errors.map((e) => html`<li>${e.line > 0 ? `Line ${e.line}: ` : ''}${e.message}</li>`)}</ul>`);
      return;
    }
    const passed = result.results.filter((t) => t.pass).length;
    const total = result.results.length;
    const prefix = result.kind === 'timeout' ? 'Stopped: it ran too long. ' : result.kind === 'stopped' ? 'Stopped. ' : '';
    status.textContent = `${prefix}${passed} of ${total} passed.${passed === total && total > 0 && result.kind === 'tests' ? ' 🎉 All tests passed.' : ''}`;
    const hiddenPassed = result.results.filter((t) => t.kind === 'hidden' && t.pass);
    const shown = result.results.filter((t) => !(t.kind === 'hidden' && t.pass));
    render(results, html`<ul class="test-list">${shown.map(row)}</ul>${hiddenPassed.length ? html`<p class="muted">🔒 ${hiddenPassed.length} hidden test${hiddenPassed.length === 1 ? '' : 's'} passed.</p>` : null}`);
    consoleEl.textContent = result.stdout;
  }

  async function run(mode: 'samples' | 'all') {
    busy(true);
    status.textContent = 'Getting Java ready…';
    await deps.runner.ready((msg) => { status.textContent = msg; });
    status.textContent = mode === 'all' ? 'Running all tests…' : 'Running the examples…';
    try {
      const result = await deps.runner.run({ code: editor.getValue(), spec: problem.spec, mode, extraTests: [...custom], timeLimitMs: mode === 'all' ? 10_000 : 5_000 });
      show(result);
    } catch (err) {
      status.textContent = `Something went wrong: ${err instanceof Error ? err.message : String(err)}`;
    } finally {
      busy(false);
    }
  }

  runBtn.addEventListener('click', () => void run('samples'));
  submitBtn.addEventListener('click', () => void run('all'));
  stopBtn.addEventListener('click', () => deps.runner.stop());
  resetBtn.addEventListener('click', () => {
    if (confirmFn('Reset to the starter code? Your code will be replaced.')) editor.setValue(problem.starter);
  });

  $<HTMLButtonElement>('[data-testid="lab-add-test"]').addEventListener('click', () => {
    const args: unknown[] = [];
    try {
      for (const p of problem.spec.params) {
        const input = $<HTMLInputElement>(`input[name="custom-${p.name}"]`);
        let value: unknown;
        try { value = JSON.parse(input.value); } catch { throw new LiteralError(`${p.name}: write it as JSON, for example [1, 2, 3].`); }
        toJavaLiteral(value, p.type);
        args.push(value);
      }
      let expected: unknown;
      const expInput = $<HTMLInputElement>('input[name="custom-expected"]');
      try { expected = JSON.parse(expInput.value); } catch { throw new LiteralError('expected: write it as JSON, for example true.'); }
      toJavaLiteral(expected, problem.spec.returns);
      const test: TestCase = { id: `c${custom.length + 1}`, args, expected };
      custom.push(test);
      customError.textContent = '';
      const li = document.createElement('li');
      li.textContent = `${test.id}: ${problem.spec.params.map((p, i) => `${p.name} = ${JSON.stringify(args[i])}`).join(', ')} → ${JSON.stringify(expected)}`;
      customList.append(li);
    } catch (err) {
      customError.textContent = err instanceof Error ? err.message : String(err);
    }
  });

  return {
    loadCode(src) {
      editor.setValue(src);
      el.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    },
    dispose() {
      if (saveTimer) clearTimeout(saveTimer);
      if (clockTimer) clearInterval(clockTimer);
      deps.runner.stop();
      editor.destroy();
      el.remove();
    },
  };
}
```

Passing hidden tests are summarized by the `🔒` line only. Failing hidden tests are shown in full.

- [ ] **Step 5: Write `src/styles/lab.css`**

```css
.lab { border: 1px solid var(--line); border-radius: var(--radius); background: var(--card); padding: 1rem; display: grid; gap: 0.75rem; }
.lab-head { display: flex; justify-content: space-between; align-items: baseline; }
.lab-head h3 { margin: 0; }
.lab-clock { font-family: var(--mono); color: var(--muted); }
.lab-editor { border: 1px solid var(--line); border-radius: 8px; overflow: hidden; min-height: 14rem; }
.lab-editor .cm-editor { min-height: 14rem; max-height: 32rem; font-size: 0.9rem; }
.lab-editor .cm-editor.cm-focused { outline: 2px solid var(--accent); }
.lab-editor .cm-scroller { font-family: var(--mono); }
.lab-buttons { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.lab-status { margin: 0; font-weight: 600; }
.test-list, .compile-errors, .custom-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
.test-list li { border: 1px solid var(--line); border-left: 4px solid var(--bad); border-radius: 8px; padding: 0.5rem 0.75rem; background: var(--bg-2); }
.test-list li.pass { border-left-color: var(--ok); }
.test-io { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 0.2rem 0.75rem; font-size: 0.875rem; margin-top: 0.3rem; }
.test-io span { color: var(--muted); }
.test-io code { overflow-wrap: anywhere; }
.test-error { color: var(--bad); margin: 0.3rem 0 0; }
.test-stdout, .lab-console-wrap pre { font-family: var(--mono); font-size: 0.8rem; background: var(--code-bg); padding: 0.5rem; border-radius: 6px; white-space: pre-wrap; margin: 0.3rem 0 0; max-height: 12rem; overflow: auto; }
.compile-errors li { color: var(--bad); font-family: var(--mono); font-size: 0.875rem; }
.custom-fields { display: grid; gap: 0.5rem; margin-top: 0.5rem; }
.custom-fields label { display: grid; gap: 0.2rem; font-size: 0.875rem; }
.custom-error { color: var(--bad); margin: 0.3rem 0 0; }
.lab-fallback { border: 1px solid var(--warn); border-radius: 8px; padding: 0.75rem; }
.lab-credit { font-size: 0.8rem; margin: 0; }
```

- [ ] **Step 6: Run to verify it passes**

Run: `npx vitest run tests/unit/lab/lab-view.test.ts && npm run typecheck`
Expected: PASS (5 tests), typecheck clean.

**Checkpoint:** lab view done.

---

### Task 16: Content check tool and writing rules

**Files:**
- Create: `tools/text.ts`, `tools/topic-order.ts`, `tools/content-check.ts`, `CONTENT-RULES.md`, `AGENTS.md`
- Test: `tests/tools/content-check.test.ts`

**Interfaces:**
- Consumes: `ContentInput`, `buildRegistry` (Task 3), `toJavaLiteral`, `argExpression`, `isGenerator` (Task 11), `parseMarkers` (Task 6).
- Produces:
  - `tools/text.ts`: `stripHtml(s: string): string` (removes `<code>`/`<pre>` blocks, tags and entities, and keeps block breaks as newlines), `countWords(s: string): number`, `sentences(s: string): string[]`
  - `tools/topic-order.ts`: `interface TopicTerm { label: string; pattern: RegExp; module: number }`, `TOPIC_TERMS: TopicTerm[]`
  - `tools/content-check.ts`: `interface Issue { level: 'error' | 'warn'; where: string; message: string }`, `checkContent(input: ContentInput): Issue[]`, `formatIssues(issues: Issue[]): string`

- [ ] **Step 1: Write `CONTENT-RULES.md`**

```markdown
# Content rules

These rules apply to every lesson and problem. `npm run check:content` checks the ones that can be measured.

## The goal

A beginner reads a lesson once and can explain the idea in their own words. If a rule makes a lesson harder to read, follow the goal and say so in your report.

## Writing

- Short sentences. Aim for 20 words or fewer. More than 30 is an error.
- Paragraphs of 3 sentences or fewer.
- Plain words. Explain every new term the first time it appears.
- Write like a friend explaining at a whiteboard.
- **No em dashes (—). No semicolons** in prose. Code may use semicolons.
- Say a caveat once. Never repeat a point.
- Numbers must be correct. Show the math in small steps (100,000 × 100,000 = 10,000,000,000).

## Lesson shape

1. **Small example**: one tiny problem.
2. **Everyday picture**: one plain analogy.
3. **Step by step**: 3 to 6 picture steps, plus the dry run. Long detail goes in **Go deeper**.
4. **How to spot it**: size, words, shape and bottleneck clues, plus at least one ❌ trap.
5. **Java template**: the reusable code shape.
6. **Where you meet this**: real-life uses. A `confirmed` claim needs a named source. Never use URLs.
7. **Mistakes** (2 or 3) and **interview angle** (2 or 3).
8. **Try it**: exactly 3 quiz questions and the linked problems.

The **simple part** (summary, example, everyday picture and steps) is about 350 words or fewer. Over 350 is a warning, and over 400 is an error.

## Topic order

Use only ideas from earlier modules, or explain them on the spot. A later idea may appear only as a preview that says "you will learn …", for example "(you will learn sorting in Module 7)".

## Problems

- Statement in our own words, with a link to the original.
- Exactly 3 hints, from gentle to direct.
- Brute force and optimal are required. Include "better" only when a real middle step exists.
- Every approach except the last says what repeated work the next one removes.
- At least 2 sample tests and 3 hidden tests. Optimal solutions also need a speed test when the limits are large.

## Never

- `TODO`, `TBD`, "lorem" or "rest of code".
- Copying text from other sites. Credit problem lists by name.
- Changing a published id.
```

- [ ] **Step 2: Write `AGENTS.md`**

```markdown
# Rules for AI agents working on this repo

Read this file and `CONTENT-RULES.md` before every task.

## Hard rules

1. **Do not run `git commit` or `git push`.** The owner decides when to commit.
2. Do only the task you were given.
3. Never change a check or test to make your work pass. Fix the work. If a check looks wrong, say so in your report.
4. Never change a published id (module, lesson, problem, trace, test).
5. Never put a lesson or problem id inside app code or CSS. App code must work for all content.
6. Never delete files unless the task says so.

## Before you report "done"

Run `npm run typecheck`, `npm run check:content`, `npm test` and `npm run verify:java`. For UI work, also run `npm run test:e2e`.

## Report format

    Task: <name>   checks: PASS/FAIL (paste the summary lines)
    Changed: <file> (one short line each)
    Open: #/l/<id>, #/p/<id>
    Questions: <only real questions, or "none">
```

- [ ] **Step 3: Write the failing content-check test**

`tests/tools/content-check.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { contentInput } from '../../content';
import type { Lesson, Module, Problem } from '../../src/content-types';
import { createRecorder, type TraceDef } from '../../src/engine/trace';
import { checkContent, formatIssues } from '../../tools/content-check';
import { countWords, sentences, stripHtml } from '../../tools/text';

describe('text helpers', () => {
  it('strips tags, code and entities', () => {
    expect(stripHtml('<p>Hi <b>there</b> &amp; you</p><pre>int a;</pre><p>Next <code>x;</code> line</p>')).toBe('Hi there & you\nNext line');
    expect(countWords('One two, three 100,000.')).toBe(4);
    expect(sentences('<p>First one. Second one!</p><ul><li>Item</li></ul>')).toEqual(['First one.', 'Second one!', 'Item']);
  });
});

const trace: TraceDef = {
  id: 'p/optimal', maxSteps: 10, inputFields: [], parseInput: () => ({ ok: true, value: {} }), formatInput: () => ({}), fromArgs: () => ({}),
  run: () => { const r = createRecorder(); r.step({ line: 'a', vars: {}, views: [], note: 'n' }); return r.finish(true); },
};

const mod: Module = { id: 'm', order: 1, level: 'basics', icon: '🧱', title: 'M', summary: 'S.', status: 'building', outcomes: ['o'], lessonIds: ['l'], problemIds: ['p'], quiz: [], cheatsheet: [], glossary: [] };

const lesson: Lesson = {
  id: 'l', moduleId: 'm', title: 'L', minutes: 5, summary: 'A short summary.', example: '<p>An example.</p>', everyday: '<p>A picture.</p>',
  steps: [1, 2, 3].map((n) => ({ icon: '🔢', title: `Step ${n}`, text: 'Do one thing.' })),
  viz: [{ label: 'Run', traceId: 'p/optimal', input: {} }], deep: '<p>More detail.</p>',
  spot: { size: 'Size clue.', words: 'Word clue.', shape: 'Shape clue.', bottleneck: 'Bottleneck clue.' },
  traps: [{ looksLike: 'A thing.', butIs: 'Another thing.', why: 'Because.' }],
  template: { title: 'T', java: 'int x = 0;' }, complexityFacts: [{ q: 'Q?', a: 'O(1)', why: 'Fast.' }],
  realLife: [{ text: 'Used here.', tier: 'educational' }], mistakes: ['One.', 'Two.'], interview: ['One.', 'Two.'],
  quiz: [0, 1, 2].map(() => ({ q: 'Q?', options: ['a', 'b'], answer: 1, why: 'Because.' })), problemIds: ['p'],
};

const problem = {
  id: 'p', moduleId: 'm', title: 'P', patternIds: ['hashing'], difficulty: 'easy', core: true, sheets: [], source: { name: 'LeetCode 1', url: 'https://leetcode.com/problems/x/' },
  statement: '<p>Do the thing.</p>', limits: ['1 ≤ n ≤ 10'], examples: [{ input: 'x', output: 'y' }],
  spot: { prompt: 'Which?', options: ['a', 'b'], answer: 0, clues: [{ kind: 'size', text: 'Small.' }, { kind: 'words', text: 'Words.' }] },
  hints: ['One.', 'Two.', 'Three.'],
  approaches: [
    { level: 'brute', title: 'B', idea: 'Slow.', java: 'class Solution { public boolean f(int[] nums) { return false; } }', time: 'O(n²)', space: 'O(1)', nextStepRemoves: 'Removes the search.' },
    { level: 'optimal', title: 'O', idea: 'Fast.', java: 'class Solution { public boolean f(int[] nums) { return false; } // @L:a\n}', time: 'O(n)', space: 'O(n)', traceId: 'p/optimal' },
  ],
  edgeCases: ['One.', 'Two.'], mistakes: ['One.', 'Two.'], explain30: 'Say it.', hook: 'Hook.', related: [], lookAlikes: [],
  spec: { className: 'Solution', method: 'f', params: [{ name: 'nums', type: 'int[]' }], returns: 'boolean', compare: 'exact', samples: [{ id: 's1', args: [[1]], expected: false }, { id: 's2', args: [[1, 1]], expected: true }], hidden: [{ id: 'h1', args: [[2]], expected: false }, { id: 'h2', args: [[2, 2]], expected: true }, { id: 'h3', args: [[3]], expected: false }] },
  starter: 'class Solution { public boolean f(int[] nums) { return false; } }',
} as Problem;

const fixture = () => ({ modules: [structuredClone(mod)], lessons: [structuredClone(lesson)], problems: [structuredClone(problem)], traces: [trace] });
const errors = (input: ReturnType<typeof fixture>) => checkContent(input).filter((i) => i.level === 'error');

describe('checkContent', () => {
  it('accepts a valid fixture', () => {
    expect(formatIssues(errors(fixture()))).toBe('');
  });
  it('catches style problems', () => {
    const f = fixture();
    f.lessons[0]!.summary = 'It is fast — very fast; truly.';
    const msgs = errors(f).map((i) => i.message).join('\n');
    expect(msgs).toContain('em dash');
    expect(msgs).toContain('semicolon');
  });
  it('catches structure problems', () => {
    const f = fixture();
    f.lessons[0]!.quiz.pop();
    f.lessons[0]!.viz[0]!.traceId = 'missing';
    f.problems[0]!.spec.samples[0]!.args = [[1.5]];
    f.problems[0]!.approaches = f.problems[0]!.approaches.filter((a) => a.level !== 'brute');
    const msgs = errors(f).map((i) => i.message).join('\n');
    expect(msgs).toContain('exactly 3 quiz questions');
    expect(msgs).toContain('unknown trace "missing"');
    expect(msgs).toContain('Expected an int');
    expect(msgs).toContain('needs a brute force approach');
  });
  it('catches later topics without a preview', () => {
    const f = fixture();
    f.lessons[0]!.everyday = '<p>Use a sliding window here.</p>';
    expect(errors(f).map((i) => i.message).join('\n')).toContain('sliding window');
    f.lessons[0]!.everyday = '<p>Use a sliding window here (you will learn it in Module 5).</p>';
    expect(errors(f).map((i) => i.message).join('\n')).not.toContain('sliding window');
  });
  it('catches too many words in the simple part', () => {
    const f = fixture();
    f.lessons[0]!.example = `<p>${'word '.repeat(420)}</p>`;
    expect(errors(f).map((i) => i.message).join('\n')).toContain('simple part');
  });
});

describe('real content', () => {
  it('has no content errors', () => {
    const issues = checkContent(contentInput);
    const warnings = issues.filter((i) => i.level === 'warn');
    if (warnings.length) console.warn(formatIssues(warnings));
    expect(formatIssues(issues.filter((i) => i.level === 'error'))).toBe('');
  });
});
```

- [ ] **Step 4: Run to verify it fails**

Run: `npm run check:content`
Expected: FAIL (cannot resolve `tools/content-check`).

- [ ] **Step 5: Implement `tools/text.ts`**

```ts
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };

export function stripHtml(s: string): string {
  return s
    .replace(/<pre[\s\S]*?<\/pre>/gi, '\n')
    .replace(/<code[\s\S]*?<\/code>/gi, '')
    .replace(/<\/(p|li|h[1-6]|div|tr|td|th)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#?\w+);/g, (m, name: string) => ENTITIES[name] ?? m)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line !== '')
    .join('\n');
}

export function countWords(s: string): number {
  return stripHtml(s).split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export function sentences(s: string): string[] {
  return stripHtml(s)
    .split('\n')
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((x) => x.trim())
    .filter((x) => x !== '');
}
```

- [ ] **Step 6: Implement `tools/topic-order.ts`**

```ts
export interface TopicTerm {
  label: string;
  pattern: RegExp;
  /** curriculum module number that teaches it (spec §5) */
  module: number;
}

export const TOPIC_TERMS: TopicTerm[] = [
  { label: 'prefix sum', pattern: /\bprefix sums?\b/i, module: 2 },
  { label: 'two pointers', pattern: /\btwo[- ]pointers?\b/i, module: 4 },
  { label: 'sliding window', pattern: /\bsliding window\b/i, module: 5 },
  { label: 'recursion', pattern: /\brecursi(on|ve)\b/i, module: 6 },
  { label: 'sorting', pattern: /\b(sorting|merge sort|quick ?sort)\b/i, module: 7 },
  { label: 'binary search', pattern: /\bbinary search\b/i, module: 8 },
  { label: 'monotonic stack', pattern: /\bmonotonic (stack|queue|deque)\b/i, module: 9 },
  { label: 'linked list', pattern: /\blinked lists?\b/i, module: 10 },
  { label: 'backtracking', pattern: /\bbacktrack(ing)?\b/i, module: 11 },
  { label: 'binary tree', pattern: /\b(binary trees?|binary search trees?|BST)\b/i, module: 12 },
  { label: 'heap', pattern: /\b(heaps?|priority queues?)\b/i, module: 13 },
  { label: 'trie', pattern: /\btrie\b/i, module: 14 },
  { label: 'graph', pattern: /\b(graphs?|BFS|DFS|breadth-first|depth-first)\b/i, module: 15 },
  { label: 'topological sort', pattern: /\btopological\b/i, module: 15 },
  { label: 'union-find', pattern: /\b(union[- ]find|disjoint set)\b/i, module: 15 },
  { label: 'shortest path', pattern: /\b(dijkstra|bellman|shortest paths?|minimum spanning)\b/i, module: 16 },
  { label: 'dynamic programming', pattern: /\b(dynamic programming|memoi[sz]ation)\b/i, module: 17 },
  { label: 'greedy', pattern: /\bgreedy\b/i, module: 19 },
  { label: 'bit manipulation', pattern: /\b(bitmasks?|bit manipulation|XOR)\b/i, module: 20 },
  { label: 'segment tree', pattern: /\b(segment trees?|fenwick)\b/i, module: 21 },
  { label: 'string matching', pattern: /\b(KMP|rabin-karp|z-function)\b/i, module: 22 },
];
```

- [ ] **Step 7: Implement `tools/content-check.ts`**

```ts
import type { Lesson, Module, Problem } from '../src/content-types';
import { buildRegistry, type ContentInput } from '../src/core/registry';
import { parseMarkers } from '../src/engine/markers';
import { argExpression, toJavaLiteral } from '../src/lab/java-literals';
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
  if (!PREVIEW.test(plain)) {
    for (const t of TOPIC_TERMS) {
      if (t.module > moduleOrder && t.pattern.test(plain)) {
        issues.push({ level: 'error', where, message: `uses "${t.label}" (taught in Module ${t.module}) without a "you will learn" preview.` });
      }
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
  if (m.status === 'complete') {
    const mcq = m.quiz.filter((q) => !('type' in q)).length;
    const scenario = m.quiz.length - mcq;
    if (mcq < 8 || scenario < 2) issues.push({ level: 'error', where: w, message: `a complete module needs 8 or more quiz questions and 2 or more scenarios (has ${mcq} and ${scenario}).` });
    if (m.cheatsheet.length < 1) issues.push({ level: 'error', where: w, message: 'a complete module needs a cheat sheet.' });
    if (m.glossary.length < 1) issues.push({ level: 'error', where: w, message: 'a complete module needs glossary terms.' });
  }
}

export function checkContent(input: ContentInput): Issue[] {
  const issues: Issue[] = [];
  try {
    buildRegistry(input);
  } catch (err) {
    return [{ level: 'error', where: 'registry', message: (err as Error).message }];
  }
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
```

The `orderOk` check compares each level's index with the previous one, so `['brute','optimal']`, `['brute','better','optimal']` and `['optimal']` pass, and `['optimal','brute']` fails.

- [ ] **Step 8: Run to verify it passes**

Run: `npm run check:content`
Expected: PASS (the text helpers, 5 fixture tests and the real-content test, which currently has empty content).

**Checkpoint:** content check and writing rules done.

---

### Task 17: App shell, home, module page, styles and boot

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/shell.css`, `src/styles/code.css`, `src/styles/index.css`, `src/pages/shell.ts`, `src/pages/home.ts`, `src/pages/module-page.ts`, `src/pages/not-found.ts`, `src/pages/router-view.ts`
- Modify: `src/main.ts` (replace the Task 1 version)
- Test: `tests/unit/pages/shell.test.ts`

**Interfaces:**
- Consumes: `Registry`, `allRoutes` (Task 3), `Route`, `startRouter`, `href` (Task 4), `Store`, `ThemeControl` (Task 5), `JavaRunner` (Task 12), `TeaVMRunner` (Task 14).
- Produces:
  - `interface Shell { outlet: HTMLElement; setActive(route: Route): void }`
  - `mountShell(root: HTMLElement, registry: Registry, theme: ThemeControl): Shell`
  - `renderHome(registry: Registry): SafeHtml`
  - `renderModule(m: Module, registry: Registry): SafeHtml`
  - `renderNotFound(): SafeHtml`
  - `interface PageContext { registry: Registry; store: Store; runner: JavaRunner; makeEditor?: typeof createEditor }`. `makeEditor` lets tests swap in a fake editor, and pages pass it through to `mountLab`.
  - `renderRoute(route: Route, outlet: HTMLElement, ctx: PageContext): { title: string; cleanup: () => void }`

- [ ] **Step 1: Write the styles**

`src/styles/tokens.css`:

```css
:root, [data-theme='dark'] {
  --bg: #0b1220; --bg-2: #111a2e; --card: #16213a; --line: #26324d;
  --text: #e6ecf5; --muted: #9aa8c0; --accent: #38bdf8; --accent-2: #a78bfa; --on-accent: #0b1220;
  --ok: #22c55e; --bad: #f87171; --warn: #f59e0b;
  --mark-current: #2563eb; --mark-discarded: #475569; --mark-range: #a16207; --mark-answer: #15803d; --mark-conflict: #dc2626;
  --code-bg: #0f172a;
  --tok-keyword: #c4b5fd; --tok-string: #86efac; --tok-number: #fcd34d; --tok-comment: #7c8aa5; --tok-type: #7dd3fc;
  --radius: 12px; --dur: 300ms;
  --font: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', sans-serif;
  --mono: ui-monospace, 'JetBrains Mono', SFMono-Regular, Menlo, Consolas, monospace;
  color-scheme: dark;
}
[data-theme='light'] {
  --bg: #f7f9fc; --bg-2: #eef2f8; --card: #ffffff; --line: #d7deea;
  --text: #0f172a; --muted: #475569; --accent: #0369a1; --accent-2: #6d28d9; --on-accent: #ffffff;
  --ok: #15803d; --bad: #b91c1c; --warn: #b45309;
  --mark-current: #2563eb; --mark-discarded: #64748b; --mark-range: #a16207; --mark-answer: #15803d; --mark-conflict: #dc2626;
  --code-bg: #f1f5f9;
  --tok-keyword: #6d28d9; --tok-string: #15803d; --tok-number: #b45309; --tok-comment: #64748b; --tok-type: #0369a1;
  color-scheme: light;
}
@media (prefers-reduced-motion: reduce) { :root { --dur: 0ms; } }
```

`src/styles/base.css`:

```css
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--text); font-family: var(--font); line-height: 1.6; font-size: 1rem; }
a { color: var(--accent); }
a:focus-visible, button:focus-visible, input:focus-visible, summary:focus-visible, [tabindex]:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
h1, h2, h3, h4 { line-height: 1.25; }
h1 { font-size: clamp(1.6rem, 4vw, 2.2rem); margin: 0 0 0.5rem; }
h2 { font-size: 1.35rem; margin: 2rem 0 0.75rem; }
code { font-family: var(--mono); font-size: 0.9em; background: var(--bg-2); padding: 0.05rem 0.3rem; border-radius: 4px; }
button { font: inherit; color: var(--text); background: var(--bg-2); border: 1px solid var(--line); border-radius: 8px; padding: 0.4rem 0.75rem; cursor: pointer; min-height: 2.25rem; }
button:hover:not(:disabled) { border-color: var(--accent); }
button:disabled { opacity: 0.5; cursor: not-allowed; }
button.primary { background: var(--accent); color: var(--on-accent); border-color: var(--accent); font-weight: 600; }
input { font: inherit; color: var(--text); background: var(--bg); border: 1px solid var(--line); border-radius: 8px; padding: 0.4rem 0.6rem; max-width: 100%; }
details > summary { cursor: pointer; font-weight: 600; }
.muted { color: var(--muted); }
.card { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 1rem; }
.callout { border-left: 4px solid var(--accent); background: var(--bg-2); padding: 0.75rem 1rem; border-radius: 8px; }
.simple-table { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: 0.95rem; }
th, td { border: 1px solid var(--line); padding: 0.45rem 0.6rem; text-align: left; vertical-align: top; }
th { background: var(--bg-2); }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
```

`src/styles/shell.css`:

```css
.topbar { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 1rem; background: var(--bg); border-bottom: 1px solid var(--line); }
.brand { font-weight: 700; color: var(--text); text-decoration: none; font-size: 1.05rem; }
.topbar .spacer { flex: 1; }
.menu-btn { display: inline-flex; }
.layout { display: grid; grid-template-columns: minmax(0, 1fr); }
.sidebar { position: fixed; inset: 3.3rem auto 0 0; width: min(18rem, 85vw); background: var(--bg-2); border-right: 1px solid var(--line); padding: 1rem; overflow-y: auto; transform: translateX(-105%); transition: transform var(--dur) ease; z-index: 15; }
body.nav-open .sidebar { transform: none; }
.sidebar h2 { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin: 1rem 0 0.3rem; }
.sidebar ul { list-style: none; margin: 0; padding: 0; }
.sidebar a { display: block; padding: 0.3rem 0.5rem; border-radius: 6px; color: var(--text); text-decoration: none; font-size: 0.95rem; }
.sidebar a[aria-current='page'] { background: var(--accent); color: var(--on-accent); }
.sidebar .module-link { font-weight: 600; }
main.outlet { padding: 1.25rem 1rem 4rem; max-width: 56rem; width: 100%; margin: 0 auto; min-width: 0; outline: none; }
@media (min-width: 1000px) {
  .menu-btn { display: none; }
  .layout { grid-template-columns: 17rem minmax(0, 1fr); }
  .sidebar { position: sticky; top: 3.3rem; height: calc(100vh - 3.3rem); transform: none; width: auto; }
}
.hero p { font-size: 1.1rem; color: var(--muted); max-width: 40rem; }
.module-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr)); }
.module-card h3 { margin: 0.2rem 0; }
.module-card a { text-decoration: none; }
.how-list { display: grid; gap: 0.5rem; padding-left: 1.2rem; }
.item-list { list-style: none; padding: 0; display: grid; gap: 0.5rem; }
.item-list a { display: block; }
.tag { display: inline-block; font-size: 0.75rem; padding: 0.05rem 0.5rem; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); }
```

`src/styles/code.css`:

```css
pre.code { margin: 0; background: var(--code-bg); border: 1px solid var(--line); border-radius: 8px; padding: 0.6rem 0; overflow: auto; font-family: var(--mono); font-size: 0.85rem; line-height: 1.5; max-height: 24rem; }
pre.code code { background: none; padding: 0; font-size: inherit; display: block; min-width: max-content; }
pre.code .ln { display: block; padding: 0 0.9rem; white-space: pre; border-left: 3px solid transparent; transition: background-color var(--dur); }
pre.code .ln.active { background: color-mix(in srgb, var(--accent) 22%, transparent); border-left-color: var(--accent); }
.tok-keyword, .tok-modifier { color: var(--tok-keyword); }
.tok-string { color: var(--tok-string); }
.tok-number, .tok-bool, .tok-atom { color: var(--tok-number); }
.tok-comment { color: var(--tok-comment); font-style: italic; }
.tok-typeName, .tok-className, .tok-namespace { color: var(--tok-type); }
```

`src/styles/index.css`:

```css
@import './tokens.css';
@import './base.css';
@import './shell.css';
@import './code.css';
@import './player.css';
@import './lab.css';
@import './lesson.css';
@import './problem.css';
```

Create empty placeholders for `src/styles/lesson.css` and `src/styles/problem.css` now so the import resolves. Each one gets a single comment line, `/* filled in Task 18 */` and `/* filled in Task 19 */`.

- [ ] **Step 2: Write the failing shell test**

```ts
import { describe, expect, it } from 'vitest';
import { buildRegistry } from '../../../src/core/registry';
import type { Module } from '../../../src/content-types';
import { mountShell } from '../../../src/pages/shell';
import { renderHome } from '../../../src/pages/home';
import { renderModule } from '../../../src/pages/module-page';

const m: Module = { id: 'foundations', order: 1, level: 'basics', icon: '🧱', title: 'Foundations', summary: 'The basics.', status: 'building', outcomes: ['Say a Big-O.'], lessonIds: [], problemIds: [], quiz: [], cheatsheet: [], glossary: [] };
const registry = buildRegistry({ modules: [m], lessons: [], problems: [], traces: [] });

describe('shell', () => {
  it('renders nav, toggles theme and marks the active link', () => {
    const root = document.createElement('div');
    let toggled = 0;
    const shell = mountShell(root, registry, { current: () => 'dark', toggle: () => { toggled++; } });
    expect(root.querySelector('a.module-link')!.getAttribute('href')).toBe('#/m/foundations');
    (root.querySelector('[data-action="theme"]') as HTMLButtonElement).click();
    expect(toggled).toBe(1);
    shell.setActive({ name: 'module', id: 'foundations' });
    expect(root.querySelector('a[aria-current="page"]')!.getAttribute('href')).toBe('#/m/foundations');
    (root.querySelector('[data-action="menu"]') as HTMLButtonElement).click();
    expect(document.body.classList.contains('nav-open')).toBe(true);
    expect(shell.outlet.tagName).toBe('MAIN');
  });
  it('home and module pages list modules and outcomes', () => {
    expect(renderHome(registry).__html).toContain('Foundations');
    expect(renderModule(m, registry).__html).toContain('Say a Big-O.');
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npx vitest run tests/unit/pages/shell.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 4: Implement the pages**

`src/pages/shell.ts`:

```ts
import { html, render } from '../core/html';
import type { Registry } from '../core/registry';
import { href, type Route } from '../core/router';
import type { ThemeControl } from '../core/theme';

export interface Shell {
  outlet: HTMLElement;
  setActive(route: Route): void;
}

export function mountShell(root: HTMLElement, registry: Registry, theme: ThemeControl): Shell {
  render(root, html`
    <a class="visually-hidden" href="#main">Skip to content</a>
    <header class="topbar">
      <button type="button" class="menu-btn" data-action="menu" aria-label="Open menu" aria-expanded="false">☰</button>
      <a class="brand" href="#/">🧩 DSA Playbook</a>
      <span class="spacer"></span>
      <button type="button" data-action="theme" aria-label="Switch dark or light theme">🌓</button>
    </header>
    <div class="layout">
      <aside class="sidebar" aria-label="Modules">
        <nav>
          ${registry.modules.map((m) => html`
            <h2>${m.level}</h2>
            <ul>
              <li><a class="module-link" href="${href({ name: 'module', id: m.id })}">${m.icon} ${m.title}</a></li>
              ${m.lessonIds.map((id) => registry.lesson(id)).filter(Boolean).map((l) => html`<li><a href="${href({ name: 'lesson', id: l!.id })}">📖 ${l!.title}</a></li>`)}
              ${m.problemIds.map((id) => registry.problem(id)).filter(Boolean).map((p) => html`<li><a href="${href({ name: 'problem', id: p!.id })}">🧪 ${p!.title}</a></li>`)}
            </ul>`)}
        </nav>
      </aside>
      <main class="outlet" id="main" tabindex="-1"></main>
    </div>`);

  const menuBtn = root.querySelector('[data-action="menu"]') as HTMLButtonElement;
  const setMenu = (open: boolean) => {
    document.body.classList.toggle('nav-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  };
  menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('nav-open')));
  root.querySelector('[data-action="theme"]')!.addEventListener('click', () => theme.toggle());
  root.querySelector('.sidebar')!.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) setMenu(false);
  });

  return {
    outlet: root.querySelector('main') as HTMLElement,
    setActive(route) {
      const target = route.name === 'notFound' ? null : href(route);
      root.querySelectorAll('.sidebar a').forEach((a) => {
        if (a.getAttribute('href') === target) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
    },
  };
}
```

`src/pages/home.ts`:

```ts
import { html, type SafeHtml } from '../core/html';
import type { Registry } from '../core/registry';
import { href } from '../core/router';

export function renderHome(registry: Registry): SafeHtml {
  return html`
    <section class="hero">
      <h1>Learn DSA by spotting patterns</h1>
      <p>Watch each algorithm run step by step. Try first, then reveal. Write real Java in your browser.</p>
    </section>
    <h2>How this site teaches</h2>
    <ul class="how-list">
      <li>🔍 <b>Spot it first.</b> Every problem starts with "which pattern is this?"</li>
      <li>⚙️ <b>Dry run.</b> Step through the code and watch the values change.</li>
      <li>🐢 → 🚀 <b>Brute, better, optimal.</b> Learn to find the work a slow answer repeats.</li>
      <li>🧪 <b>Java lab.</b> Write your solution and run the tests right here.</li>
    </ul>
    <h2>Start here</h2>
    <div class="module-grid">
      ${registry.modules.map((m) => html`
        <article class="card module-card">
          <a href="${href({ name: 'module', id: m.id })}"><span aria-hidden="true">${m.icon}</span> <h3>${m.title}</h3></a>
          <p class="muted">${m.summary}</p>
          <p><span class="tag">${m.lessonIds.length} lesson${m.lessonIds.length === 1 ? '' : 's'}</span> <span class="tag">${m.problemIds.length} problem${m.problemIds.length === 1 ? '' : 's'}</span></p>
        </article>`)}
    </div>`;
}
```

`src/pages/module-page.ts`:

```ts
import type { Module } from '../content-types';
import { html, type SafeHtml } from '../core/html';
import type { Registry } from '../core/registry';
import { href } from '../core/router';

export function renderModule(m: Module, registry: Registry): SafeHtml {
  const lessons = m.lessonIds.map((id) => registry.lesson(id)).filter((l) => l !== undefined);
  const problems = m.problemIds.map((id) => registry.problem(id)).filter((p) => p !== undefined);
  return html`
    <h1><span aria-hidden="true">${m.icon}</span> ${m.title}</h1>
    <p class="muted">${m.summary}</p>
    <h2>After this module you can</h2>
    <ul>${m.outcomes.map((o) => html`<li>${o}</li>`)}</ul>
    <h2>Lessons</h2>
    <ul class="item-list">${lessons.map((l) => html`<li class="card"><a href="${href({ name: 'lesson', id: l.id })}">📖 ${l.title}</a> <span class="muted">${l.minutes} min</span><br /><span class="muted">${l.summary}</span></li>`)}</ul>
    <h2>Problems</h2>
    <ul class="item-list">${problems.map((p) => html`<li class="card"><a href="${href({ name: 'problem', id: p.id })}">🧪 ${p.title}</a> <span class="tag">${p.difficulty}</span></li>`)}</ul>`;
}
```

`src/pages/not-found.ts`:

```ts
import { html, type SafeHtml } from '../core/html';

export function renderNotFound(): SafeHtml {
  return html`<h1>Page not found</h1><p>This page does not exist. <a href="#/">Go to the start</a>.</p>`;
}
```

`src/pages/router-view.ts`:

```ts
import { render } from '../core/html';
import type { Registry } from '../core/registry';
import type { Route } from '../core/router';
import type { Store } from '../core/store';
import type { createEditor } from '../lab/editor';
import type { JavaRunner } from '../lab/runner';
import { renderHome } from './home';
import { renderModule } from './module-page';
import { renderNotFound } from './not-found';

export interface PageContext {
  registry: Registry;
  store: Store;
  runner: JavaRunner;
  makeEditor?: typeof createEditor;
}

const noop = () => {};

export function renderRoute(route: Route, outlet: HTMLElement, ctx: PageContext): { title: string; cleanup: () => void } {
  outlet.innerHTML = '';
  if (route.name === 'home') {
    render(outlet, renderHome(ctx.registry));
    return { title: 'DSA Playbook', cleanup: noop };
  }
  if (route.name === 'module') {
    const m = ctx.registry.module(route.id);
    if (m) {
      render(outlet, renderModule(m, ctx.registry));
      return { title: `${m.title} · DSA Playbook`, cleanup: noop };
    }
  }
  render(outlet, renderNotFound());
  return { title: 'Not found · DSA Playbook', cleanup: noop };
}
```

`src/main.ts` (replace the whole file):

```ts
import { contentInput } from '../content';
import { allRoutes, buildRegistry } from './core/registry';
import { startRouter } from './core/router';
import { createStore } from './core/store';
import { initTheme } from './core/theme';
import { TeaVMRunner } from './lab/teavm-runner';
import { mountShell } from './pages/shell';
import { renderRoute } from './pages/router-view';
import './styles/index.css';

const store = createStore(window.localStorage);
const theme = initTheme(window, store);
const registry = buildRegistry(contentInput);
const shell = mountShell(document.getElementById('app') as HTMLElement, registry, theme);
const runner = new TeaVMRunner();
window.__dsa = { routes: allRoutes(registry) };

let cleanup: () => void = () => {};
startRouter(window, (route) => {
  cleanup();
  shell.setActive(route);
  const page = renderRoute(route, shell.outlet, { registry, store, runner });
  cleanup = page.cleanup;
  document.title = page.title;
  window.scrollTo(0, 0);
  shell.outlet.focus({ preventScroll: true });
});
```

- [ ] **Step 5: Run unit tests, typecheck and a quick e2e boot**

Run: `npx vitest run tests/unit/pages/shell.test.ts && npm run typecheck && npm run test:e2e -- boot`
Expected: PASS. Boot test passes (home `h1` visible).

**Checkpoint:** shell and navigation done.

---

### Task 18: Lesson page and quiz

**Files:**
- Create: `src/engine/quiz.ts`, `src/pages/lesson-page.ts`
- Modify: `src/pages/router-view.ts` (add the lesson route), `src/styles/lesson.css`
- Test: `tests/unit/pages/lesson-page.test.ts`

**Interfaces:**
- Consumes: `Lesson`, `Registry`, `mountVizGroup` (Task 10), `codeBlock` (Task 6), `PageContext` (Task 17).
- Produces:
  - `mountQuiz(host: HTMLElement, questions: QuizQuestion[], onComplete?: (score: number) => void): () => void`. Options are `button.quiz-option`. Feedback goes in `.quiz-feedback`. The score appears at `.quiz-score` as `N of M right`.
  - `mountLessonPage(host: HTMLElement, lesson: Lesson, ctx: PageContext): () => void`. Section ids are `example`, `everyday`, `steps`, `spot`, `template`, `real-life`, `mistakes`, `try-it`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { mountQuiz } from '../../../src/engine/quiz';
import { mountLessonPage } from '../../../src/pages/lesson-page';
import { buildRegistry } from '../../../src/core/registry';
import { createStore } from '../../../src/core/store';
import { createRecorder, type TraceDef } from '../../../src/engine/trace';
import type { Lesson } from '../../../src/content-types';

const q = [
  { q: 'Pick b', options: ['a', 'b'], answer: 1, why: 'Because b.' },
  { q: 'Pick a', options: ['a', 'b'], answer: 0, why: 'Because a.' },
];

describe('mountQuiz', () => {
  it('locks each question and counts the score', () => {
    const host = document.createElement('div');
    let final = -1;
    mountQuiz(host, q, (s) => { final = s; });
    const opts = host.querySelectorAll<HTMLButtonElement>('.quiz-option');
    opts[1]!.click();
    expect(host.querySelectorAll('.quiz-feedback')[0]!.textContent).toContain('Right');
    opts[0]!.click();
    expect(opts[0]!.disabled).toBe(true);
    opts[3]!.click();
    expect(host.querySelectorAll('.quiz-feedback')[1]!.textContent).toContain('Not quite');
    expect(host.querySelector('.quiz-score')!.textContent).toBe('1 of 2 right');
    expect(final).toBe(1);
  });
});

const trace: TraceDef = {
  id: 'p/optimal', maxSteps: 10, inputFields: [], parseInput: () => ({ ok: true, value: {} }), formatInput: () => ({}), fromArgs: () => ({}),
  run: () => { const r = createRecorder(); r.step({ line: 'a', vars: { x: '1' }, views: [], note: 'Hello step.' }); return r.finish(1); },
};

const lesson: Lesson = {
  id: 'l', moduleId: 'm', title: 'My lesson', minutes: 5, summary: 'Short summary.', example: '<p>Example text.</p>', everyday: '<p>Everyday text.</p>',
  steps: [{ icon: '🐢', title: 'Slow', text: 'Go slow.' }, { icon: '🚀', title: 'Fast', text: 'Go fast.' }, { icon: '✅', title: 'Check', text: 'Check it.' }],
  viz: [{ label: 'Run it', traceId: 'p/optimal', input: {} }], deep: '<p>Deep text.</p>',
  spot: { size: 'Size.', words: 'Words.', shape: 'Shape.', bottleneck: 'Bottleneck.' },
  traps: [{ looksLike: 'Looks.', butIs: 'Is.', why: 'Why.' }], template: { title: 'Template', java: 'int x = 1;' },
  complexityFacts: [{ q: 'Fast?', a: 'O(1)', why: 'Yes.' }], realLife: [{ text: 'Real.', tier: 'confirmed', source: 'Docs' }],
  mistakes: ['M1.', 'M2.'], interview: ['I1.', 'I2.'], quiz: q.concat([{ q: 'Pick a', options: ['a', 'b'], answer: 0, why: 'A.' }]), problemIds: [],
};

describe('mountLessonPage', () => {
  it('renders all parts and mounts the viz', () => {
    const registry = buildRegistry({ modules: [], lessons: [lesson], problems: [{ id: 'p', moduleId: 'm', title: 'P', approaches: [{ level: 'optimal', title: 'o', idea: 'i', java: 'int a; // @L:a', time: 'O(1)', space: 'O(1)', traceId: 'p/optimal' }] } as never], traces: [trace] });
    const host = document.createElement('div');
    const d: Record<string, string> = {};
    const dispose = mountLessonPage(host, lesson, { registry, store: createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }), runner: { ready: async () => {}, run: async () => ({ kind: 'runnerUnavailable', reason: '' }), stop() {} } });
    expect(host.querySelector('h1')!.textContent).toBe('My lesson');
    for (const id of ['example', 'everyday', 'steps', 'spot', 'template', 'real-life', 'mistakes', 'try-it']) expect(host.querySelector(`#${id}`)).not.toBeNull();
    expect(host.querySelector('.player-note')!.textContent).toBe('Hello step.');
    expect(host.querySelector('details.deep')!.textContent).toContain('Deep text.');
    expect(host.textContent).toContain('Confirmed');
    expect(host.querySelectorAll('.quiz-question')).toHaveLength(3);
    dispose();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/pages/lesson-page.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement `src/engine/quiz.ts`**

```ts
import type { QuizQuestion } from '../content-types';
import { html, render } from '../core/html';

export function mountQuiz(host: HTMLElement, questions: QuizQuestion[], onComplete?: (score: number) => void): () => void {
  const el = document.createElement('div');
  el.className = 'quiz';
  render(el, html`${questions.map((q, i) => html`
    <fieldset class="quiz-question" data-index="${i}">
      <legend>${i + 1}. ${q.q}</legend>
      ${q.options.map((o, k) => html`<button type="button" class="quiz-option" data-q="${i}" data-k="${k}">${o}</button>`)}
      <p class="quiz-feedback" aria-live="polite"></p>
    </fieldset>`)}
    <p class="quiz-score" aria-live="polite"></p>`);
  host.append(el);
  const answered = new Map<number, boolean>();
  el.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.quiz-option');
    if (!btn) return;
    const qi = Number(btn.dataset.q);
    const k = Number(btn.dataset.k);
    const q = questions[qi];
    if (!q || answered.has(qi)) return;
    const right = k === q.answer;
    answered.set(qi, right);
    const fs = el.querySelector(`.quiz-question[data-index="${qi}"]`) as HTMLElement;
    fs.querySelectorAll<HTMLButtonElement>('.quiz-option').forEach((b, idx) => {
      b.disabled = true;
      if (idx === q.answer) b.classList.add('right');
      else if (idx === k) b.classList.add('wrong');
    });
    (fs.querySelector('.quiz-feedback') as HTMLElement).textContent = `${right ? '✅ Right.' : '❌ Not quite.'} ${q.why}`;
    if (answered.size === questions.length) {
      const score = [...answered.values()].filter(Boolean).length;
      (el.querySelector('.quiz-score') as HTMLElement).textContent = `${score} of ${questions.length} right`;
      onComplete?.(score);
    }
  });
  return () => el.remove();
}
```

- [ ] **Step 4: Implement `src/pages/lesson-page.ts`**

```ts
import type { Lesson } from '../content-types';
import { html, raw, render } from '../core/html';
import { href } from '../core/router';
import { codeBlock } from '../engine/highlight';
import { mountVizGroup, type VizItem } from '../engine/player-view';
import { mountQuiz } from '../engine/quiz';
import type { PageContext } from './router-view';

export function mountLessonPage(host: HTMLElement, lesson: Lesson, ctx: PageContext): () => void {
  const problems = lesson.problemIds.map((id) => ctx.registry.problem(id)).filter((p) => p !== undefined);
  render(host, html`
    <article class="lesson">
      <p class="muted"><a href="${href({ name: 'module', id: lesson.moduleId })}">← ${ctx.registry.module(lesson.moduleId)?.title ?? 'Module'}</a> · ${lesson.minutes} min</p>
      <h1>${lesson.title}</h1>
      <p class="lead">${lesson.summary}</p>

      <section id="example"><h2>🔴 A small example</h2>${raw(lesson.example)}</section>
      <section id="everyday"><h2>💡 The everyday picture</h2>${raw(lesson.everyday)}</section>

      <section id="steps"><h2>⚙️ Step by step</h2>
        <ol class="picture-steps">${lesson.steps.map((s) => html`<li><span class="step-icon" aria-hidden="true">${s.icon}</span><div><b>${s.title}</b><p>${s.text}</p></div></li>`)}</ol>
        <div class="viz-host"></div>
        <details class="deep"><summary>🔬 Go deeper</summary>${raw(lesson.deep)}</details>
      </section>

      <section id="spot"><h2>🔍 How to spot it</h2>
        <dl class="clues">
          <div><dt>📏 Size</dt><dd>${lesson.spot.size}</dd></div>
          <div><dt>🔤 Words</dt><dd>${lesson.spot.words}</dd></div>
          <div><dt>🧱 Shape</dt><dd>${lesson.spot.shape}</dd></div>
          <div><dt>🔁 Bottleneck</dt><dd>${lesson.spot.bottleneck}</dd></div>
        </dl>
        ${lesson.traps.map((t) => html`<div class="callout trap"><b>❌ Trap:</b> ${t.looksLike} <b>But it is:</b> ${t.butIs} <span class="muted">${t.why}</span></div>`)}
      </section>

      <section id="template"><h2>🧩 Java template: ${lesson.template.title}</h2>${codeBlock(lesson.template.java, { label: `Java template: ${lesson.template.title}` })}
        <h3>⏱️ Big-O facts</h3>
        <div class="simple-table"><table><thead><tr><th>Question</th><th>Answer</th><th>Why</th></tr></thead>
          <tbody>${lesson.complexityFacts.map((f) => html`<tr><td>${f.q}</td><td><b>${f.a}</b></td><td>${f.why}</td></tr>`)}</tbody></table></div>
      </section>

      <section id="real-life"><h2>🌍 Where you meet this</h2>
        <ul>${lesson.realLife.map((r) => html`<li>${r.text} <span class="tag">${r.tier === 'confirmed' ? 'Confirmed' : 'Educational'}</span>${r.source ? html` <span class="muted">Source: ${r.source}</span>` : null}</li>`)}</ul>
      </section>

      <section id="mistakes"><h2>⚠️ Common mistakes</h2><ul>${lesson.mistakes.map((m) => html`<li>${m}</li>`)}</ul>
        <h3>🎤 In the interview</h3><ul>${lesson.interview.map((m) => html`<li>${m}</li>`)}</ul>
      </section>

      <section id="try-it"><h2>🧪 Try it</h2>
        <div class="quiz-host"></div>
        ${problems.length ? html`<h3>Practice problems</h3><ul class="item-list">${problems.map((p) => html`<li class="card"><a href="${href({ name: 'problem', id: p.id })}">🧪 ${p.title}</a> <span class="tag">${p.difficulty}</span></li>`)}</ul>` : null}
      </section>
    </article>`);

  const items: VizItem[] = [];
  for (const v of lesson.viz) {
    const trace = ctx.registry.trace(v.traceId);
    const approach = ctx.registry.approachForTrace(v.traceId);
    if (trace && approach) items.push({ label: v.label, trace, java: approach.java, input: v.input });
  }
  const disposeViz = items.length ? mountVizGroup(host.querySelector('.viz-host') as HTMLElement, items) : () => {};
  const disposeQuiz = mountQuiz(host.querySelector('.quiz-host') as HTMLElement, lesson.quiz);
  return () => {
    disposeViz();
    disposeQuiz();
    host.innerHTML = '';
  };
}
```

- [ ] **Step 5: Add the lesson route in `src/pages/router-view.ts`**

Add the import `import { mountLessonPage } from './lesson-page';`. Insert this block before the final not-found fallback:

```ts
  if (route.name === 'lesson') {
    const lesson = ctx.registry.lesson(route.id);
    if (lesson) {
      const cleanup = mountLessonPage(outlet, lesson, ctx);
      return { title: `${lesson.title} · DSA Playbook`, cleanup };
    }
  }
```

- [ ] **Step 6: Write `src/styles/lesson.css`**

```css
.lesson .lead { font-size: 1.1rem; }
.lesson section { scroll-margin-top: 4rem; }
.picture-steps { list-style: none; padding: 0; counter-reset: step; display: grid; gap: 0.6rem; margin: 0 0 1rem; }
.picture-steps li { display: grid; grid-template-columns: 2.5rem minmax(0, 1fr); gap: 0.6rem; align-items: start; background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 0.6rem 0.8rem; }
.picture-steps p { margin: 0.1rem 0 0; }
.step-icon { font-size: 1.6rem; line-height: 1; }
details.deep { margin-top: 1rem; background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 0.6rem 1rem; }
.clues { display: grid; gap: 0.5rem; margin: 0 0 1rem; }
.clues > div { display: grid; grid-template-columns: 8rem minmax(0, 1fr); gap: 0.5rem; background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 0.5rem 0.75rem; }
.clues dt { font-weight: 700; }
.clues dd { margin: 0; }
@media (max-width: 520px) { .clues > div { grid-template-columns: minmax(0, 1fr); } }
.callout.trap { border-left-color: var(--bad); margin-top: 0.5rem; }
.quiz { display: grid; gap: 0.75rem; }
.quiz-question { border: 1px solid var(--line); border-radius: var(--radius); padding: 0.6rem 1rem 0.8rem; display: grid; gap: 0.4rem; }
.quiz-question legend { font-weight: 600; padding: 0 0.3rem; }
.quiz-option { text-align: left; }
.quiz-option.right { border-color: var(--ok); outline: 2px solid var(--ok); }
.quiz-option.wrong { border-color: var(--bad); outline: 2px solid var(--bad); }
.quiz-feedback { margin: 0.2rem 0 0; }
.quiz-score { font-weight: 700; }
```

- [ ] **Step 7: Run to verify it passes**

Run: `npx vitest run tests/unit/pages/lesson-page.test.ts && npm run typecheck`
Expected: PASS, typecheck clean.

**Checkpoint:** lesson page done.

---

### Task 19: Problem page (Spot it first, hints, lab, approaches)

**Files:**
- Create: `src/pages/spot-first.ts`, `src/pages/problem-page.ts`
- Modify: `src/pages/router-view.ts` (add the problem route), `src/styles/problem.css`
- Test: `tests/unit/pages/problem-page.test.ts`

**Interfaces:**
- Consumes: `Problem`, `mountLab` (Task 15), `mountVizGroup` (Task 10), `codeBlock`, `parseMarkers` (Task 6), `PageContext`.
- Produces:
  - `mountSpotFirst(host: HTMLElement, spot: SpotFirst): () => void`. Uses radio inputs `name="spot-option"`, clue toggle buttons `.clue-chip` with `aria-pressed`, a check button `[data-testid="spot-check"]`, and a result area `[data-testid="spot-result"]`.
  - `mountProblemPage(host: HTMLElement, problem: Problem, ctx: PageContext): () => void`. Section ids are `problem`, `spot`, `hints`, `lab`, `approaches`, `dry-run`, `compare`, `edge-cases`, `explain`, `hook`, `related`. Hint button `[data-testid="hint-next"]`. Approach buttons `[data-testid="load-into-lab-<level>"]`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { mountSpotFirst } from '../../../src/pages/spot-first';
import { mountProblemPage } from '../../../src/pages/problem-page';
import { buildRegistry } from '../../../src/core/registry';
import { createStore } from '../../../src/core/store';
import { createRecorder, type TraceDef } from '../../../src/engine/trace';
import type { Problem } from '../../../src/content-types';

const spot = { prompt: 'Which idea fits?', options: ['Check pairs', 'Remember seen'], answer: 1, clues: [{ kind: 'size' as const, text: 'Big n.' }, { kind: 'bottleneck' as const, text: 'Repeated search.' }] };

describe('mountSpotFirst', () => {
  it('asks first, then reveals clues', () => {
    const host = document.createElement('div');
    mountSpotFirst(host, spot);
    const check = host.querySelector<HTMLButtonElement>('[data-testid="spot-check"]')!;
    check.click();
    expect(host.querySelector('[data-testid="spot-result"]')!.textContent).toContain('Pick an answer first');
    host.querySelectorAll<HTMLInputElement>('input[name="spot-option"]')[1]!.click();
    host.querySelector<HTMLButtonElement>('.clue-chip')!.click();
    check.click();
    const result = host.querySelector('[data-testid="spot-result"]')!.textContent!;
    expect(result).toContain('Right');
    expect(result).toContain('Repeated search.');
    expect(result).toContain('You used: size');
  });
});

const trace: TraceDef = {
  id: 'p/optimal', maxSteps: 10, inputFields: [], parseInput: () => ({ ok: true, value: {} }), formatInput: () => ({}), fromArgs: () => ({ nums: [1, 1] }),
  run: () => { const r = createRecorder(); r.step({ line: 'a', vars: {}, views: [], note: 'Optimal step.' }); return r.finish(true); },
};

const problem = {
  id: 'p', moduleId: 'm', title: 'Problem P', patternIds: ['hashing'], difficulty: 'easy', core: true, sheets: ['neetcode150'], source: { name: 'LeetCode 1', url: 'https://leetcode.com/problems/x/' },
  statement: '<p>Do it.</p>', limits: ['1 ≤ n ≤ 10'], examples: [{ input: 'nums = [1, 1]', output: 'true', note: 'Repeat.' }],
  spot, hints: ['Hint one.', 'Hint two.', 'Hint three.'],
  approaches: [
    { level: 'brute', title: 'Pairs', idea: 'Check pairs.', java: 'class Solution { /* brute */ }', time: 'O(n²)', space: 'O(1)', nextStepRemoves: 'Removes the search.' },
    { level: 'optimal', title: 'Set', idea: 'Use a set.', java: 'class Solution { /* optimal */ } // @L:a', time: 'O(n)', space: 'O(n)', traceId: 'p/optimal' },
  ],
  edgeCases: ['One item.', 'All same.'], mistakes: ['M1.', 'M2.'], explain30: 'Thirty seconds.', hook: 'Seen it? Set.',
  related: [{ title: 'Two Sum', why: 'Same lookup idea.' }], lookAlikes: [],
  spec: { className: 'Solution', method: 'f', params: [{ name: 'nums', type: 'int[]' }], returns: 'boolean', compare: 'exact', samples: [{ id: 's1', args: [[1, 1]], expected: true }], hidden: [] },
  starter: 'class Solution {}',
} as unknown as Problem;

describe('mountProblemPage', () => {
  it('renders parts, reveals hints one at a time and loads code into the lab', () => {
    const registry = buildRegistry({ modules: [], lessons: [], problems: [problem], traces: [trace] });
    const d: Record<string, string> = {};
    const host = document.createElement('div');
    document.body.append(host);
    let editorValue = '';
    const makeEditor = (_p: HTMLElement, doc: string) => {
      editorValue = doc;
      return { getValue: () => editorValue, setValue: (v: string) => { editorValue = v; }, focus() {}, destroy() {} };
    };
    const dispose = mountProblemPage(host, problem, { registry, makeEditor, store: createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }), runner: { ready: async () => {}, run: async () => ({ kind: 'tests', results: [], stdout: '' }), stop() {} } });
    for (const id of ['problem', 'spot', 'hints', 'lab', 'approaches', 'dry-run', 'compare', 'edge-cases', 'explain', 'hook', 'related']) expect(host.querySelector(`#${id}`)).not.toBeNull();
    const next = host.querySelector<HTMLButtonElement>('[data-testid="hint-next"]')!;
    expect(host.querySelectorAll('.hint:not([hidden])')).toHaveLength(0);
    next.click();
    expect(host.querySelectorAll('.hint:not([hidden])')).toHaveLength(1);
    next.click(); next.click();
    expect(next.disabled).toBe(true);
    expect(host.querySelector('.player-note')!.textContent).toBe('Optimal step.');
    (host.querySelector('[data-testid="load-into-lab-optimal"]') as HTMLButtonElement).click();
    expect(editorValue).toContain('/* optimal */');
    expect(editorValue).not.toContain('@L:');
    dispose();
    host.remove();
  });
});
```

The real CodeMirror editor is covered by the browser tests in Task 21.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/pages/problem-page.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement `src/pages/spot-first.ts`**

```ts
import type { ClueKind, SpotFirst } from '../content-types';
import { html, render } from '../core/html';

const KINDS: { kind: ClueKind; label: string }[] = [
  { kind: 'size', label: '📏 size' },
  { kind: 'words', label: '🔤 words' },
  { kind: 'shape', label: '🧱 shape' },
  { kind: 'bottleneck', label: '🔁 bottleneck' },
];

export function mountSpotFirst(host: HTMLElement, spot: SpotFirst): () => void {
  const el = document.createElement('div');
  el.className = 'spot-first card';
  render(el, html`
    <p><b>${spot.prompt}</b></p>
    <div class="spot-options" role="radiogroup">${spot.options.map((o, i) => html`<label><input type="radio" name="spot-option" value="${i}" /> ${o}</label>`)}</div>
    <p class="muted">Which clues did you use?</p>
    <div class="clue-chips">${KINDS.map((k) => html`<button type="button" class="clue-chip" data-kind="${k.kind}" aria-pressed="false">${k.label}</button>`)}</div>
    <button type="button" class="primary" data-testid="spot-check">Check my answer</button>
    <div class="spot-result" data-testid="spot-result" aria-live="polite"></div>`);
  host.append(el);
  el.querySelectorAll<HTMLButtonElement>('.clue-chip').forEach((b) =>
    b.addEventListener('click', () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'))),
  );
  const result = el.querySelector('[data-testid="spot-result"]') as HTMLElement;
  el.querySelector('[data-testid="spot-check"]')!.addEventListener('click', () => {
    const picked = el.querySelector<HTMLInputElement>('input[name="spot-option"]:checked');
    if (!picked) {
      result.textContent = 'Pick an answer first. Guessing is fine.';
      return;
    }
    const right = Number(picked.value) === spot.answer;
    const used = [...el.querySelectorAll<HTMLButtonElement>('.clue-chip[aria-pressed="true"]')].map((b) => b.dataset.kind);
    render(result, html`
      <p><b>${right ? '✅ Right.' : '❌ Not this time.'}</b> The best fit is: <b>${spot.options[spot.answer] ?? ''}</b>.</p>
      <p class="muted">You used: ${used.length ? used.join(', ') : 'no clues yet'}.</p>
      <p>The clues an expert sees:</p>
      <ul>${spot.clues.map((c) => html`<li><b>${KINDS.find((k) => k.kind === c.kind)?.label ?? c.kind}:</b> ${c.text}</li>`)}</ul>`);
  });
  return () => el.remove();
}
```

- [ ] **Step 4: Implement `src/pages/problem-page.ts`**

```ts
import type { Problem } from '../content-types';
import { html, raw, render } from '../core/html';
import { href } from '../core/router';
import { codeBlock } from '../engine/highlight';
import { parseMarkers } from '../engine/markers';
import { mountVizGroup } from '../engine/player-view';
import { mountLab } from '../lab/lab-view';
import type { PageContext } from './router-view';
import { mountSpotFirst } from './spot-first';

const LEVEL_LABEL = { brute: '🐢 Brute force', better: '🚶 Better', optimal: '🚀 Optimal' } as const;

export function mountProblemPage(host: HTMLElement, problem: Problem, ctx: PageContext): () => void {
  const link = (l: { title: string; why: string; id?: string }) =>
    html`<li>${l.id ? html`<a href="${href({ name: 'problem', id: l.id })}">${l.title}</a>` : html`<b>${l.title}</b> <span class="tag">coming later</span>`} <span class="muted">${l.why}</span></li>`;
  render(host, html`
    <article class="problem">
      <p class="muted"><a href="${href({ name: 'module', id: problem.moduleId })}">← ${ctx.registry.module(problem.moduleId)?.title ?? 'Module'}</a></p>
      <h1>${problem.title} <span class="tag">${problem.difficulty}</span></h1>

      <section id="problem"><h2>📝 The problem</h2>${raw(problem.statement)}
        <h3>Limits</h3><ul>${problem.limits.map((l) => html`<li><code>${l}</code></li>`)}</ul>
        <h3>Examples</h3><ul>${problem.examples.map((e) => html`<li><code>${e.input}</code> → <code>${e.output}</code>${e.note ? html` <span class="muted">${e.note}</span>` : null}</li>`)}</ul>
        <p><a href="${problem.source.url}" target="_blank" rel="noopener">Open on ${problem.source.name}</a></p>
      </section>

      <section id="spot"><h2>🔍 Spot it first</h2><div class="spot-host"></div></section>

      <section id="hints"><h2>💬 Hints</h2>
        <ol class="hints">${problem.hints.map((h) => html`<li class="hint" hidden>${h}</li>`)}</ol>
        <button type="button" data-testid="hint-next">Show a hint (0 of 3)</button>
      </section>

      <section id="lab"><h2>🧪 Try it yourself</h2><div class="lab-host"></div></section>

      <section id="approaches"><h2>🐢 → 🚀 Approaches</h2>
        ${problem.approaches.map((a) => html`
          <details class="approach card" data-level="${a.level}">
            <summary>${LEVEL_LABEL[a.level]}: ${a.title} <span class="muted">${a.time} time, ${a.space} space</span></summary>
            <p>${a.idea}</p>
            ${codeBlock(parseMarkers(a.java).code, { label: `${a.level} solution in Java` })}
            <p><button type="button" data-testid="load-into-lab-${a.level}">Load into lab</button></p>
            ${a.nextStepRemoves ? html`<p class="callout"><b>What the next step removes:</b> ${a.nextStepRemoves}</p>` : null}
          </details>`)}
      </section>

      <section id="dry-run"><h2>⚙️ Dry run of the optimal solution</h2><div class="viz-host"></div></section>

      <section id="compare"><h2>📊 Compare the approaches</h2>
        <div class="simple-table"><table><thead><tr><th>Approach</th><th>Time</th><th>Space</th><th>Why move on?</th></tr></thead>
          <tbody>${problem.approaches.map((a) => html`<tr><td>${LEVEL_LABEL[a.level]}</td><td>${a.time}</td><td>${a.space}</td><td>${a.nextStepRemoves ?? 'This is the goal.'}</td></tr>`)}</tbody></table></div>
      </section>

      <section id="edge-cases"><h2>⚠️ Edge cases</h2><ul>${problem.edgeCases.map((e) => html`<li>${e}</li>`)}</ul>
        <h3>Common mistakes</h3><ul>${problem.mistakes.map((m) => html`<li>${m}</li>`)}</ul>
      </section>

      <section id="explain"><h2>🗣️ The 30-second explanation</h2>
        <details class="card"><summary>Say it out loud first, then reveal</summary><p>${problem.explain30}</p></details>
      </section>

      <section id="hook"><h2>🪝 Memory hook</h2><p class="callout"><b>${problem.hook}</b></p></section>

      <section id="related"><h2>🔗 Related problems</h2>
        <ul>${problem.related.map(link)}</ul>
        ${problem.lookAlikes.length ? html`<h3>Look-alikes</h3><ul>${problem.lookAlikes.map(link)}</ul>` : null}
      </section>
    </article>`);

  const disposeSpot = mountSpotFirst(host.querySelector('.spot-host') as HTMLElement, problem.spot);
  const lab = mountLab(host.querySelector('.lab-host') as HTMLElement, problem, { runner: ctx.runner, store: ctx.store, makeEditor: ctx.makeEditor });

  const hints = [...host.querySelectorAll<HTMLElement>('.hint')];
  const hintBtn = host.querySelector<HTMLButtonElement>('[data-testid="hint-next"]') as HTMLButtonElement;
  let shown = 0;
  hintBtn.addEventListener('click', () => {
    const next = hints[shown];
    if (!next) return;
    next.hidden = false;
    shown++;
    hintBtn.textContent = `Show a hint (${shown} of 3)`;
    if (shown >= hints.length) hintBtn.disabled = true;
  });

  for (const a of problem.approaches) {
    host.querySelector(`[data-testid="load-into-lab-${a.level}"]`)?.addEventListener('click', () => lab.loadCode(parseMarkers(a.java).code));
  }

  const optimal = problem.approaches.find((a) => a.level === 'optimal' && a.traceId);
  const trace = optimal?.traceId ? ctx.registry.trace(optimal.traceId) : undefined;
  const sample = problem.spec.samples[0];
  const vizHost = host.querySelector('.viz-host') as HTMLElement;
  const disposeViz = optimal && trace && sample
    ? mountVizGroup(vizHost, [{ label: optimal.title, trace, java: optimal.java, input: trace.fromArgs(sample.args) }])
    : (() => { vizHost.textContent = 'No dry run for this problem yet.'; return () => {}; })();

  return () => {
    disposeSpot();
    disposeViz();
    lab.dispose();
    host.innerHTML = '';
  };
}
```

- [ ] **Step 5: Add the problem route in `src/pages/router-view.ts`**

Add `import { mountProblemPage } from './problem-page';` and insert before the not-found fallback:

```ts
  if (route.name === 'problem') {
    const problem = ctx.registry.problem(route.id);
    if (problem) {
      const cleanup = mountProblemPage(outlet, problem, ctx);
      return { title: `${problem.title} · DSA Playbook`, cleanup };
    }
  }
```

- [ ] **Step 6: Write `src/styles/problem.css`**

```css
.problem section { scroll-margin-top: 4rem; }
.spot-first { display: grid; gap: 0.5rem; }
.spot-options { display: grid; gap: 0.35rem; }
.spot-options label { display: flex; gap: 0.5rem; align-items: center; padding: 0.4rem 0.6rem; border: 1px solid var(--line); border-radius: 8px; cursor: pointer; }
.clue-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.clue-chip[aria-pressed='true'] { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
.spot-result ul { margin: 0.3rem 0 0; }
.hints { padding-left: 1.4rem; }
.hint { margin-bottom: 0.4rem; }
.approach { margin-bottom: 0.6rem; }
.approach summary { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: baseline; }
.approach pre.code { margin-top: 0.5rem; }
```

- [ ] **Step 7: Run to verify it passes**

Run: `npx vitest run tests/unit/pages/problem-page.test.ts && npm run typecheck`
Expected: PASS, typecheck clean.

**Checkpoint:** problem page done.

---

### Task 20: Model content (Foundations, lesson, Contains Duplicate, traces)

**Files:**
- Create:
  - `content/modules/01-foundations/module.ts`
  - `content/modules/01-foundations/lessons/brute-better-optimal.ts`
  - `content/modules/01-foundations/problems/contains-duplicate/` containing `problem.ts`, `spec.json`, `Starter.java`, `Brute.java`, `Better.java`, `Optimal.java` and `trace.ts`
- Modify: `content/index.ts`
- Test: `tests/content/traces.test.ts`, `tests/tools/verify-java.test.ts`

**Interfaces:**
- Produces: module `foundations`, lesson `brute-better-optimal`, problem `contains-duplicate`, and traces `contains-duplicate/brute` and `contains-duplicate/optimal` with input `{ nums: number[] }` (1 to 20 numbers, each from -1,000,000,000 to 1,000,000,000).

- [ ] **Step 1: Write the Java files**

`Starter.java`:

```java
import java.util.*;

class Solution {
    public boolean containsDuplicate(int[] nums) {
        // Write your code here.
        return false;
    }
}
```

`Brute.java`:

```java
class Solution {
    public boolean containsDuplicate(int[] nums) {
        for (int i = 0; i < nums.length; i++) { // @L:outer
            for (int j = i + 1; j < nums.length; j++) { // @L:inner
                if (nums[i] == nums[j]) { // @L:compare
                    return true; // @L:found
                }
            }
        }
        return false; // @L:none
    }
}
```

`Better.java`:

```java
import java.util.Arrays;

class Solution {
    public boolean containsDuplicate(int[] nums) {
        int[] sorted = nums.clone();
        Arrays.sort(sorted);
        for (int i = 1; i < sorted.length; i++) {
            if (sorted[i] == sorted[i - 1]) {
                return true;
            }
        }
        return false;
    }
}
```

`Optimal.java`:

```java
import java.util.HashSet;
import java.util.Set;

class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>(); // @L:init
        for (int num : nums) { // @L:loop
            if (!seen.add(num)) { // @L:check
                return true; // @L:found
            }
        }
        return false; // @L:none
    }
}
```

- [ ] **Step 2: Write `spec.json`**

```json
{
  "className": "Solution",
  "method": "containsDuplicate",
  "params": [{ "name": "nums", "type": "int[]" }],
  "returns": "boolean",
  "compare": "exact",
  "samples": [
    { "id": "s1", "args": [[1, 2, 3, 1]], "expected": true },
    { "id": "s2", "args": [[1, 2, 3, 4]], "expected": false }
  ],
  "hidden": [
    { "id": "h1", "args": [[7]], "expected": false },
    { "id": "h2", "args": [[7, 7, 7, 7]], "expected": true },
    { "id": "h3", "args": [[1, 2, 3, 4, 5, 6, 7, 8, 9, 1]], "expected": true },
    { "id": "h4", "args": [[-1000000000, 1000000000, 0, -1000000000]], "expected": true },
    { "id": "h5", "args": [[2, 14, 18, 22, 22]], "expected": true },
    { "id": "h6", "args": [[5, 4, 3, 2, 1]], "expected": false }
  ],
  "speed": { "id": "speed", "args": [{ "gen": "intRange", "n": 100000 }], "expected": false, "timeLimitMs": 2000 }
}
```

- [ ] **Step 3: Write `trace.ts`**

```ts
import { createRecorder, parseIntList, type ArrayView, type HashView, type MarkColor, type ParseResult, type TraceDef } from '../../../../../src/engine/trace';

interface Input {
  nums: number[];
}

const fields = [{ name: 'nums', label: 'nums', placeholder: '3, 8, 1, 8' }];
const LIMITS = { min: -1_000_000_000, max: 1_000_000_000, minLength: 1, maxLength: 20 };

function parse(f: Record<string, string>): ParseResult<Input> {
  const r = parseIntList(f.nums ?? '', LIMITS);
  return r.ok ? { ok: true, value: { nums: r.value } } : r;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const containsDuplicateBrute: TraceDef<Input> = {
  id: 'contains-duplicate/brute',
  maxSteps: 400,
  inputFields: fields,
  parseInput: parse,
  formatInput: (i) => ({ nums: i.nums.join(', ') }),
  fromArgs: (args) => ({ nums: args[0] as number[] }),
  run({ nums }) {
    const rec = createRecorder();
    const arr = (pointers: ArrayView['pointers'], marks: ArrayView['marks']): ArrayView => ({ kind: 'array', id: 'nums', label: 'nums', values: nums, pointers, marks });
    let checks = 0;
    rec.step({ line: 'outer', vars: { i: '-', j: '-', checks: '0' }, views: [arr([], [])], note: `We will compare every pair. There are ${plural(nums.length, 'number')}.` });
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        checks++;
        const same = nums[i] === nums[j];
        const color: MarkColor = same ? 'answer' : 'current';
        const vars = { i: String(i), j: String(j), checks: String(checks) };
        const view = arr([{ name: 'i', index: i }, { name: 'j', index: j }], [{ index: i, color }, { index: j, color }]);
        rec.step({
          line: 'compare',
          vars,
          views: [view],
          note: same
            ? `nums[${i}] is ${nums[i]} and nums[${j}] is ${nums[j]}. They are equal.`
            : `Compare nums[${i}] = ${nums[i]} with nums[${j}] = ${nums[j]}. They are different.`,
        });
        if (same) {
          rec.step({ line: 'found', vars, views: [view], note: `We found a repeat. Return true after ${plural(checks, 'check')}.` });
          return rec.finish(true);
        }
      }
    }
    rec.step({ line: 'none', vars: { i: '-', j: '-', checks: String(checks) }, views: [arr([], [])], note: `No pair matched after ${plural(checks, 'check')}. Return false.` });
    return rec.finish(false);
  },
};

export const containsDuplicateOptimal: TraceDef<Input> = {
  id: 'contains-duplicate/optimal',
  maxSteps: 100,
  inputFields: fields,
  parseInput: parse,
  formatInput: (i) => ({ nums: i.nums.join(', ') }),
  fromArgs: (args) => ({ nums: args[0] as number[] }),
  run({ nums }) {
    const rec = createRecorder();
    const seen: number[] = [];
    const set = (key?: string, color?: MarkColor): HashView => ({ kind: 'hash', id: 'seen', label: 'seen', mode: 'set', entries: seen.map((v) => ({ key: String(v) })), highlightKey: key, highlightColor: color });
    const arr = (index: number | null, color: MarkColor): ArrayView => ({ kind: 'array', id: 'nums', label: 'nums', values: nums, pointers: index === null ? [] : [{ name: 'num', index }], marks: index === null ? [] : [{ index, color }] });
    rec.step({ line: 'init', vars: { num: '-', 'seen size': '0' }, views: [arr(null, 'current'), set()], note: 'Start with an empty set called seen.' });
    for (let k = 0; k < nums.length; k++) {
      const v = nums[k] as number;
      if (seen.includes(v)) {
        const vars = { num: String(v), 'seen size': String(seen.length) };
        rec.step({ line: 'check', vars, views: [arr(k, 'answer'), set(String(v), 'answer')], note: `${v} is already in seen. We found a repeat.` });
        rec.step({ line: 'found', vars, views: [arr(k, 'answer'), set(String(v), 'answer')], note: 'Return true. We never had to look back at the list.' });
        return rec.finish(true);
      }
      seen.push(v);
      rec.step({ line: 'check', vars: { num: String(v), 'seen size': String(seen.length) }, views: [arr(k, 'current'), set(String(v), 'current')], note: `${v} is not in seen yet. Add it and move on.` });
    }
    rec.step({ line: 'none', vars: { num: '-', 'seen size': String(seen.length) }, views: [arr(null, 'current'), set()], note: 'We reached the end with no repeat. Return false.' });
    return rec.finish(false);
  },
};
```

- [ ] **Step 4: Write `problem.ts`**

```ts
import type { Problem, ProblemSpec } from '../../../../../src/content-types';
import better from './Better.java?raw';
import brute from './Brute.java?raw';
import optimal from './Optimal.java?raw';
import spec from './spec.json';
import starter from './Starter.java?raw';

export const containsDuplicate: Problem = {
  id: 'contains-duplicate',
  moduleId: 'foundations',
  title: 'Contains Duplicate',
  patternIds: ['hashing'],
  difficulty: 'easy',
  core: true,
  sheets: ['neetcode150'],
  source: { name: 'LeetCode 217', url: 'https://leetcode.com/problems/contains-duplicate/' },
  statement: '<p>You get an array of whole numbers called <code>nums</code>. Return <code>true</code> if any value appears at least twice. Return <code>false</code> if every value is different.</p>',
  limits: ['1 ≤ nums.length ≤ 100,000', '-1,000,000,000 ≤ nums[i] ≤ 1,000,000,000'],
  examples: [
    { input: 'nums = [1, 2, 3, 1]', output: 'true', note: 'The number 1 appears twice.' },
    { input: 'nums = [1, 2, 3, 4]', output: 'false', note: 'Every number is different.' },
  ],
  spot: {
    prompt: 'Which idea fits this problem best?',
    options: ['Check every pair of numbers', 'Remember the numbers you have already seen', 'Count up to the biggest number'],
    answer: 1,
    clues: [
      { kind: 'size', text: 'Up to 100,000 numbers. Checking every pair is about 5 billion checks, which is too slow.' },
      { kind: 'words', text: '"Any value appears twice" is really the question "have I seen this before?"' },
      { kind: 'shape', text: 'One unsorted list. The order of the numbers does not change the answer.' },
      { kind: 'bottleneck', text: 'The slow way searches for an equal number again and again. A HashSet answers in one step.' },
    ],
  },
  hints: [
    'What is the slowest correct way? Say its Big-O out loud.',
    'For each number, the slow way asks "is there an equal number somewhere?" Can you answer that faster?',
    'Keep a HashSet. If add() returns false, that value was already there.',
  ],
  approaches: [
    {
      level: 'brute',
      title: 'Compare every pair',
      idea: 'For each index i, look at every later index j. If two values match, return true. If no pair matches, return false.',
      java: brute,
      time: 'O(n²)',
      space: 'O(1)',
      nextStepRemoves: 'The inner loop searches the rest of the list for every number. Putting equal numbers side by side turns that search into one look at a neighbour.',
      traceId: 'contains-duplicate/brute',
    },
    {
      level: 'better',
      title: 'Sort, then check neighbours',
      idea: 'Copy the array and put the copy in order. Equal numbers now sit side by side. One pass that compares each number with the one before it finds any repeat. You will learn how sorting works in Module 7.',
      java: better,
      time: 'O(n log n)',
      space: 'O(n)',
      nextStepRemoves: 'Putting every number in order does more work than we need. We only need to know if a value was seen before. A HashSet answers that directly.',
    },
    {
      level: 'optimal',
      title: 'Remember what you have seen',
      idea: 'Walk the array once. Keep a HashSet of values seen so far. If the current value is already in the set, return true. Otherwise add it and move on.',
      java: optimal,
      time: 'O(n)',
      space: 'O(n)',
      traceId: 'contains-duplicate/optimal',
    },
  ],
  edgeCases: [
    'Only one number. There is no pair, so the answer is false.',
    'All numbers are the same, like [7, 7, 7]. The answer is true at the second number.',
    'The repeat is at the very end. You must look at every number before you say false.',
    'Very large and very small numbers. They are safe because we only compare them.',
  ],
  mistakes: [
    'Starting the inner loop at j = 0. Then every number matches itself and the answer is always true.',
    'Putting nums itself in order. That changes the caller’s array. Work on a copy instead.',
    'Storing the index in the set instead of the value. Every index is different, so nothing ever repeats.',
  ],
  explain30:
    'The simple way compares every pair. That is O(n²), which is too slow for 100,000 numbers. I only need to know if I have seen a value before. So I walk the array once with a HashSet. If adding a value fails, it was already there and I return true. That is O(n) time and O(n) space.',
  hook: 'Seen it before? Use a HashSet.',
  related: [
    { title: 'Valid Anagram', why: 'Also asks a "have I seen this?" question, but counts letters.' },
    { title: 'Two Sum', why: 'Replaces an inner search loop with one HashMap lookup.' },
  ],
  lookAlikes: [
    { title: 'Contains Duplicate II', why: 'Same idea, but only the last k numbers count. You will learn it with the sliding window in Module 5.' },
    { title: 'Find the Duplicate Number', why: 'No extra space is allowed, so a HashSet is not an option. You will learn the trick in Module 10.' },
  ],
  // JSON types are wider than ProblemSpec. The content check validates every field.
  spec: spec as unknown as ProblemSpec,
  starter,
};
```

- [ ] **Step 5: Write the lesson `brute-better-optimal.ts`**

```ts
import type { Lesson } from '../../../../src/content-types';

export const bruteBetterOptimal: Lesson = {
  id: 'brute-better-optimal',
  moduleId: 'foundations',
  title: 'Brute force, better, optimal',
  minutes: 10,
  summary: 'Start with the simple slow answer. Then find the work it repeats and remove it, one step at a time.',
  example: `<p>You get a list of numbers. Does any number appear twice?</p>
<ul><li>[3, 8, 1, 8] has a repeat. The number 8 appears twice.</li><li>[3, 8, 1, 5] has no repeat.</li></ul>
<p>The list can hold 100,000 numbers. How do you answer fast?</p>`,
  everyday: `<p>Think of a guard checking names at a party door.</p>
<p>The slow guard walks through the whole hall for every new guest and looks at every face. The fast guard keeps a guest list at the door. Each new name needs one look at the list.</p>`,
  steps: [
    { icon: '🐢', title: 'Write the brute force', text: 'Compare every pair of numbers. It is slow, but it is correct. It is your starting point.' },
    { icon: '🔢', title: 'Count its cost', text: '100,000 numbers make about 5 billion pairs. At 100 million steps a second, that takes about 50 seconds.' },
    { icon: '🔁', title: 'Find the repeated work', text: 'For each number, the inner loop searches the list again. That search is the work we keep repeating.' },
    { icon: '🚶', title: 'Make it better', text: 'Put the list in order first. Equal numbers then sit side by side, so one pass finds a repeat. You will learn sorting in Module 7.' },
    { icon: '🚀', title: 'Make it optimal', text: 'Keep a HashSet of numbers you have seen. Checking it takes about one step, so one pass is enough.' },
    { icon: '✅', title: 'Check the new cost', text: 'One pass over 100,000 numbers is 100,000 steps. That takes about one millisecond.' },
  ],
  viz: [
    { label: 'Brute force: compare every pair', traceId: 'contains-duplicate/brute', input: { nums: [3, 8, 1, 8] } },
    { label: 'Optimal: remember what you have seen', traceId: 'contains-duplicate/optimal', input: { nums: [3, 8, 1, 8] } },
  ],
  deep: `<h4>The numbers</h4>
<p>With n numbers there are n × (n − 1) ÷ 2 pairs. For n = 100,000 that is 100,000 × 99,999 ÷ 2, which is about 5,000,000,000 pairs.</p>
<p>Putting the list in order takes about n × log₂ n steps. You will learn why in Module 7. log₂ 100,000 is about 17, so that is about 1,700,000 steps. The HashSet way takes about 100,000 steps.</p>
<h4>Why a HashSet is fast</h4>
<p>A HashSet turns each value into a number called a hash code. The hash code says which bucket the value lives in. So it checks one bucket, not the whole list. This is O(1) on average. Many values can land in the same bucket, so the worst case is slower.</p>
<h4>Why O(n) is the best we can do</h4>
<p>The repeat might be the very last number. So any correct answer must look at every number at least once. That means O(n) time is the lower limit.</p>
<h4>The trade</h4>
<p>The HashSet saves time but uses O(n) extra memory. If memory is very tight, putting the list in order is the better choice.</p>`,
  spot: {
    size: 'n can be 100,000. About 5 billion pair checks are far too many. You need O(n log n) or O(n).',
    words: 'Words like "appears twice", "duplicate" or "seen before".',
    shape: 'One unsorted list. The order of the numbers does not change the answer.',
    bottleneck: 'An inner loop searches for an equal value again and again. A HashSet answers "have I seen it?" in about one step.',
  },
  traps: [
    {
      looksLike: '"Find the duplicate number", but you may not change the array or use extra memory.',
      butIs: 'A different trick that treats the values like links. You will learn it in Module 10.',
      why: 'A HashSet uses extra memory, so the rules forbid it.',
    },
    {
      looksLike: '"Are two equal numbers at most k places apart?"',
      butIs: 'The same HashSet idea, but you keep only the last k numbers. You will learn this as the sliding window in Module 5.',
      why: 'Numbers that are far apart do not count.',
    },
  ],
  template: {
    title: 'Seen before? Use a HashSet',
    java: `Set<Integer> seen = new HashSet<>();
for (int x : nums) {
    if (!seen.add(x)) {
        // x was already in the set
    }
}`,
  },
  complexityFacts: [
    { q: 'HashSet add or contains: how fast?', a: 'O(1) on average', why: 'It jumps straight to one bucket instead of searching.' },
    { q: 'Checking every pair of n numbers?', a: 'O(n²)', why: 'There are about n × n ÷ 2 pairs.' },
    { q: 'Putting n numbers in order with Arrays.sort?', a: 'O(n log n)', why: 'You will learn why in Module 7.' },
  ],
  realLife: [
    { text: 'A sign-up form checks if a username is taken. It looks in a set of names, not through every user one by one.', tier: 'educational' },
    { text: 'Java’s HashSet is backed by a hash table. Add and contains take constant time when the hash spreads values well.', tier: 'confirmed', source: 'Java SE API documentation, HashSet' },
  ],
  mistakes: [
    'Jumping to the clever answer without saying the brute force. Interviewers want to see your path.',
    'Putting the input array itself in order when the caller still needs it. Work on a copy instead.',
    'Saying a HashSet is always O(1). Say "O(1) on average", because many values in one bucket make it slower.',
  ],
  interview: [
    'Say the brute force and its Big-O first, in one or two sentences.',
    'Name the repeated work out loud. For example, "the inner loop searches the list again".',
    'State the trade. The HashSet saves time but uses O(n) extra memory.',
  ],
  quiz: [
    {
      q: 'What should you say first in an interview?',
      options: ['Only the optimal answer', 'The brute force and its Big-O', 'The Java syntax for HashSet', 'Nothing until the code is done'],
      answer: 1,
      why: 'The brute force shows you understand the problem. Its cost tells you how much faster you need to be.',
    },
    {
      q: 'The brute force compares every pair. What is the repeated work?',
      options: ['Reading the input', 'Searching the list again for each number', 'Printing the answer', 'Making the array'],
      answer: 1,
      why: 'For every number, the inner loop scans the list again. A HashSet replaces that scan with one look.',
    },
    {
      q: 'n is 100,000. Which cost is fast enough?',
      options: ['O(n²)', 'O(n³)', 'O(n)', 'O(2ⁿ)'],
      answer: 2,
      why: 'O(n) is about 100,000 steps. O(n²) is about 10 billion steps, which is far too slow.',
    },
  ],
  problemIds: ['contains-duplicate'],
};
```

- [ ] **Step 6: Write `module.ts`**

```ts
import type { Module } from '../../../src/content-types';

export const foundations: Module = {
  id: 'foundations',
  order: 1,
  level: 'basics',
  icon: '🧱',
  title: 'Foundations',
  summary: 'How to think about speed, how to read the limits, and how to turn a slow answer into a fast one.',
  status: 'building',
  outcomes: [
    'Write a brute force and say its Big-O.',
    'Find the work a slow answer repeats.',
    'Use a HashSet to answer "have I seen this before?" in about one step.',
  ],
  lessonIds: ['brute-better-optimal'],
  problemIds: ['contains-duplicate'],
  quiz: [],
  cheatsheet: [],
  glossary: [
    { term: 'Brute force', aka: [], def: 'The simplest correct answer. It usually checks every option, so it is often slow.' },
    { term: 'Big-O', aka: ['time complexity'], def: 'A way to say how the number of steps grows when the input grows.' },
    { term: 'HashSet', aka: [], def: 'A Java set that can add a value or check for it in about one step on average.' },
  ],
};
```

- [ ] **Step 7: Register the content in `content/index.ts`**

```ts
import type { ContentInput } from '../src/core/registry';
import { bruteBetterOptimal } from './modules/01-foundations/lessons/brute-better-optimal';
import { foundations } from './modules/01-foundations/module';
import { containsDuplicate } from './modules/01-foundations/problems/contains-duplicate/problem';
import { containsDuplicateBrute, containsDuplicateOptimal } from './modules/01-foundations/problems/contains-duplicate/trace';

export const contentInput: ContentInput = {
  modules: [foundations],
  lessons: [bruteBetterOptimal],
  problems: [containsDuplicate],
  traces: [containsDuplicateBrute, containsDuplicateOptimal],
};
```

- [ ] **Step 8: Write the trace correctness test**

`tests/content/traces.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { contentInput } from '../../content';
import { buildRegistry } from '../../src/core/registry';
import { parseMarkers } from '../../src/engine/markers';
import { compareValues } from '../../src/lab/compare';

const registry = buildRegistry(contentInput);

for (const problem of contentInput.problems) {
  for (const approach of problem.approaches) {
    if (!approach.traceId) continue;
    describe(`${problem.id} / ${approach.traceId}`, () => {
      const def = registry.trace(approach.traceId as string);
      const markers = parseMarkers(approach.java).lines;
      it('exists', () => expect(def).toBeDefined());
      for (const t of [...problem.spec.samples, ...problem.spec.hidden]) {
        it(`gives the expected answer for ${t.id}`, () => {
          const trace = def!.run(def!.fromArgs(t.args));
          expect(compareValues(problem.spec.compare, t.expected, trace.result)).toBe(true);
          expect(trace.steps.length).toBeLessThanOrEqual(def!.maxSteps);
          for (const s of trace.steps) expect(Object.keys(markers)).toContain(s.line);
        });
      }
    });
  }
}
```

- [ ] **Step 9: Write the real-content JDK test**

`tests/tools/verify-java.test.ts`:

```ts
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contentInput } from '../../content';
import { verifyProblemOnJdk } from '../../tools/verify-java';

describe('every reference solution passes on the JDK', () => {
  for (const problem of contentInput.problems) {
    it(problem.id, () => {
      const issues = verifyProblemOnJdk(problem, mkdtempSync(join(tmpdir(), 'dsa-verify-')));
      expect(issues.map((i) => `${i.approach} ${i.testId ?? ''}: ${i.message}`)).toEqual([]);
    });
  }
});
```

- [ ] **Step 10: Run every check and fix the content until it passes**

Run: `npm run typecheck && npm test && npm run check:content && npm run verify:java`
Expected:
- All pass.
- `check:content` prints no errors. Warnings are allowed, but read each one and shorten the sentence if you can.
- `verify:java` passes the fixture tests and `contains-duplicate`.

If the content check flags a sentence, **rewrite the content**, never the check. Keep the meaning and the simple wording.

**Checkpoint:** model content passes every automatic check.

---

### Task 21: End-to-end tests (routes, real Java runner, screenshots, reduced motion)

**Files:**
- Create: `tests/e2e/smoke.spec.ts`, `tests/e2e/lab.spec.ts`, `tests/e2e/solutions.spec.ts`, `tests/e2e/screens.spec.ts`
- Delete: nothing (`tests/e2e/boot.spec.ts` stays)

**Interfaces:**
- Consumes: `window.__dsa.routes` (Task 17), the test ids from Tasks 15 and 19, the `.player-count` text (Task 10).

- [ ] **Step 1: Write `tests/e2e/smoke.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

test('every route opens with no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const routes = await page.evaluate(() => window.__dsa?.routes ?? []);
  expect(routes.length).toBeGreaterThan(3);
  for (const r of routes) {
    await page.goto(`./${r}`);
    await expect(page.locator('main h1')).toBeVisible();
  }
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Write `tests/e2e/lab.spec.ts`**

```ts
import { expect, test, type Page } from '@playwright/test';

async function setCode(page: Page, code: string) {
  await page.locator('.cm-content').fill(code);
}

test.beforeEach(async ({ page }) => {
  await page.goto('./#/p/contains-duplicate');
});

test('the optimal solution passes every test in the browser', async ({ page }) => {
  await page.getByTestId('load-into-lab-optimal').click();
  await page.getByTestId('lab-submit').click();
  await expect(page.getByTestId('lab-status')).toContainText('All tests passed', { timeout: 90_000 });
});

test('a compile error shows its line', async ({ page }) => {
  await setCode(page, 'class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        int x = 1 +;\n        return false;\n    }\n}\n');
  await page.getByTestId('lab-run').click();
  await expect(page.getByTestId('lab-results')).toContainText('Line 3', { timeout: 90_000 });
});

test('an endless loop is stopped by the time limit', async ({ page }) => {
  await setCode(page, 'class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        while (true) { }\n    }\n}\n');
  await page.getByTestId('lab-run').click();
  await expect(page.getByTestId('lab-status')).toContainText('ran too long', { timeout: 90_000 });
  await expect(page.getByTestId('lab-results')).toContainText('Did not finish in time');
});

test('a wrong answer shows expected and got', async ({ page }) => {
  await setCode(page, 'class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        return false;\n    }\n}\n');
  await page.getByTestId('lab-run').click();
  const failing = page.locator('[data-testid="test-row"][data-pass="false"]').first();
  await expect(failing).toContainText('Expected', { timeout: 90_000 });
  await expect(failing).toContainText('true');
});
```

- [ ] **Step 3: Write `tests/e2e/solutions.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

test('every reference approach passes in the browser runner', async ({ page }) => {
  await page.goto('./');
  const problemRoutes = (await page.evaluate(() => window.__dsa?.routes ?? [])).filter((r) => r.startsWith('#/p/'));
  for (const r of problemRoutes) {
    await page.goto(`./${r}`);
    const levels = await page.locator('details.approach').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.level as string));
    for (const level of levels) {
      await page.getByTestId(`load-into-lab-${level}`).click();
      await page.getByTestId('lab-submit').click();
      await expect(page.getByTestId('lab-submit')).toBeEnabled({ timeout: 90_000 });
      const failing = await page.locator('[data-testid="test-row"][data-pass="false"]').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.kind));
      if (level === 'optimal') expect(failing, `${r} ${level}`).toEqual([]);
      else expect(failing.filter((k) => k !== 'speed'), `${r} ${level}`).toEqual([]);
    }
  }
});
```

- [ ] **Step 4: Write `tests/e2e/screens.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

const pages: [string, string][] = [['home', '#/'], ['lesson', '#/l/brute-better-optimal'], ['problem', '#/p/contains-duplicate']];

for (const theme of ['dark', 'light'] as const) {
  for (const width of [360, 1280]) {
    test(`screens ${theme} ${width}px have no sideways scroll`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((t) => {
        localStorage.setItem('dsa:v1', JSON.stringify({ version: 1, settings: { theme: t, updatedAt: 1 }, code: {} }));
      }, theme);
      for (const [name, route] of pages) {
        await page.goto(`./${route}`);
        await page.waitForTimeout(400);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${name} ${theme} ${width}`).toBeLessThanOrEqual(0);
        await page.screenshot({ path: `test-results/screens/${name}-${theme}-${width}.png`, fullPage: true });
      }
    });
  }
}

test('reduced motion: the dry run does not play by itself', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./#/l/brute-better-optimal');
  const count = page.locator('.player-count').first();
  await count.scrollIntoViewIfNeeded();
  await expect(count).toHaveText(/^Step 1 of/);
  await page.waitForTimeout(3500);
  await expect(count).toHaveText(/^Step 1 of/);
});

test('normal motion: the dry run plays when in view', async ({ page }) => {
  await page.goto('./#/l/brute-better-optimal');
  const count = page.locator('.player-count').first();
  await count.scrollIntoViewIfNeeded();
  await expect(count).not.toHaveText(/^Step 1 of/, { timeout: 5000 });
});
```

- [ ] **Step 5: Run the e2e suite and fix what fails**

Run: `npm run test:e2e`
Expected: all specs pass. Screenshots are written to `test-results/screens/` (12 files).

Common fixes:
- Sideways scroll at 360 px: make wide boxes scroll inside themselves (`overflow-x: auto` on `.player-stage`, `pre.code` and `.simple-table`). Never shrink text below readable size.
- TeaVM not loading: check `dist/runner/teavm/` exists after build, and that `assetBase` ends with `/dsa-playbook/runner/teavm/`.

- [ ] **Step 6: Look at every screenshot**

Open each file in `test-results/screens/`. Check that text is readable in both themes, that nothing overlaps, and that the pointer arrows sit under the right cells. Fix CSS if needed and re-run Step 5.

**Checkpoint:** the real Java runner, every route, both themes and both widths are verified.

---

### Task 22: CI/CD workflow, README, notices and owner review

**Files:**
- Create: `.github/workflows/ci.yml`, `README.md`, `THIRD_PARTY_NOTICES.md`

**Interfaces:**
- Consumes: npm scripts from Task 1, `scripts/fetch-teavm.mjs --check` (Task 14).

- [ ] **Step 1: Check the latest major versions of the GitHub Actions used**

Run:

```bash
for a in actions/checkout actions/setup-node actions/setup-java actions/upload-artifact actions/upload-pages-artifact actions/deploy-pages; do printf "%-32s" $a; gh api repos/$a/releases/latest --jq .tag_name; done
```

Use each action's latest **major** tag (for example `v5`) in the workflow below. Replace the versions shown if newer majors exist.

- [ ] **Step 2: Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  # Cancel old pull request runs, but never cancel a deploy from main halfway through.
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm
      - uses: actions/setup-java@v5
        with:
          distribution: temurin
          java-version: 21
      - run: npm ci
      - run: node scripts/fetch-teavm.mjs --check
      - run: npm run typecheck
      - run: npm run check:content
      - run: npm test
      - run: npm run verify:java
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
        env:
          CI: 'true'
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: screens
          path: test-results/screens
          if-no-files-found: ignore
      - uses: actions/upload-pages-artifact@v4
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        with:
          path: dist

  deploy:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: check
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Write `THIRD_PARTY_NOTICES.md`**

```markdown
# Third-party notices

DSA Playbook includes or loads the following software.

## TeaVM and teavm-javac (Java compiler in the browser)

- Files: `public/runner/teavm/*` (see `VERSION.json` for the source URL, date and SHA-256 hashes).
- TeaVM: Copyright konsoletyper and contributors. Licensed under the Apache License, Version 2.0. Source: https://github.com/konsoletyper/teavm
- teavm-javac: Copyright konsoletyper. Source files carry the Apache License 2.0 header. Source: https://github.com/konsoletyper/teavm-javac
- The compiler includes the Java compiler (javac) and class library from OpenJDK, licensed under the GNU General Public License, version 2, with the Classpath Exception. Source: https://github.com/openjdk/jdk

## CodeMirror and Lezer

- Copyright Marijn Haverbeke and others. MIT License. Source: https://github.com/codemirror

## Problem lists

- Problem selections follow the NeetCode 150 list (neetcode.io) and Striver's A2Z sheet (takeuforward.org). All explanations on this site are written for this site. Problem statements are summarized in our own words and link to the original.
```

- [ ] **Step 4: Write `README.md`**

```markdown
# 🧩 DSA Playbook

Learn data structures and algorithms by **spotting patterns**. Every lesson has a step-by-step dry run, and every problem has a Java lab that runs in your browser.

Live site: https://akashkumarchoudhary.github.io/dsa-playbook/

## What is inside (so far)

- Foundations: the model lesson "Brute force, better, optimal"
- Model problem: Contains Duplicate, with brute, better and optimal solutions, dry runs and a Java lab

## Run it locally

    npm install
    npm run dev          # http://localhost:5173/dsa-playbook/

## Checks

    npm run typecheck
    npm run check:content   # writing rules and structure
    npm test                # unit tests and dry-run correctness
    npm run verify:java     # every solution on a real JDK 21
    npm run test:e2e        # browser tests, including the in-browser Java runner

## How it is built

Vite + TypeScript, no UI framework. Content lives in `content/` as typed data and plain `.java` files. Java runs in the browser with TeaVM (see `THIRD_PARTY_NOTICES.md`). Read `CONTENT-RULES.md` before writing content and `AGENTS.md` before using an AI agent on this repo.

Design: `docs/superpowers/specs/2026-11-23-dsa-playbook-design.md`
```

- [ ] **Step 5: Run the full local CI**

Run: `npm run ci && node scripts/fetch-teavm.mjs --check`
Expected: every step passes.

- [ ] **Step 6: Owner review checkpoint (stop here)**

Report to the owner:
- What was built, and the pass counts from each check.
- The screenshot folder `test-results/screens/`.
- How to open the site: `npm run dev`, then `#/l/brute-better-optimal` and `#/p/contains-duplicate`.
- Two decisions the owner needs to make:
  1. **The commit plan** (how and when to commit). Nothing has been committed.
  2. **Turning on GitHub Pages for this repo.** This happens with the first push, using `gh api -X POST repos/AkashkumarChoudhary/dsa-playbook/pages -f build_type=workflow`. It is outward-facing, so only run it when the owner says so.

**Nothing in Part 1b starts until the owner approves the model lesson and the model problem in the browser.**
