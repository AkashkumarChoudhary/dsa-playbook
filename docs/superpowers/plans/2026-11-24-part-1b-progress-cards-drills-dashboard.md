# Part 1b: Progress, Flashcards, Drills and Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the whole-course catalog, the progress tracker, lesson and module quizzes, Leitner flashcards, Spot-It drills, mastery and fading, the Today page, the dashboard, the roadmap, sheet pages and settings (export and import), so a learner sees what is learned and what is left.

**Architecture:** A generated catalog (`content/catalog/`, `content/sheets/`) lists all 26 modules, 126 planned lessons, 107 patterns and 319 problems. The registry merges it with built content, so every page can show "built" or "coming in Part N". All progress lives in the existing `dsa:v1` store as new, validated records. Every rule (tracker, Leitner, decks, drills, mastery, dashboard numbers) is a pure function in `src/engine/` that takes `now` or a day key, and the pages only render and call `store.update` with the small actions in `src/engine/progress.ts`.

**Tech Stack:** Vite 8, TypeScript 7 (strict), Vitest 5 + happy-dom 21, Playwright 1.65 (local `channel: 'chrome'`), Node 24 (`scripts/*.mjs`), JDK 21 (CI), GitHub Actions + GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-23-dsa-playbook-design.md` (§5, §6, §7, §9, §11, §15) and the Part 1b addendum `docs/superpowers/specs/2026-11-24-part-1b-decisions.md` (D1 to D12). The addendum wins where they differ.

## Decisions beyond the spec

The addendum decides D1 to D12. Each one maps to tasks here:

| Item | What | Tasks |
|---|---|---|
| D1 | Catalog of modules, lessons, patterns, problems and sheets, generated problems file, registry merge | 1, 2, 3 |
| D2 | New store fields, `dayKey`, corrupt value backed up once, `pagehide` flush | 4, 5, 16 |
| D3 | Tracker: ticks, solved elsewhere, self-marked alone, reveal, Submit hook, re-solve schedule | 6, 10, 16 |
| D4 | Lesson open and quiz score, module quiz with scenarios, module progress, module drill button | 10, 15 |
| D5 | Card generation with stable ids, Leitner, decks, review page | 7, 8, 13, 18 |
| D6 | Drill items (hand-written and generated), sessions, drills page | 9, 13, 19 |
| D7 | `patternStatus`, `lessonDone`, `problemLevel`, `isMastered` | 11 |
| D8 | Dashboard math and page | 12, 20 |
| D9 | Today page | 17, 22 |
| D10 | Roadmap, sheets, settings, router, top nav, sidebar dots | 14, 17, 21, 22 |
| D11 | Content-check additions | 13 |
| D12 | Not built here: Size Reader, Pattern Finder, rest of Foundations, sync, viz and hubs | none |

Choices this plan makes where the spec and the addendum are silent:

1. **Foundations has no pattern of its own.** Its lessons teach ideas, not patterns. So "items from started modules" and "cards from started modules" use the item's or card's own `moduleId`. That makes the Foundations drills and cards work now.
2. **`ProblemProgress.openedAt?`** is one more added field. "Continue where you left off" needs the last opened problem.
3. **"I solved this elsewhere" counts as a solve** (spec §9.1). It starts the re-solve schedule. Pressing it again while a re-solve is due completes that step, so a learner who cannot use the lab is never stuck.
4. **A re-solve step is never due sooner than one day after the step before.** The steps stay at +3, +7 and +21 days from the first solve otherwise.
5. **"Was mastered" (for fading) comes from the drill log.** A pattern fades when some run of 10 drills had 8 or more right, its core problems and cards still pass, and then it goes 30 days without activity or the last 10 drills drop below 80%. The dashboard stays read-only.
6. **A problem's level is its highest tick.** Level 5 needs level 4 and every pattern of the problem mastered.
7. **Pace** uses lessons done plus problems solved in the last 14 days, divided by 14. Levels finish in order, so each finish day adds up the work of the levels before it. Fewer than 3 active days in the last 14 shows "Not enough data yet".
8. **A level with no patterns** (Interview) unlocks its milestone when all its lessons are done.
9. **Card id lock.** `content/card-ids.json` records each card id with the start of its front. The content check warns when an id disappears, starts to hold a different item, or is new. `npm run cards:lock` rewrites the file.
10. **Drill options.** Distractors come from patterns of modules up to 3 places after the item's module, falling back to all patterns. An item's weight is `1 + 2 × weakness`, where weakness is the share of the last 10 drills missed, or 0.5 with no drills yet.
11. **Generated interview items** show the problem statement plus its spot prompt, and the limits. The clue explanation joins the problem's spot clues.
12. **Module quiz results are not stored.** D2 has no field for them.
13. **`part` is a string**, so Foundations can say "coming in Part 1c".
14. **The content check also compares** a built problem's `moduleId`, `difficulty` and `core` with the catalog, and a built module's `order` and `level`.
15. **`normalize()` skips `__proto__` keys** in every record (Part 1a follow-up, in code this plan rewrites).
16. **New cards count as due today.** There is no daily cap on new cards yet.
17. **The registry builds cards and drill items lazily**, on first use, so small test fixtures can stay partial.
18. **The top nav is a second row of the header.** A CSS variable `--top-h` replaces the hard-coded `3.3rem` sidebar offset.
19. **A real-life card** shows the real-life text on the front and the pattern (or lesson) title plus the lesson summary on the back.
20. **The sidebar progress dot** per module is empty (not started), half (started) or full (every built lesson done and every built problem solved).

## Global Constraints

- Repo dir `/home/akashkumar/Documents/Learning/repos/dsa`, GitHub `AkashkumarChoudhary/dsa-playbook`, Pages base path **`/dsa-playbook/`**. Work happens on branch **`part-1b`**.
- **Git workflow (spec §15.2, addendum):** implementers never run `git commit` or `git push` (`AGENTS.md` rule 1). The controller commits once per task after its review passes, with `git add <the task's files>` and a message like `<type>(<scope>): <summary> (Part 1b Task N)` ending with the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Task 24 opens **one** pull request into `main`. Nobody merges it except the owner, after the browser review.
- TypeScript `strict: true`. No UI framework. No external images: emoji, CSS and inline SVG only.
- Hash routes only: `#/`, `#/dashboard`, `#/roadmap`, `#/m/:id`, `#/l/:id`, `#/p/:id`, `#/drills`, `#/drills/:moduleId`, `#/cards`, `#/cards/:deck`, `#/sheets/:sheetId`, `#/settings`.
- Works from a **360 px** phone to desktop, with no sideways page scroll. Dark and light themes, dark by default, following the system setting until the user picks one. **`prefers-reduced-motion`** means no movement and no autoplay.
- Animation: only slides, fades and color changes, `--dur: 300ms`. Same colors everywhere: current (blue), discarded (grey), range (yellow), answer (green), conflict (red). Pattern map: ⬜ not started, 🟦 learning, 🟨 practicing, 🟩 mastered, 🟧 fading.
- Every learner-facing string follows `CONTENT-RULES.md`:
  - Sentences of 20 words or fewer. More than 20 is a warning, more than 30 is an error.
  - **No em dashes (—) and no semicolons in prose.**
  - Plain words, with every new term explained the first time.
  - No topic used before it is taught unless the text says "you will learn".
- LocalStorage key `dsa:v1`. **Only add fields** to the stored state. Never rename or remove them. `normalize()` validates every field.
- Engines never call `Date.now()`. They take `now` (ms) or a local `today` day key from `dayKey(ms)`. Pages get the clock from `ctx.now` (default `Date.now`).
- **`AGENTS.md` rule 5: no lesson or problem id inside app code or CSS** (`src/`). App code must work for all content. Tests and `content/` may name ids.
- Ids never change once published. Ids are lowercase kebab-case. Catalog ids of unbuilt modules are drafts until that module's part starts.
- Keyboard use, visible focus, ARIA labels and AA contrast on every new control.
- Before a task reports done: `npm run typecheck`, `npm run check:catalog` (from Task 2 on), `npm run check:content`, `npm test` and `npm run verify:java`. UI tasks (15 to 23) also run `npm run test:e2e`.

---

## File structure

```
scripts/build-catalog.mjs                 parses docs/curriculum/problem-map.md, writes the problem catalog and sheet lists
content/
  catalog/modules.ts                      26 modules (hand-written)
  catalog/lessons.ts                      126 planned lessons (hand-written)
  catalog/patterns.ts                     107 patterns (hand-written)
  catalog/problems.ts                     319 problems (GENERATED)
  catalog/index.ts                        `catalog`
  sheets/neetcode150.ts, striver-bs.ts, striver-recursion.ts   ordered ids (GENERATED)
  sheets/index.ts                         sheet titles and credits
  drills/foundations.ts                   hand-written Spot-It items
  card-ids.json                           card id lock (written by npm run cards:lock)
  index.ts                                + catalog, drills
src/
  content-types.ts                        + CatalogModule, CatalogLesson, Pattern, CatalogProblem, Sheet, Catalog, DrillItem
  core/store.ts                           + lessons, problems, cards, drills, days; validation; corrupt value backed up once
  core/registry.ts                        + roadmap merge, lookups, lazy cards and drills
  core/router.ts                          + dashboard, roadmap, settings, drills, cards, sheets
  engine/days.ts                          dayKey, addDays, daysBetween, lastNDays, streak, formatDay
  engine/tracker.ts                       problem progress rules, re-solve schedule, levels 0 to 4
  engine/leitner.ts                       rateCard, isDue
  engine/cards.ts                         card generation, decks
  engine/drills.ts                        seeded RNG, generated items, sessions, accuracy
  engine/progress.ts                      store actions (open, quiz, submit, ticks, cards, drills)
  engine/mastery.ts                       lessonDone, isMastered, problemLevel, patternStatus
  engine/dashboard.ts                     computeDashboard
  engine/quiz.ts                          + mountScenarios
  lab/lab-view.ts                         + onSubmitResult, pagehide flush
  pages/lesson-page.ts                    + open, quiz score, retry
  pages/module-page.ts                    progress, module quiz, drill button
  pages/tracker.ts                        "Your progress" box
  pages/problem-page.ts                   + tracker, reveal, Submit hook, sheet credit
  pages/today.ts                          Today (and the first-visit intro)
  pages/roadmap-page.ts                   #/roadmap
  pages/sheet-page.ts                     #/sheets/:id
  pages/cards-page.ts                     #/cards and #/cards/:deck
  pages/drills-page.ts                    #/drills and #/drills/:moduleId
  pages/dashboard-page.ts                 #/dashboard
  pages/settings-page.ts                  #/settings
  pages/home.ts                           + start button
  pages/shell.ts                          + top nav, module dots
  pages/router-view.ts                    + every new route, ctx.now
  main.ts                                 store passed to the shell
  styles/progress.css                     tracker, tags, dots, module quiz, roadmap, sheets, today, settings
  styles/practice.css                     flashcards and drills
  styles/dashboard.css                    dashboard
tools/
  card-lock.ts                            card fingerprints
  content-check.ts                        + catalog, built-vs-catalog, drills, card ids
tests/
  unit/catalog/*.test.ts                  catalog shape and counts
  unit/engine/*.test.ts                   one file per engine
  unit/pages/*.test.ts                    one file per page
  tools/card-lock.test.ts                 writes the lock when CARDS_LOCK=write
  e2e/progress.spec.ts                    cards, drills, tracker, dashboard
```

---
### Task 1: Catalog types, modules, lessons and patterns

**Files:**
- Modify: `src/content-types.ts` (append the catalog and drill types at the end)
- Create: `content/catalog/modules.ts`, `content/catalog/lessons.ts`, `content/catalog/patterns.ts`
- Test: `tests/unit/catalog/catalog.test.ts`

**Interfaces:**
- Consumes: `Level`, `Difficulty` from `src/content-types.ts` (Part 1a).
- Produces (`src/content-types.ts`):
  - `type SheetId = 'neetcode150' | 'striver-bs' | 'striver-recursion'`
  - `interface CatalogModule { id: string; order: number; level: Level; icon: string; title: string; part: string }`
  - `interface CatalogLesson { id: string; moduleId: string; title: string; minutes: number; patternId?: string }`
  - `interface Pattern { id: string; moduleId: string; lessonId: string; title: string }`
  - `interface CatalogProblem { id: string; title: string; moduleId: string; difficulty: Difficulty; patternIds: string[]; sheets: SheetId[]; url: string; lc?: number; core: boolean }`
  - `interface Sheet { id: SheetId; title: string; credit: string; problemIds: string[] }`
  - `interface Catalog { modules: CatalogModule[]; lessons: CatalogLesson[]; patterns: Pattern[]; problems: CatalogProblem[]; sheets: Sheet[] }`
  - `type DrillKind = 'interview' | 'lookalike' | 'reallife'`
  - `interface DrillItem { id: string; kind: DrillKind; prompt: string /* trusted HTML */; limits?: string[]; acceptedPatternIds: string[]; clueExplanation: string; moduleId: string }`
- Produces (content): `catalogModules: CatalogModule[]` (26), `catalogLessons: CatalogLesson[]` (126), `catalogPatterns: Pattern[]` (107). Pattern ids used by Task 2's mapping table are exactly the ids in `patterns.ts`.

The lessons follow each module's "Teaches" line in `docs/curriculum/problem-map.md`. Foundations uses the spec §5 draft list, and `brute-better-optimal` keeps its built 10 minutes. The `hashing` pattern keeps its id (used by `contains-duplicate`) and belongs to the `hashset-seen-before` lesson.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/catalog/catalog.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { catalogLessons } from '../../../content/catalog/lessons';
import { catalogModules } from '../../../content/catalog/modules';
import { catalogPatterns } from '../../../content/catalog/patterns';

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const unique = (ids: string[]) => new Set(ids).size === ids.length;

describe('catalog modules, lessons and patterns', () => {
  it('has the 26 modules of spec §5 in order', () => {
    expect(catalogModules).toHaveLength(26);
    expect(catalogModules.map((m) => m.order)).toEqual(Array.from({ length: 26 }, (_, i) => i + 1));
    expect(unique(catalogModules.map((m) => m.id))).toBe(true);
    for (const m of catalogModules) expect(m.id).toMatch(KEBAB);
    const levels = catalogModules.map((m) => m.level);
    expect(levels.filter((l) => l === 'basics')).toHaveLength(7);
    expect(levels.filter((l) => l === 'core')).toHaveLength(7);
    expect(levels.filter((l) => l === 'hard')).toHaveLength(6);
    expect(levels.filter((l) => l === 'advanced')).toHaveLength(5);
    expect(levels.filter((l) => l === 'interview')).toHaveLength(1);
  });

  it('starts Foundations with the spec §5 draft lessons', () => {
    expect(catalogLessons.filter((l) => l.moduleId === 'foundations').map((l) => l.id)).toEqual([
      'what-is-dsa', 'big-o-time', 'big-o-space', 'reading-limits', 'java-toolkit', 'how-to-dry-run', 'brute-better-optimal', 'edge-cases', 'interview-script',
    ]);
  });

  it('gives every module lessons with kebab ids and sensible minutes', () => {
    expect(catalogLessons).toHaveLength(126);
    expect(unique(catalogLessons.map((l) => l.id))).toBe(true);
    for (const l of catalogLessons) {
      expect(l.id).toMatch(KEBAB);
      expect(catalogModules.some((m) => m.id === l.moduleId), l.id).toBe(true);
      expect(l.minutes, l.id).toBeGreaterThanOrEqual(10);
      expect(l.minutes, l.id).toBeLessThanOrEqual(30);
    }
    for (const m of catalogModules) expect(catalogLessons.some((l) => l.moduleId === m.id), m.id).toBe(true);
  });

  it('links each pattern to exactly one lesson in the same module, and back', () => {
    expect(catalogPatterns).toHaveLength(107);
    expect(unique(catalogPatterns.map((p) => p.id))).toBe(true);
    expect(catalogPatterns.find((p) => p.id === 'hashing')).toMatchObject({ moduleId: 'hashing', lessonId: 'hashset-seen-before' });
    for (const p of catalogPatterns) {
      expect(p.id).toMatch(KEBAB);
      const lesson = catalogLessons.find((l) => l.id === p.lessonId);
      expect(lesson?.patternId, p.id).toBe(p.id);
      expect(lesson?.moduleId, p.id).toBe(p.moduleId);
    }
    for (const l of catalogLessons.filter((x) => x.patternId)) {
      expect(catalogPatterns.filter((p) => p.lessonId === l.id), l.id).toHaveLength(1);
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/catalog/catalog.test.ts`
Expected: FAIL, because `content/catalog/lessons.ts` and the other catalog files do not exist yet.

- [ ] **Step 3: Append the types to `src/content-types.ts`**

Add this at the end of the file:

```ts

/* ---------- Part 1b: the catalog of planned content, and drills ---------- */

export type SheetId = 'neetcode150' | 'striver-bs' | 'striver-recursion';

/** One of the 26 modules in spec §5, built or not. */
export interface CatalogModule {
  id: string;
  order: number;
  level: Level;
  icon: string;
  title: string;
  /** the build part that adds this module's content, shown as "coming in Part N" */
  part: string;
}

/** A planned lesson. Ids are drafts until the module's part starts (spec §5). */
export interface CatalogLesson {
  id: string;
  moduleId: string;
  title: string;
  minutes: number;
  /** set on pattern lessons: the pattern this lesson teaches */
  patternId?: string;
}

/** A pattern is what mastery is measured on (spec §11.2). */
export interface Pattern {
  id: string;
  moduleId: string;
  lessonId: string;
  title: string;
}

/** One row of docs/curriculum/problem-map.md. Generated by scripts/build-catalog.mjs. */
export interface CatalogProblem {
  id: string;
  title: string;
  moduleId: string;
  difficulty: Difficulty;
  patternIds: string[];
  sheets: SheetId[];
  url: string;
  /** LeetCode number, when the problem is on LeetCode */
  lc?: number;
  core: boolean;
}

export interface Sheet {
  id: SheetId;
  title: string;
  /** who made the list, shown on the sheet page */
  credit: string;
  /** problem ids in the sheet's own order */
  problemIds: string[];
}

export interface Catalog {
  modules: CatalogModule[];
  lessons: CatalogLesson[];
  patterns: Pattern[];
  problems: CatalogProblem[];
  sheets: Sheet[];
}

export type DrillKind = 'interview' | 'lookalike' | 'reallife';

/** A Spot-It drill question (spec §6.2, §11.2). */
export interface DrillItem {
  id: string;
  kind: DrillKind;
  /** trusted HTML, like problem.statement */
  prompt: string;
  limits?: string[];
  acceptedPatternIds: string[];
  clueExplanation: string;
  moduleId: string;
}
```

- [ ] **Step 4: Create `content/catalog/modules.ts`**

```ts
import type { CatalogModule } from '../../src/content-types';

/** All 26 modules from spec §5. `part` is the build part from spec §15 and the problem map. */
export const catalogModules: CatalogModule[] = [
  { id: 'foundations', order: 1, level: 'basics', icon: '🧱', title: 'Foundations', part: '1c' },
  { id: 'arrays-strings', order: 2, level: 'basics', icon: '📦', title: 'Arrays & Strings', part: '2' },
  { id: 'hashing', order: 3, level: 'basics', icon: '#️⃣', title: 'Hashing', part: '2' },
  { id: 'two-pointers', order: 4, level: 'basics', icon: '👉', title: 'Two Pointers', part: '3' },
  { id: 'sliding-window', order: 5, level: 'basics', icon: '🪟', title: 'Sliding Window', part: '3' },
  { id: 'recursion-basics', order: 6, level: 'basics', icon: '🔁', title: 'Recursion Basics', part: '4' },
  { id: 'sorting', order: 7, level: 'basics', icon: '🔀', title: 'Sorting', part: '4' },
  { id: 'binary-search', order: 8, level: 'core', icon: '🔎', title: 'Binary Search', part: '5' },
  { id: 'stack-queue', order: 9, level: 'core', icon: '📚', title: 'Stack & Queue', part: '5' },
  { id: 'linked-list', order: 10, level: 'core', icon: '🔗', title: 'Linked List', part: '6' },
  { id: 'backtracking', order: 11, level: 'core', icon: '🧭', title: 'Backtracking', part: '6' },
  { id: 'trees', order: 12, level: 'core', icon: '🌳', title: 'Trees', part: '7' },
  { id: 'heap', order: 13, level: 'core', icon: '⛰️', title: 'Heap', part: '7' },
  { id: 'tries', order: 14, level: 'core', icon: '🔤', title: 'Tries', part: '7' },
  { id: 'graphs', order: 15, level: 'hard', icon: '🕸️', title: 'Graphs', part: '8' },
  { id: 'advanced-graphs', order: 16, level: 'hard', icon: '🗺️', title: 'Advanced Graphs', part: '8' },
  { id: 'dp-1d', order: 17, level: 'hard', icon: '🧮', title: '1-D DP', part: '9' },
  { id: 'dp-2d', order: 18, level: 'hard', icon: '🔢', title: '2-D DP', part: '9' },
  { id: 'greedy-intervals', order: 19, level: 'hard', icon: '💰', title: 'Greedy & Intervals', part: '10' },
  { id: 'bits-math', order: 20, level: 'hard', icon: '➗', title: 'Bits & Math', part: '10' },
  { id: 'range-queries', order: 21, level: 'advanced', icon: '📊', title: 'Range Queries', part: '11' },
  { id: 'string-algorithms', order: 22, level: 'advanced', icon: '🧵', title: 'String Algorithms', part: '11' },
  { id: 'advanced-dp', order: 23, level: 'advanced', icon: '🧠', title: 'Advanced DP', part: '12' },
  { id: 'graph-algorithms-2', order: 24, level: 'advanced', icon: '🌐', title: 'Graph Algorithms II', part: '12' },
  { id: 'more-patterns', order: 25, level: 'advanced', icon: '🧰', title: 'More Patterns', part: '13' },
  { id: 'interview-meta', order: 26, level: 'interview', icon: '🎤', title: 'Interview & Meta', part: '14' },
];
```

- [ ] **Step 5: Create `content/catalog/lessons.ts`**

```ts
import type { CatalogLesson } from '../../src/content-types';

const L = (moduleId: string, id: string, title: string, minutes: number, patternId?: string): CatalogLesson =>
  patternId ? { id, moduleId, title, minutes, patternId } : { id, moduleId, title, minutes };

/**
 * Every planned lesson, module by module. Pattern lessons name their pattern.
 * Ids are drafts until the module's part starts (spec §5). Once a lesson is built, its id never changes.
 */
export const catalogLessons: CatalogLesson[] = [
  // M1 Foundations: the draft list from spec §5
  L('foundations', 'what-is-dsa', 'What DSA is and why it helps', 10),
  L('foundations', 'big-o-time', 'Big-O for time', 20),
  L('foundations', 'big-o-space', 'Big-O for memory', 15),
  L('foundations', 'reading-limits', 'Read the limits first', 15),
  L('foundations', 'java-toolkit', 'Your Java toolkit and what each part costs', 25),
  L('foundations', 'how-to-dry-run', 'How to dry run code', 15),
  L('foundations', 'brute-better-optimal', 'Brute force, better, optimal', 10),
  L('foundations', 'edge-cases', 'Find the edge cases', 15),
  L('foundations', 'interview-script', 'The interview script', 15),

  // M2 Arrays & Strings
  L('arrays-strings', 'in-place-array-moves', 'Change an array in place', 20, 'in-place-array'),
  L('arrays-strings', 'running-value', 'Keep a running value in one pass', 15, 'running-value'),
  L('arrays-strings', 'prefix-sums', 'Prefix sums', 20, 'prefix-sum'),
  L('arrays-strings', 'kadane', 'Kadane: the best subarray sum', 20, 'kadane'),
  L('arrays-strings', 'grid-walks', 'Walk a 2-D grid', 20, 'grid-walk'),
  L('arrays-strings', 'strings-stringbuilder', 'Strings and StringBuilder', 15, 'string-building'),

  // M3 Hashing
  L('hashing', 'hashset-seen-before', 'HashSet: have I seen it?', 20, 'hashing'),
  L('hashing', 'hashmap-counting', 'HashMap: count things', 20, 'counting'),
  L('hashing', 'hashmap-partner', 'HashMap: find the partner', 20, 'partner-lookup'),
  L('hashing', 'group-by-key', 'Group things by a key', 15, 'group-by-key'),
  L('hashing', 'prefix-sum-hashmap', 'Prefix sum + HashMap', 25, 'prefix-sum-map'),

  // M4 Two Pointers
  L('two-pointers', 'pointers-from-both-ends', 'Two pointers from both ends', 20, 'opposite-pointers'),
  L('two-pointers', 'pointers-same-way', 'Two pointers going the same way', 20, 'same-direction-pointers'),
  L('two-pointers', 'expand-from-center', 'Expand from the center', 20, 'expand-center'),

  // M5 Sliding Window
  L('sliding-window', 'fixed-window', 'A window of fixed size', 20, 'fixed-window'),
  L('sliding-window', 'grow-shrink-window', 'A window that grows and shrinks', 25, 'variable-window'),
  L('sliding-window', 'exactly-k-trick', 'Exactly K with two windows', 15, 'exactly-k-window'),

  // M6 Recursion Basics
  L('recursion-basics', 'base-case-call-stack', 'Base case and the call stack', 20, 'base-case-recursion'),
  L('recursion-basics', 'pass-down-or-return-up', 'Pass it down or return it up', 15),
  L('recursion-basics', 'recursion-trees', 'Recursion trees', 20, 'recursion-tree'),
  L('recursion-basics', 'pick-not-pick', 'Pick or not pick', 25, 'pick-not-pick'),

  // M7 Sorting
  L('sorting', 'simple-sorts', 'Bubble, selection and insertion sort', 20),
  L('sorting', 'merge-sort', 'Merge sort', 25, 'merge-sort'),
  L('sorting', 'quick-sort-partition', 'Quick sort and partition', 25, 'partition'),
  L('sorting', 'custom-sort-order', 'Sort in your own order', 15, 'custom-order'),
  L('sorting', 'sort-then-scan', 'Sort first, then scan', 20, 'sort-then-scan'),

  // M8 Binary Search
  L('binary-search', 'binary-search-basics', 'Binary search: halve the range', 20, 'binary-search'),
  L('binary-search', 'first-or-last-true', 'First or last true (lower and upper bound)', 25, 'bounds-search'),
  L('binary-search', 'rotated-arrays', 'Search a rotated array', 20, 'rotated-search'),
  L('binary-search', 'search-on-answer', 'Binary search on the answer', 25, 'answer-search'),
  L('binary-search', 'sorted-grid-search', 'Search a sorted grid', 20, 'grid-search'),
  L('binary-search', 'two-arrays-cut', 'Binary search the cut in two arrays', 25, 'cut-search'),

  // M9 Stack & Queue
  L('stack-queue', 'stack-matching', 'Stacks for matching pairs', 20, 'stack-matching'),
  L('stack-queue', 'stack-process-undo', 'Stacks to process and undo', 20, 'stack-process'),
  L('stack-queue', 'queues', 'Queues: first in, first out', 15, 'queue'),
  L('stack-queue', 'monotonic-stack', 'Monotonic stack: next greater or smaller', 25, 'monotonic-stack'),

  // M10 Linked List
  L('linked-list', 'linked-list-basics', 'What a linked list is', 15),
  L('linked-list', 'reverse-a-list', 'Reverse a list in place', 20, 'list-reverse'),
  L('linked-list', 'dummy-head-merge', 'Dummy head and merging', 20, 'dummy-head'),
  L('linked-list', 'fast-slow-pointers', 'Fast, slow and gap pointers', 25, 'list-pointers'),
  L('linked-list', 'list-plus-hashmap', 'Lists plus a HashMap', 25, 'list-design'),

  // M11 Backtracking
  L('backtracking', 'choose-explore-undo', 'Choose, explore, undo', 25, 'backtracking'),
  L('backtracking', 'prune-and-skip', 'Prune paths and skip duplicates', 25, 'prune-dedupe'),
  L('backtracking', 'build-permutations', 'Build permutations', 20, 'permutations'),
  L('backtracking', 'boards-and-grids', 'Fill boards and walk grids', 25, 'board-backtracking'),

  // M12 Trees
  L('trees', 'tree-walks', 'Tree walks: pre, in and post order', 25, 'tree-dfs'),
  L('trees', 'answers-from-children', 'Answers from the children', 25, 'bottom-up-tree'),
  L('trees', 'level-by-level', 'Level by level (BFS)', 20, 'tree-bfs'),
  L('trees', 'tree-views', 'Tree views and columns', 20, 'tree-views'),
  L('trees', 'build-trees', 'Build and save trees', 20, 'tree-build'),
  L('trees', 'bst-rules', 'Binary search tree rules', 25, 'bst'),

  // M13 Heap
  L('heap', 'heap-basics', 'How a heap works', 15),
  L('heap', 'top-k-heap', 'Top K with a heap', 20, 'top-k'),
  L('heap', 'k-way-merge', 'Merge K sorted lists', 20, 'k-way-merge'),
  L('heap', 'two-heaps', 'Two heaps for the median', 20, 'two-heaps'),
  L('heap', 'best-item-now', 'Take the best item now', 20, 'best-now'),

  // M14 Tries
  L('tries', 'trie-basics', 'Build a trie', 25, 'trie'),
  L('tries', 'trie-with-dfs', 'Search a trie with DFS', 20, 'trie-dfs'),

  // M15 Graphs
  L('graphs', 'graph-basics', 'Graphs: nodes and edges', 20),
  L('graphs', 'graph-dfs', 'Depth-first search (DFS)', 25, 'graph-dfs'),
  L('graphs', 'graph-bfs', 'Breadth-first search (BFS)', 25, 'graph-bfs'),
  L('graphs', 'multi-source-bfs', 'BFS from many starts', 20, 'multi-source-bfs'),
  L('graphs', 'topological-sort', 'Order with prerequisites', 25, 'topo-sort'),
  L('graphs', 'union-find', 'Union-Find groups', 25, 'union-find'),

  // M16 Advanced Graphs
  L('advanced-graphs', 'dijkstra', 'Dijkstra: shortest paths', 25, 'dijkstra'),
  L('advanced-graphs', 'bellman-ford', 'Bellman-Ford and limited stops', 20, 'bellman-ford'),
  L('advanced-graphs', 'floyd-warshall', 'All pairs with Floyd-Warshall', 20, 'floyd-warshall'),
  L('advanced-graphs', 'minimum-spanning-tree', 'Minimum spanning trees', 25, 'mst'),

  // M17 1-D DP
  L('dp-1d', 'memo-and-table', 'From recursion to memo to table', 25, 'step-dp'),
  L('dp-1d', 'take-or-skip', 'Take it or skip it', 20, 'take-or-skip'),
  L('dp-1d', 'amount-dp', 'The best way to make an amount', 25, 'amount-dp'),
  L('dp-1d', 'split-a-string-dp', 'Can this prefix be split?', 20, 'split-dp'),
  L('dp-1d', 'longest-increasing', 'Longest increasing subsequence', 25, 'lis'),

  // M18 2-D DP
  L('dp-2d', 'grid-dp', 'DP on a grid', 20, 'grid-dp'),
  L('dp-2d', 'knapsack-01', '0/1 knapsack', 25, 'knapsack'),
  L('dp-2d', 'unbounded-knapsack', 'Unbounded knapsack', 20, 'unbounded-knapsack'),
  L('dp-2d', 'two-string-dp', 'Two strings: the LCS family', 25, 'two-string-dp'),
  L('dp-2d', 'stock-states', 'States: the stock problems', 20, 'state-dp'),

  // M19 Greedy & Intervals
  L('greedy-intervals', 'greedy-choice', 'Make the best choice now', 25, 'greedy'),
  L('greedy-intervals', 'farthest-reach', 'Track the farthest reach', 20, 'reach'),
  L('greedy-intervals', 'merge-intervals', 'Sort and merge intervals', 20, 'merge-intervals'),
  L('greedy-intervals', 'earliest-end-first', 'Keep the earliest end', 20, 'interval-scheduling'),
  L('greedy-intervals', 'count-overlaps', 'Count overlaps with starts and ends', 20, 'overlap-count'),

  // M20 Bits & Math
  L('bits-math', 'digit-math', 'Work with digits', 20, 'digit-math'),
  L('bits-math', 'gcd-and-primes', 'GCD and primes', 20, 'number-theory'),
  L('bits-math', 'fast-power', 'Fast power', 15, 'fast-power'),
  L('bits-math', 'bit-basics', 'Bits, masks and shifts', 25, 'bit-tricks'),
  L('bits-math', 'xor-tricks', 'XOR tricks', 20, 'xor'),

  // M21 Range Queries
  L('range-queries', 'segment-tree', 'Segment trees', 30, 'segment-tree'),
  L('range-queries', 'lazy-updates', 'Range updates with lazy marks', 25),
  L('range-queries', 'fenwick-tree', 'Fenwick trees', 25, 'fenwick-tree'),
  L('range-queries', 'sparse-table', 'Sparse tables', 20, 'sparse-table'),

  // M22 String Algorithms
  L('string-algorithms', 'kmp', 'KMP and the prefix function', 30, 'kmp'),
  L('string-algorithms', 'z-function', 'The Z-function', 20, 'z-function'),
  L('string-algorithms', 'rolling-hash', 'Rolling hash (Rabin-Karp)', 25, 'rolling-hash'),
  L('string-algorithms', 'manacher', 'Manacher: every palindrome fast', 25, 'manacher'),

  // M23 Advanced DP
  L('advanced-dp', 'lis-fast', 'LIS with binary search', 20, 'lis-fast'),
  L('advanced-dp', 'interval-dp', 'Interval DP: try every split', 30, 'interval-dp'),
  L('advanced-dp', 'tree-dp', 'DP on trees', 25, 'tree-dp'),
  L('advanced-dp', 'bitmask-dp', 'Bitmask DP', 25, 'bitmask-dp'),
  L('advanced-dp', 'digit-dp', 'Digit DP', 25, 'digit-dp'),

  // M24 Graph Algorithms II
  L('graph-algorithms-2', 'two-color-graph', 'Two-color a graph', 20, 'bipartite'),
  L('graph-algorithms-2', 'zero-one-bfs', '0-1 BFS with a deque', 20, 'zero-one-bfs'),
  L('graph-algorithms-2', 'bridges-cut-points', 'Bridges and cut points', 30, 'bridges'),
  L('graph-algorithms-2', 'strongly-connected', 'Strongly connected parts', 25, 'scc'),
  L('graph-algorithms-2', 'euler-path', 'Euler paths', 25, 'euler-path'),

  // M25 More Patterns
  L('more-patterns', 'monotonic-deque', 'Monotonic deque', 25, 'monotonic-deque'),
  L('more-patterns', 'treemap', 'Ordered maps with TreeMap', 20, 'treemap'),
  L('more-patterns', 'sweep-line', 'Sweep line', 25, 'sweep-line'),
  L('more-patterns', 'reservoir-sampling', 'Reservoir sampling', 15, 'reservoir'),
  L('more-patterns', 'meet-in-the-middle', 'Meet in the middle', 25, 'meet-middle'),
  L('more-patterns', 'quickselect', 'Quickselect', 20, 'quickselect'),
  L('more-patterns', 'morris-traversal', 'Morris traversal', 20, 'morris'),

  // M26 Interview & Meta
  L('interview-meta', 'full-interview-script', 'The full interview script', 20),
  L('interview-meta', 'think-out-loud', 'Think out loud', 15),
  L('interview-meta', 'choose-a-pattern', 'Choose a pattern with the clues', 20),
  L('interview-meta', 'mock-rounds', 'How mock rounds work', 15),
];
```

- [ ] **Step 6: Create `content/catalog/patterns.ts`**

```ts
import type { Pattern } from '../../src/content-types';

const P = (moduleId: string, lessonId: string, id: string, title: string): Pattern => ({ id, moduleId, lessonId, title });

/** Every pattern. Each one has exactly one lesson that teaches it. Mastery is measured per pattern (spec §9.3). */
export const catalogPatterns: Pattern[] = [
  P('arrays-strings', 'in-place-array-moves', 'in-place-array', 'Change the array in place'),
  P('arrays-strings', 'running-value', 'running-value', 'One pass with a running value'),
  P('arrays-strings', 'prefix-sums', 'prefix-sum', 'Prefix sums'),
  P('arrays-strings', 'kadane', 'kadane', 'Kadane: best subarray'),
  P('arrays-strings', 'grid-walks', 'grid-walk', 'Walk a 2-D grid'),
  P('arrays-strings', 'strings-stringbuilder', 'string-building', 'Build strings with StringBuilder'),

  P('hashing', 'hashset-seen-before', 'hashing', 'HashSet: seen it before?'),
  P('hashing', 'hashmap-counting', 'counting', 'Count with a HashMap'),
  P('hashing', 'hashmap-partner', 'partner-lookup', 'Find the partner with a HashMap'),
  P('hashing', 'group-by-key', 'group-by-key', 'Group by a key'),
  P('hashing', 'prefix-sum-hashmap', 'prefix-sum-map', 'Prefix sum + HashMap'),

  P('two-pointers', 'pointers-from-both-ends', 'opposite-pointers', 'Two pointers from both ends'),
  P('two-pointers', 'pointers-same-way', 'same-direction-pointers', 'Two pointers going the same way'),
  P('two-pointers', 'expand-from-center', 'expand-center', 'Expand from the center'),

  P('sliding-window', 'fixed-window', 'fixed-window', 'Fixed-size sliding window'),
  P('sliding-window', 'grow-shrink-window', 'variable-window', 'Window that grows and shrinks'),
  P('sliding-window', 'exactly-k-trick', 'exactly-k-window', 'Exactly K with two windows'),

  P('recursion-basics', 'base-case-call-stack', 'base-case-recursion', 'Recursion: base case + smaller call'),
  P('recursion-basics', 'recursion-trees', 'recursion-tree', 'Recursion tree'),
  P('recursion-basics', 'pick-not-pick', 'pick-not-pick', 'Pick or not pick'),

  P('sorting', 'merge-sort', 'merge-sort', 'Merge sort: split and merge'),
  P('sorting', 'quick-sort-partition', 'partition', 'Partition around a pivot'),
  P('sorting', 'custom-sort-order', 'custom-order', 'Sort in a custom order'),
  P('sorting', 'sort-then-scan', 'sort-then-scan', 'Sort first, then scan'),

  P('binary-search', 'binary-search-basics', 'binary-search', 'Binary search for a value'),
  P('binary-search', 'first-or-last-true', 'bounds-search', 'First or last true (bounds)'),
  P('binary-search', 'rotated-arrays', 'rotated-search', 'Search a rotated array'),
  P('binary-search', 'search-on-answer', 'answer-search', 'Binary search on the answer'),
  P('binary-search', 'sorted-grid-search', 'grid-search', 'Search a sorted grid'),
  P('binary-search', 'two-arrays-cut', 'cut-search', 'Binary search the cut'),

  P('stack-queue', 'stack-matching', 'stack-matching', 'Stack for matching pairs'),
  P('stack-queue', 'stack-process-undo', 'stack-process', 'Stack to process and undo'),
  P('stack-queue', 'queues', 'queue', 'Queue: first in, first out'),
  P('stack-queue', 'monotonic-stack', 'monotonic-stack', 'Monotonic stack'),

  P('linked-list', 'reverse-a-list', 'list-reverse', 'Reverse links in place'),
  P('linked-list', 'dummy-head-merge', 'dummy-head', 'Dummy head and merge'),
  P('linked-list', 'fast-slow-pointers', 'list-pointers', 'Fast, slow and gap pointers'),
  P('linked-list', 'list-plus-hashmap', 'list-design', 'List + HashMap design'),

  P('backtracking', 'choose-explore-undo', 'backtracking', 'Choose, explore, undo'),
  P('backtracking', 'prune-and-skip', 'prune-dedupe', 'Prune and skip duplicates'),
  P('backtracking', 'build-permutations', 'permutations', 'Build permutations'),
  P('backtracking', 'boards-and-grids', 'board-backtracking', 'Backtrack on a board or grid'),

  P('trees', 'tree-walks', 'tree-dfs', 'Tree DFS: pre, in, post order'),
  P('trees', 'answers-from-children', 'bottom-up-tree', 'Answer from the children'),
  P('trees', 'level-by-level', 'tree-bfs', 'Tree BFS by level'),
  P('trees', 'tree-views', 'tree-views', 'Tree views and columns'),
  P('trees', 'build-trees', 'tree-build', 'Build a tree from walks'),
  P('trees', 'bst-rules', 'bst', 'BST rules'),

  P('heap', 'top-k-heap', 'top-k', 'Top K with a heap'),
  P('heap', 'k-way-merge', 'k-way-merge', 'K-way merge with a heap'),
  P('heap', 'two-heaps', 'two-heaps', 'Two heaps for a median'),
  P('heap', 'best-item-now', 'best-now', 'Take the best item now'),

  P('tries', 'trie-basics', 'trie', 'Trie: a prefix tree'),
  P('tries', 'trie-with-dfs', 'trie-dfs', 'Trie + DFS search'),

  P('graphs', 'graph-dfs', 'graph-dfs', 'Graph DFS'),
  P('graphs', 'graph-bfs', 'graph-bfs', 'Graph BFS: fewest steps'),
  P('graphs', 'multi-source-bfs', 'multi-source-bfs', 'BFS from many starts'),
  P('graphs', 'topological-sort', 'topo-sort', 'Topological sort'),
  P('graphs', 'union-find', 'union-find', 'Union-Find'),

  P('advanced-graphs', 'dijkstra', 'dijkstra', 'Dijkstra'),
  P('advanced-graphs', 'bellman-ford', 'bellman-ford', 'Bellman-Ford'),
  P('advanced-graphs', 'floyd-warshall', 'floyd-warshall', 'Floyd-Warshall'),
  P('advanced-graphs', 'minimum-spanning-tree', 'mst', 'Minimum spanning tree'),

  P('dp-1d', 'memo-and-table', 'step-dp', 'DP on steps (like Fibonacci)'),
  P('dp-1d', 'take-or-skip', 'take-or-skip', 'Take it or skip it'),
  P('dp-1d', 'amount-dp', 'amount-dp', 'DP over amounts'),
  P('dp-1d', 'split-a-string-dp', 'split-dp', 'Split a string with DP'),
  P('dp-1d', 'longest-increasing', 'lis', 'Longest increasing subsequence'),

  P('dp-2d', 'grid-dp', 'grid-dp', 'Grid DP'),
  P('dp-2d', 'knapsack-01', 'knapsack', '0/1 knapsack'),
  P('dp-2d', 'unbounded-knapsack', 'unbounded-knapsack', 'Unbounded knapsack'),
  P('dp-2d', 'two-string-dp', 'two-string-dp', 'Two-string DP (LCS family)'),
  P('dp-2d', 'stock-states', 'state-dp', 'State machine DP'),

  P('greedy-intervals', 'greedy-choice', 'greedy', 'Best choice now (greedy)'),
  P('greedy-intervals', 'farthest-reach', 'reach', 'Farthest reach'),
  P('greedy-intervals', 'merge-intervals', 'merge-intervals', 'Sort and merge intervals'),
  P('greedy-intervals', 'earliest-end-first', 'interval-scheduling', 'Keep the earliest end'),
  P('greedy-intervals', 'count-overlaps', 'overlap-count', 'Count overlaps'),

  P('bits-math', 'digit-math', 'digit-math', 'Digit math'),
  P('bits-math', 'gcd-and-primes', 'number-theory', 'GCD and primes'),
  P('bits-math', 'fast-power', 'fast-power', 'Fast power'),
  P('bits-math', 'bit-basics', 'bit-tricks', 'Bit masks and shifts'),
  P('bits-math', 'xor-tricks', 'xor', 'XOR tricks'),

  P('range-queries', 'segment-tree', 'segment-tree', 'Segment tree'),
  P('range-queries', 'fenwick-tree', 'fenwick-tree', 'Fenwick tree'),
  P('range-queries', 'sparse-table', 'sparse-table', 'Sparse table'),

  P('string-algorithms', 'kmp', 'kmp', 'KMP prefix function'),
  P('string-algorithms', 'z-function', 'z-function', 'Z-function'),
  P('string-algorithms', 'rolling-hash', 'rolling-hash', 'Rolling hash'),
  P('string-algorithms', 'manacher', 'manacher', 'Manacher'),

  P('advanced-dp', 'lis-fast', 'lis-fast', 'LIS with binary search'),
  P('advanced-dp', 'interval-dp', 'interval-dp', 'Interval DP'),
  P('advanced-dp', 'tree-dp', 'tree-dp', 'Tree DP'),
  P('advanced-dp', 'bitmask-dp', 'bitmask-dp', 'Bitmask DP'),
  P('advanced-dp', 'digit-dp', 'digit-dp', 'Digit DP'),

  P('graph-algorithms-2', 'two-color-graph', 'bipartite', 'Two-coloring (bipartite)'),
  P('graph-algorithms-2', 'zero-one-bfs', 'zero-one-bfs', '0-1 BFS'),
  P('graph-algorithms-2', 'bridges-cut-points', 'bridges', 'Bridges and cut points'),
  P('graph-algorithms-2', 'strongly-connected', 'scc', 'Strongly connected parts'),
  P('graph-algorithms-2', 'euler-path', 'euler-path', 'Euler path'),

  P('more-patterns', 'monotonic-deque', 'monotonic-deque', 'Monotonic deque'),
  P('more-patterns', 'treemap', 'treemap', 'Ordered map (TreeMap)'),
  P('more-patterns', 'sweep-line', 'sweep-line', 'Sweep line'),
  P('more-patterns', 'reservoir-sampling', 'reservoir', 'Reservoir sampling'),
  P('more-patterns', 'meet-in-the-middle', 'meet-middle', 'Meet in the middle'),
  P('more-patterns', 'quickselect', 'quickselect', 'Quickselect'),
  P('more-patterns', 'morris-traversal', 'morris', 'Morris traversal'),
];
```

- [ ] **Step 7: Run the test and the type check**

Run: `npx vitest run tests/unit/catalog/catalog.test.ts && npm run typecheck`
Expected: `Tests  4 passed (4)`, and `tsc --noEmit` prints nothing.

- [ ] **Step 8: Commit (controller only, after review)**

```bash
git add src/content-types.ts content/catalog/modules.ts content/catalog/lessons.ts content/catalog/patterns.ts tests/unit/catalog/catalog.test.ts
git commit -m "feat(catalog): add modules, planned lessons and patterns (Part 1b Task 1)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Problem catalog generator, sheet lists and the CI check

**Files:**
- Create: `scripts/build-catalog.mjs`
- Create (generated by the script, never edited by hand): `content/catalog/problems.ts`, `content/sheets/neetcode150.ts`, `content/sheets/striver-bs.ts`, `content/sheets/striver-recursion.ts`
- Create: `content/sheets/index.ts`, `content/catalog/index.ts`
- Modify: `package.json` (scripts), `.github/workflows/ci.yml` (one step)
- Test: `tests/unit/catalog/problems.test.ts`

**Interfaces:**
- Consumes: `CatalogProblem`, `Sheet`, `Catalog` (Task 1), `catalogModules`, `catalogLessons`, `catalogPatterns` (Task 1).
- Produces:
  - `scripts/build-catalog.mjs` exports `parseProblemMap(text)`, `buildCatalog(text)` and `renderFiles(text): Record<string, string>` (repo path → file text). Run directly it writes the four files, or with `--check` exits 1 when any is out of date.
  - `catalogProblems: CatalogProblem[]` (319 rows), `neetcode150`, `striverBs`, `striverRecursion: string[]`.
  - `sheets: Sheet[]` (`content/sheets/index.ts`) and `catalog: Catalog` (`content/catalog/index.ts`), used by Task 3.
  - npm scripts `check:catalog` and `build:catalog`.

The map table inside the script is the curriculum decision for every problem: its patterns (main one first) and whether it is core. Every pattern gets 1 to 3 core problems. Three patterns are only practised on revisits, so they borrow an earlier problem as core: `manacher` (LC 5), `quickselect` (LC 215) and `morris` (LC 94). The NeetCode 150 order is embedded from the addendum.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/catalog/problems.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { catalog } from '../../../content/catalog';
import { catalogModules } from '../../../content/catalog/modules';
import { catalogPatterns } from '../../../content/catalog/patterns';
import { catalogProblems } from '../../../content/catalog/problems';
import { neetcode150 } from '../../../content/sheets/neetcode150';
import { striverBs } from '../../../content/sheets/striver-bs';
import { striverRecursion } from '../../../content/sheets/striver-recursion';
// @ts-expect-error The generator is plain JavaScript with no type file.
import { renderFiles } from '../../../scripts/build-catalog.mjs';

const unique = (ids: string[]) => new Set(ids).size === ids.length;

describe('problem catalog (generated from docs/curriculum/problem-map.md)', () => {
  it('has every problem of the map once', () => {
    expect(catalogProblems).toHaveLength(319);
    expect(unique(catalogProblems.map((p) => p.id))).toBe(true);
    for (const p of catalogProblems) expect(p.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it('matches the summary table of the map', () => {
    expect(catalogProblems.filter((p) => p.sheets.includes('neetcode150'))).toHaveLength(150);
    expect(catalogProblems.filter((p) => p.sheets.includes('striver-bs'))).toHaveLength(32);
    expect(catalogProblems.filter((p) => p.sheets.includes('striver-recursion'))).toHaveLength(22);
    expect(catalogProblems.filter((p) => p.sheets.length === 0)).toHaveLength(129);
    const perModule = (id: string) => catalogProblems.filter((p) => p.moduleId === id).length;
    expect(perModule('foundations')).toBe(1);
    expect(perModule('binary-search')).toBe(34);
    expect(perModule('trees')).toBe(27);
    expect(perModule('interview-meta')).toBe(0);
  });

  it('keeps the sheets in their own order and in step with each problem', () => {
    expect(neetcode150).toHaveLength(150);
    expect(neetcode150.slice(0, 3)).toEqual(['contains-duplicate', 'valid-anagram', 'two-sum']);
    expect(neetcode150.at(-1)).toBe('reverse-integer');
    expect(striverBs).toHaveLength(32);
    expect(striverBs[0]).toBe('binary-search');
    expect(striverBs.at(-1)).toBe('median-in-a-row-wise-sorted-matrix');
    expect(striverRecursion).toHaveLength(22);
    expect(striverRecursion[0]).toBe('1-to-n-without-loop');
    expect(striverRecursion.at(-1)).toBe('rat-in-maze');
    for (const sheet of catalog.sheets) {
      expect(unique(sheet.problemIds), sheet.id).toBe(true);
      const tagged = catalogProblems.filter((p) => p.sheets.includes(sheet.id)).map((p) => p.id);
      expect([...sheet.problemIds].sort(), sheet.id).toEqual(tagged.sort());
    }
  });

  it('maps every problem to 1 or 2 known patterns, and every pattern has 1 to 3 core problems', () => {
    const patternIds = new Set(catalogPatterns.map((p) => p.id));
    const moduleIds = new Set(catalogModules.map((m) => m.id));
    for (const p of catalogProblems) {
      expect(moduleIds.has(p.moduleId), p.id).toBe(true);
      expect(p.patternIds.length, p.id).toBeGreaterThanOrEqual(1);
      expect(p.patternIds.length, p.id).toBeLessThanOrEqual(2);
      for (const id of p.patternIds) expect(patternIds.has(id), `${p.id} → ${id}`).toBe(true);
    }
    for (const pattern of catalogPatterns) {
      const core = catalogProblems.filter((p) => p.core && p.patternIds.includes(pattern.id));
      expect(core.length, pattern.id).toBeGreaterThanOrEqual(1);
      expect(core.length, pattern.id).toBeLessThanOrEqual(3);
    }
  });

  it('keeps the model problem as built', () => {
    expect(catalogProblems.find((p) => p.id === 'contains-duplicate')).toEqual({
      id: 'contains-duplicate', title: 'Contains Duplicate', moduleId: 'foundations', difficulty: 'easy', patternIds: ['hashing'],
      sheets: ['neetcode150'], url: 'https://leetcode.com/problems/contains-duplicate/', lc: 217, core: true,
    });
  });

  it('is up to date with the problem map', () => {
    const files = renderFiles(readFileSync('docs/curriculum/problem-map.md', 'utf8')) as Record<string, string>;
    for (const [path, body] of Object.entries(files)) expect(readFileSync(path, 'utf8'), path).toBe(body);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/catalog/problems.test.ts`
Expected: FAIL, because `content/catalog/index.ts` and `scripts/build-catalog.mjs` do not exist yet.

- [ ] **Step 3: Create the generator `scripts/build-catalog.mjs`**

```js
// Builds the problem catalog and the three sheet lists from docs/curriculum/problem-map.md.
// Usage: node scripts/build-catalog.mjs          (write the files)
//        node scripts/build-catalog.mjs --check  (fail if the files on disk are out of date)
// The problem map gives the rows. The MAP table below adds each problem's patterns and its core flag.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAP_FILE = join(ROOT, 'docs', 'curriculum', 'problem-map.md');

/** Problem-map module number → catalog module id (content/catalog/modules.ts). */
const MODULE_IDS = [
  null, 'foundations', 'arrays-strings', 'hashing', 'two-pointers', 'sliding-window', 'recursion-basics', 'sorting',
  'binary-search', 'stack-queue', 'linked-list', 'backtracking', 'trees', 'heap', 'tries', 'graphs', 'advanced-graphs',
  'dp-1d', 'dp-2d', 'greedy-intervals', 'bits-math', 'range-queries', 'string-algorithms', 'advanced-dp',
  'graph-algorithms-2', 'more-patterns', 'interview-meta',
];

/** NeetCode 150 in its official order (neetcode-gh/leetcode .problemSiteData.json, the data behind neetcode.io/practice). */
const NC150_ORDER = [
  'contains-duplicate', 'valid-anagram', 'two-sum', 'group-anagrams', 'top-k-frequent-elements',
  'product-of-array-except-self', 'valid-sudoku', 'encode-and-decode-strings', 'longest-consecutive-sequence',
  'valid-palindrome', 'two-sum-ii-input-array-is-sorted', '3sum', 'container-with-most-water', 'trapping-rain-water',
  'best-time-to-buy-and-sell-stock', 'longest-substring-without-repeating-characters',
  'longest-repeating-character-replacement', 'permutation-in-string', 'minimum-window-substring',
  'sliding-window-maximum', 'valid-parentheses', 'min-stack', 'evaluate-reverse-polish-notation',
  'generate-parentheses', 'daily-temperatures', 'car-fleet', 'largest-rectangle-in-histogram', 'binary-search',
  'search-a-2d-matrix', 'koko-eating-bananas', 'find-minimum-in-rotated-sorted-array',
  'search-in-rotated-sorted-array', 'time-based-key-value-store', 'median-of-two-sorted-arrays',
  'reverse-linked-list', 'merge-two-sorted-lists', 'reorder-list', 'remove-nth-node-from-end-of-list',
  'copy-list-with-random-pointer', 'add-two-numbers', 'linked-list-cycle', 'find-the-duplicate-number', 'lru-cache',
  'merge-k-sorted-lists', 'reverse-nodes-in-k-group', 'invert-binary-tree', 'maximum-depth-of-binary-tree',
  'diameter-of-binary-tree', 'balanced-binary-tree', 'same-tree', 'subtree-of-another-tree',
  'lowest-common-ancestor-of-a-binary-search-tree', 'binary-tree-level-order-traversal',
  'binary-tree-right-side-view', 'count-good-nodes-in-binary-tree', 'validate-binary-search-tree',
  'kth-smallest-element-in-a-bst', 'construct-binary-tree-from-preorder-and-inorder-traversal',
  'binary-tree-maximum-path-sum', 'serialize-and-deserialize-binary-tree', 'implement-trie-prefix-tree',
  'design-add-and-search-words-data-structure', 'word-search-ii', 'kth-largest-element-in-a-stream',
  'last-stone-weight', 'k-closest-points-to-origin', 'kth-largest-element-in-an-array', 'task-scheduler',
  'design-twitter', 'find-median-from-data-stream', 'subsets', 'combination-sum', 'permutations', 'subsets-ii',
  'combination-sum-ii', 'word-search', 'palindrome-partitioning', 'letter-combinations-of-a-phone-number',
  'n-queens', 'number-of-islands', 'clone-graph', 'max-area-of-island', 'pacific-atlantic-water-flow',
  'surrounded-regions', 'rotting-oranges', 'walls-and-gates', 'course-schedule', 'course-schedule-ii',
  'redundant-connection', 'number-of-connected-components-in-an-undirected-graph', 'graph-valid-tree', 'word-ladder',
  'reconstruct-itinerary', 'min-cost-to-connect-all-points', 'network-delay-time', 'swim-in-rising-water',
  'alien-dictionary', 'cheapest-flights-within-k-stops', 'climbing-stairs', 'min-cost-climbing-stairs',
  'house-robber', 'house-robber-ii', 'longest-palindromic-substring', 'palindromic-substrings', 'decode-ways',
  'coin-change', 'maximum-product-subarray', 'word-break', 'longest-increasing-subsequence',
  'partition-equal-subset-sum', 'unique-paths', 'longest-common-subsequence',
  'best-time-to-buy-and-sell-stock-with-cooldown', 'coin-change-ii', 'target-sum', 'interleaving-string',
  'longest-increasing-path-in-a-matrix', 'distinct-subsequences', 'edit-distance', 'burst-balloons',
  'regular-expression-matching', 'maximum-subarray', 'jump-game', 'jump-game-ii', 'gas-station', 'hand-of-straights',
  'merge-triplets-to-form-target-triplet', 'partition-labels', 'valid-parenthesis-string', 'insert-interval',
  'merge-intervals', 'non-overlapping-intervals', 'meeting-rooms', 'meeting-rooms-ii',
  'minimum-interval-to-include-each-query', 'rotate-image', 'spiral-matrix', 'set-matrix-zeroes', 'happy-number',
  'plus-one', 'powx-n', 'multiply-strings', 'detect-squares', 'single-number', 'number-of-1-bits', 'counting-bits',
  'reverse-bits', 'missing-number', 'sum-of-two-integers', 'reverse-integer',
];

/**
 * Problem id → [pattern ids (space separated, the main one first), core (1 or 0)].
 * Core problems decide "mastered" (spec §9.3). Every pattern has 1 to 3 core problems.
 */
const MAP = {
  // M1 Foundations
  'contains-duplicate': ['hashing', 1],

  // M2 Arrays & Strings
  'reverse-string': ['in-place-array', 1],
  'plus-one': ['in-place-array', 0],
  'missing-number': ['running-value', 0],
  'rotate-array': ['in-place-array', 1],
  'reverse-words-in-a-string': ['string-building', 1],
  'encode-and-decode-strings': ['string-building', 1],
  'best-time-to-buy-and-sell-stock': ['running-value', 1],
  'range-sum-query-immutable': ['prefix-sum', 1],
  'product-of-array-except-self': ['prefix-sum', 1],
  'maximum-subarray': ['kadane', 1],
  'maximum-sum-circular-subarray': ['kadane', 0],
  'maximum-product-subarray': ['kadane', 1],
  'next-permutation': ['in-place-array', 0],
  'spiral-matrix': ['grid-walk', 1],
  'rotate-image': ['grid-walk', 1],
  'set-matrix-zeroes': ['grid-walk', 0],

  // M3 Hashing
  'valid-anagram': ['counting', 1],
  'two-sum': ['partner-lookup', 1],
  'majority-element': ['counting', 0],
  'group-anagrams': ['group-by-key', 1],
  'top-k-frequent-elements': ['counting group-by-key', 1],
  'valid-sudoku': ['hashing', 0],
  'longest-consecutive-sequence': ['hashing', 1],
  'insert-delete-getrandom-o1': ['partner-lookup', 0],
  'detect-squares': ['counting', 0],
  'subarray-sum-equals-k': ['prefix-sum-map', 1],
  'contiguous-array': ['prefix-sum-map', 1],

  // M4 Two Pointers
  'valid-palindrome': ['opposite-pointers', 1],
  'valid-palindrome-ii': ['opposite-pointers', 0],
  'move-zeroes': ['same-direction-pointers', 1],
  'remove-duplicates-from-sorted-array': ['same-direction-pointers', 1],
  'merge-sorted-array': ['same-direction-pointers', 0],
  'two-sum-ii-input-array-is-sorted': ['opposite-pointers', 1],
  'container-with-most-water': ['opposite-pointers', 0],
  'palindromic-substrings': ['expand-center', 1],
  'longest-palindromic-substring': ['expand-center manacher', 1],
  'trapping-rain-water': ['opposite-pointers', 0],

  // M5 Sliding Window
  'maximum-average-subarray-i': ['fixed-window', 1],
  'find-all-anagrams-in-a-string': ['fixed-window', 1],
  'permutation-in-string': ['fixed-window', 1],
  'longest-substring-without-repeating-characters': ['variable-window', 1],
  'minimum-size-subarray-sum': ['variable-window', 1],
  'max-consecutive-ones-iii': ['variable-window', 0],
  'fruit-into-baskets': ['variable-window', 0],
  'longest-repeating-character-replacement': ['variable-window', 1],
  'subarrays-with-k-different-integers': ['exactly-k-window', 1],
  'minimum-window-substring': ['variable-window', 0],

  // M6 Recursion Basics
  '1-to-n-without-loop': ['base-case-recursion', 1],
  'sum-of-natural-numbers': ['base-case-recursion', 0],
  'factorial': ['base-case-recursion', 1],
  'pyramid-pattern': ['base-case-recursion', 0],
  'fibonacci-number': ['recursion-tree', 1],
  'tower-of-hanoi': ['recursion-tree', 1],
  'k-th-symbol-in-grammar': ['base-case-recursion', 0],
  'subsets': ['pick-not-pick', 1],
  'subset-sums': ['pick-not-pick', 1],

  // M7 Sorting
  'merge-sort': ['merge-sort', 1],
  'quick-sort': ['partition', 1],
  'sort-colors': ['partition', 1],
  'largest-number': ['custom-order', 1],
  '3sum': ['sort-then-scan opposite-pointers', 1],
  '4sum': ['sort-then-scan', 0],
  'count-inversions': ['merge-sort', 1],
  'count-of-smaller-numbers-after-self': ['merge-sort', 0],

  // M8 Binary Search
  'binary-search': ['binary-search', 1],
  'implement-lower-bound': ['bounds-search', 1],
  'implement-upper-bound': ['bounds-search', 0],
  'search-insert-position': ['bounds-search', 0],
  'floor-in-sorted-array': ['bounds-search', 0],
  'find-first-and-last-position-of-element-in-sorted-array': ['bounds-search', 1],
  'count-occurrences-in-sorted': ['bounds-search', 0],
  'search-in-rotated-sorted-array': ['rotated-search', 1],
  'search-in-rotated-sorted-array-ii': ['rotated-search', 0],
  'find-minimum-in-rotated-sorted-array': ['rotated-search', 1],
  'find-rotation-count': ['rotated-search', 0],
  'single-element-in-a-sorted-array': ['bounds-search', 0],
  'find-peak-element': ['binary-search', 1],
  'time-based-key-value-store': ['bounds-search', 0],
  'random-pick-with-weight': ['bounds-search prefix-sum', 0],
  'sqrtx': ['answer-search', 1],
  'nth-root-of-m': ['answer-search', 0],
  'koko-eating-bananas': ['answer-search', 1],
  'minimum-number-of-days-to-make-m-bouquets': ['answer-search', 0],
  'find-the-smallest-divisor-given-a-threshold': ['answer-search', 0],
  'capacity-to-ship-packages-within-d-days': ['answer-search', 1],
  'kth-missing-positive-number': ['bounds-search', 0],
  'aggressive-cows': ['answer-search', 0],
  'allocate-minimum-pages': ['answer-search', 0],
  'split-array-largest-sum': ['answer-search', 0],
  'painters-partition-problem': ['answer-search', 0],
  'minimize-max-distance-to-gas-station': ['answer-search', 0],
  'row-with-max-1s-in-rowwise-sorted': ['grid-search', 1],
  'search-a-2d-matrix': ['grid-search', 1],
  'search-a-2d-matrix-ii': ['grid-search', 0],
  'find-a-peak-element-ii': ['grid-search', 0],
  'median-of-two-sorted-arrays': ['cut-search', 1],
  'k-th-of-two-sorted-arrays': ['cut-search', 1],
  'median-in-a-row-wise-sorted-matrix': ['answer-search grid-search', 0],

  // M9 Stack & Queue
  'valid-parentheses': ['stack-matching', 1],
  'implement-queue-using-stacks': ['queue', 1],
  'min-stack': ['stack-process', 1],
  'evaluate-reverse-polish-notation': ['stack-process', 1],
  'decode-string': ['stack-process', 1],
  'asteroid-collision': ['stack-process', 0],
  'next-greater-element-i': ['monotonic-stack', 1],
  'daily-temperatures': ['monotonic-stack', 1],
  'online-stock-span': ['monotonic-stack', 0],
  'car-fleet': ['stack-process sort-then-scan', 0],
  'remove-k-digits': ['monotonic-stack', 0],
  'sum-of-subarray-minimums': ['monotonic-stack', 0],
  'largest-rectangle-in-histogram': ['monotonic-stack', 1],

  // M10 Linked List
  'reverse-linked-list': ['list-reverse', 1],
  'merge-two-sorted-lists': ['dummy-head', 1],
  'middle-of-the-linked-list': ['list-pointers', 1],
  'linked-list-cycle': ['list-pointers', 1],
  'linked-list-cycle-ii': ['list-pointers', 0],
  'find-the-duplicate-number': ['list-pointers', 1],
  'palindrome-linked-list': ['list-pointers list-reverse', 0],
  'intersection-of-two-linked-lists': ['list-pointers', 0],
  'remove-nth-node-from-end-of-list': ['list-pointers', 0],
  'odd-even-linked-list': ['dummy-head', 0],
  'add-two-numbers': ['dummy-head', 1],
  'reorder-list': ['list-pointers list-reverse', 0],
  'sort-list': ['merge-sort dummy-head', 0],
  'copy-list-with-random-pointer': ['list-design', 1],
  'lru-cache': ['list-design', 1],
  'merge-k-sorted-lists': ['dummy-head merge-sort', 0],
  'reverse-nodes-in-k-group': ['list-reverse', 1],

  // M11 Backtracking
  'combinations': ['backtracking', 1],
  'letter-combinations-of-a-phone-number': ['backtracking', 1],
  'generate-parentheses': ['prune-dedupe', 1],
  'combination-sum': ['backtracking', 1],
  'combination-sum-ii': ['prune-dedupe', 1],
  'subsets-ii': ['prune-dedupe', 1],
  'permutations': ['permutations', 1],
  'permutations-ii': ['permutations prune-dedupe', 0],
  'palindrome-partitioning': ['backtracking', 0],
  'word-search': ['board-backtracking', 1],
  'rat-in-maze': ['board-backtracking', 0],
  'permutation-sequence': ['permutations', 0],
  'm-coloring-problem': ['backtracking', 0],
  'partition-to-k-equal-sum-subsets': ['prune-dedupe', 0],
  'n-queens': ['board-backtracking', 1],
  'sudoku-solver': ['board-backtracking', 1],

  // M12 Trees
  'binary-tree-preorder-traversal': ['tree-dfs', 1],
  'binary-tree-inorder-traversal': ['tree-dfs morris', 1],
  'maximum-depth-of-binary-tree': ['bottom-up-tree', 1],
  'same-tree': ['tree-dfs', 1],
  'invert-binary-tree': ['tree-dfs', 0],
  'symmetric-tree': ['tree-dfs', 0],
  'subtree-of-another-tree': ['tree-dfs', 0],
  'balanced-binary-tree': ['bottom-up-tree', 1],
  'diameter-of-binary-tree': ['bottom-up-tree', 1],
  'binary-tree-level-order-traversal': ['tree-bfs', 1],
  'binary-tree-zigzag-level-order-traversal': ['tree-bfs', 1],
  'binary-tree-right-side-view': ['tree-views', 1],
  'top-view-of-binary-tree': ['tree-views', 1],
  'vertical-order-traversal-of-a-binary-tree': ['tree-views', 0],
  'maximum-width-of-binary-tree': ['tree-bfs', 0],
  'tree-boundary-traversal': ['tree-views', 0],
  'count-good-nodes-in-binary-tree': ['tree-dfs', 0],
  'lowest-common-ancestor-of-a-binary-tree': ['bottom-up-tree', 0],
  'all-nodes-distance-k-in-binary-tree': ['tree-bfs', 0],
  'construct-binary-tree-from-preorder-and-inorder-traversal': ['tree-build', 1],
  'lowest-common-ancestor-of-a-binary-search-tree': ['bst', 1],
  'validate-binary-search-tree': ['bst', 1],
  'kth-smallest-element-in-a-bst': ['bst', 1],
  'delete-node-in-a-bst': ['bst', 0],
  'binary-search-tree-iterator': ['bst', 0],
  'binary-tree-maximum-path-sum': ['bottom-up-tree', 0],
  'serialize-and-deserialize-binary-tree': ['tree-build', 1],

  // M13 Heap
  'kth-largest-element-in-a-stream': ['top-k', 1],
  'last-stone-weight': ['best-now', 1],
  'kth-largest-element-in-an-array': ['top-k quickselect', 1],
  'k-closest-points-to-origin': ['top-k', 1],
  'top-k-frequent-words': ['top-k counting', 0],
  'reorganize-string': ['best-now', 1],
  'task-scheduler': ['best-now', 1],
  'kth-smallest-element-in-a-sorted-matrix': ['k-way-merge', 1],
  'design-twitter': ['k-way-merge', 1],
  'ipo': ['best-now sort-then-scan', 0],
  'find-median-from-data-stream': ['two-heaps', 1],

  // M14 Tries
  'implement-trie-prefix-tree': ['trie', 1],
  'replace-words': ['trie', 0],
  'search-suggestions-system': ['trie', 1],
  'design-add-and-search-words-data-structure': ['trie-dfs', 1],
  'word-search-ii': ['trie-dfs', 1],

  // M15 Graphs
  'flood-fill': ['graph-dfs', 1],
  'number-of-islands': ['graph-dfs', 1],
  'max-area-of-island': ['graph-dfs', 1],
  'number-of-provinces': ['graph-dfs', 0],
  'number-of-connected-components-in-an-undirected-graph': ['graph-dfs union-find', 0],
  'clone-graph': ['graph-dfs', 0],
  'surrounded-regions': ['graph-dfs', 0],
  'pacific-atlantic-water-flow': ['graph-dfs', 0],
  'rotting-oranges': ['multi-source-bfs', 1],
  'walls-and-gates': ['multi-source-bfs', 1],
  '01-matrix': ['multi-source-bfs', 1],
  'word-ladder': ['graph-bfs', 1],
  'graph-valid-tree': ['union-find graph-dfs', 0],
  'course-schedule': ['topo-sort', 1],
  'course-schedule-ii': ['topo-sort', 1],
  'find-eventual-safe-states': ['topo-sort', 0],
  'alien-dictionary': ['topo-sort', 1],
  'redundant-connection': ['union-find', 1],
  'number-of-operations-to-make-network-connected': ['union-find', 1],
  'accounts-merge': ['union-find', 1],

  // M16 Advanced Graphs
  'network-delay-time': ['dijkstra', 1],
  'path-with-minimum-effort': ['dijkstra', 1],
  'swim-in-rising-water': ['dijkstra', 0],
  'number-of-ways-to-arrive-at-destination': ['dijkstra', 0],
  'cheapest-flights-within-k-stops': ['bellman-ford', 1],
  'bellman-ford': ['bellman-ford', 1],
  'find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance': ['floyd-warshall', 1],
  'min-cost-to-connect-all-points': ['mst', 1],

  // M17 1-D DP
  'climbing-stairs': ['step-dp', 1],
  'min-cost-climbing-stairs': ['step-dp', 1],
  'house-robber': ['take-or-skip', 1],
  'house-robber-ii': ['take-or-skip', 1],
  'delete-and-earn': ['take-or-skip', 0],
  'decode-ways': ['step-dp', 1],
  'coin-change': ['amount-dp', 1],
  'perfect-squares': ['amount-dp', 1],
  'combination-sum-iv': ['amount-dp', 0],
  'word-break': ['split-dp', 1],
  'longest-increasing-subsequence': ['lis', 1],
  'number-of-longest-increasing-subsequence': ['lis', 0],
  'longest-increasing-path-in-a-matrix': ['lis graph-dfs', 0],

  // M18 2-D DP
  'unique-paths': ['grid-dp', 1],
  'minimum-path-sum': ['grid-dp', 1],
  'triangle': ['grid-dp', 0],
  'maximal-square': ['grid-dp', 1],
  '0-1-knapsack-problem': ['knapsack', 1],
  'partition-equal-subset-sum': ['knapsack', 1],
  'count-subsets-with-sum': ['knapsack', 0],
  'target-sum': ['knapsack', 1],
  'knapsack-with-duplicate-items': ['unbounded-knapsack', 1],
  'coin-change-ii': ['unbounded-knapsack', 1],
  'longest-common-subsequence': ['two-string-dp', 1],
  'longest-palindromic-subsequence': ['two-string-dp', 0],
  'edit-distance': ['two-string-dp', 1],
  'interleaving-string': ['two-string-dp', 0],
  'distinct-subsequences': ['two-string-dp', 1],
  'wildcard-matching': ['two-string-dp', 0],
  'regular-expression-matching': ['two-string-dp', 0],
  'best-time-to-buy-and-sell-stock-ii': ['state-dp', 1],
  'best-time-to-buy-and-sell-stock-with-cooldown': ['state-dp', 1],
  'best-time-to-buy-and-sell-stock-with-transaction-fee': ['state-dp', 0],
  'best-time-to-buy-and-sell-stock-iv': ['state-dp', 1],

  // M19 Greedy & Intervals
  'assign-cookies': ['greedy', 1],
  'jump-game': ['reach', 1],
  'jump-game-ii': ['reach', 1],
  'gas-station': ['greedy', 1],
  'merge-triplets-to-form-target-triplet': ['greedy', 0],
  'partition-labels': ['greedy', 1],
  'hand-of-straights': ['greedy counting', 0],
  'valid-parenthesis-string': ['greedy', 0],
  'candy': ['greedy', 0],
  'meeting-rooms': ['merge-intervals', 1],
  'merge-intervals': ['merge-intervals', 1],
  'insert-interval': ['merge-intervals', 1],
  'interval-list-intersections': ['merge-intervals', 0],
  'non-overlapping-intervals': ['interval-scheduling', 1],
  'minimum-number-of-arrows-to-burst-balloons': ['interval-scheduling', 1],
  'meeting-rooms-ii': ['overlap-count sweep-line', 1],
  'car-pooling': ['overlap-count', 1],
  'minimum-interval-to-include-each-query': ['merge-intervals best-now', 0],

  // M20 Bits & Math
  'happy-number': ['digit-math hashing', 0],
  'reverse-integer': ['digit-math', 1],
  'multiply-strings': ['digit-math', 1],
  'greatest-common-divisor-of-strings': ['number-theory', 1],
  'count-primes': ['number-theory', 1],
  'powx-n': ['fast-power', 1],
  'power-of-two': ['bit-tricks', 1],
  'number-of-1-bits': ['bit-tricks', 1],
  'single-number': ['xor', 1],
  'counting-bits': ['bit-tricks', 0],
  'reverse-bits': ['bit-tricks', 1],
  'single-number-iii': ['xor', 1],
  'sum-of-two-integers': ['xor bit-tricks', 0],
  'divide-two-integers': ['bit-tricks', 0],
  'maximum-xor-of-two-numbers-in-an-array': ['xor trie', 0],

  // M21 Range Queries
  'range-sum-query-mutable': ['fenwick-tree segment-tree', 1],
  'range-minimum-query': ['segment-tree sparse-table', 1],
  'create-sorted-array-through-instructions': ['fenwick-tree', 1],
  'my-calendar-iii': ['segment-tree', 1],

  // M22 String Algorithms
  'find-the-index-of-the-first-occurrence-in-a-string': ['kmp', 1],
  'longest-happy-prefix': ['kmp', 1],
  'shortest-palindrome': ['kmp', 0],
  'sum-of-scores-of-built-strings': ['z-function', 1],
  'repeated-string-match': ['rolling-hash', 1],
  'longest-duplicate-substring': ['rolling-hash answer-search', 0],

  // M23 Advanced DP
  'russian-doll-envelopes': ['lis-fast', 1],
  'matrix-chain-multiplication': ['interval-dp', 1],
  'minimum-cost-to-cut-a-stick': ['interval-dp', 1],
  'burst-balloons': ['interval-dp', 1],
  'house-robber-iii': ['tree-dp', 1],
  'binary-tree-cameras': ['tree-dp', 1],
  'sum-of-distances-in-tree': ['tree-dp', 1],
  'can-i-win': ['bitmask-dp', 1],
  'shortest-path-visiting-all-nodes': ['bitmask-dp graph-bfs', 0],
  'numbers-at-most-n-given-digit-set': ['digit-dp', 1],
  'number-of-digit-one': ['digit-dp', 1],

  // M24 Graph Algorithms II
  'is-graph-bipartite': ['bipartite', 1],
  'possible-bipartition': ['bipartite', 1],
  'minimum-cost-to-make-at-least-one-valid-path-in-a-grid': ['zero-one-bfs', 1],
  'critical-connections-in-a-network': ['bridges', 1],
  'articulation-point': ['bridges', 1],
  'count-strongly-connected-components': ['scc', 1],
  'reconstruct-itinerary': ['euler-path', 1],
  'valid-arrangement-of-pairs': ['euler-path', 1],

  // M25 More Patterns
  'sliding-window-maximum': ['monotonic-deque', 1],
  'longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit': ['monotonic-deque', 1],
  'shortest-subarray-with-sum-at-least-k': ['monotonic-deque', 1],
  'my-calendar-i': ['treemap', 1],
  'the-skyline-problem': ['sweep-line', 1],
  'linked-list-random-node': ['reservoir', 1],
  'closest-subsequence-sum': ['meet-middle', 1],
};

const ROW = /^\| (\d+) \| (GfG|\d+) \| \[(.+?)\]\((\S+?)\) \| (Easy|Medium|Hard) \| ([^|]+?) \|/;
const LC_URL = /^https:\/\/leetcode\.com\/problems\/([a-z0-9-]+)\/$/;
const SOURCE_SHEET = { NC150: 'neetcode150', 'Striver-BS': 'striver-bs', 'Striver-Rec': 'striver-recursion' };

const kebab = (s) => s.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** "NC150, Striver-Rec #14, #15" → { neetcode150: [], 'striver-recursion': [14, 15] } */
function parseSource(source) {
  const out = {};
  let current = null;
  for (const raw of source.split(',')) {
    const token = raw.trim();
    if (token === 'Extra') continue;
    const name = Object.keys(SOURCE_SHEET).find((k) => token === k || token.startsWith(`${k} `));
    if (name) {
      current = SOURCE_SHEET[name];
      out[current] = [];
    } else if (!token.startsWith('#') || !current) {
      throw new Error(`Unknown source "${token}" in "${source}"`);
    }
    for (const m of token.matchAll(/#(\d+)/g)) out[current].push(Number(m[1]));
  }
  return out;
}

export function parseProblemMap(text) {
  const rows = [];
  let moduleNo = null;
  for (const line of text.split('\n')) {
    const heading = /^## M(\d+) /.exec(line);
    if (heading) { moduleNo = Number(heading[1]); continue; }
    const m = ROW.exec(line);
    if (!m || moduleNo === null) continue;
    const [, , lc, title, url, difficulty, source] = m;
    const slug = LC_URL.exec(url)?.[1];
    if (lc !== 'GfG' && !slug) throw new Error(`LeetCode row without a LeetCode link: ${title}`);
    rows.push({ id: slug ?? kebab(title), title, moduleId: MODULE_IDS[moduleNo], difficulty: difficulty.toLowerCase(), url, lc: lc === 'GfG' ? undefined : Number(lc), sources: parseSource(source) });
  }
  return rows;
}

export function buildCatalog(text) {
  const rows = parseProblemMap(text);
  const seen = new Set();
  for (const r of rows) {
    if (seen.has(r.id)) throw new Error(`Duplicate problem id: ${r.id}`);
    seen.add(r.id);
    if (!MAP[r.id]) throw new Error(`No pattern mapping for ${r.id}. Add it to MAP in scripts/build-catalog.mjs.`);
  }
  for (const id of Object.keys(MAP)) if (!seen.has(id)) throw new Error(`MAP lists ${id}, which is not in the problem map.`);
  const problems = rows.map((r) => ({
    id: r.id, title: r.title, moduleId: r.moduleId, difficulty: r.difficulty,
    patternIds: MAP[r.id][0].split(' '), sheets: Object.keys(r.sources), url: r.url, lc: r.lc, core: MAP[r.id][1] === 1,
  }));

  const nc = rows.filter((r) => r.sources.neetcode150).map((r) => r.id);
  const missing = nc.filter((id) => !NC150_ORDER.includes(id));
  const extra = NC150_ORDER.filter((id) => !nc.includes(id));
  if (missing.length || extra.length) throw new Error(`NeetCode 150 mismatch. Not in the order list: ${missing.join(', ')}. Not in the map: ${extra.join(', ')}`);

  // Striver order: the smallest #NN of each row. Rows that share a number keep the problem map's order.
  const striver = (sheet) => rows
    .map((r, index) => ({ id: r.id, index, n: r.sources[sheet] }))
    .filter((r) => r.n)
    .sort((a, b) => Math.min(...a.n) - Math.min(...b.n) || a.index - b.index)
    .map((r) => r.id);

  return { problems, sheets: { neetcode150: [...NC150_ORDER], 'striver-bs': striver('striver-bs'), 'striver-recursion': striver('striver-recursion') } };
}

const q = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const HEADER = '// Generated by scripts/build-catalog.mjs from docs/curriculum/problem-map.md. Do not edit by hand.\n';

function problemsFile(problems) {
  const line = (p) => `  { id: ${q(p.id)}, title: ${q(p.title)}, moduleId: ${q(p.moduleId)}, difficulty: ${q(p.difficulty)}, patternIds: [${p.patternIds.map(q).join(', ')}], sheets: [${p.sheets.map(q).join(', ')}], url: ${q(p.url)}, ${p.lc === undefined ? '' : `lc: ${p.lc}, `}core: ${p.core} },`;
  return `${HEADER}import type { CatalogProblem } from '../../src/content-types';\n\nexport const catalogProblems: CatalogProblem[] = [\n${problems.map(line).join('\n')}\n];\n`;
}

function sheetFile(name, ids) {
  return `${HEADER}export const ${name}: string[] = [\n${ids.map((id) => `  ${q(id)},`).join('\n')}\n];\n`;
}

/** Path (from the repo root) → file text. */
export function renderFiles(text) {
  const { problems, sheets } = buildCatalog(text);
  return {
    'content/catalog/problems.ts': problemsFile(problems),
    'content/sheets/neetcode150.ts': sheetFile('neetcode150', sheets.neetcode150),
    'content/sheets/striver-bs.ts': sheetFile('striverBs', sheets['striver-bs']),
    'content/sheets/striver-recursion.ts': sheetFile('striverRecursion', sheets['striver-recursion']),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = renderFiles(readFileSync(MAP_FILE, 'utf8'));
  if (process.argv.includes('--check')) {
    const stale = Object.entries(files).filter(([path, body]) => {
      try { return readFileSync(join(ROOT, path), 'utf8') !== body; } catch { return true; }
    });
    for (const [path] of stale) console.error(`out of date: ${path}`);
    if (stale.length) { console.error('Run: node scripts/build-catalog.mjs'); process.exit(1); }
    console.log('Catalog files match docs/curriculum/problem-map.md');
  } else {
    for (const [path, body] of Object.entries(files)) {
      mkdirSync(dirname(join(ROOT, path)), { recursive: true });
      writeFileSync(join(ROOT, path), body);
    }
    console.log(`Wrote ${Object.keys(files).length} files.`);
  }
}
```

- [ ] **Step 4: Generate the files**

Run: `node scripts/build-catalog.mjs`
Expected: `Wrote 4 files.` The first rows of `content/catalog/problems.ts` look like this (do not paste the rest by hand):

```ts
// Generated by scripts/build-catalog.mjs from docs/curriculum/problem-map.md. Do not edit by hand.
import type { CatalogProblem } from '../../src/content-types';

export const catalogProblems: CatalogProblem[] = [
  { id: 'contains-duplicate', title: 'Contains Duplicate', moduleId: 'foundations', difficulty: 'easy', patternIds: ['hashing'], sheets: ['neetcode150'], url: 'https://leetcode.com/problems/contains-duplicate/', lc: 217, core: true },
  { id: 'reverse-string', title: 'Reverse String', moduleId: 'arrays-strings', difficulty: 'easy', patternIds: ['in-place-array'], sheets: ['striver-recursion'], url: 'https://leetcode.com/problems/reverse-string/', lc: 344, core: true },
```

Then run: `node scripts/build-catalog.mjs --check`
Expected: `Catalog files match docs/curriculum/problem-map.md`

- [ ] **Step 5: Create `content/sheets/index.ts`**

```ts
import type { Sheet } from '../../src/content-types';
import { neetcode150 } from './neetcode150';
import { striverBs } from './striver-bs';
import { striverRecursion } from './striver-recursion';

/** The three problem lists, credited by name (spec §3). The id lists are generated. */
export const sheets: Sheet[] = [
  { id: 'neetcode150', title: 'NeetCode 150', credit: 'The list and its order come from NeetCode (neetcode.io).', problemIds: neetcode150 },
  { id: 'striver-bs', title: 'Striver Binary Search', credit: 'The list and its order come from Striver (takeUforward), binary search sheet.', problemIds: striverBs },
  { id: 'striver-recursion', title: 'Striver Recursion', credit: 'The list and its order come from Striver (takeUforward), recursion sheet.', problemIds: striverRecursion },
];
```

- [ ] **Step 6: Create `content/catalog/index.ts`**

```ts
import type { Catalog } from '../../src/content-types';
import { sheets } from '../sheets';
import { catalogLessons } from './lessons';
import { catalogModules } from './modules';
import { catalogPatterns } from './patterns';
import { catalogProblems } from './problems';

/** Everything the course plans to teach, built or not. The dashboard counts against this. */
export const catalog: Catalog = {
  modules: catalogModules,
  lessons: catalogLessons,
  patterns: catalogPatterns,
  problems: catalogProblems,
  sheets,
};
```

- [ ] **Step 7: Add the npm scripts and the CI step**

In `package.json`, add these two lines to `"scripts"` right after `"check:content"`, and add `npm run check:catalog` to `"ci"`:

```json
    "check:catalog": "node scripts/build-catalog.mjs --check",
    "build:catalog": "node scripts/build-catalog.mjs",
```

```json
    "ci": "npm run typecheck && npm run check:catalog && npm run check:content && npm test && npm run verify:java && npm run test:e2e"
```

In `.github/workflows/ci.yml`, add one step right after `- run: node scripts/fetch-teavm.mjs --check`:

```yaml
      - run: npm run check:catalog
```

- [ ] **Step 8: Run the tests and checks**

Run: `npx vitest run tests/unit/catalog && npm run check:catalog && npm run typecheck`
Expected: `Tests  10 passed (10)`, then `Catalog files match docs/curriculum/problem-map.md`, and no type errors.

- [ ] **Step 9: Commit (controller only, after review)**

```bash
git add scripts/build-catalog.mjs content/catalog/problems.ts content/catalog/index.ts content/sheets package.json .github/workflows/ci.yml tests/unit/catalog/problems.test.ts
git commit -m "feat(catalog): generate the 319-problem catalog and sheet lists (Part 1b Task 2)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Registry merges built and planned content

**Files:**
- Modify (replace the whole file): `src/core/registry.ts`
- Modify (replace the whole file): `content/index.ts`
- Test: `tests/unit/core/registry.test.ts` (append a `describe` block and widen one import)

**Interfaces:**
- Consumes: `Catalog`, `CatalogModule`, `CatalogProblem`, `DrillItem`, `Pattern`, `Sheet` (Task 1), `catalog` (Task 2).
- Produces (`src/core/registry.ts`):
  - `ContentInput` gains `catalog?: Catalog` and `drills?: DrillItem[]`. Both are optional, so existing fixtures still work.
  - `interface RoadmapLesson { id: string; moduleId: string; title: string; minutes: number; patternId?: string; built: boolean; part: string }`
  - `interface RoadmapProblem extends CatalogProblem { built: boolean; part: string }`
  - `interface RoadmapModule extends CatalogModule { built: boolean; lessons: RoadmapLesson[]; problems: RoadmapProblem[] }`
  - `Registry` gains `roadmap: RoadmapModule[]`, `allLessons: RoadmapLesson[]`, `allProblems: RoadmapProblem[]`, `patterns: Pattern[]`, `sheets: Sheet[]`, `roadmapModule(id)`, `roadmapLesson(id)`, `roadmapProblem(id)`, `pattern(id)`, `sheet(id)` (each returns `T | undefined`).
  - `EMPTY_CATALOG: Catalog`.
  - A built lesson keeps its own `title` and `minutes` in the merge. A built item missing from the catalog is still listed at the end of its module (Task 13 reports it as an error).
- Produces (`content/index.ts`): `contentInput.catalog = catalog`.

- [ ] **Step 1: Write the failing test**

In `tests/unit/core/registry.test.ts`, change the content-types import to:

```ts
import type { Catalog, Lesson, Module, Problem } from '../../../src/content-types';
```

Then append this block at the end of the file:

```ts

describe('catalog merge', () => {
  const catalog: Catalog = {
    modules: [
      { id: 'b', order: 2, level: 'basics', icon: '📦', title: 'B planned', part: '2' },
      { id: 'a', order: 1, level: 'basics', icon: '🧱', title: 'A planned', part: '1c' },
    ],
    lessons: [
      { id: 'l0', moduleId: 'b', title: 'Planned L0', minutes: 20 },
      { id: 'l1', moduleId: 'b', title: 'Old title', minutes: 99, patternId: 'pat' },
    ],
    patterns: [{ id: 'pat', moduleId: 'b', lessonId: 'l1', title: 'A pattern' }],
    problems: [
      { id: 'p1', title: 'P1', moduleId: 'b', difficulty: 'easy', patternIds: ['pat'], sheets: ['neetcode150'], url: 'https://x/', core: true },
      { id: 'p2', title: 'P2', moduleId: 'b', difficulty: 'hard', patternIds: ['pat'], sheets: [], url: 'https://y/', core: false },
    ],
    sheets: [{ id: 'neetcode150', title: 'NeetCode 150', credit: 'c', problemIds: ['p1'] }],
  };
  const realLesson = { id: 'l1', moduleId: 'b', title: 'L1', minutes: 15 } as unknown as Lesson;
  const r = buildRegistry({ ...input(), lessons: [realLesson], catalog });

  it('lists every catalog module in order and marks what is built', () => {
    expect(r.roadmap.map((m) => [m.id, m.built])).toEqual([['a', true], ['b', true]]);
    expect(r.roadmapModule('a')?.part).toBe('1c');
  });
  it('marks built lessons and problems, and uses the built title and minutes', () => {
    expect(r.roadmapModule('b')!.lessons.map((l) => [l.id, l.built, l.title, l.minutes])).toEqual([['l0', false, 'Planned L0', 20], ['l1', true, 'L1', 15]]);
    expect(r.roadmapProblem('p1')).toMatchObject({ built: true, part: '2', core: true });
    expect(r.roadmapProblem('p2')).toMatchObject({ built: false, part: '2' });
    expect(r.allLessons).toHaveLength(2);
    expect(r.allProblems.map((p) => p.id)).toEqual(['p1', 'p2']);
  });
  it('finds patterns and sheets', () => {
    expect(r.pattern('pat')?.lessonId).toBe('l1');
    expect(r.sheet('neetcode150')?.problemIds).toEqual(['p1']);
    expect(r.sheet('nope')).toBeUndefined();
    expect(r.roadmapLesson('l0')?.built).toBe(false);
  });
  it('still lists a built item that the catalog misses', () => {
    const extra = { id: 'p9', moduleId: 'b', title: 'P9', difficulty: 'medium', patternIds: [], core: false, source: { name: 'x', url: 'https://z/' }, approaches: [] } as unknown as Problem;
    const r2 = buildRegistry({ ...input(), problems: [...input().problems, extra], catalog });
    expect(r2.roadmapModule('b')!.problems.at(-1)).toMatchObject({ id: 'p9', built: true });
  });
  it('works with no catalog', () => {
    const plain = buildRegistry(input());
    expect(plain.roadmap.map((m) => m.id)).toEqual(['a', 'b']);
    expect(plain.allLessons.map((l) => l.id)).toEqual(['l1']);
    expect(plain.patterns).toEqual([]);
  });
  it('merges the real catalog with the real content', async () => {
    const { contentInput } = await import('../../../content');
    const real = buildRegistry(contentInput);
    expect(real.roadmap).toHaveLength(26);
    expect(real.allProblems).toHaveLength(319);
    expect(real.allLessons.filter((l) => l.built).map((l) => l.id)).toEqual(['brute-better-optimal']);
    expect(real.roadmapProblem('contains-duplicate')?.built).toBe(true);
    expect(real.roadmapModule('hashing')).toMatchObject({ built: false, part: '2' });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/core/registry.test.ts`
Expected: FAIL. `r.roadmap` is undefined, and TypeScript also reports that `catalog` is not part of `ContentInput`.

- [ ] **Step 3: Replace `src/core/registry.ts`**

```ts
import type { Approach, Catalog, CatalogModule, CatalogProblem, DrillItem, Lesson, Module, Pattern, Problem, Sheet } from '../content-types';
import type { TraceDef } from '../engine/trace';

export interface ContentInput {
  modules: Module[];
  lessons: Lesson[];
  problems: Problem[];
  traces: TraceDef[];
  /** planned content for the whole course. Small test fixtures leave it out. */
  catalog?: Catalog;
  /** hand-written drill items */
  drills?: DrillItem[];
}

/** A catalog lesson merged with the built one. A `built` lesson has a page. */
export interface RoadmapLesson {
  id: string;
  moduleId: string;
  title: string;
  minutes: number;
  patternId?: string;
  built: boolean;
  /** the part that builds it, for "coming in Part N" */
  part: string;
}

export interface RoadmapProblem extends CatalogProblem {
  built: boolean;
  part: string;
}

export interface RoadmapModule extends CatalogModule {
  built: boolean;
  lessons: RoadmapLesson[];
  problems: RoadmapProblem[];
}

export interface Registry {
  /** built modules, by order */
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
  /** every catalog module merged with built content, by order */
  roadmap: RoadmapModule[];
  allLessons: RoadmapLesson[];
  allProblems: RoadmapProblem[];
  patterns: Pattern[];
  sheets: Sheet[];
  roadmapModule(id: string): RoadmapModule | undefined;
  roadmapLesson(id: string): RoadmapLesson | undefined;
  roadmapProblem(id: string): RoadmapProblem | undefined;
  pattern(id: string): Pattern | undefined;
  sheet(id: string): Sheet | undefined;
}

export const EMPTY_CATALOG: Catalog = { modules: [], lessons: [], patterns: [], problems: [], sheets: [] };

function indexById<T extends { id: string }>(kind: string, items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    if (map.has(item.id)) throw new Error(`Duplicate ${kind} id: ${item.id}`);
    map.set(item.id, item);
  }
  return map;
}

/**
 * Merges the catalog with built content. A catalog item whose id is built is marked `built`.
 * A built item missing from the catalog is still listed, at the end of its module, so the site keeps
 * working. The content check reports it as an error.
 */
function mergeRoadmap(catalog: Catalog, modules: Map<string, Module>, lessons: Map<string, Lesson>, problems: Map<string, Problem>): RoadmapModule[] {
  const catalogModules: CatalogModule[] = [...catalog.modules];
  for (const m of modules.values()) {
    if (!catalogModules.some((c) => c.id === m.id)) catalogModules.push({ id: m.id, order: m.order, level: m.level, icon: m.icon, title: m.title, part: '' });
  }
  catalogModules.sort((a, b) => a.order - b.order);
  return catalogModules.map((cm) => {
    const plannedLessons: RoadmapLesson[] = catalog.lessons
      .filter((l) => l.moduleId === cm.id)
      .map((l) => {
        const real = lessons.get(l.id);
        return { ...l, title: real?.title ?? l.title, minutes: real?.minutes ?? l.minutes, built: !!real, part: cm.part };
      });
    const extraLessons: RoadmapLesson[] = [...lessons.values()]
      .filter((l) => l.moduleId === cm.id && !catalog.lessons.some((c) => c.id === l.id))
      .map((l) => ({ id: l.id, moduleId: l.moduleId, title: l.title, minutes: l.minutes, built: true, part: cm.part }));
    const plannedProblems: RoadmapProblem[] = catalog.problems
      .filter((p) => p.moduleId === cm.id)
      .map((p) => ({ ...p, built: problems.has(p.id), part: cm.part }));
    const extraProblems: RoadmapProblem[] = [...problems.values()]
      .filter((p) => p.moduleId === cm.id && !catalog.problems.some((c) => c.id === p.id))
      // Small test fixtures may leave fields out, so read them with care.
      .map((p) => ({ id: p.id, title: p.title, moduleId: p.moduleId, difficulty: p.difficulty, patternIds: p.patternIds ?? [], sheets: [], url: p.source?.url ?? '', core: !!p.core, built: true, part: cm.part }));
    return { ...cm, built: modules.has(cm.id), lessons: [...plannedLessons, ...extraLessons], problems: [...plannedProblems, ...extraProblems] };
  });
}

export function buildRegistry(input: ContentInput): Registry {
  const catalog = input.catalog ?? EMPTY_CATALOG;
  const modules = indexById('module', input.modules);
  const lessons = indexById('lesson', input.lessons);
  const problems = indexById('problem', input.problems);
  const traces = indexById('trace', input.traces);
  const approachByTrace = new Map<string, Approach>();
  for (const p of input.problems) {
    for (const a of p.approaches) if (a.traceId) approachByTrace.set(a.traceId, a);
  }
  const roadmap = mergeRoadmap(catalog, modules, lessons, problems);
  const allLessons = roadmap.flatMap((m) => m.lessons);
  const allProblems = roadmap.flatMap((m) => m.problems);
  const roadmapById = new Map(roadmap.map((m) => [m.id, m]));
  const lessonById = new Map(allLessons.map((l) => [l.id, l]));
  const problemById = new Map(allProblems.map((p) => [p.id, p]));
  const patternById = new Map(catalog.patterns.map((p) => [p.id, p]));
  const sheetById = new Map(catalog.sheets.map((s) => [s.id as string, s]));
  return {
    modules: [...modules.values()].sort((a, b) => a.order - b.order),
    lessonIds: [...lessons.keys()],
    problemIds: [...problems.keys()],
    module: (id) => modules.get(id),
    lesson: (id) => lessons.get(id),
    problem: (id) => problems.get(id),
    trace: (id) => traces.get(id),
    approachForTrace: (id) => approachByTrace.get(id),
    roadmap,
    allLessons,
    allProblems,
    patterns: catalog.patterns,
    sheets: catalog.sheets,
    roadmapModule: (id) => roadmapById.get(id),
    roadmapLesson: (id) => lessonById.get(id),
    roadmapProblem: (id) => problemById.get(id),
    pattern: (id) => patternById.get(id),
    sheet: (id) => sheetById.get(id),
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

- [ ] **Step 4: Replace `content/index.ts`**

```ts
import type { ContentInput } from '../src/core/registry';
import { catalog } from './catalog';
import { bruteBetterOptimal } from './modules/01-foundations/lessons/brute-better-optimal';
import { foundations } from './modules/01-foundations/module';
import { containsDuplicate } from './modules/01-foundations/problems/contains-duplicate/problem';
import { containsDuplicateBrute, containsDuplicateOptimal } from './modules/01-foundations/problems/contains-duplicate/trace';

export const contentInput: ContentInput = {
  modules: [foundations],
  lessons: [bruteBetterOptimal],
  problems: [containsDuplicate],
  traces: [containsDuplicateBrute, containsDuplicateOptimal],
  catalog,
};
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/unit/core/registry.test.ts && npm test && npm run typecheck`
Expected: `Tests  9 passed (9)` for the registry file, then the whole unit suite passes, and no type errors.

- [ ] **Step 6: Commit (controller only, after review)**

```bash
git add src/core/registry.ts content/index.ts tests/unit/core/registry.test.ts
git commit -m "feat(registry): merge the catalog with built content (Part 1b Task 3)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Store progress fields and the corrupt-backup fix

**Files:**
- Modify (replace the whole file): `src/core/store.ts`
- Test: `tests/unit/core/store.test.ts` (append two `describe` blocks and add `trimDrills` to the import)

**Interfaces:**
- Consumes: the Part 1a store (`createStore`, the 3-way `merge`, `browserStorage`, `memoryStorage`). Their behaviour stays the same.
- Produces (`src/core/store.ts`):
  - `interface LessonProgress { openedAt: number; bestScore: number; total: number; passedAt?: number; updatedAt: number }`
  - `type MarkKey = 'understood' | 'solvedAlone' | 'selfMarkedAlone' | 'canExplain' | 'fromMemory'`, `MARK_KEYS: MarkKey[]`
  - `interface ProblemProgress { marks: Partial<Record<MarkKey, number>>; solvedAt?: number; solvedElsewhere?: number; revealedAt?: number; openedAt?: number; resolveSteps: number; nextResolveAt?: number; updatedAt: number }`
  - `type Box = 1 | 2 | 3 | 4 | 5`, `interface CardProgress { box: Box; dueDay: string; again: number; lastDay: string; updatedAt: number }`
  - `interface DrillAttempt { itemId: string; patternIds: string[]; correct: boolean; at: number }`, `MAX_DRILLS = 1000`
  - `StoredState` gains `lessons`, `problems`, `cards`, `drills` (records) and `days: Record<string, number>`.
  - `trimDrills(drills: Record<string, DrillAttempt>, max = MAX_DRILLS): Record<string, DrillAttempt>` keeps the newest by `at` and returns the same object when nothing is dropped.
  - `normalize()` validates every new field, skips `__proto__` keys, and trims drills.
  - `createStore()` backs up one corrupt value once, not on every read.

- [ ] **Step 1: Write the failing tests**

In `tests/unit/core/store.test.ts`, change the first store import to:

```ts
import { browserStorage, createStore, defaultState, normalize, STORAGE_KEY, trimDrills, type KeyValueStorage, type StorageEventSource } from '../../../src/core/store';
```

Then append:

```ts

describe('progress fields (Part 1b)', () => {
  it('starts empty', () => {
    expect(defaultState()).toMatchObject({ lessons: {}, problems: {}, cards: {}, drills: {}, days: {} });
  });

  it('keeps valid progress and drops bad entries', () => {
    const s = normalize({
      lessons: { a: { openedAt: 1, bestScore: 2, total: 3, passedAt: 4, updatedAt: 4 }, b: { openedAt: 'x', bestScore: 0, total: 3, updatedAt: 1 } },
      problems: {
        p: { marks: { understood: 5, canExplain: 'no', wat: 1 }, solvedAt: 6, resolveSteps: 2, nextResolveAt: 9, revealedAt: 3, updatedAt: 6 },
        q: { marks: {}, resolveSteps: 7, updatedAt: 1 },
        r: { marks: {} },
      },
      cards: {
        'c:hook': { box: 3, dueDay: '2026-11-30', again: 1, lastDay: '2026-11-24', updatedAt: 2 },
        'c:spot': { box: 6, dueDay: '2026-11-30', again: 0, lastDay: '2026-11-24', updatedAt: 2 },
        'c:edges': { box: 1, dueDay: 'tomorrow', again: 0, lastDay: '2026-11-24', updatedAt: 2 },
      },
      drills: { a1: { itemId: 'i', patternIds: ['hashing'], correct: true, at: 10 }, a2: { itemId: 'i', patternIds: [1], correct: true, at: 11 } },
      days: { '2026-11-24': 3, '2026-11-25': 0, 'not-a-day': 2 },
    });
    expect(s.lessons).toEqual({ a: { openedAt: 1, bestScore: 2, total: 3, passedAt: 4, updatedAt: 4 } });
    expect(s.problems.p).toEqual({ marks: { understood: 5 }, solvedAt: 6, resolveSteps: 2, nextResolveAt: 9, revealedAt: 3, updatedAt: 6 });
    expect(s.problems.q?.resolveSteps).toBe(0);
    expect(s.problems.r).toBeUndefined();
    expect(Object.keys(s.cards)).toEqual(['c:hook']);
    expect(Object.keys(s.drills)).toEqual(['a1']);
    expect(s.days).toEqual({ '2026-11-24': 3 });
  });

  it('never lets a stored "__proto__" key change the prototype', () => {
    const s = normalize(JSON.parse('{"code":{"__proto__":{"source":"x","updatedAt":1}},"lessons":{"__proto__":{"openedAt":1,"bestScore":0,"total":3,"updatedAt":1}}}'));
    expect(Object.getPrototypeOf(s.code)).toBe(Object.prototype);
    expect(Object.keys(s.code)).toEqual([]);
    expect(Object.keys(s.lessons)).toEqual([]);
  });

  it('keeps only the newest 1,000 drill attempts', () => {
    const drills: Record<string, unknown> = {};
    for (let i = 0; i < 1005; i++) drills[`a${i}`] = { itemId: 'i', patternIds: [], correct: true, at: i };
    const s = normalize({ drills });
    expect(Object.keys(s.drills)).toHaveLength(1000);
    expect(s.drills.a4).toBeUndefined();
    expect(s.drills.a5).toBeDefined();
    const one = { x: { itemId: 'i', patternIds: [], correct: false, at: 1 } };
    expect(trimDrills(one, 5)).toBe(one);
  });

  it('keeps drill attempts written by two tabs', () => {
    const storage = memory();
    const a = createStore(storage);
    const b = createStore(storage);
    a.update((s) => { s.drills.x = { itemId: 'i', patternIds: ['p'], correct: true, at: 1 }; });
    b.update((s) => { s.drills.y = { itemId: 'j', patternIds: ['p'], correct: false, at: 2 }; });
    expect(Object.keys(JSON.parse(storage.data[STORAGE_KEY]!).drills).sort()).toEqual(['x', 'y']);
  });
});

describe('corrupt data (Part 1a follow-up)', () => {
  it('backs up the same corrupt value only once', () => {
    // Each backup key holds the time. A new time per call makes a second backup visible.
    let t = 0;
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => ++t);
    const storage = memory({ [STORAGE_KEY]: '{not json' });
    const store = createStore(storage);
    store.update((s) => { s.settings.theme = 'light'; });
    clock.mockRestore();
    const backups = Object.keys(storage.data).filter((k) => k.startsWith('dsa:corrupt:'));
    expect(backups).toHaveLength(1);
    expect(storage.data[backups[0]!]).toBe('{not json');
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/unit/core/store.test.ts`
Expected: FAIL. `trimDrills` is not exported, the progress records are missing, and the corrupt value is backed up twice.

- [ ] **Step 3: Replace `src/core/store.ts`**

```ts
export type ThemeSetting = 'system' | 'dark' | 'light';

export interface SavedCode {
  source: string;
  updatedAt: number;
}

/** One lesson's progress. `openedAt` is the last time it was opened. Spec §9.3: done means `passedAt` is set. */
export interface LessonProgress {
  openedAt: number;
  bestScore: number;
  total: number;
  passedAt?: number;
  updatedAt: number;
}

/** Ticks and automatic levels on the problem page (spec §9.1). Each value is the time it was set. */
export type MarkKey = 'understood' | 'solvedAlone' | 'selfMarkedAlone' | 'canExplain' | 'fromMemory';
export const MARK_KEYS: MarkKey[] = ['understood', 'solvedAlone', 'selfMarkedAlone', 'canExplain', 'fromMemory'];

export interface ProblemProgress {
  marks: Partial<Record<MarkKey, number>>;
  /** first time Submit passed every test */
  solvedAt?: number;
  /** first time the learner said they solved it elsewhere */
  solvedElsewhere?: number;
  /** first time Show solutions was pressed */
  revealedAt?: number;
  /** last time the page was opened, for "continue where you left off" */
  openedAt?: number;
  /** re-solves done, 0 to 3 (spec §9.2) */
  resolveSteps: number;
  nextResolveAt?: number;
  updatedAt: number;
}

export type Box = 1 | 2 | 3 | 4 | 5;

/** Leitner state of one flashcard (spec §9.5). Days are local "YYYY-MM-DD" keys. */
export interface CardProgress {
  box: Box;
  dueDay: string;
  again: number;
  lastDay: string;
  updatedAt: number;
}

export interface DrillAttempt {
  itemId: string;
  patternIds: string[];
  correct: boolean;
  at: number;
}

/** Drill attempts kept in storage. Older ones are dropped. */
export const MAX_DRILLS = 1000;

export interface StoredState {
  version: 1;
  settings: { theme: ThemeSetting; updatedAt: number };
  code: Record<string, SavedCode>;
  lessons: Record<string, LessonProgress>;
  problems: Record<string, ProblemProgress>;
  cards: Record<string, CardProgress>;
  /** keyed by attempt id, so two tabs can add attempts without losing each other's */
  drills: Record<string, DrillAttempt>;
  /** activity count per local day, for the streak and the activity grid */
  days: Record<string, number>;
}

export const STORAGE_KEY = 'dsa:v1';

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Anything that sends the browser "storage" event, which fires when another tab writes. */
export interface StorageEventSource {
  addEventListener(type: 'storage', listener: (e: { key: string | null }) => void): void;
}

export interface Store {
  get(): Readonly<StoredState>;
  update(mutator: (draft: StoredState) => void): void;
  subscribe(cb: (s: Readonly<StoredState>) => void): () => void;
}

export function defaultState(): StoredState {
  return { version: 1, settings: { theme: 'system', updatedAt: 0 }, code: {}, lessons: {}, problems: {}, cards: {}, drills: {}, days: {} };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const THEMES: ThemeSetting[] = ['system', 'dark', 'light'];

/** Own entries of a stored record. Skips "__proto__", which would change the object's prototype. */
function entries(v: unknown): [string, unknown][] {
  return isObj(v) ? Object.entries(v).filter(([k]) => k !== '__proto__') : [];
}

function lessonProgress(v: unknown): LessonProgress | null {
  if (!isObj(v) || !isNum(v.openedAt) || !isNum(v.bestScore) || !isNum(v.total) || !isNum(v.updatedAt)) return null;
  const out: LessonProgress = { openedAt: v.openedAt, bestScore: v.bestScore, total: v.total, updatedAt: v.updatedAt };
  if (isNum(v.passedAt)) out.passedAt = v.passedAt;
  return out;
}

function problemProgress(v: unknown): ProblemProgress | null {
  if (!isObj(v) || !isNum(v.updatedAt)) return null;
  const marks: ProblemProgress['marks'] = {};
  for (const k of MARK_KEYS) {
    const t = isObj(v.marks) ? v.marks[k] : undefined;
    if (isNum(t)) marks[k] = t;
  }
  const steps = v.resolveSteps;
  const out: ProblemProgress = { marks, resolveSteps: Number.isInteger(steps) && (steps as number) >= 0 && (steps as number) <= 3 ? (steps as number) : 0, updatedAt: v.updatedAt };
  for (const k of ['solvedAt', 'solvedElsewhere', 'revealedAt', 'openedAt', 'nextResolveAt'] as const) {
    const t = v[k];
    if (isNum(t)) out[k] = t;
  }
  return out;
}

function cardProgress(v: unknown): CardProgress | null {
  if (!isObj(v) || !isDay(v.dueDay) || !isDay(v.lastDay) || !isNum(v.again) || v.again < 0 || !isNum(v.updatedAt)) return null;
  if (![1, 2, 3, 4, 5].includes(v.box as number)) return null;
  return { box: v.box as Box, dueDay: v.dueDay, again: v.again, lastDay: v.lastDay, updatedAt: v.updatedAt };
}

function drillAttempt(v: unknown): DrillAttempt | null {
  if (!isObj(v) || typeof v.itemId !== 'string' || typeof v.correct !== 'boolean' || !isNum(v.at)) return null;
  if (!Array.isArray(v.patternIds) || !v.patternIds.every((p) => typeof p === 'string')) return null;
  return { itemId: v.itemId, patternIds: [...(v.patternIds as string[])], correct: v.correct, at: v.at };
}

/** Keeps the newest `max` attempts. */
export function trimDrills(drills: Record<string, DrillAttempt>, max = MAX_DRILLS): Record<string, DrillAttempt> {
  const list = Object.entries(drills);
  if (list.length <= max) return drills;
  list.sort((a, b) => b[1].at - a[1].at || (a[0] < b[0] ? -1 : 1));
  return Object.fromEntries(list.slice(0, max));
}

export function normalize(raw: unknown): StoredState {
  const state = defaultState();
  if (!isObj(raw)) return state;
  if (isObj(raw.settings)) {
    const t = raw.settings.theme;
    if (typeof t === 'string' && (THEMES as string[]).includes(t)) state.settings.theme = t as ThemeSetting;
    if (typeof raw.settings.updatedAt === 'number') state.settings.updatedAt = raw.settings.updatedAt;
  }
  for (const [id, v] of entries(raw.code)) {
    if (isObj(v) && typeof v.source === 'string' && typeof v.updatedAt === 'number') {
      state.code[id] = { source: v.source, updatedAt: v.updatedAt };
    }
  }
  for (const [id, v] of entries(raw.lessons)) {
    const p = lessonProgress(v);
    if (p) state.lessons[id] = p;
  }
  for (const [id, v] of entries(raw.problems)) {
    const p = problemProgress(v);
    if (p) state.problems[id] = p;
  }
  for (const [id, v] of entries(raw.cards)) {
    const p = cardProgress(v);
    if (p) state.cards[id] = p;
  }
  for (const [id, v] of entries(raw.drills)) {
    const a = drillAttempt(v);
    if (a) state.drills[id] = a;
  }
  state.drills = trimDrills(state.drills);
  for (const [day, n] of entries(raw.days)) {
    if (isDay(day) && isNum(n) && n > 0) state.days[day] = n;
  }
  return state;
}

/**
 * Three-way merge used when writing. `stored` is the JSON in storage, `before` is its normalized
 * copy and `after` is that copy after the change. Only what the change touched is written.
 * Fields this version does not know (from a newer version or another tab) are kept.
 */
function merge(stored: unknown, before: unknown, after: unknown): unknown {
  if (isObj(stored) && isObj(before) && isObj(after)) {
    const out: Record<string, unknown> = { ...stored };
    for (const k of Object.keys(before)) if (!(k in after)) delete out[k];
    for (const [k, v] of Object.entries(after)) out[k] = merge(stored[k], before[k], v);
    return out;
  }
  const unchanged = JSON.stringify(before) === JSON.stringify(after);
  return unchanged && stored !== undefined ? stored : after;
}

/** A store-shaped map in memory, used when the browser blocks storage. */
export function memoryStorage(): KeyValueStorage {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v); } };
}

/** localStorage when the browser allows it. Reading `localStorage` itself throws when cookies are blocked. */
export function browserStorage(win: Pick<Window, 'localStorage'>): KeyValueStorage {
  try {
    const s = win.localStorage;
    s.getItem(STORAGE_KEY);
    return s;
  } catch (err) {
    console.warn('DSA Playbook cannot use browser storage here. Your progress lasts until you close this page.', err);
    return memoryStorage();
  }
}

interface Loaded {
  raw: unknown;
  state: StoredState;
}

export function createStore(storage: KeyValueStorage, win?: StorageEventSource): Store {
  let warnedRead = false;
  /** The corrupt text already copied, so the same bad value is backed up only once. */
  let backedUp: string | null = null;

  /** Reads and normalizes storage. Null means it could not be read or was corrupt. */
  function load(): Loaded | null {
    let text: string | null;
    try {
      text = storage.getItem(STORAGE_KEY);
    } catch (err) {
      if (!warnedRead) console.warn('DSA Playbook could not read saved progress in this browser.', err);
      warnedRead = true;
      return null;
    }
    if (!text) return { raw: undefined, state: defaultState() };
    try {
      const raw: unknown = JSON.parse(text);
      return { raw, state: normalize(raw) };
    } catch {
      if (text !== backedUp) {
        backedUp = text;
        try {
          storage.setItem(`dsa:corrupt:${Date.now()}`, text);
        } catch {
          /* nothing else we can do */
        }
      }
      return null;
    }
  }

  const first = load() ?? { raw: undefined, state: defaultState() };
  let state: StoredState = first.state;
  let lastRaw: unknown = first.raw;
  const listeners = new Set<(s: Readonly<StoredState>) => void>();
  const notify = () => {
    for (const cb of listeners) cb(state);
  };

  function save(value: unknown) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (err) {
      console.warn('DSA Playbook could not save progress in this browser.', err);
    }
  }

  win?.addEventListener('storage', (e) => {
    if (e.key !== null && e.key !== STORAGE_KEY) return;
    const fresh = load();
    if (!fresh) return;
    state = fresh.state;
    lastRaw = fresh.raw;
    notify();
  });

  return {
    get: () => state,
    update(mutator) {
      // Read again first: another tab may have saved since we last looked.
      const fresh = load() ?? { raw: lastRaw, state };
      const draft = structuredClone(fresh.state);
      mutator(draft);
      const out = isObj(fresh.raw) ? merge(fresh.raw, fresh.state, draft) : draft;
      state = draft;
      lastRaw = structuredClone(out);
      save(out);
      notify();
    },
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/unit/core/store.test.ts && npm test && npm run typecheck`
Expected: `Tests  19 passed (19)` for the store file, the whole suite passes, no type errors.

- [ ] **Step 5: Commit (controller only, after review)**

```bash
git add src/core/store.ts tests/unit/core/store.test.ts
git commit -m "feat(store): add lesson, problem, card, drill and day progress (Part 1b Task 4)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Local day keys and the streak

**Files:**
- Create: `src/engine/days.ts`
- Test: `tests/unit/engine/days.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (`src/engine/days.ts`):
  - `DAY_MS = 86_400_000`
  - `dayKey(ms: number): string` (local "YYYY-MM-DD")
  - `isDayKey(s: string): boolean`
  - `addDays(key: string, n: number): string`
  - `daysBetween(a: string, b: string): number`
  - `lastNDays(today: string, n: number): string[]` (oldest first, ends with `today`)
  - `streak(days: Readonly<Record<string, number>>, today: string): number`
  - `formatDay(key: string): string` ("24 Nov 2026", for pages)

- [ ] **Step 1: Write the failing test**

Create `tests/unit/engine/days.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { addDays, dayKey, daysBetween, formatDay, isDayKey, lastNDays, streak } from '../../../src/engine/days';

describe('day keys', () => {
  it('uses the local calendar day', () => {
    expect(dayKey(new Date(2026, 10, 24, 0, 5).getTime())).toBe('2026-11-24');
    expect(dayKey(new Date(2026, 10, 24, 23, 55).getTime())).toBe('2026-11-24');
    expect(dayKey(new Date(2026, 0, 3, 12).getTime())).toBe('2026-01-03');
  });
  it('checks the shape', () => {
    expect(isDayKey('2026-11-24')).toBe(true);
    expect(isDayKey('2026-1-24')).toBe(false);
    expect(isDayKey('today')).toBe(false);
  });
  it('adds days across months, years and leap days', () => {
    expect(addDays('2026-11-24', 1)).toBe('2026-11-25');
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-11-24', 30)).toBe('2026-12-24');
  });
  it('counts days between', () => {
    expect(daysBetween('2026-11-24', '2026-11-24')).toBe(0);
    expect(daysBetween('2026-11-24', '2026-12-01')).toBe(7);
    expect(daysBetween('2026-12-01', '2026-11-24')).toBe(-7);
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
  });
  it('lists the last n days, oldest first', () => {
    expect(lastNDays('2026-11-24', 3)).toEqual(['2026-11-22', '2026-11-23', '2026-11-24']);
    expect(lastNDays('2026-11-24', 84)).toHaveLength(84);
  });
  it('formats a day for people', () => {
    expect(formatDay('2026-11-24')).toBe('24 Nov 2026');
  });
});

describe('streak', () => {
  const today = '2026-11-24';
  it('is 0 with no activity', () => {
    expect(streak({}, today)).toBe(0);
  });
  it('counts days in a row up to today', () => {
    expect(streak({ '2026-11-22': 1, '2026-11-23': 2, '2026-11-24': 1 }, today)).toBe(3);
  });
  it('keeps yesterday\'s streak while today is still empty', () => {
    expect(streak({ '2026-11-22': 1, '2026-11-23': 2 }, today)).toBe(2);
  });
  it('stops at a gap', () => {
    expect(streak({ '2026-11-20': 1, '2026-11-22': 1, '2026-11-23': 1, '2026-11-24': 1 }, today)).toBe(3);
    expect(streak({ '2026-11-21': 4 }, today)).toBe(0);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/engine/days.test.ts`
Expected: FAIL, because `src/engine/days.ts` does not exist.

- [ ] **Step 3: Create `src/engine/days.ts`**

```ts
/** Local-time day keys ("YYYY-MM-DD"). Engines take `now` or a day key, never Date.now(), so tests can pick any time. */

export const DAY_MS = 86_400_000;

const pad = (n: number) => String(n).padStart(2, '0');

/** The learner's local calendar day for a time in ms. */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isDayKey(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function parts(key: string): [number, number, number] {
  const [y, m, d] = key.split('-').map(Number);
  return [y ?? 1970, m ?? 1, d ?? 1];
}

/** The day `n` days after `key` (n may be negative). Works on the calendar, so clock changes do not matter. */
export function addDays(key: string, n: number): string {
  const [y, m, d] = parts(key);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Whole days from `a` to `b`. Positive when b is later. */
export function daysBetween(a: string, b: string): number {
  const [ya, ma, da] = parts(a);
  const [yb, mb, db] = parts(b);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / DAY_MS);
}

/** The last `n` days ending with `today`, oldest first. */
export function lastNDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
}

/**
 * Days in a row with activity. Today counts when it has activity. When today has none yet,
 * the streak still runs up to yesterday, so it does not reset in the morning.
 */
export function streak(days: Readonly<Record<string, number>>, today: string): number {
  let day = (days[today] ?? 0) > 0 ? today : addDays(today, -1);
  let n = 0;
  while ((days[day] ?? 0) > 0) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

/** Shows a day key as "24 Nov 2026". */
export function formatDay(key: string): string {
  const [y, m, d] = parts(key);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/unit/engine/days.test.ts && npm run typecheck`
Expected: `Tests  10 passed (10)`, no type errors.

- [ ] **Step 5: Commit (controller only, after review)**

```bash
git add src/engine/days.ts tests/unit/engine/days.test.ts
git commit -m "feat(engine): add local day keys and the streak (Part 1b Task 5)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Tracker rules for one problem

**Files:**
- Create: `src/engine/tracker.ts`
- Test: `tests/unit/engine/tracker.test.ts`

**Interfaces:**
- Consumes: `ProblemProgress`, `MarkKey` (Task 4), `RunResult` (`src/lab/runner.ts`), `DAY_MS` (Task 5).
- Produces (`src/engine/tracker.ts`), all pure (they return a new object):
  - `RESOLVE_GAPS_DAYS = [3, 7, 21]`
  - `type TickMark = Exclude<MarkKey, 'solvedAlone'>`, `type BaseLevel = 0 | 1 | 2 | 3 | 4`
  - `LEVEL_LABELS` (index 0 to 5: 'Not started', 'Understood', 'Solved alone', 'Can explain', 'Code from memory', 'Spots it elsewhere')
  - `emptyProblemProgress(now: number): ProblemProgress`
  - `isSolved(p?: ProblemProgress): boolean`, `firstSolveAt(p?): number | undefined`, `resolveDue(p: ProblemProgress | undefined, now: number): boolean`
  - `allTestsPassed(result: RunResult): boolean`
  - `recordSubmitPass(prev, now)`, `recordSolvedElsewhere(prev, now)`, `recordReveal(prev, now)`, `recordOpen(prev, now)`, `toggleMark(prev, mark: TickMark, now)`, each `(ProblemProgress | undefined, ...) => ProblemProgress`
  - `baseLevel(p?: ProblemProgress): BaseLevel` (highest tick wins; level 5 is in Task 11)

- [ ] **Step 1: Write the failing test**

Create `tests/unit/engine/tracker.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DAY_MS } from '../../../src/engine/days';
import { allTestsPassed, baseLevel, emptyProblemProgress, firstSolveAt, isSolved, recordOpen, recordReveal, recordSolvedElsewhere, recordSubmitPass, resolveDue, toggleMark } from '../../../src/engine/tracker';

const T0 = new Date(2026, 10, 24, 10).getTime();
const day = (n: number) => T0 + n * DAY_MS;

describe('Submit pass', () => {
  it('sets solvedAt and solved alone when nothing was revealed', () => {
    const p = recordSubmitPass(undefined, T0);
    expect(p.solvedAt).toBe(T0);
    expect(p.marks.solvedAlone).toBe(T0);
    expect(baseLevel(p)).toBe(2);
    expect(isSolved(p)).toBe(true);
  });
  it('does not set solved alone after a peek', () => {
    const p = recordSubmitPass(recordReveal(undefined, T0), day(1));
    expect(p.solvedAt).toBe(day(1));
    expect(p.marks.solvedAlone).toBeUndefined();
    expect(baseLevel(p)).toBe(0);
  });
  it('keeps the first solve time', () => {
    const p = recordSubmitPass(recordSubmitPass(undefined, T0), day(1));
    expect(p.solvedAt).toBe(T0);
  });
  it('does not change the input', () => {
    const before = emptyProblemProgress(T0);
    recordSubmitPass(before, T0);
    expect(before).toEqual(emptyProblemProgress(T0));
  });
});

describe('re-solve schedule (+3, +7, +21 days)', () => {
  it('runs three steps from the first solve', () => {
    let p = recordSubmitPass(undefined, T0);
    expect(p.nextResolveAt).toBe(day(3));
    expect(resolveDue(p, day(2))).toBe(false);
    p = recordSubmitPass(p, day(2));
    expect(p.resolveSteps).toBe(0);
    expect(resolveDue(p, day(3))).toBe(true);
    p = recordSubmitPass(p, day(3));
    expect(p.resolveSteps).toBe(1);
    expect(p.nextResolveAt).toBe(day(7));
    p = recordSubmitPass(p, day(7));
    expect(p.resolveSteps).toBe(2);
    expect(p.nextResolveAt).toBe(day(21));
    p = recordSubmitPass(p, day(22));
    expect(p.resolveSteps).toBe(3);
    expect(p.nextResolveAt).toBeUndefined();
    expect(resolveDue(p, day(100))).toBe(false);
    expect(recordSubmitPass(p, day(101)).resolveSteps).toBe(3);
  });
  it('never makes the next step due sooner than a day later', () => {
    let p = recordSubmitPass(undefined, T0);
    p = recordSubmitPass(p, day(10));
    expect(p.resolveSteps).toBe(1);
    expect(p.nextResolveAt).toBe(day(11));
  });
  it('counts "solved elsewhere" as a solve and starts the schedule', () => {
    let p = recordSolvedElsewhere(undefined, T0);
    expect(isSolved(p)).toBe(true);
    expect(p.solvedAt).toBeUndefined();
    expect(p.nextResolveAt).toBe(day(3));
    expect(baseLevel(p)).toBe(0);
    p = recordSolvedElsewhere(p, day(4));
    expect(p.resolveSteps).toBe(1);
    expect(p.solvedElsewhere).toBe(T0);
    p = recordSubmitPass(p, day(5));
    expect(p.solvedAt).toBe(day(5));
    expect(p.marks.solvedAlone).toBe(day(5));
    expect(p.resolveSteps).toBe(1);
    expect(firstSolveAt(p)).toBe(T0);
  });
});

describe('marks and levels', () => {
  it('toggles ticks, and the highest tick wins', () => {
    let p = toggleMark(undefined, 'understood', T0);
    expect(baseLevel(p)).toBe(1);
    p = toggleMark(p, 'canExplain', T0);
    expect(baseLevel(p)).toBe(3);
    p = toggleMark(p, 'canExplain', T0);
    expect(baseLevel(p)).toBe(1);
    p = toggleMark(p, 'selfMarkedAlone', T0);
    expect(baseLevel(p)).toBe(2);
    p = toggleMark(p, 'fromMemory', T0);
    expect(baseLevel(p)).toBe(4);
  });
  it('records the first peek and the last open', () => {
    let p = recordReveal(undefined, T0);
    p = recordReveal(p, day(1));
    expect(p.revealedAt).toBe(T0);
    p = recordOpen(p, day(2));
    expect(p.openedAt).toBe(day(2));
    expect(p.updatedAt).toBe(day(2));
    expect(baseLevel(undefined)).toBe(0);
  });
});

describe('allTestsPassed', () => {
  const row = (pass: boolean) => ({ id: 'a', kind: 'hidden' as const, pass, input: '', expected: '', actual: '', stdout: '', timeMs: 1 });
  it('needs a full, passing test run', () => {
    expect(allTestsPassed({ kind: 'tests', stdout: '', results: [row(true), row(true)] })).toBe(true);
    expect(allTestsPassed({ kind: 'tests', stdout: '', results: [row(true), row(false)] })).toBe(false);
    expect(allTestsPassed({ kind: 'tests', stdout: '', results: [] })).toBe(false);
    expect(allTestsPassed({ kind: 'timeout', stdout: '', results: [row(true)] })).toBe(false);
    expect(allTestsPassed({ kind: 'compileError', errors: [] })).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/engine/tracker.test.ts`
Expected: FAIL, because `src/engine/tracker.ts` does not exist.

- [ ] **Step 3: Create `src/engine/tracker.ts`**

```ts
import type { MarkKey, ProblemProgress } from '../core/store';
import type { RunResult } from '../lab/runner';
import { DAY_MS } from './days';

/** Re-solve reminders come 3, 7 and 21 days after the first solve (spec §9.2). */
export const RESOLVE_GAPS_DAYS = [3, 7, 21] as const;

/** The marks a learner may tick. `solvedAlone` is set by Submit only. */
export type TickMark = Exclude<MarkKey, 'solvedAlone'>;

export type BaseLevel = 0 | 1 | 2 | 3 | 4;

export const LEVEL_LABELS = ['Not started', 'Understood', 'Solved alone', 'Can explain', 'Code from memory', 'Spots it elsewhere'] as const;

export function emptyProblemProgress(now: number): ProblemProgress {
  return { marks: {}, resolveSteps: 0, updatedAt: now };
}

function copy(p: ProblemProgress | undefined, now: number): ProblemProgress {
  return p ? { ...p, marks: { ...p.marks } } : emptyProblemProgress(now);
}

/** Spec §9.1: solved when Submit passed every test, or when self-marked as solved elsewhere. */
export function isSolved(p: ProblemProgress | undefined): boolean {
  return p !== undefined && (p.solvedAt !== undefined || p.solvedElsewhere !== undefined);
}

/** The first solve, by either way. */
export function firstSolveAt(p: ProblemProgress | undefined): number | undefined {
  if (!p) return undefined;
  const times = [p.solvedAt, p.solvedElsewhere].filter((t): t is number => t !== undefined);
  return times.length ? Math.min(...times) : undefined;
}

export function resolveDue(p: ProblemProgress | undefined, now: number): boolean {
  return p !== undefined && isSolved(p) && p.resolveSteps < 3 && p.nextResolveAt !== undefined && now >= p.nextResolveAt;
}

/**
 * Step `step` (0, 1 or 2) is due 3, 7 or 21 days after the first solve. It is never sooner than
 * one day after now, so a learner who comes back late does not get two re-solves on one day.
 */
function nextResolveAt(first: number, step: number, now: number): number {
  return Math.max(first + (RESOLVE_GAPS_DAYS[step] ?? 0) * DAY_MS, now + DAY_MS);
}

/** Starts the re-solve schedule on the first solve, or completes the next step when it is due. */
function startOrAdvance(p: ProblemProgress, now: number): void {
  const first = firstSolveAt(p);
  if (first === undefined || p.resolveSteps >= 3) return;
  if (p.nextResolveAt === undefined) {
    p.nextResolveAt = nextResolveAt(first, 0, now);
    return;
  }
  if (now < p.nextResolveAt) return;
  p.resolveSteps += 1;
  if (p.resolveSteps < 3) p.nextResolveAt = nextResolveAt(first, p.resolveSteps, now);
  else delete p.nextResolveAt;
}

/** True when a run passed every test. */
export function allTestsPassed(result: RunResult): boolean {
  return result.kind === 'tests' && result.results.length > 0 && result.results.every((t) => t.pass);
}

/** Submit passed every test (spec §9.1, §9.2). */
export function recordSubmitPass(prev: ProblemProgress | undefined, now: number): ProblemProgress {
  const p = copy(prev, now);
  if (p.solvedAt === undefined) {
    p.solvedAt = now;
    if (p.revealedAt === undefined && p.marks.solvedAlone === undefined) p.marks.solvedAlone = now;
  }
  startOrAdvance(p, now);
  p.updatedAt = now;
  return p;
}

/** "I solved this elsewhere". Counts as a solve. Pressed again while a re-solve is due, it completes that step. */
export function recordSolvedElsewhere(prev: ProblemProgress | undefined, now: number): ProblemProgress {
  const p = copy(prev, now);
  if (p.solvedElsewhere === undefined) p.solvedElsewhere = now;
  startOrAdvance(p, now);
  p.updatedAt = now;
  return p;
}

/** The first press of Show solutions counts as a peek. */
export function recordReveal(prev: ProblemProgress | undefined, now: number): ProblemProgress {
  const p = copy(prev, now);
  if (p.revealedAt === undefined) p.revealedAt = now;
  p.updatedAt = now;
  return p;
}

export function recordOpen(prev: ProblemProgress | undefined, now: number): ProblemProgress {
  const p = copy(prev, now);
  p.openedAt = now;
  p.updatedAt = now;
  return p;
}

export function toggleMark(prev: ProblemProgress | undefined, mark: TickMark, now: number): ProblemProgress {
  const p = copy(prev, now);
  if (p.marks[mark] === undefined) p.marks[mark] = now;
  else delete p.marks[mark];
  p.updatedAt = now;
  return p;
}

/** Levels 1 to 4 from the marks. The highest mark wins. Level 5 needs mastery, see mastery.ts. */
export function baseLevel(p: ProblemProgress | undefined): BaseLevel {
  if (!p) return 0;
  const m = p.marks;
  if (m.fromMemory !== undefined) return 4;
  if (m.canExplain !== undefined) return 3;
  if (m.solvedAlone !== undefined || m.selfMarkedAlone !== undefined) return 2;
  if (m.understood !== undefined) return 1;
  return 0;
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/unit/engine/tracker.test.ts && npm run typecheck`
Expected: `Tests  10 passed (10)`, no type errors.

- [ ] **Step 5: Commit (controller only, after review)**

```bash
git add src/engine/tracker.ts tests/unit/engine/tracker.test.ts
git commit -m "feat(engine): add tracker rules and the re-solve schedule (Part 1b Task 6)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Leitner scheduler

**Files:**
- Create: `src/engine/leitner.ts`
- Test: `tests/unit/engine/leitner.test.ts`

**Interfaces:**
- Consumes: `Box`, `CardProgress` (Task 4), `addDays` (Task 5).
- Produces (`src/engine/leitner.ts`):
  - `BOX_DAYS = [1, 3, 7, 14, 30]`
  - `type Rating = 'again' | 'hard' | 'good' | 'easy'`, `RATINGS: Rating[]` (in key order 1 to 4)
  - `rateCard(prev: CardProgress | undefined, rating: Rating, today: string, now: number): CardProgress`
  - `isDue(p: CardProgress | undefined, today: string): boolean`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/engine/leitner.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { CardProgress } from '../../../src/core/store';
import { BOX_DAYS, isDue, rateCard } from '../../../src/engine/leitner';

const today = '2026-11-24';
const at = (box: CardProgress['box'], again = 0): CardProgress => ({ box, dueDay: today, again, lastDay: '2026-11-20', updatedAt: 1 });

describe('rateCard (Leitner, 5 boxes)', () => {
  it('uses the intervals 1, 3, 7, 14 and 30 days', () => {
    expect(BOX_DAYS).toEqual([1, 3, 7, 14, 30]);
  });
  it('starts a new card in box 1', () => {
    expect(rateCard(undefined, 'again', today, 5)).toEqual({ box: 1, dueDay: '2026-11-25', again: 1, lastDay: today, updatedAt: 5 });
    expect(rateCard(undefined, 'hard', today, 5)).toMatchObject({ box: 1, dueDay: '2026-11-25', again: 0 });
    expect(rateCard(undefined, 'good', today, 5)).toMatchObject({ box: 2, dueDay: '2026-11-27' });
    expect(rateCard(undefined, 'easy', today, 5)).toMatchObject({ box: 3, dueDay: '2026-12-01' });
  });
  it('Again sends the card to box 1 and counts it', () => {
    expect(rateCard(at(4, 2), 'again', today, 5)).toMatchObject({ box: 1, dueDay: '2026-11-25', again: 3 });
  });
  it('Hard keeps the box and waits that box\'s interval', () => {
    expect(rateCard(at(3), 'hard', today, 5)).toMatchObject({ box: 3, dueDay: '2026-12-01' });
  });
  it('Good moves up one box, Easy moves up two', () => {
    expect(rateCard(at(2), 'good', today, 5)).toMatchObject({ box: 3, dueDay: '2026-12-01' });
    expect(rateCard(at(2), 'easy', today, 5)).toMatchObject({ box: 4, dueDay: '2026-12-08' });
  });
  it('never goes past box 5', () => {
    expect(rateCard(at(4), 'easy', today, 5)).toMatchObject({ box: 5, dueDay: '2026-12-24' });
    expect(rateCard(at(5), 'good', today, 5)).toMatchObject({ box: 5 });
  });
});

describe('isDue', () => {
  it('treats new cards and past due days as due', () => {
    expect(isDue(undefined, today)).toBe(true);
    expect(isDue({ ...at(2), dueDay: '2026-11-23' }, today)).toBe(true);
    expect(isDue({ ...at(2), dueDay: today }, today)).toBe(true);
    expect(isDue({ ...at(2), dueDay: '2026-11-25' }, today)).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/engine/leitner.test.ts`
Expected: FAIL, because `src/engine/leitner.ts` does not exist.

- [ ] **Step 3: Create `src/engine/leitner.ts`**

```ts
import type { Box, CardProgress } from '../core/store';
import { addDays } from './days';

/** Days until a card in box 1..5 is due again (spec §9.5). */
export const BOX_DAYS = [1, 3, 7, 14, 30] as const;

export type Rating = 'again' | 'hard' | 'good' | 'easy';
export const RATINGS: Rating[] = ['again', 'hard', 'good', 'easy'];

const clampBox = (n: number): Box => Math.min(5, Math.max(1, n)) as Box;

/**
 * Spec §9.5. A new card starts in box 1 the first time it is seen.
 * Again → box 1. Hard → same box. Good → next box. Easy → two boxes up. Box 5 is the top.
 * The card is then due after its new box's interval.
 */
export function rateCard(prev: CardProgress | undefined, rating: Rating, today: string, now: number): CardProgress {
  const box = prev?.box ?? 1;
  const next = rating === 'again' ? 1 : rating === 'hard' ? box : rating === 'good' ? clampBox(box + 1) : clampBox(box + 2);
  return {
    box: next,
    dueDay: addDays(today, BOX_DAYS[next - 1] ?? 1),
    again: (prev?.again ?? 0) + (rating === 'again' ? 1 : 0),
    lastDay: today,
    updatedAt: now,
  };
}

/** New cards are due right away. */
export function isDue(p: CardProgress | undefined, today: string): boolean {
  return p === undefined || p.dueDay <= today;
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/unit/engine/leitner.test.ts && npm run typecheck`
Expected: `Tests  7 passed (7)`, no type errors.

- [ ] **Step 5: Commit (controller only, after review)**

```bash
git add src/engine/leitner.ts tests/unit/engine/leitner.test.ts
git commit -m "feat(engine): add the Leitner flashcard scheduler (Part 1b Task 7)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Flashcard generation and decks

**Files:**
- Create: `src/engine/cards.ts`
- Modify: `src/core/registry.ts` (lazy `cards`)
- Test: `tests/unit/engine/cards.test.ts`

**Interfaces:**
- Consumes: `Lesson`, `Problem`, `Pattern` (content types), `html`, `raw` (`src/core/html.ts`), `CardProgress` (Task 4), `isDue` (Task 7), `Registry` (Task 3).
- Produces (`src/engine/cards.ts`):
  - `type CardKind = 'spot' | 'hook' | 'template' | 'bigo' | 'trap' | 'explain' | 'edges' | 'reallife'`, `KIND_LABEL: Record<CardKind, string>`
  - `interface Card { id: string; kind: CardKind; sourceId: string; moduleId: string; patternIds: string[]; title: string; front: string; back: string; backCode?: string }` (front and back are trusted HTML)
  - `WEAK_DECK_SIZE = 20`, `INTERVIEW_DECK_SIZE = 30`
  - `problemCards(p: Problem): Card[]` (ids `<id>:spot`, `:hook`, `:explain`, `:edges`)
  - `lessonCards(l: Lesson, pattern?: Pattern): Card[]` (ids `<id>:template`, `:bigo-<i>`, `:trap-<i>`, `:reallife-<i>`)
  - `generateCards(lessons: Lesson[], problems: Problem[], patternOfLesson: (lessonId: string) => Pattern | undefined): Card[]`
  - `deckCards(deck: string, cards: Card[], progress: Readonly<Record<string, CardProgress>>, started: ReadonlySet<string>, today: string): Card[] | null` for decks `due`, `weak`, `interview`, `module-<moduleId>`
  - `deckTitle(deck: string, moduleTitle: (moduleId: string) => string | undefined): string | null`
- Produces (`src/core/registry.ts`): `Registry.cards: readonly Card[]`, built once on first read. A lesson card carries its catalog pattern (if any).

- [ ] **Step 1: Write the failing test**

Create `tests/unit/engine/cards.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { contentInput } from '../../../content';
import type { Lesson, Pattern, Problem } from '../../../src/content-types';
import { buildRegistry } from '../../../src/core/registry';
import type { CardProgress } from '../../../src/core/store';
import { deckCards, deckTitle, generateCards, lessonCards, problemCards, type Card } from '../../../src/engine/cards';

const lesson = {
  id: 'l', moduleId: 'm1', title: 'Lesson L', summary: 'Why it works.',
  template: { title: 'Seen set', java: 'Set<Integer> seen = new HashSet<>();' },
  complexityFacts: [{ q: 'Add?', a: 'O(1)', why: 'One bucket.' }, { q: 'Pairs?', a: 'O(n²)', why: 'Two loops.' }],
  traps: [{ looksLike: 'Looks like <b>this</b>.', butIs: 'But it is that.', why: 'Because.' }],
  realLife: [{ text: 'A sign-up form.', tier: 'educational' }],
} as unknown as Lesson;

const problem = {
  id: 'p', moduleId: 'm2', title: 'Problem P', patternIds: ['hashing'],
  statement: '<p>Find a <code>repeat</code>.</p>', limits: ['1 ≤ n ≤ 10'],
  spot: { prompt: 'Which?', options: ['Pairs', 'Seen set'], answer: 1, clues: [{ kind: 'size', text: 'Big n.' }, { kind: 'bottleneck', text: 'Repeated search.' }] },
  approaches: [{ level: 'optimal', time: 'O(n)', space: 'O(n)' }],
  hook: 'Seen it? Set.', explain30: 'Walk once with a set.', edgeCases: ['One item.', 'All same.'],
} as unknown as Problem;

const pattern: Pattern = { id: 'hashing', moduleId: 'm2', lessonId: 'l', title: 'HashSet: seen it before?' };

describe('card generation (spec §9.5)', () => {
  it('makes the four problem cards with stable ids', () => {
    const cards = problemCards(problem);
    expect(cards.map((c) => c.id)).toEqual(['p:spot', 'p:hook', 'p:explain', 'p:edges']);
    expect(cards.every((c) => c.moduleId === 'm2' && c.patternIds[0] === 'hashing' && c.title === 'Problem P')).toBe(true);
    const [spot, hook, explain, edges] = cards as [Card, Card, Card, Card];
    expect(spot.front).toContain('<code>repeat</code>');
    expect(spot.front).toContain('1 ≤ n ≤ 10');
    expect(spot.back).toContain('Seen set');
    expect(spot.back).toContain('Repeated search.');
    expect(hook.back).toContain('Seen it? Set.');
    expect(hook.back).toContain('O(n) time, O(n) space');
    expect(explain.back).toContain('Walk once with a set.');
    expect(edges.back).toContain('<li>All same.</li>');
  });

  it('makes lesson cards, one per list item, numbered from 0', () => {
    const cards = lessonCards(lesson, pattern);
    expect(cards.map((c) => c.id)).toEqual(['l:template', 'l:bigo-0', 'l:bigo-1', 'l:trap-0', 'l:reallife-0']);
    expect(cards[0]!.backCode).toBe('Set<Integer> seen = new HashSet<>();');
    expect(cards[3]!.front).toContain('Looks like &lt;b&gt;this&lt;/b&gt;.');
    expect(cards[4]!.back).toContain('HashSet: seen it before?');
    expect(cards.every((c) => c.patternIds.join() === 'hashing')).toBe(true);
    expect(lessonCards(lesson).every((c) => c.patternIds.length === 0)).toBe(true);
  });

  it('puts lesson cards first', () => {
    expect(generateCards([lesson], [problem], () => pattern).map((c) => c.id)[0]).toBe('l:template');
  });

  it('keeps the ids of the real content', () => {
    const ids = buildRegistry(contentInput).cards.map((c) => c.id);
    expect(ids).toContain('contains-duplicate:spot');
    expect(ids).toContain('brute-better-optimal:trap-1');
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('decks', () => {
  const cards = [...lessonCards(lesson, pattern), ...problemCards(problem)];
  const today = '2026-11-24';
  const p = (dueDay: string, again = 0): CardProgress => ({ box: 2, dueDay, again, lastDay: '2026-11-20', updatedAt: 1 });

  it('shows only cards from started modules', () => {
    expect(deckCards('due', cards, {}, new Set(['m2']), today)!.map((c) => c.id)).toEqual(['p:spot', 'p:hook', 'p:explain', 'p:edges']);
    expect(deckCards('due', cards, {}, new Set(), today)).toEqual([]);
  });

  it('Due today: seen cards that are due, oldest first, then new cards', () => {
    const progress = { 'p:spot': p('2026-11-30'), 'p:hook': p('2026-11-24'), 'p:explain': p('2026-11-20') };
    expect(deckCards('due', cards, progress, new Set(['m2']), today)!.map((c) => c.id)).toEqual(['p:explain', 'p:hook', 'p:edges']);
  });

  it('Weak spots: the most "Again" first', () => {
    const progress = { 'p:spot': p('2026-11-30', 1), 'p:hook': p('2026-11-30', 4), 'l:bigo-0': p('2026-11-30', 2) };
    expect(deckCards('weak', cards, progress, new Set(['m1', 'm2']), today)!.map((c) => c.id)).toEqual(['p:hook', 'l:bigo-0', 'p:spot']);
  });

  it('Interview tomorrow: memory hooks and traps only', () => {
    expect(deckCards('interview', cards, {}, new Set(['m1', 'm2']), today)!.map((c) => c.id)).toEqual(['l:trap-0', 'p:hook']);
  });

  it('By module, and unknown decks', () => {
    expect(deckCards('module-m1', cards, {}, new Set(['m1']), today)!.map((c) => c.kind)).toEqual(['template', 'bigo', 'bigo', 'trap', 'reallife']);
    expect(deckCards('module-m1', cards, {}, new Set(['m2']), today)).toEqual([]);
    expect(deckCards('nope', cards, {}, new Set(['m1']), today)).toBeNull();
  });

  it('titles', () => {
    const title = (id: string) => (id === 'm1' ? 'Module One' : undefined);
    expect(deckTitle('due', title)).toBe('Due today');
    expect(deckTitle('weak', title)).toBe('Weak spots');
    expect(deckTitle('interview', title)).toBe('Interview tomorrow');
    expect(deckTitle('module-m1', title)).toBe('Module: Module One');
    expect(deckTitle('module-zz', title)).toBeNull();
    expect(deckTitle('nope', title)).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/engine/cards.test.ts`
Expected: FAIL, because `src/engine/cards.ts` does not exist.

- [ ] **Step 3: Create `src/engine/cards.ts`**

```ts
import type { Lesson, Pattern, Problem } from '../content-types';
import { html, raw } from '../core/html';
import type { CardProgress } from '../core/store';
import { isDue } from './leitner';

/** The 8 card kinds of spec §9.5. */
export type CardKind = 'spot' | 'hook' | 'template' | 'bigo' | 'trap' | 'explain' | 'edges' | 'reallife';

export const KIND_LABEL: Record<CardKind, string> = {
  spot: 'Spot it', hook: 'Memory hook', template: 'Template', bigo: 'Big-O', trap: 'Trap', explain: 'Explain it', edges: 'Edge cases', reallife: 'Real life',
};

/** A flashcard made from content. Front and back are trusted HTML. */
export interface Card {
  /** `<sourceId>:<kind>`, or `<sourceId>:<kind>-<index>` for list fields. Never shifts. */
  id: string;
  kind: CardKind;
  sourceId: string;
  moduleId: string;
  patternIds: string[];
  /** the lesson or problem title */
  title: string;
  front: string;
  back: string;
  /** Java to show under the back as a code block */
  backCode?: string;
}

export const WEAK_DECK_SIZE = 20;
/** About 10 minutes at about 20 seconds a card. */
export const INTERVIEW_DECK_SIZE = 30;

export function problemCards(p: Problem): Card[] {
  const base = { sourceId: p.id, moduleId: p.moduleId, patternIds: [...p.patternIds], title: p.title };
  const optimal = p.approaches.find((a) => a.level === 'optimal');
  const keyClue = p.spot.clues.find((c) => c.kind === 'bottleneck') ?? p.spot.clues[0];
  return [
    {
      ...base, id: `${p.id}:spot`, kind: 'spot',
      front: html`<div class="card-statement">${raw(p.statement)}</div><ul class="card-limits">${p.limits.map((l) => html`<li><code>${l}</code></li>`)}</ul><p><b>Which idea fits?</b></p>`.__html,
      back: html`<p><b>${p.spot.options[p.spot.answer] ?? ''}</b></p>${keyClue ? html`<p>Key clue: ${keyClue.text}</p>` : null}`.__html,
    },
    {
      ...base, id: `${p.id}:hook`, kind: 'hook',
      front: html`<p><b>${p.title}</b>: what is the memory hook?</p>`.__html,
      back: html`<p><b>${p.hook}</b></p>${optimal ? html`<p>Optimal: ${optimal.time} time, ${optimal.space} space.</p>` : null}`.__html,
    },
    {
      ...base, id: `${p.id}:explain`, kind: 'explain',
      front: html`<p><b>${p.title}</b>: explain the answer in 30 seconds.</p>`.__html,
      back: html`<p>${p.explain30}</p>`.__html,
    },
    {
      ...base, id: `${p.id}:edges`, kind: 'edges',
      front: html`<p><b>${p.title}</b>: name the edge cases.</p>`.__html,
      back: html`<ul>${p.edgeCases.map((e) => html`<li>${e}</li>`)}</ul>`.__html,
    },
  ];
}

export function lessonCards(l: Lesson, pattern?: Pattern): Card[] {
  const base = { sourceId: l.id, moduleId: l.moduleId, patternIds: pattern ? [pattern.id] : [], title: l.title };
  return [
    {
      ...base, id: `${l.id}:template`, kind: 'template',
      front: html`<p>Write the template: <b>${l.template.title}</b></p>`.__html,
      back: html`<p>${l.template.title}</p>`.__html,
      backCode: l.template.java,
    },
    ...l.complexityFacts.map((f, i): Card => ({
      ...base, id: `${l.id}:bigo-${i}`, kind: 'bigo',
      front: html`<p>${f.q}</p>`.__html,
      back: html`<p><b>${f.a}</b></p><p>${f.why}</p>`.__html,
    })),
    ...l.traps.map((t, i): Card => ({
      ...base, id: `${l.id}:trap-${i}`, kind: 'trap',
      front: html`<p>${t.looksLike}</p><p><b>Which idea fits?</b></p>`.__html,
      back: html`<p><b>${t.butIs}</b></p><p>${t.why}</p>`.__html,
    })),
    ...l.realLife.map((r, i): Card => ({
      ...base, id: `${l.id}:reallife-${i}`, kind: 'reallife',
      front: html`<p>${r.text}</p><p><b>Which idea is this?</b></p>`.__html,
      back: html`<p><b>${pattern?.title ?? l.title}</b></p><p>${l.summary}</p>`.__html,
    })),
  ];
}

/** Every card, lessons first, in content order. */
export function generateCards(lessons: Lesson[], problems: Problem[], patternOfLesson: (lessonId: string) => Pattern | undefined): Card[] {
  return [...lessons.flatMap((l) => lessonCards(l, patternOfLesson(l.id))), ...problems.flatMap(problemCards)];
}

/**
 * The cards of one deck. Only cards from started modules appear (spec §9.5).
 * Returns null for a deck name it does not know.
 */
export function deckCards(deck: string, cards: Card[], progress: Readonly<Record<string, CardProgress>>, started: ReadonlySet<string>, today: string): Card[] | null {
  const open = cards.filter((c) => started.has(c.moduleId));
  if (deck === 'due') {
    const due = open.filter((c) => isDue(progress[c.id], today));
    const dueDay = (c: Card) => progress[c.id]?.dueDay ?? '';
    const seen = due.filter((c) => progress[c.id]).sort((a, b) => (dueDay(a) < dueDay(b) ? -1 : dueDay(a) > dueDay(b) ? 1 : 0));
    return [...seen, ...due.filter((c) => !progress[c.id])];
  }
  if (deck === 'weak') {
    const again = (c: Card) => progress[c.id]?.again ?? 0;
    return open.filter((c) => again(c) > 0).sort((a, b) => again(b) - again(a)).slice(0, WEAK_DECK_SIZE);
  }
  if (deck === 'interview') return open.filter((c) => c.kind === 'hook' || c.kind === 'trap').slice(0, INTERVIEW_DECK_SIZE);
  if (deck.startsWith('module-')) {
    const moduleId = deck.slice('module-'.length);
    return open.filter((c) => c.moduleId === moduleId);
  }
  return null;
}

/** The deck's title, or null when the deck or its module does not exist. */
export function deckTitle(deck: string, moduleTitle: (moduleId: string) => string | undefined): string | null {
  if (deck === 'due') return 'Due today';
  if (deck === 'weak') return 'Weak spots';
  if (deck === 'interview') return 'Interview tomorrow';
  if (deck.startsWith('module-')) {
    const title = moduleTitle(deck.slice('module-'.length));
    return title ? `Module: ${title}` : null;
  }
  return null;
}
```

- [ ] **Step 4: Add lazy cards to the registry**

In `src/core/registry.ts`, add this import below the content-types import:

```ts
import { generateCards, type Card } from '../engine/cards';
```

At the end of `interface Registry`, after `sheet(id: string): Sheet | undefined;`, add:

```ts
  /** flashcards made from built lessons and problems, made on first use */
  readonly cards: Card[];
```

In `buildRegistry`, right after the `sheetById` line, add:

```ts
  const patternOfLesson = (lessonId: string) => {
    const patternId = lessonById.get(lessonId)?.patternId;
    return patternId ? patternById.get(patternId) : undefined;
  };
  let cards: Card[] | null = null;
```

In the returned object, after `sheet: (id) => sheetById.get(id),`, add:

```ts
    get cards() {
      cards ??= generateCards(input.lessons, input.problems, patternOfLesson);
      return cards;
    },
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/unit/engine/cards.test.ts && npm test && npm run typecheck`
Expected: `Tests  10 passed (10)` for the cards file, the whole suite passes, no type errors.

- [ ] **Step 6: Commit (controller only, after review)**

```bash
git add src/engine/cards.ts src/core/registry.ts tests/unit/engine/cards.test.ts
git commit -m "feat(engine): generate flashcards from content and build decks (Part 1b Task 8)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Drill engine (items, sessions, accuracy)

**Files:**
- Create: `src/engine/drills.ts`
- Modify: `src/core/registry.ts` (lazy `drills`)
- Test: `tests/unit/engine/drills.test.ts`

**Interfaces:**
- Consumes: `DrillItem`, `Pattern`, `Problem`, `ClueKind` (content types), `html`, `raw`, `DrillAttempt` (Task 4), `Registry` and `ContentInput.drills` (Task 3).
- Produces (`src/engine/drills.ts`):
  - `DRILL_SIZE = 10`, `DRILL_SECONDS = 60`, `MIN_OPTIONS = 4`
  - `mulberry32(seed: number): () => number`, `shuffle<T>(items: readonly T[], rand: () => number): T[]`
  - `problemDrillItem(p: Problem): DrillItem` (id `<problemId>-interview`, prompt = statement + spot prompt, title hidden, accepted = `p.patternIds`)
  - `drillPool(items: DrillItem[], opts: { started: ReadonlySet<string>; moduleId?: string }): DrillItem[]`
  - `attemptsNewestFirst(drills: Readonly<Record<string, DrillAttempt>>): DrillAttempt[]`
  - `patternAccuracy(attempts: DrillAttempt[], patternId: string, last = 10): { right: number; total: number }` (attempts newest first)
  - `isCorrect(item: DrillItem, patternId: string): boolean`
  - `interface DrillOption { patternId: string; title: string }`, `interface DrillQuestion { item: DrillItem; options: DrillOption[] }`
  - `interface SessionInput { items: DrillItem[]; patterns: Pattern[]; moduleOrder: (moduleId: string) => number | undefined; attempts: DrillAttempt[]; seed: number; size?: number }`
  - `buildSession(input: SessionInput): DrillQuestion[]`
- Produces (`src/core/registry.ts`): `Registry.drills: readonly DrillItem[]` = hand-written items, then one generated item per built problem.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/engine/drills.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { contentInput } from '../../../content';
import type { DrillItem, Pattern, Problem } from '../../../src/content-types';
import { buildRegistry } from '../../../src/core/registry';
import type { DrillAttempt } from '../../../src/core/store';
import { attemptsNewestFirst, buildSession, drillPool, isCorrect, mulberry32, patternAccuracy, problemDrillItem, shuffle } from '../../../src/engine/drills';

const patterns: Pattern[] = [
  { id: 'a', moduleId: 'm1', lessonId: 'la', title: 'Pattern A' },
  { id: 'b', moduleId: 'm1', lessonId: 'lb', title: 'Pattern B' },
  { id: 'c', moduleId: 'm2', lessonId: 'lc', title: 'Pattern C' },
  { id: 'd', moduleId: 'm2', lessonId: 'ld', title: 'Pattern D' },
  { id: 'e', moduleId: 'm3', lessonId: 'le', title: 'Pattern E' },
  { id: 'far', moduleId: 'm9', lessonId: 'lf', title: 'Far pattern' },
];
const order = (m: string) => Number(m.slice(1));
const item = (id: string, accepted: string[], moduleId = 'm1'): DrillItem => ({ id, kind: 'reallife', prompt: `<p>${id}</p>`, acceptedPatternIds: accepted, clueExplanation: 'Because.', moduleId });
const attempt = (patternId: string, correct: boolean, at: number): DrillAttempt => ({ itemId: 'x', patternIds: [patternId], correct, at });

describe('seeded helpers', () => {
  it('gives the same numbers for the same seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(a()).toBeGreaterThanOrEqual(0);
    expect(shuffle([1, 2, 3, 4, 5], mulberry32(7))).toEqual(shuffle([1, 2, 3, 4, 5], mulberry32(7)));
    expect(shuffle([1, 2, 3, 4, 5], mulberry32(7)).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('items', () => {
  it('makes an interview item from a built problem, with the title hidden', () => {
    const p = {
      id: 'contains-x', moduleId: 'm1', title: 'Secret Title', patternIds: ['a'], statement: '<p>Find a repeat.</p>', limits: ['n ≤ 10'],
      spot: { prompt: 'Which idea fits <best>?', clues: [{ kind: 'size', text: 'Small n.' }, { kind: 'bottleneck', text: 'Repeated search.' }] },
    } as unknown as Problem;
    const made = problemDrillItem(p);
    expect(made).toEqual({
      id: 'contains-x-interview', kind: 'interview', prompt: '<p>Find a repeat.</p><p><b>Which idea fits &lt;best&gt;?</b></p>', limits: ['n ≤ 10'],
      acceptedPatternIds: ['a'], clueExplanation: 'Size: Small n. Bottleneck: Repeated search.', moduleId: 'm1',
    });
    expect(JSON.stringify(made)).not.toContain('Secret Title');
  });
  it('adds generated items after the hand-written ones in the registry', () => {
    const ids = buildRegistry({ ...contentInput, drills: [item('hand', ['hashing'], 'foundations')] }).drills.map((d) => d.id);
    expect(ids).toEqual(['hand', 'contains-duplicate-interview']);
  });
  it('uses started modules, or one module when scoped', () => {
    const items = [item('x', ['a'], 'm1'), item('y', ['c'], 'm2')];
    expect(drillPool(items, { started: new Set(['m1']) }).map((i) => i.id)).toEqual(['x']);
    expect(drillPool(items, { started: new Set(['m1']), moduleId: 'm2' }).map((i) => i.id)).toEqual(['y']);
    expect(drillPool(items, { started: new Set() })).toEqual([]);
  });
  it('accepts any of the accepted patterns', () => {
    expect(isCorrect(item('x', ['a', 'b']), 'b')).toBe(true);
    expect(isCorrect(item('x', ['a', 'b']), 'c')).toBe(false);
  });
});

describe('accuracy', () => {
  it('counts the last 10 attempts of a pattern, newest first', () => {
    const drills: Record<string, DrillAttempt> = {};
    for (let i = 0; i < 12; i++) drills[`t${i}`] = attempt('a', i >= 2, i);
    drills.other = attempt('b', false, 99);
    const newest = attemptsNewestFirst(drills);
    expect(newest[0]!.at).toBe(99);
    expect(patternAccuracy(newest, 'a')).toEqual({ right: 10, total: 10 });
    expect(patternAccuracy(newest, 'a', 12)).toEqual({ right: 10, total: 12 });
    expect(patternAccuracy(newest, 'zzz')).toEqual({ right: 0, total: 0 });
  });
});

describe('buildSession', () => {
  const items = ['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7', 'i8', 'i9', 'i10', 'i11', 'i12'].map((id, k) => item(id, [k % 2 ? 'a' : 'b']));

  it('picks 10 different items, or fewer when fewer exist', () => {
    const s = buildSession({ items, patterns, moduleOrder: order, attempts: [], seed: 1 });
    expect(s).toHaveLength(10);
    expect(new Set(s.map((q) => q.item.id)).size).toBe(10);
    expect(buildSession({ items: items.slice(0, 3), patterns, moduleOrder: order, attempts: [], seed: 1 })).toHaveLength(3);
    expect(buildSession({ items: [], patterns, moduleOrder: order, attempts: [], seed: 1 })).toEqual([]);
  });

  it('is the same for the same seed', () => {
    const a = buildSession({ items, patterns, moduleOrder: order, attempts: [], seed: 5 });
    const b = buildSession({ items, patterns, moduleOrder: order, attempts: [], seed: 5 });
    expect(a).toEqual(b);
  });

  it('shows the accepted patterns plus near distractors, at least 4 options', () => {
    const [q] = buildSession({ items: [item('x', ['a'])], patterns, moduleOrder: order, attempts: [], seed: 3 });
    expect(q!.options).toHaveLength(4);
    expect(q!.options.map((o) => o.patternId)).toContain('a');
    expect(q!.options.map((o) => o.patternId)).not.toContain('far');
    expect(new Set(q!.options.map((o) => o.patternId)).size).toBe(4);
    const [two] = buildSession({ items: [item('y', ['a', 'c'])], patterns, moduleOrder: order, attempts: [], seed: 3 });
    expect(two!.options).toHaveLength(4);
    expect(two!.options.map((o) => o.title)).toEqual(expect.arrayContaining(['Pattern A', 'Pattern C']));
  });

  it('picks weak patterns more often', () => {
    const attempts: DrillAttempt[] = [];
    for (let i = 0; i < 10; i++) attempts.push(attempt('a', false, 100 - i), attempt('b', true, 50 - i));
    const pool = [...Array.from({ length: 10 }, (_, k) => item(`weak${k}`, ['a'])), ...Array.from({ length: 10 }, (_, k) => item(`strong${k}`, ['b']))];
    let weak = 0;
    for (let seed = 1; seed <= 40; seed++) {
      weak += buildSession({ items: pool, patterns, moduleOrder: order, attempts, seed, size: 5 }).filter((q) => q.item.id.startsWith('weak')).length;
    }
    // Weights are 3 (always wrong) against 1 (always right), so most of the 200 picks are weak items.
    expect(weak).toBeGreaterThan(120);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/engine/drills.test.ts`
Expected: FAIL, because `src/engine/drills.ts` does not exist.

- [ ] **Step 3: Create `src/engine/drills.ts`**

```ts
import type { ClueKind, DrillItem, Pattern, Problem } from '../content-types';
import { html, raw } from '../core/html';
import type { DrillAttempt } from '../core/store';

/** Spec §6.2: 10 items a session, 60 seconds each. */
export const DRILL_SIZE = 10;
export const DRILL_SECONDS = 60;
export const MIN_OPTIONS = 4;

const CLUE_WORD: Record<ClueKind, string> = { size: 'Size', words: 'Words', shape: 'Shape', bottleneck: 'Bottleneck' };

/** A small seeded random number generator, so tests get the same session every time. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** An "interview" item made from a built problem: its statement, spot prompt and limits, with the title hidden. */
export function problemDrillItem(p: Problem): DrillItem {
  return {
    id: `${p.id}-interview`,
    kind: 'interview',
    prompt: html`${raw(p.statement)}<p><b>${p.spot.prompt}</b></p>`.__html,
    limits: [...p.limits],
    acceptedPatternIds: [...p.patternIds],
    clueExplanation: p.spot.clues.map((c) => `${CLUE_WORD[c.kind]}: ${c.text}`).join(' '),
    moduleId: p.moduleId,
  };
}

/** Items from started modules, or from one module when the drill is scoped to it. */
export function drillPool(items: DrillItem[], opts: { started: ReadonlySet<string>; moduleId?: string }): DrillItem[] {
  return items.filter((i) => (opts.moduleId ? i.moduleId === opts.moduleId : opts.started.has(i.moduleId)));
}

export function attemptsNewestFirst(drills: Readonly<Record<string, DrillAttempt>>): DrillAttempt[] {
  return Object.values(drills).sort((a, b) => b.at - a.at);
}

/** Right answers among the last `last` attempts for a pattern. `attempts` must be newest first. */
export function patternAccuracy(attempts: DrillAttempt[], patternId: string, last = 10): { right: number; total: number } {
  const recent = attempts.filter((a) => a.patternIds.includes(patternId)).slice(0, last);
  return { right: recent.filter((a) => a.correct).length, total: recent.length };
}

export function isCorrect(item: DrillItem, patternId: string): boolean {
  return item.acceptedPatternIds.includes(patternId);
}

export interface DrillOption {
  patternId: string;
  title: string;
}

export interface DrillQuestion {
  item: DrillItem;
  options: DrillOption[];
}

export interface SessionInput {
  items: DrillItem[];
  patterns: Pattern[];
  moduleOrder: (moduleId: string) => number | undefined;
  /** newest first */
  attempts: DrillAttempt[];
  seed: number;
  size?: number;
}

/** 0 for a pattern you always get right, 1 for one you always miss, 0.5 when there is no data yet. */
function weakness(attempts: DrillAttempt[], patternId: string): number {
  const { right, total } = patternAccuracy(attempts, patternId);
  return total === 0 ? 0.5 : 1 - right / total;
}

/**
 * Picks up to `size` items, weighted toward weak patterns. Each question shows the accepted patterns
 * plus distractors from other patterns, at least 4 options in all, in a shuffled order.
 */
export function buildSession(input: SessionInput): DrillQuestion[] {
  const rand = mulberry32(input.seed);
  const size = Math.min(input.size ?? DRILL_SIZE, input.items.length);
  const left = input.items.map((item) => ({ item, weight: 1 + 2 * Math.max(0, ...item.acceptedPatternIds.map((id) => weakness(input.attempts, id))) }));
  const picked: DrillItem[] = [];
  while (picked.length < size) {
    const total = left.reduce((s, x) => s + x.weight, 0);
    let r = rand() * total;
    let index = left.findIndex((x) => (r -= x.weight) < 0);
    if (index < 0) index = left.length - 1;
    picked.push(left[index]!.item);
    left.splice(index, 1);
  }
  const byId = new Map(input.patterns.map((p) => [p.id, p]));
  return picked.map((item) => {
    const accepted = item.acceptedPatternIds.map((id) => byId.get(id)).filter((p): p is Pattern => p !== undefined);
    const limit = Math.max(...[item.moduleId, ...accepted.map((p) => p.moduleId)].map((m) => input.moduleOrder(m) ?? 0)) + 3;
    const others = input.patterns.filter((p) => !item.acceptedPatternIds.includes(p.id));
    const near = others.filter((p) => (input.moduleOrder(p.moduleId) ?? Infinity) <= limit);
    const need = Math.max(MIN_OPTIONS, accepted.length + 2) - accepted.length;
    const distractors = shuffle(near.length >= need ? near : others, rand).slice(0, need);
    const options = shuffle([...accepted, ...distractors], rand).map((p) => ({ patternId: p.id, title: p.title }));
    return { item, options };
  });
}
```

- [ ] **Step 4: Add lazy drill items to the registry**

In `src/core/registry.ts`, add this import below the cards import:

```ts
import { problemDrillItem } from '../engine/drills';
```

At the end of `interface Registry`, after the `cards` line, add:

```ts
  /** hand-written drill items, then one "interview" item per built problem, made on first use */
  readonly drills: DrillItem[];
```

In `buildRegistry`, below `let cards: Card[] | null = null;`, add:

```ts
  let drills: DrillItem[] | null = null;
```

In the returned object, after the `get cards()` getter, add:

```ts
    get drills() {
      drills ??= [...(input.drills ?? []), ...input.problems.map(problemDrillItem)];
      return drills;
    },
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/unit/engine/drills.test.ts && npm test && npm run typecheck`
Expected: `Tests  10 passed (10)` for the drills file, the whole suite passes, no type errors.

- [ ] **Step 6: Commit (controller only, after review)**

```bash
git add src/engine/drills.ts src/core/registry.ts tests/unit/engine/drills.test.ts
git commit -m "feat(engine): add Spot-It drill items and weighted sessions (Part 1b Task 9)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Progress actions for pages

**Files:**
- Create: `src/engine/progress.ts`
- Test: `tests/unit/engine/progress.test.ts`

**Interfaces:**
- Consumes: `StoredState`, `DrillAttempt`, `trimDrills` (Task 4), `dayKey` (Task 5), tracker functions and `TickMark` (Task 6), `rateCard`, `Rating` (Task 7).
- Produces (`src/engine/progress.ts`). Each action mutates the `store.update` draft:
  - `bumpDay(d: StoredState, now: number): void`
  - `openLesson(d, lessonId: string, now): void` (counts activity)
  - `quizPassed(score: number, total: number): boolean` (2 of 3 or better)
  - `saveQuizScore(d, lessonId: string, score: number, total: number, now): void` (best score, first `passedAt`)
  - `openProblem(d, problemId, now)`, `revealSolutions(d, problemId, now)` (no activity count)
  - `passSubmit(d, problemId, now)`, `markSolvedElsewhere(d, problemId, now)`, `tickMark(d, problemId, mark: TickMark, now)`
  - `reviewCard(d, cardId: string, rating: Rating, now): void`
  - `recordDrill(d, attemptId: string, attempt: DrillAttempt): void` (trims to 1,000)
  - `newAttemptId(now: number, rand = Math.random): string`
  - `startedModules(state: Readonly<StoredState>, moduleOfLesson: (lessonId: string) => string | undefined): Set<string>`
  - `hasProgress(state: Readonly<StoredState>): boolean`
  - `lastOpened(state: Readonly<StoredState>): { kind: 'lesson' | 'problem'; id: string } | null`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/engine/progress.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { defaultState } from '../../../src/core/store';
import { DAY_MS } from '../../../src/engine/days';
import { bumpDay, hasProgress, lastOpened, markSolvedElsewhere, newAttemptId, openLesson, openProblem, passSubmit, quizPassed, recordDrill, revealSolutions, reviewCard, saveQuizScore, startedModules, tickMark } from '../../../src/engine/progress';

const T0 = new Date(2026, 10, 24, 10).getTime();

describe('lessons', () => {
  it('opening sets openedAt, counts activity and starts the module', () => {
    const d = defaultState();
    openLesson(d, 'l1', T0);
    openLesson(d, 'l1', T0 + 5);
    expect(d.lessons.l1).toEqual({ openedAt: T0 + 5, bestScore: 0, total: 0, updatedAt: T0 + 5 });
    expect(d.days['2026-11-24']).toBe(2);
    expect([...startedModules(d, (id) => (id === 'l1' ? 'm1' : undefined))]).toEqual(['m1']);
  });
  it('passes at 2 of 3 and keeps the best score', () => {
    expect(quizPassed(2, 3)).toBe(true);
    expect(quizPassed(1, 3)).toBe(false);
    expect(quizPassed(0, 0)).toBe(false);
    const d = defaultState();
    openLesson(d, 'l1', T0);
    saveQuizScore(d, 'l1', 1, 3, T0 + 1);
    expect(d.lessons.l1).toMatchObject({ bestScore: 1, total: 3 });
    expect(d.lessons.l1?.passedAt).toBeUndefined();
    saveQuizScore(d, 'l1', 3, 3, T0 + 2);
    saveQuizScore(d, 'l1', 2, 3, T0 + 3);
    expect(d.lessons.l1).toMatchObject({ bestScore: 3, passedAt: T0 + 2 });
  });
});

describe('problems', () => {
  it('records open, reveal, submit, elsewhere and ticks', () => {
    const d = defaultState();
    openProblem(d, 'p', T0);
    expect(d.problems.p?.openedAt).toBe(T0);
    expect(d.days).toEqual({});
    revealSolutions(d, 'p', T0 + 1);
    passSubmit(d, 'p', T0 + 2);
    expect(d.problems.p).toMatchObject({ revealedAt: T0 + 1, solvedAt: T0 + 2, resolveSteps: 0 });
    expect(d.problems.p?.marks.solvedAlone).toBeUndefined();
    tickMark(d, 'p', 'canExplain', T0 + 3);
    expect(d.problems.p?.marks.canExplain).toBe(T0 + 3);
    markSolvedElsewhere(d, 'q', T0);
    expect(d.problems.q?.solvedElsewhere).toBe(T0);
    expect(d.days['2026-11-24']).toBe(3);
  });
});

describe('cards and drills', () => {
  it('rates a card on today\'s key', () => {
    const d = defaultState();
    reviewCard(d, 'p:hook', 'good', T0);
    expect(d.cards['p:hook']).toEqual({ box: 2, dueDay: '2026-11-27', again: 0, lastDay: '2026-11-24', updatedAt: T0 });
  });
  it('adds drill attempts and keeps the newest 1,000', () => {
    const d = defaultState();
    for (let i = 0; i < 1002; i++) recordDrill(d, `a${i}`, { itemId: 'i', patternIds: ['p'], correct: true, at: T0 + i });
    expect(Object.keys(d.drills)).toHaveLength(1000);
    expect(d.drills.a0).toBeUndefined();
    expect(d.days['2026-11-24']).toBe(1002);
  });
  it('makes different attempt ids', () => {
    expect(newAttemptId(T0, () => 0.1)).not.toBe(newAttemptId(T0, () => 0.2));
  });
});

describe('summary helpers', () => {
  it('knows a first-time visitor', () => {
    const d = defaultState();
    expect(hasProgress(d)).toBe(false);
    d.settings.theme = 'light';
    d.code.p = { source: 'x', updatedAt: 1 };
    expect(hasProgress(d)).toBe(false);
    openProblem(d, 'p', T0);
    expect(hasProgress(d)).toBe(true);
  });
  it('finds the last opened lesson or problem', () => {
    const d = defaultState();
    expect(lastOpened(d)).toBeNull();
    openLesson(d, 'l1', T0);
    openProblem(d, 'p', T0 + DAY_MS);
    expect(lastOpened(d)).toEqual({ kind: 'problem', id: 'p' });
    openLesson(d, 'l1', T0 + 2 * DAY_MS);
    expect(lastOpened(d)).toEqual({ kind: 'lesson', id: 'l1' });
  });
  it('counts activity per local day', () => {
    const d = defaultState();
    bumpDay(d, T0);
    bumpDay(d, T0 + DAY_MS);
    expect(d.days).toEqual({ '2026-11-24': 1, '2026-11-25': 1 });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/engine/progress.test.ts`
Expected: FAIL, because `src/engine/progress.ts` does not exist.

- [ ] **Step 3: Create `src/engine/progress.ts`**

```ts
import { trimDrills, type DrillAttempt, type StoredState } from '../core/store';
import { dayKey } from './days';
import { rateCard, type Rating } from './leitner';
import { recordOpen, recordReveal, recordSolvedElsewhere, recordSubmitPass, toggleMark, type TickMark } from './tracker';

/*
 * Changes to progress. Each one takes the draft from `store.update` and the time, so pages stay thin
 * and tests can pass any time. Learning actions also count toward today's activity.
 */

export function bumpDay(d: StoredState, now: number): void {
  const key = dayKey(now);
  d.days[key] = (d.days[key] ?? 0) + 1;
}

/** Spec §9: opening any lesson starts its module. */
export function openLesson(d: StoredState, lessonId: string, now: number): void {
  const prev = d.lessons[lessonId];
  d.lessons[lessonId] = prev ? { ...prev, openedAt: now, updatedAt: now } : { openedAt: now, bestScore: 0, total: 0, updatedAt: now };
  bumpDay(d, now);
}

/** True when the score is at least 2 of 3 (spec §9.3), or the same share of another total. */
export function quizPassed(score: number, total: number): boolean {
  return total > 0 && score * 3 >= total * 2;
}

export function saveQuizScore(d: StoredState, lessonId: string, score: number, total: number, now: number): void {
  const prev = d.lessons[lessonId] ?? { openedAt: now, bestScore: 0, total, updatedAt: now };
  const next = { ...prev, bestScore: Math.max(prev.bestScore, score), total, updatedAt: now };
  if (next.passedAt === undefined && quizPassed(score, total)) next.passedAt = now;
  d.lessons[lessonId] = next;
  bumpDay(d, now);
}

export function openProblem(d: StoredState, problemId: string, now: number): void {
  d.problems[problemId] = recordOpen(d.problems[problemId], now);
}

export function revealSolutions(d: StoredState, problemId: string, now: number): void {
  d.problems[problemId] = recordReveal(d.problems[problemId], now);
}

export function passSubmit(d: StoredState, problemId: string, now: number): void {
  d.problems[problemId] = recordSubmitPass(d.problems[problemId], now);
  bumpDay(d, now);
}

export function markSolvedElsewhere(d: StoredState, problemId: string, now: number): void {
  d.problems[problemId] = recordSolvedElsewhere(d.problems[problemId], now);
  bumpDay(d, now);
}

export function tickMark(d: StoredState, problemId: string, mark: TickMark, now: number): void {
  d.problems[problemId] = toggleMark(d.problems[problemId], mark, now);
  bumpDay(d, now);
}

export function reviewCard(d: StoredState, cardId: string, rating: Rating, now: number): void {
  d.cards[cardId] = rateCard(d.cards[cardId], rating, dayKey(now), now);
  bumpDay(d, now);
}

export function recordDrill(d: StoredState, attemptId: string, attempt: DrillAttempt): void {
  d.drills[attemptId] = attempt;
  d.drills = trimDrills(d.drills);
  bumpDay(d, attempt.at);
}

/** A new id for a drill attempt. Random, so two tabs never pick the same one. */
export function newAttemptId(now: number, rand: () => number = Math.random): string {
  return `${now.toString(36)}-${Math.floor(rand() * 1e9).toString(36)}`;
}

/** Modules with at least one opened lesson (spec §9 "started"). */
export function startedModules(state: Readonly<StoredState>, moduleOfLesson: (lessonId: string) => string | undefined): Set<string> {
  const out = new Set<string>();
  for (const id of Object.keys(state.lessons)) {
    const m = moduleOfLesson(id);
    if (m) out.add(m);
  }
  return out;
}

/** False for a first-time visitor. Settings and saved code do not count. */
export function hasProgress(state: Readonly<StoredState>): boolean {
  return [state.lessons, state.problems, state.cards, state.drills].some((r) => Object.keys(r).length > 0);
}

/** The lesson or problem opened most recently, for "continue where you left off". */
export function lastOpened(state: Readonly<StoredState>): { kind: 'lesson' | 'problem'; id: string } | null {
  let best: { kind: 'lesson' | 'problem'; id: string; at: number } | null = null;
  for (const [id, l] of Object.entries(state.lessons)) if (!best || l.openedAt > best.at) best = { kind: 'lesson', id, at: l.openedAt };
  for (const [id, p] of Object.entries(state.problems)) if (p.openedAt !== undefined && (!best || p.openedAt > best.at)) best = { kind: 'problem', id, at: p.openedAt };
  return best ? { kind: best.kind, id: best.id } : null;
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/unit/engine/progress.test.ts && npm run typecheck`
Expected: `Tests  9 passed (9)`, no type errors.

- [ ] **Step 5: Commit (controller only, after review)**

```bash
git add src/engine/progress.ts tests/unit/engine/progress.test.ts
git commit -m "feat(engine): add progress actions and activity days (Part 1b Task 10)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Mastery and fading

**Files:**
- Create: `src/engine/mastery.ts`
- Test: `tests/unit/engine/mastery.test.ts`

**Interfaces:**
- Consumes: `Pattern`, `StoredState`, `DrillAttempt`, `DAY_MS`, `attemptsNewestFirst`, `patternAccuracy` (Task 9), `baseLevel`, `isSolved` (Task 6).
- Produces (`src/engine/mastery.ts`):
  - `type PatternStatus = 'not-started' | 'learning' | 'practicing' | 'mastered' | 'fading'`
  - `interface MasteryData { patterns: Pattern[]; allProblems: { id: string; patternIds: string[]; core: boolean }[]; cards: { id: string; patternIds: string[] }[] }` (a `Registry` fits it)
  - `FADE_AFTER_DAYS = 30`
  - `lessonDone(state, lessonId: string): boolean`
  - `isMastered(patternId: string, state, data: MasteryData): boolean`
  - `problemLevel(problemId: string, state, data: MasteryData): 0 | 1 | 2 | 3 | 4 | 5`
  - `lastActivity(patternId: string, state, data: MasteryData): number | undefined`
  - `patternStatus(patternId: string, state, data: MasteryData, now: number): PatternStatus`

`state` is `Readonly<StoredState>` everywhere.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/engine/mastery.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { defaultState, type StoredState } from '../../../src/core/store';
import { DAY_MS } from '../../../src/engine/days';
import { isMastered, lastActivity, lessonDone, patternStatus, problemLevel, type MasteryData } from '../../../src/engine/mastery';

const NOW = new Date(2026, 10, 24, 10).getTime();

const data: MasteryData = {
  patterns: [{ id: 'hashing', moduleId: 'm', lessonId: 'set-lesson', title: 'HashSet' }],
  allProblems: [
    { id: 'core1', patternIds: ['hashing'], core: true },
    { id: 'core2', patternIds: ['hashing'], core: true },
    { id: 'extra', patternIds: ['hashing'], core: false },
  ],
  cards: [1, 2, 3, 4, 5].map((n) => ({ id: `c${n}`, patternIds: ['hashing'] })),
};

/** Both core problems at level 3, 8 of the last 10 drills right (d0 and d1 wrong), 4 of 5 cards in box 3. */
function masteredState(at = NOW): StoredState {
  const s = defaultState();
  for (const id of ['core1', 'core2']) s.problems[id] = { marks: { canExplain: at }, solvedAt: at, resolveSteps: 0, updatedAt: at };
  for (let i = 0; i < 10; i++) s.drills[`d${i}`] = { itemId: 'x', patternIds: ['hashing'], correct: i >= 2, at: at - i };
  for (let n = 1; n <= 4; n++) s.cards[`c${n}`] = { box: 3, dueDay: '2026-12-01', again: 0, lastDay: '2026-11-24', updatedAt: at };
  return s;
}

describe('lessonDone and problemLevel', () => {
  it('needs a passed quiz', () => {
    const s = defaultState();
    s.lessons.a = { openedAt: 1, bestScore: 1, total: 3, updatedAt: 1 };
    s.lessons.b = { openedAt: 1, bestScore: 2, total: 3, passedAt: 2, updatedAt: 2 };
    expect(lessonDone(s, 'a')).toBe(false);
    expect(lessonDone(s, 'b')).toBe(true);
    expect(lessonDone(s, 'zzz')).toBe(false);
  });
  it('computes level 5 only at level 4 with the pattern mastered', () => {
    const s = masteredState();
    s.problems.core1!.marks.fromMemory = NOW;
    expect(problemLevel('core1', s, data)).toBe(5);
    expect(problemLevel('core2', s, data)).toBe(3);
    s.drills.d2!.correct = false;
    expect(problemLevel('core1', s, data)).toBe(4);
    expect(problemLevel('none', s, data)).toBe(0);
  });
});

describe('isMastered (spec §9.3)', () => {
  it('holds when all three parts hold', () => {
    expect(isMastered('hashing', masteredState(), data)).toBe(true);
  });
  it('needs every core problem at level 3', () => {
    const s = masteredState();
    s.problems.core2!.marks = { understood: NOW };
    expect(isMastered('hashing', s, data)).toBe(false);
  });
  it('needs 10 drills with 8 right', () => {
    const s = masteredState();
    delete s.drills.d9;
    expect(isMastered('hashing', s, data)).toBe(false);
    const t = masteredState();
    t.drills.d2!.correct = false;
    expect(isMastered('hashing', t, data)).toBe(false);
  });
  it('needs 80% of the cards in box 3 or higher', () => {
    const s = masteredState();
    s.cards.c4!.box = 2;
    expect(isMastered('hashing', s, data)).toBe(false);
  });
  it('is false for a pattern with no core problem', () => {
    expect(isMastered('hashing', masteredState(), { ...data, allProblems: [] })).toBe(false);
  });
});

describe('patternStatus (spec §9.4)', () => {
  it('goes not started → learning → practicing → mastered', () => {
    const s = defaultState();
    expect(patternStatus('hashing', s, data, NOW)).toBe('not-started');
    s.lessons['set-lesson'] = { openedAt: NOW, bestScore: 0, total: 0, updatedAt: NOW };
    expect(patternStatus('hashing', s, data, NOW)).toBe('learning');
    s.problems.extra = { marks: {}, solvedElsewhere: NOW, resolveSteps: 0, updatedAt: NOW };
    expect(patternStatus('hashing', s, data, NOW)).toBe('practicing');
    expect(patternStatus('hashing', masteredState(), data, NOW)).toBe('mastered');
  });
  it('fades after 30 days with no activity', () => {
    const s = masteredState(NOW - 31 * DAY_MS);
    expect(lastActivity('hashing', s, data)).toBe(NOW - 31 * DAY_MS);
    expect(patternStatus('hashing', s, data, NOW)).toBe('fading');
    expect(patternStatus('hashing', s, data, NOW - 2 * DAY_MS)).toBe('mastered');
  });
  it('fades when the last 10 drills drop below 80%', () => {
    const s = masteredState();
    for (let i = 0; i < 3; i++) s.drills[`late${i}`] = { itemId: 'x', patternIds: ['hashing'], correct: false, at: NOW + 1 + i };
    expect(patternStatus('hashing', s, data, NOW + 10)).toBe('fading');
  });
  it('is mastered again after a good run', () => {
    const s = masteredState();
    for (let i = 0; i < 3; i++) s.drills[`late${i}`] = { itemId: 'x', patternIds: ['hashing'], correct: false, at: NOW + 1 + i };
    for (let i = 0; i < 10; i++) s.drills[`again${i}`] = { itemId: 'x', patternIds: ['hashing'], correct: true, at: NOW + 10 + i };
    expect(patternStatus('hashing', s, data, NOW + 30)).toBe('mastered');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/engine/mastery.test.ts`
Expected: FAIL, because `src/engine/mastery.ts` does not exist.

- [ ] **Step 3: Create `src/engine/mastery.ts`**

```ts
import type { Pattern } from '../content-types';
import type { DrillAttempt, StoredState } from '../core/store';
import { DAY_MS } from './days';
import { attemptsNewestFirst, patternAccuracy } from './drills';
import { baseLevel, isSolved } from './tracker';

export type PatternStatus = 'not-started' | 'learning' | 'practicing' | 'mastered' | 'fading';

/** What mastery needs to know about the course. A Registry fits this shape. */
export interface MasteryData {
  patterns: Pattern[];
  allProblems: { id: string; patternIds: string[]; core: boolean }[];
  cards: { id: string; patternIds: string[] }[];
}

export const FADE_AFTER_DAYS = 30;

/** Spec §9.3: a lesson is done when its quiz was passed with at least 2 of 3 right. */
export function lessonDone(state: Readonly<StoredState>, lessonId: string): boolean {
  return state.lessons[lessonId]?.passedAt !== undefined;
}

function corePassed(patternId: string, state: Readonly<StoredState>, data: MasteryData): boolean {
  const core = data.allProblems.filter((p) => p.core && p.patternIds.includes(patternId));
  return core.length > 0 && core.every((p) => baseLevel(state.problems[p.id]) >= 3);
}

/** At least 8 of the last 10 drills right, with at least 10 attempts. `newest` is newest first. */
function drillsPassed(patternId: string, newest: DrillAttempt[]): boolean {
  const { right, total } = patternAccuracy(newest, patternId);
  return total >= 10 && right >= 8;
}

/** At least 80% of the pattern's cards in box 3 or higher. A pattern with no cards passes. */
function cardsPassed(patternId: string, state: Readonly<StoredState>, data: MasteryData): boolean {
  const cards = data.cards.filter((c) => c.patternIds.includes(patternId));
  if (cards.length === 0) return true;
  const high = cards.filter((c) => (state.cards[c.id]?.box ?? 0) >= 3).length;
  return high / cards.length >= 0.8;
}

/** Spec §9.3: all three must hold. */
export function isMastered(patternId: string, state: Readonly<StoredState>, data: MasteryData): boolean {
  return corePassed(patternId, state, data) && drillsPassed(patternId, attemptsNewestFirst(state.drills)) && cardsPassed(patternId, state, data);
}

/** Level 0 to 5 (spec §9.1). Level 5 is never stored: level 4 plus every pattern of the problem mastered. */
export function problemLevel(problemId: string, state: Readonly<StoredState>, data: MasteryData): 0 | 1 | 2 | 3 | 4 | 5 {
  const level = baseLevel(state.problems[problemId]);
  if (level < 4) return level;
  const patternIds = data.allProblems.find((p) => p.id === problemId)?.patternIds ?? [];
  return patternIds.length > 0 && patternIds.every((id) => isMastered(id, state, data)) ? 5 : 4;
}

/** The newest drill, flashcard review or solve for a pattern, in ms. */
export function lastActivity(patternId: string, state: Readonly<StoredState>, data: MasteryData): number | undefined {
  const times: number[] = [];
  for (const a of Object.values(state.drills)) if (a.patternIds.includes(patternId)) times.push(a.at);
  for (const c of data.cards) {
    const p = state.cards[c.id];
    if (p && c.patternIds.includes(patternId)) times.push(p.updatedAt);
  }
  for (const pr of data.allProblems) {
    const p = state.problems[pr.id];
    if (p && pr.patternIds.includes(patternId) && isSolved(p)) times.push(p.updatedAt);
  }
  return times.length ? Math.max(...times) : undefined;
}

/** True when some run of 10 drills in a row for the pattern had 8 or more right. */
function hadGoodRun(patternId: string, newest: DrillAttempt[]): boolean {
  const list = newest.filter((a) => a.patternIds.includes(patternId));
  for (let i = 0; i + 10 <= list.length; i++) {
    if (list.slice(i, i + 10).filter((a) => a.correct).length >= 8) return true;
  }
  return false;
}

/**
 * Spec §9.4 statuses. "Fading" needs to know the pattern was mastered before. The dashboard stores
 * nothing, so this reads it from the drill log: a run of 10 drills with 8 or more right, while the
 * core problems and the cards still pass.
 */
export function patternStatus(patternId: string, state: Readonly<StoredState>, data: MasteryData, now: number): PatternStatus {
  const newest = attemptsNewestFirst(state.drills);
  const core = corePassed(patternId, state, data);
  const cards = cardsPassed(patternId, state, data);
  const drills = drillsPassed(patternId, newest);
  const wasMastered = core && cards && hadGoodRun(patternId, newest);
  const last = lastActivity(patternId, state, data);
  const stale = last === undefined || now - last > FADE_AFTER_DAYS * DAY_MS;
  if (wasMastered && (stale || !drills)) return 'fading';
  if (core && drills && cards) return 'mastered';
  if (data.allProblems.some((p) => p.patternIds.includes(patternId) && isSolved(state.problems[p.id]))) return 'practicing';
  const lessonId = data.patterns.find((p) => p.id === patternId)?.lessonId;
  if (lessonId && state.lessons[lessonId]) return 'learning';
  return 'not-started';
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/unit/engine/mastery.test.ts && npm run typecheck`
Expected: `Tests  11 passed (11)`, no type errors.

- [ ] **Step 5: Commit (controller only, after review)**

```bash
git add src/engine/mastery.ts tests/unit/engine/mastery.test.ts
git commit -m "feat(engine): add mastery, problem levels and fading (Part 1b Task 11)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Dashboard math

**Files:**
- Create: `src/engine/dashboard.ts`
- Test: `tests/unit/engine/dashboard.test.ts`

**Interfaces:**
- Consumes: `RoadmapModule`, `RoadmapLesson`, `RoadmapProblem` (Task 3), `deckCards`, `Card` (Task 8), day helpers (Task 5), `attemptsNewestFirst`, `patternAccuracy` (Task 9), `lessonDone`, `patternStatus`, `PatternStatus` (Task 11), `startedModules` (Task 10), `baseLevel`, `firstSolveAt`, `isSolved`, `resolveDue` (Task 6).
- Produces (`src/engine/dashboard.ts`):
  - `interface DashboardSource { roadmap; allLessons; allProblems; patterns; sheets; cards }` (a `Registry` fits it)
  - `LEVELS: { level: Level; title: string }[]`, `PROBLEM_MINUTES = { easy: 20, medium: 40, hard: 60 }`, `ACTIVITY_DAYS = 84`, `PACE_WINDOW_DAYS = 14`, `PACE_MIN_ACTIVE_DAYS = 3`, `INTERVIEW_SHEET: SheetId = 'neetcode150'`
  - `interface Counter { done: number; total: number; left: number }`
  - `interface PatternBox { id: string; title: string; status: PatternStatus; lessonId: string; lessonBuilt: boolean }`
  - `interface DashboardData { headline; lessons; problems; patterns; hours; levels; patternMap; sheets; interviewReady; weakest; activity; pace; milestones }` (exact field types in the code below)
  - `computeDashboard(state: Readonly<StoredState>, src: DashboardSource, now: number): DashboardData`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/engine/dashboard.test.ts`. Every number is worked out in a comment:

```ts
import { describe, expect, it } from 'vitest';
import type { Catalog, Lesson, Problem } from '../../../src/content-types';
import { buildRegistry } from '../../../src/core/registry';
import { defaultState, type StoredState } from '../../../src/core/store';
import { computeDashboard } from '../../../src/engine/dashboard';
import { addDays, DAY_MS, dayKey } from '../../../src/engine/days';

const NOW = new Date(2026, 10, 24, 10).getTime();
const TODAY = dayKey(NOW);

const catalog: Catalog = {
  modules: [
    { id: 'm1', order: 1, level: 'basics', icon: '🧱', title: 'One', part: '1c' },
    { id: 'm2', order: 2, level: 'core', icon: '📦', title: 'Two', part: '2' },
    { id: 'm3', order: 3, level: 'interview', icon: '🎤', title: 'Three', part: '14' },
  ],
  lessons: [
    { id: 'l1', moduleId: 'm1', title: 'L1', minutes: 20, patternId: 'pa' },
    { id: 'l2', moduleId: 'm1', title: 'L2', minutes: 10 },
    { id: 'l3', moduleId: 'm2', title: 'L3', minutes: 30, patternId: 'pb' },
    { id: 'l4', moduleId: 'm3', title: 'L4', minutes: 15 },
  ],
  patterns: [
    { id: 'pa', moduleId: 'm1', lessonId: 'l1', title: 'Pattern A' },
    { id: 'pb', moduleId: 'm2', lessonId: 'l3', title: 'Pattern B' },
  ],
  problems: [
    { id: 'p1', title: 'P1', moduleId: 'm1', difficulty: 'easy', patternIds: ['pa'], sheets: ['neetcode150'], url: 'https://x/', core: true },
    { id: 'p2', title: 'P2', moduleId: 'm1', difficulty: 'medium', patternIds: ['pa'], sheets: [], url: 'https://x/', core: false },
    { id: 'p3', title: 'P3', moduleId: 'm2', difficulty: 'hard', patternIds: ['pb'], sheets: ['neetcode150', 'striver-bs'], url: 'https://x/', core: true },
  ],
  sheets: [
    { id: 'neetcode150', title: 'NeetCode 150', credit: 'c', problemIds: ['p1', 'p3'] },
    { id: 'striver-bs', title: 'Striver Binary Search', credit: 'c', problemIds: ['p3'] },
  ],
};

const l1 = {
  id: 'l1', moduleId: 'm1', title: 'L1', minutes: 20, summary: 'S.', template: { title: 'T', java: 'x' },
  complexityFacts: [{ q: 'Q', a: 'O(1)', why: 'W' }], traps: [{ looksLike: 'A', butIs: 'B', why: 'C' }], realLife: [{ text: 'R', tier: 'educational' }],
} as unknown as Lesson;
const p1 = {
  id: 'p1', moduleId: 'm1', title: 'P1', patternIds: ['pa'], difficulty: 'easy', core: true, statement: '<p>S</p>', limits: ['n'],
  spot: { prompt: 'Which?', options: ['a'], answer: 0, clues: [] }, approaches: [], hook: 'H', explain30: 'E', edgeCases: ['e'], source: { name: 'x', url: 'https://x/' },
} as unknown as Problem;
const registry = buildRegistry({ modules: [], lessons: [l1], problems: [p1], traces: [], catalog });

function session(): StoredState {
  const s = defaultState();
  s.lessons.l1 = { openedAt: NOW - 3 * DAY_MS, bestScore: 3, total: 3, passedAt: NOW - DAY_MS, updatedAt: NOW - DAY_MS };
  s.lessons.l2 = { openedAt: NOW - 2 * DAY_MS, bestScore: 0, total: 0, updatedAt: NOW - 2 * DAY_MS };
  s.problems.p1 = { marks: { canExplain: NOW - DAY_MS }, solvedAt: NOW - 2 * DAY_MS, resolveSteps: 0, nextResolveAt: NOW + DAY_MS, updatedAt: NOW - DAY_MS };
  for (const n of [0, 1, 2]) s.days[addDays(TODAY, -n)] = 2;
  [true, true, false, true].forEach((correct, i) => { s.drills[`d${i}`] = { itemId: 'i', patternIds: ['pa'], correct, at: NOW - i }; });
  return s;
}

describe('computeDashboard', () => {
  const d = computeDashboard(session(), registry, NOW);

  it('counts "X of Y, Z left" against the whole catalog', () => {
    expect(d.lessons).toEqual({ done: 1, total: 4, left: 3 });
    expect(d.problems).toEqual({ done: 1, total: 3, left: 2 });
    expect(d.patterns).toEqual({ done: 0, total: 2, left: 2 });
    // Total: lessons 20 + 10 + 30 + 15 = 75 min, problems 20 + 40 + 60 = 120 min, so 195 min ≈ 3 h.
    // Done: lesson 20 min + easy problem 20 min = 40 min ≈ 1 h.
    expect(d.hours).toEqual({ done: 1, total: 3, left: 2 });
  });

  it('shows the headline', () => {
    // Module m1 is started. Lesson l1 makes 4 new cards and problem p1 makes 4. No re-solve is due yet.
    expect(d.headline).toEqual({ masteredPct: 0, streak: 3, dueToday: 8 });
  });

  it('shows progress per level', () => {
    expect(d.levels.map((l) => [l.level, l.done, l.total, l.pct])).toEqual([
      ['basics', 2, 4, 50], ['core', 0, 2, 0], ['hard', 0, 0, 0], ['advanced', 0, 0, 0], ['interview', 0, 1, 0],
    ]);
  });

  it('colors the pattern map', () => {
    expect(d.patternMap.map((m) => [m.moduleId, m.patterns.map((p) => [p.id, p.status, p.lessonBuilt])])).toEqual([
      ['m1', [['pa', 'practicing', true]]],
      ['m2', [['pb', 'not-started', false]]],
    ]);
  });

  it('shows sheet progress and both parts of the interview-ready score', () => {
    expect(d.sheets).toEqual([
      { id: 'neetcode150', title: 'NeetCode 150', solved: 1, total: 2 },
      { id: 'striver-bs', title: 'Striver Binary Search', solved: 0, total: 1 },
    ]);
    // NeetCode 150 at level 3 or higher: 1 of 2 = 50%. Last drills: 3 of 4 = 75%. Average: 62.5, shown as 63.
    expect(d.interviewReady).toEqual({ sheetShare: 50, drillAccuracy: 75, drillsCounted: 4, score: 63 });
  });

  it('lists the weakest patterns and the activity grid', () => {
    expect(d.weakest).toEqual([{ id: 'pa', title: 'Pattern A', accuracy: 75, attempts: 4, fading: false }]);
    expect(d.activity).toHaveLength(84);
    expect(d.activity.at(-1)).toEqual({ day: TODAY, count: 2 });
    expect(d.activity[0]!.day).toBe(addDays(TODAY, -83));
  });

  it('estimates a finish day per level from the last 14 days', () => {
    // 2 items done in 14 days. Basics has 2 left: 2 × 14 ÷ 2 = 14 days. Core adds 2 more: 28 days. Interview adds 1: 35 days.
    expect(d.pace).toEqual([
      { level: 'basics', title: 'Basics', left: 2, finishDay: addDays(TODAY, 14) },
      { level: 'core', title: 'Core', left: 2, finishDay: addDays(TODAY, 28) },
      { level: 'hard', title: 'Hard', left: 0, finishDay: null },
      { level: 'advanced', title: 'Advanced', left: 0, finishDay: null },
      { level: 'interview', title: 'Interview', left: 1, finishDay: addDays(TODAY, 35) },
    ]);
  });

  it('says there is not enough data with fewer than 3 active days', () => {
    const s = session();
    delete s.days[addDays(TODAY, -2)];
    expect(computeDashboard(s, registry, NOW).pace).toBeNull();
  });

  it('unlocks a milestone only when every pattern in the level is mastered', () => {
    expect(d.milestones.every((m) => !m.unlocked)).toBe(true);
    const s = session();
    for (let i = 0; i < 10; i++) s.drills[`m${i}`] = { itemId: 'i', patternIds: ['pa'], correct: true, at: NOW + i };
    for (const c of registry.cards) s.cards[c.id] = { box: 3, dueDay: addDays(TODAY, 7), again: 0, lastDay: TODAY, updatedAt: NOW };
    const m = computeDashboard(s, registry, NOW + 20);
    expect(m.milestones.map((x) => [x.title, x.unlocked])).toEqual([
      ['Basics complete', true], ['Core complete', false], ['Hard complete', false], ['Advanced complete', false], ['Interview complete', false],
    ]);
    expect(m.patterns).toEqual({ done: 1, total: 2, left: 1 });
    expect(m.headline.masteredPct).toBe(50);
  });

  it('is all zero for a new learner', () => {
    const z = computeDashboard(defaultState(), registry, NOW);
    expect(z.headline).toEqual({ masteredPct: 0, streak: 0, dueToday: 0 });
    expect(z.interviewReady).toEqual({ sheetShare: 0, drillAccuracy: 0, drillsCounted: 0, score: 0 });
    expect(z.weakest).toEqual([]);
    expect(z.pace).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/engine/dashboard.test.ts`
Expected: FAIL, because `src/engine/dashboard.ts` does not exist.

- [ ] **Step 3: Create `src/engine/dashboard.ts`**

```ts
import type { Level, Pattern, Sheet, SheetId } from '../content-types';
import type { RoadmapLesson, RoadmapModule, RoadmapProblem } from '../core/registry';
import type { StoredState } from '../core/store';
import { deckCards, type Card } from './cards';
import { addDays, DAY_MS, dayKey, lastNDays, streak } from './days';
import { attemptsNewestFirst, patternAccuracy } from './drills';
import { lessonDone, patternStatus, type PatternStatus } from './mastery';
import { startedModules } from './progress';
import { baseLevel, firstSolveAt, isSolved, resolveDue } from './tracker';

/** What the dashboard reads from the course. A Registry fits this shape. */
export interface DashboardSource {
  roadmap: RoadmapModule[];
  allLessons: RoadmapLesson[];
  allProblems: RoadmapProblem[];
  patterns: Pattern[];
  sheets: Sheet[];
  cards: Card[];
}

export const LEVELS: { level: Level; title: string }[] = [
  { level: 'basics', title: 'Basics' },
  { level: 'core', title: 'Core' },
  { level: 'hard', title: 'Hard' },
  { level: 'advanced', title: 'Advanced' },
  { level: 'interview', title: 'Interview' },
];

/** Minutes per problem by difficulty (spec §9.4). */
export const PROBLEM_MINUTES = { easy: 20, medium: 40, hard: 60 } as const;
export const ACTIVITY_DAYS = 84;
export const PACE_WINDOW_DAYS = 14;
export const PACE_MIN_ACTIVE_DAYS = 3;
export const INTERVIEW_SHEET: SheetId = 'neetcode150';

export interface Counter {
  done: number;
  total: number;
  left: number;
}

export interface PatternBox {
  id: string;
  title: string;
  status: PatternStatus;
  lessonId: string;
  lessonBuilt: boolean;
}

export interface DashboardData {
  headline: { masteredPct: number; streak: number; dueToday: number };
  lessons: Counter;
  problems: Counter;
  patterns: Counter;
  /** whole hours */
  hours: Counter;
  levels: { level: Level; title: string; done: number; total: number; pct: number }[];
  patternMap: { moduleId: string; moduleTitle: string; icon: string; patterns: PatternBox[] }[];
  sheets: { id: SheetId; title: string; solved: number; total: number }[];
  /** whole percents */
  interviewReady: { sheetShare: number; drillAccuracy: number; drillsCounted: number; score: number };
  weakest: { id: string; title: string; accuracy: number | null; attempts: number; fading: boolean }[];
  activity: { day: string; count: number }[];
  /** null means "Not enough data yet" */
  pace: { level: Level; title: string; left: number; finishDay: string | null }[] | null;
  milestones: { level: Level; title: string; unlocked: boolean }[];
}

const counter = (done: number, total: number): Counter => ({ done, total, left: total - done });
const pct = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));

/** Every number on the dashboard. It only reads tracker data and stores nothing (spec §9.4). */
export function computeDashboard(state: Readonly<StoredState>, src: DashboardSource, now: number): DashboardData {
  const today = dayKey(now);
  const levelOf = new Map(src.roadmap.map((m) => [m.id, m.level]));
  const moduleOfLesson = new Map(src.allLessons.map((l) => [l.id, l.moduleId]));
  const masteryData = { patterns: src.patterns, allProblems: src.allProblems, cards: src.cards };

  const doneLessons = src.allLessons.filter((l) => lessonDone(state, l.id));
  const solvedProblems = src.allProblems.filter((p) => isSolved(state.problems[p.id]));
  const status = new Map(src.patterns.map((p) => [p.id, patternStatus(p.id, state, masteryData, now)]));
  const mastered = src.patterns.filter((p) => status.get(p.id) === 'mastered').length;

  const minutes = (lessons: RoadmapLesson[], problems: RoadmapProblem[]) =>
    lessons.reduce((s, l) => s + l.minutes, 0) + problems.reduce((s, p) => s + PROBLEM_MINUTES[p.difficulty], 0);
  const totalHours = Math.round(minutes(src.allLessons, src.allProblems) / 60);
  const doneHours = Math.round(minutes(doneLessons, solvedProblems) / 60);

  const started = startedModules(state, (id) => moduleOfLesson.get(id));
  const dueCards = deckCards('due', src.cards, state.cards, started, today)?.length ?? 0;
  const dueResolves = src.allProblems.filter((p) => resolveDue(state.problems[p.id], now)).length;

  const levels = LEVELS.map(({ level, title }) => {
    const lessons = src.allLessons.filter((l) => levelOf.get(l.moduleId) === level);
    const problems = src.allProblems.filter((p) => levelOf.get(p.moduleId) === level);
    const done = lessons.filter((l) => lessonDone(state, l.id)).length + problems.filter((p) => isSolved(state.problems[p.id])).length;
    const total = lessons.length + problems.length;
    return { level, title, done, total, pct: pct(done, total) };
  });

  const builtLessons = new Set(src.allLessons.filter((l) => l.built).map((l) => l.id));
  const patternMap = src.roadmap
    .map((m) => ({
      moduleId: m.id,
      moduleTitle: m.title,
      icon: m.icon,
      patterns: src.patterns
        .filter((p) => p.moduleId === m.id)
        .map((p): PatternBox => ({ id: p.id, title: p.title, status: status.get(p.id) ?? 'not-started', lessonId: p.lessonId, lessonBuilt: builtLessons.has(p.lessonId) })),
    }))
    .filter((m) => m.patterns.length > 0);

  const sheets = src.sheets.map((s) => ({ id: s.id, title: s.title, solved: s.problemIds.filter((id) => isSolved(state.problems[id])).length, total: s.problemIds.length }));

  const newest = attemptsNewestFirst(state.drills);
  const last50 = newest.slice(0, 50);
  const interviewIds = src.sheets.find((s) => s.id === INTERVIEW_SHEET)?.problemIds ?? [];
  const sheetShare = pct(interviewIds.filter((id) => baseLevel(state.problems[id]) >= 3).length, interviewIds.length);
  const drillAccuracy = pct(last50.filter((a) => a.correct).length, last50.length);

  const weakest = src.patterns
    .map((p) => {
      const { right, total } = patternAccuracy(newest, p.id);
      return { id: p.id, title: p.title, accuracy: total ? pct(right, total) : null, attempts: total, fading: status.get(p.id) === 'fading' };
    })
    .filter((w) => w.attempts > 0 || w.fading)
    .sort((a, b) => Number(b.fading) - Number(a.fading) || (a.accuracy ?? 101) - (b.accuracy ?? 101) || b.attempts - a.attempts)
    .slice(0, 5);

  const activity = lastNDays(today, ACTIVITY_DAYS).map((day) => ({ day, count: state.days[day] ?? 0 }));

  const since = now - PACE_WINDOW_DAYS * DAY_MS;
  const activeDays = lastNDays(today, PACE_WINDOW_DAYS).filter((d) => (state.days[d] ?? 0) > 0).length;
  const recent =
    doneLessons.filter((l) => (state.lessons[l.id]?.passedAt ?? 0) >= since).length +
    solvedProblems.filter((p) => (firstSolveAt(state.problems[p.id]) ?? 0) >= since).length;
  let pace: DashboardData['pace'] = null;
  if (activeDays >= PACE_MIN_ACTIVE_DAYS && recent > 0) {
    // Items per day = recent ÷ 14. Days needed = items ahead ÷ that rate, kept in whole numbers to avoid rounding drift.
    let ahead = 0;
    pace = levels.map(({ level, title, done, total }) => {
      const left = total - done;
      ahead += left;
      return { level, title, left, finishDay: left === 0 ? null : addDays(today, Math.ceil((ahead * PACE_WINDOW_DAYS) / recent)) };
    });
  }

  const milestones = LEVELS.map(({ level, title }) => {
    const pats = src.patterns.filter((p) => levelOf.get(p.moduleId) === level);
    const lessons = src.allLessons.filter((l) => levelOf.get(l.moduleId) === level);
    const unlocked = pats.length > 0
      ? pats.every((p) => status.get(p.id) === 'mastered')
      : lessons.length > 0 && lessons.every((l) => lessonDone(state, l.id));
    return { level, title: `${title} complete`, unlocked };
  });

  return {
    headline: { masteredPct: pct(mastered, src.patterns.length), streak: streak(state.days, today), dueToday: dueCards + dueResolves },
    lessons: counter(doneLessons.length, src.allLessons.length),
    problems: counter(solvedProblems.length, src.allProblems.length),
    patterns: counter(mastered, src.patterns.length),
    hours: counter(doneHours, totalHours),
    levels,
    patternMap,
    sheets,
    interviewReady: { sheetShare, drillAccuracy, drillsCounted: last50.length, score: Math.round((sheetShare + drillAccuracy) / 2) },
    weakest,
    activity,
    pace,
    milestones,
  };
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/unit/engine/dashboard.test.ts && npm run typecheck`
Expected: `Tests  10 passed (10)`, no type errors.

- [ ] **Step 5: Commit (controller only, after review)**

```bash
git add src/engine/dashboard.ts tests/unit/engine/dashboard.test.ts
git commit -m "feat(engine): add dashboard math (Part 1b Task 12)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Content check for the catalog, drills and card ids, plus the Foundations drill items

**Files:**
- Create: `tools/card-lock.ts`, `content/drills/foundations.ts`, `tests/tools/card-lock.test.ts`, `content/card-ids.json` (written by a script)
- Modify: `tools/content-check.ts` (imports, and new checks before `checkContent`)
- Modify (replace the whole file): `content/index.ts`
- Modify: `package.json` (one script)
- Test: `tests/tools/content-check.test.ts` (imports, a new `describe` block, the real-content test reads the lock)

**Interfaces:**
- Consumes: `Catalog`, `DrillItem` (Task 1), `catalog` (Task 2), `Registry`, `ContentInput` (Task 3), `Card` (Task 8), `Registry.drills` (Task 9), `stripHtml` (`tools/text.ts`), the existing `prose`, `required`, `safeHtml`, `ID` in `tools/content-check.ts`.
- Produces:
  - `tools/card-lock.ts`: `CARD_LOCK_PATH = 'content/card-ids.json'`, `cardFingerprint(card: Card): string`, `cardFingerprints(cards: Card[]): Record<string, string>`
  - `tools/content-check.ts`: `checkCardIds(cards: Card[], lock: Record<string, string>): Issue[]`, `interface CheckOptions { cardLock?: Record<string, string> }`, and `checkContent(input: ContentInput, opts?: CheckOptions): Issue[]`. New errors cover the catalog (ids, links, core problems, sheets, NeetCode 150 = 150), built items against the catalog, and drill items (writing rules, topic order, known patterns, unique ids). Card id changes are warnings.
  - `foundationsDrills: DrillItem[]` (6 items, 3 real-life and 3 look-alike), wired as `contentInput.drills`.
  - npm script `cards:lock`.

The drill items use only Module 1 ideas. Later ideas appear only in a "You will learn … in Module N" sentence, which the topic-order check allows.

- [ ] **Step 1: Write the failing tests**

In `tests/tools/content-check.test.ts`, replace the first five import lines:

```ts
import { describe, expect, it } from 'vitest';
import { contentInput } from '../../content';
import type { Lesson, Module, Problem } from '../../src/content-types';
import { createRecorder, type TraceDef } from '../../src/engine/trace';
import { checkContent, formatIssues } from '../../tools/content-check';
```

with:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contentInput } from '../../content';
import type { Catalog, DrillItem, Lesson, Module, Problem } from '../../src/content-types';
import { buildRegistry } from '../../src/core/registry';
import { createRecorder, type TraceDef } from '../../src/engine/trace';
import { CARD_LOCK_PATH, cardFingerprints } from '../../tools/card-lock';
import { checkCardIds, checkContent, formatIssues } from '../../tools/content-check';
```

Then replace the start of the real-content block:

```ts
describe('real content', () => {
  it('has no content errors', () => {
    const issues = checkContent(contentInput);
```

with this (a new `describe` block, then the real-content test reading the lock; the rest of that test stays as it is):

```ts
describe('catalog, drill and card checks (Part 1b)', () => {
  const catalog = (): Catalog => ({
    modules: [{ id: 'm', order: 1, level: 'basics', icon: '🧱', title: 'M', part: '1c' }],
    lessons: [{ id: 'l', moduleId: 'm', title: 'L', minutes: 5, patternId: 'hashing' }],
    patterns: [{ id: 'hashing', moduleId: 'm', lessonId: 'l', title: 'HashSet' }],
    problems: [{ id: 'p', title: 'P', moduleId: 'm', difficulty: 'easy', patternIds: ['hashing'], sheets: [], url: 'https://leetcode.com/problems/x/', core: true }],
    sheets: [],
  });
  const drill = (): DrillItem => ({ id: 'd1', kind: 'reallife', prompt: '<p>A plain work task.</p>', acceptedPatternIds: ['hashing'], clueExplanation: 'Words: seen before.', moduleId: 'm' });
  const full = () => ({ ...fixture(), catalog: catalog(), drills: [drill()] });
  const msgs = (f: ReturnType<typeof full>) => checkContent(f).filter((i) => i.level === 'error').map((i) => `${i.where}: ${i.message}`).join('\n');

  it('accepts a matching catalog', () => {
    expect(msgs(full())).toBe('');
  });
  it('needs every built item in the catalog, with the same facts', () => {
    const f = full();
    f.catalog.lessons = [];
    f.catalog.patterns = [];
    f.catalog.problems[0]!.patternIds = [];
    expect(msgs(f)).toContain('lesson l: is not in the catalog');
    const g = full();
    g.problems[0]!.patternIds = ['other'];
    g.problems[0]!.sheets = ['neetcode150'];
    g.problems[0]!.core = false;
    const m = msgs(g);
    expect(m).toContain('problem p: patternIds must match the catalog (hashing)');
    expect(m).toContain('problem p: sheets must match the catalog (none)');
    expect(m).toContain('problem p: core must match the catalog (true)');
    const h = full();
    h.problems[0]!.id = 'q';
    h.modules[0]!.problemIds = ['q'];
    h.lessons[0]!.problemIds = ['q'];
    expect(msgs(h)).toContain('problem q: is not in the catalog');
  });
  it('needs a core problem for every pattern', () => {
    const f = full();
    f.catalog.problems[0]!.core = false;
    f.problems[0]!.core = false;
    expect(msgs(f)).toContain('catalog pattern hashing: needs at least 1 core problem.');
  });
  it('checks sheets', () => {
    const f = full();
    f.catalog.sheets = [{ id: 'neetcode150', title: 'NeetCode 150', credit: 'c', problemIds: ['p', 'ghost'] }];
    const m = msgs(f);
    expect(m).toContain('sheet neetcode150: lists unknown problem "ghost".');
    expect(m).toContain('sheet neetcode150: lists "p", but that problem does not name this sheet.');
    expect(m).toContain('sheet neetcode150: must have exactly 150 problems, has 2.');
  });
  it('checks drill items', () => {
    const f = full();
    f.drills[0]!.clueExplanation = 'Use it — always; trust me.';
    f.drills[0]!.acceptedPatternIds = ['ghost'];
    f.drills.push({ ...drill(), prompt: '<p>Use a sliding window here.</p>' });
    const m = msgs(f);
    expect(m).toContain('drill d1 clueExplanation: uses an em dash');
    expect(m).toContain('drill d1 clueExplanation: uses a semicolon');
    expect(m).toContain('drill d1: accepts unknown pattern "ghost".');
    expect(m).toContain('drill d1: duplicate id.');
    expect(m).toContain('drill d1 prompt: uses "sliding window" (taught in Module 5)');
  });
  it('warns when card ids change', () => {
    const cards = buildRegistry(full()).cards;
    const lock: Record<string, string> = { ...cardFingerprints(cards), 'l:trap-9': 'Gone.' };
    lock['l:trap-0'] = 'Something else.';
    delete lock['p:hook'];
    const warns = checkCardIds(cards, lock).map((i) => `${i.level} ${i.where}: ${i.message}`).join('\n');
    expect(warns).toContain('warn card l:trap-9: is gone');
    expect(warns).toContain('warn card l:trap-0: now shows a different item');
    expect(warns).toContain('warn card p:hook: is new');
    expect(checkCardIds(cards, cardFingerprints(cards))).toEqual([]);
  });
});

describe('real content', () => {
  it('has no content errors', () => {
    const issues = checkContent(contentInput, { cardLock: JSON.parse(readFileSync(CARD_LOCK_PATH, 'utf8')) as Record<string, string> });
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run check:content`
Expected: FAIL. `tools/card-lock.ts` does not exist and `checkCardIds` is not exported.

- [ ] **Step 3: Create `tools/card-lock.ts`**

```ts
import type { Card } from '../src/engine/cards';
import { stripHtml } from './text';

/** Recorded card ids. A card id holds the learner's progress, so ids must never shift. */
export const CARD_LOCK_PATH = 'content/card-ids.json';

/** The start of a card's front in plain words. It shows when an id starts to hold a different item. */
export function cardFingerprint(card: Card): string {
  return stripHtml(card.front).replace(/\s+/g, ' ').trim().slice(0, 80);
}

/** id → fingerprint, sorted by id, ready to save as JSON. */
export function cardFingerprints(cards: Card[]): Record<string, string> {
  return Object.fromEntries([...cards].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).map((c) => [c.id, cardFingerprint(c)]));
}
```

- [ ] **Step 4: Add the new checks to `tools/content-check.ts`**

Replace the import lines at the top:

```ts
import type { Lesson, Module, Problem } from '../src/content-types';
import { buildRegistry, type ContentInput } from '../src/core/registry';
import { parseMarkers } from '../src/engine/markers';
import { argExpression, toJavaLiteral } from '../src/lab/java-literals';
import { countWords, sentences, stripHtml } from './text';
import { TOPIC_TERMS } from './topic-order';
```

with:

```ts
import type { Catalog, Lesson, Module, Problem } from '../src/content-types';
import { buildRegistry, type ContentInput, type Registry } from '../src/core/registry';
import type { Card } from '../src/engine/cards';
import { parseMarkers } from '../src/engine/markers';
import { argExpression, toJavaLiteral } from '../src/lab/java-literals';
import { cardFingerprint } from './card-lock';
import { countWords, sentences, stripHtml } from './text';
import { TOPIC_TERMS } from './topic-order';
```

Then replace the first lines of `checkContent`:

```ts
export function checkContent(input: ContentInput): Issue[] {
  const issues: Issue[] = [];
  try {
    buildRegistry(input);
  } catch (err) {
    return [{ level: 'error', where: 'registry', message: (err as Error).message }];
  }
```

with the new helpers and the new start of `checkContent` (the rest of `checkContent` stays as it is):

```ts
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
```

- [ ] **Step 5: Create `content/drills/foundations.ts`**

```ts
import type { DrillItem } from '../../src/content-types';

/** Hand-written Spot-It items for Module 1. Built problems add their own "interview" items. */
export const foundationsDrills: DrillItem[] = [
  {
    id: 'username-taken',
    kind: 'reallife',
    moduleId: 'foundations',
    prompt: '<p>A sign-up form must reject a username that is already taken. The site has 2 million users. The check must feel instant.</p>',
    acceptedPatternIds: ['hashing'],
    clueExplanation: 'Words: "already taken" means "have I seen this before?". Size: 2 million names are too many to scan on every sign-up. A HashSet of names answers in about one step on average.',
  },
  {
    id: 'ticket-scanned-twice',
    kind: 'reallife',
    moduleId: 'foundations',
    prompt: '<p>A train gate scans tickets all day. It must beep when the same ticket is scanned a second time.</p>',
    acceptedPatternIds: ['hashing'],
    clueExplanation: 'Words: "a second time" is a repeat check. Bottleneck: searching every earlier scan again is the repeated work. Keep the scanned ticket numbers in a HashSet.',
  },
  {
    id: 'guests-both-days',
    kind: 'reallife',
    moduleId: 'foundations',
    prompt: '<p>You have the guest list from Saturday and the guest list from Sunday. Each list has 50,000 names. Find the guests who came on both days.</p>',
    acceptedPatternIds: ['hashing'],
    clueExplanation: 'Size: 50,000 × 50,000 pair checks is 2.5 billion, which is too slow. Bottleneck: for each Sunday guest you search Saturday again. Put the Saturday names in a HashSet, then check each Sunday name.',
  },
  {
    id: 'repeat-or-most',
    kind: 'lookalike',
    moduleId: 'foundations',
    prompt: '<p><b>Task A:</b> Does any number in the list appear twice?</p><p><b>Task B:</b> Which number appears the most times?</p><p>Which idea fits <b>Task B</b>?</p>',
    acceptedPatternIds: ['counting'],
    clueExplanation: 'Task A only needs yes or no, so a HashSet is enough. Task B needs how many times each number appears. A HashMap from number to count gives that in one pass. You will learn counting with a HashMap in Module 3.',
  },
  {
    id: 'repeat-or-near-repeat',
    kind: 'lookalike',
    moduleId: 'foundations',
    prompt: '<p><b>Task A:</b> Does any number appear twice anywhere in the list?</p><p><b>Task B:</b> Are two equal numbers at most k places apart?</p><p>Which idea fits <b>Task B</b>?</p>',
    acceptedPatternIds: ['fixed-window'],
    clueExplanation: 'Words: "at most k places apart" means only nearby numbers count. Keep a HashSet of just the last k numbers, and drop the oldest as you move. You will learn this as the sliding window in Module 5.',
  },
  {
    id: 'repeat-or-pair-sum',
    kind: 'lookalike',
    moduleId: 'foundations',
    prompt: '<p><b>Task A:</b> Does any number appear twice?</p><p><b>Task B:</b> Do any two numbers add up to a target?</p><p>Which idea fits <b>Task B</b>?</p>',
    acceptedPatternIds: ['partner-lookup'],
    clueExplanation: 'Bottleneck: for each number, the slow way searches the list for its partner, which is the target minus the number. A HashMap of the numbers seen so far finds the partner in about one step. You will learn this partner lookup in Module 3.',
  },
];
```

- [ ] **Step 6: Replace `content/index.ts`**

```ts
import type { ContentInput } from '../src/core/registry';
import { catalog } from './catalog';
import { foundationsDrills } from './drills/foundations';
import { bruteBetterOptimal } from './modules/01-foundations/lessons/brute-better-optimal';
import { foundations } from './modules/01-foundations/module';
import { containsDuplicate } from './modules/01-foundations/problems/contains-duplicate/problem';
import { containsDuplicateBrute, containsDuplicateOptimal } from './modules/01-foundations/problems/contains-duplicate/trace';

export const contentInput: ContentInput = {
  modules: [foundations],
  lessons: [bruteBetterOptimal],
  problems: [containsDuplicate],
  traces: [containsDuplicateBrute, containsDuplicateOptimal],
  catalog,
  drills: [...foundationsDrills],
};
```

- [ ] **Step 7: Add the lock writer and record the card ids**

Create `tests/tools/card-lock.test.ts`:

```ts
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { contentInput } from '../../content';
import { buildRegistry } from '../../src/core/registry';
import { CARD_LOCK_PATH, cardFingerprints } from '../../tools/card-lock';

// Runs only through `npm run cards:lock`, which sets CARDS_LOCK=write.
it.runIf(process.env.CARDS_LOCK === 'write')('records every card id in content/card-ids.json', () => {
  writeFileSync(CARD_LOCK_PATH, `${JSON.stringify(cardFingerprints(buildRegistry(contentInput).cards), null, 2)}\n`);
});
```

In `package.json`, add this script right after `"build:catalog"`:

```json
    "cards:lock": "CARDS_LOCK=write vitest run -c vitest.tools.config.ts card-lock",
```

Run: `npm run cards:lock`
Expected: `Tests  1 passed (1)`, and `content/card-ids.json` now holds exactly:

```json
{
  "brute-better-optimal:bigo-0": "HashSet add or contains: how fast?",
  "brute-better-optimal:bigo-1": "Checking every pair of n numbers?",
  "brute-better-optimal:bigo-2": "Putting n numbers in order with Arrays.sort?",
  "brute-better-optimal:reallife-0": "A sign-up form checks if a username is taken. It looks in a set of names, not th",
  "brute-better-optimal:reallife-1": "Java’s HashSet keeps values in buckets chosen by hash code. Add and contains tak",
  "brute-better-optimal:template": "Write the template: Seen before? Use a HashSet",
  "brute-better-optimal:trap-0": "\"Find the duplicate number\", but you may not change the array or use extra memor",
  "brute-better-optimal:trap-1": "\"Are two equal numbers at most k places apart?\" Which idea fits?",
  "contains-duplicate:edges": "Contains Duplicate: name the edge cases.",
  "contains-duplicate:explain": "Contains Duplicate: explain the answer in 30 seconds.",
  "contains-duplicate:hook": "Contains Duplicate: what is the memory hook?",
  "contains-duplicate:spot": "You get an array of whole numbers called . The numbers can be negative. Return i"
}
```

- [ ] **Step 8: Run the checks**

Run: `npm run check:content && npm test && npm run typecheck`
Expected: `Tests  21 passed (21)` for the content check with no `WARN` lines, the unit suite passes, no type errors.

- [ ] **Step 9: Commit (controller only, after review)**

```bash
git add tools/card-lock.ts tools/content-check.ts content/drills/foundations.ts content/index.ts content/card-ids.json tests/tools/card-lock.test.ts tests/tools/content-check.test.ts package.json
git commit -m "feat(check): check the catalog, drill items and card ids (Part 1b Task 13)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Router for the new pages

**Files:**
- Modify (replace the whole file): `src/core/router.ts`
- Test: `tests/unit/core/router.test.ts` (more cases)

**Interfaces:**
- Consumes: nothing new.
- Produces (`src/core/router.ts`):
  - `Route` gains `{ name: 'dashboard' }`, `{ name: 'roadmap' }`, `{ name: 'settings' }`, `{ name: 'drills'; moduleId?: string }`, `{ name: 'cards'; deck?: string }`, `{ name: 'sheet'; id: string }`.
  - `parseRoute(hash)` reads `#/dashboard`, `#/roadmap`, `#/settings`, `#/drills`, `#/drills/<moduleId>`, `#/cards`, `#/cards/<deck>`, `#/sheets/<sheetId>` (trailing slash allowed, ids kebab-case).
  - `href(route)` builds each of them. `startRouter` is unchanged.
- The pages for these routes come in Tasks 17 to 21. Task 22 wires them into `renderRoute`. Until then they show "Page not found", which is fine because nothing links to them yet.

- [ ] **Step 1: Write the failing tests**

In `tests/unit/core/router.test.ts`, replace the end of the `parseRoute` table:

```ts
    ['#/x/y', { name: 'notFound', path: '/x/y' }],
    ['#/l/Bad_Id', { name: 'notFound', path: '/l/Bad_Id' }],
  ])('%s', (hash, route) => {
```

with:

```ts
    ['#/x/y', { name: 'notFound', path: '/x/y' }],
    ['#/l/Bad_Id', { name: 'notFound', path: '/l/Bad_Id' }],
    ['#/dashboard', { name: 'dashboard' }],
    ['#/roadmap/', { name: 'roadmap' }],
    ['#/settings', { name: 'settings' }],
    ['#/drills', { name: 'drills' }],
    ['#/drills/foundations', { name: 'drills', moduleId: 'foundations' }],
    ['#/drills/Bad_Id', { name: 'notFound', path: '/drills/Bad_Id' }],
    ['#/cards', { name: 'cards' }],
    ['#/cards/due', { name: 'cards', deck: 'due' }],
    ['#/cards/module-foundations', { name: 'cards', deck: 'module-foundations' }],
    ['#/sheets/neetcode150', { name: 'sheet', id: 'neetcode150' }],
    ['#/sheets/', { name: 'notFound', path: '/sheets/' }],
    ['#/m/a?x=1', { name: 'notFound', path: '/m/a?x=1' }],
  ])('%s', (hash, route) => {
```

And replace the end of the `href` test:

```ts
    expect(href({ name: 'problem', id: 'c' })).toBe('#/p/c');
  });
```

with:

```ts
    expect(href({ name: 'problem', id: 'c' })).toBe('#/p/c');
    expect(href({ name: 'dashboard' })).toBe('#/dashboard');
    expect(href({ name: 'roadmap' })).toBe('#/roadmap');
    expect(href({ name: 'settings' })).toBe('#/settings');
    expect(href({ name: 'drills' })).toBe('#/drills');
    expect(href({ name: 'drills', moduleId: 'm1' })).toBe('#/drills/m1');
    expect(href({ name: 'cards' })).toBe('#/cards');
    expect(href({ name: 'cards', deck: 'due' })).toBe('#/cards/due');
    expect(href({ name: 'sheet', id: 'striver-bs' })).toBe('#/sheets/striver-bs');
  });
  it('round-trips every route', () => {
    for (const h of ['#/', '#/dashboard', '#/roadmap', '#/settings', '#/drills', '#/drills/m1', '#/cards', '#/cards/weak', '#/sheets/neetcode150', '#/m/a', '#/l/b', '#/p/c']) {
      const r = parseRoute(h);
      expect(r.name, h).not.toBe('notFound');
      expect(href(r as Exclude<typeof r, { name: 'notFound' }>)).toBe(h);
    }
  });
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/unit/core/router.test.ts`
Expected: FAIL. `#/dashboard` parses as `notFound`, and TypeScript rejects `href({ name: 'dashboard' })`.

- [ ] **Step 3: Replace `src/core/router.ts`**

```ts
export type Route =
  | { name: 'home' }
  | { name: 'dashboard' }
  | { name: 'roadmap' }
  | { name: 'settings' }
  | { name: 'drills'; moduleId?: string }
  | { name: 'cards'; deck?: string }
  | { name: 'sheet'; id: string }
  | { name: 'module'; id: string }
  | { name: 'lesson'; id: string }
  | { name: 'problem'; id: string }
  | { name: 'notFound'; path: string };

const ITEM = /^\/(m|l|p|sheets|cards|drills)\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/;
const PAGES: Record<string, Route> = {
  '/dashboard': { name: 'dashboard' },
  '/roadmap': { name: 'roadmap' },
  '/settings': { name: 'settings' },
  '/cards': { name: 'cards' },
  '/drills': { name: 'drills' },
};

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  if (path === '/') return { name: 'home' };
  const page = PAGES[path.replace(/\/$/, '')];
  if (page) return page;
  const m = ITEM.exec(path);
  if (m) {
    const id = m[2] as string;
    switch (m[1]) {
      case 'm':
        return { name: 'module', id };
      case 'l':
        return { name: 'lesson', id };
      case 'sheets':
        return { name: 'sheet', id };
      case 'cards':
        return { name: 'cards', deck: id };
      case 'drills':
        return { name: 'drills', moduleId: id };
      default:
        return { name: 'problem', id };
    }
  }
  return { name: 'notFound', path };
}

export function href(route: Exclude<Route, { name: 'notFound' }>): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'dashboard':
      return '#/dashboard';
    case 'roadmap':
      return '#/roadmap';
    case 'settings':
      return '#/settings';
    case 'drills':
      return route.moduleId ? `#/drills/${route.moduleId}` : '#/drills';
    case 'cards':
      return route.deck ? `#/cards/${route.deck}` : '#/cards';
    case 'sheet':
      return `#/sheets/${route.id}`;
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

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/unit/core/router.test.ts && npm test && npm run typecheck`
Expected: `Tests  23 passed (23)` for the router file, the whole suite passes, no type errors.

- [ ] **Step 5: Commit (controller only, after review)**

```bash
git add src/core/router.ts tests/unit/core/router.test.ts
git commit -m "feat(router): add dashboard, roadmap, drills, cards, sheets and settings routes (Part 1b Task 14)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Lesson progress, scenario questions and the module page

**Files:**
- Create: `src/pages/clock.ts`, `src/pages/progress-tags.ts`, `src/styles/progress.css`
- Modify (replace the whole file): `src/pages/module-page.ts`, `src/pages/lesson-page.ts`
- Modify: `src/engine/quiz.ts` (append `mountScenarios`), `src/pages/router-view.ts` (`now` in the context, module route), `src/styles/index.css` (one import)
- Test: `tests/unit/pages/module-page.test.ts` (new), `tests/unit/pages/lesson-page.test.ts` (append a block)

**Interfaces:**
- Consumes: `openLesson`, `saveQuizScore`, `quizPassed` (Task 10), `lessonDone`, `problemLevel` (Task 11), `isSolved`, `LEVEL_LABELS` (Task 6), `Registry.roadmapModule` (Task 3), `href({ name: 'drills', moduleId })` (Task 14).
- Produces:
  - `PageContext` gains `now?: () => number`.
  - `clockOf(ctx: { now?: () => number }): () => number` (`src/pages/clock.ts`).
  - `comingTag(part: string): SafeHtml`, `lessonTag(state, lessonId): SafeHtml | null`, `problemTag(state, problemId, registry): SafeHtml | null` (`src/pages/progress-tags.ts`), reused by Tasks 16, 17.
  - `mountScenarios(host: HTMLElement, questions: ScenarioQuestion[], onMark?: (right: number, marked: number) => void): () => void`. Test ids `scenario-show`, `scenario-right`, `scenario-wrong`.
  - `renderModule(m: Module, registry: Registry, state?: Readonly<StoredState>): SafeHtml` (the old two-argument call still works) and `mountModulePage(host: HTMLElement, m: Module, ctx: PageContext): () => void`. Test ids `module-progress`, `module-drill`. The quiz section `#module-quiz` is left out when the quiz is empty.
  - The lesson page opens the lesson on mount, shows `[data-testid="lesson-status"]`, saves each quiz score and offers `[data-testid="quiz-retry"]`.
  - CSS classes `.button`, `.tag-done`, `.tag-coming`, `.planned`, `.scenario*`.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/pages/module-page.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Catalog, Lesson, Module, Problem } from '../../../src/content-types';
import { buildRegistry } from '../../../src/core/registry';
import { createStore } from '../../../src/core/store';
import { mountScenarios } from '../../../src/engine/quiz';
import { mountModulePage, renderModule } from '../../../src/pages/module-page';

const memStore = () => { const d: Record<string, string> = {}; return createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }); };
const runner = { ready: async () => {}, run: async () => ({ kind: 'runnerUnavailable' as const, reason: '' }), stop() {} };

const mod: Module = {
  id: 'm', order: 1, level: 'basics', icon: '🧱', title: 'Mod', summary: 'Sum.', status: 'building', outcomes: ['Do it.'], lessonIds: ['l1'], problemIds: ['p1'],
  quiz: [
    { q: 'Pick b', options: ['a', 'b'], answer: 1, why: 'Because.' },
    { type: 'scenario', q: 'A work task.', answer: 'Use a set.' },
  ],
  cheatsheet: [], glossary: [],
};
const catalog: Catalog = {
  modules: [{ id: 'm', order: 1, level: 'basics', icon: '🧱', title: 'Mod', part: '1c' }],
  lessons: [{ id: 'l1', moduleId: 'm', title: 'L1', minutes: 10 }, { id: 'l2', moduleId: 'm', title: 'Planned lesson', minutes: 15 }],
  patterns: [],
  problems: [
    { id: 'p1', title: 'P1', moduleId: 'm', difficulty: 'easy', patternIds: [], sheets: [], url: 'https://x/', core: false },
    { id: 'p2', title: 'Planned problem', moduleId: 'm', difficulty: 'hard', patternIds: [], sheets: [], url: 'https://y/', core: false },
  ],
  sheets: [],
};
const l1 = { id: 'l1', moduleId: 'm', title: 'L1', minutes: 10, summary: 'Lesson summary.' } as unknown as Lesson;
const p1 = { id: 'p1', moduleId: 'm', title: 'P1', difficulty: 'easy', approaches: [] } as unknown as Problem;
const registry = buildRegistry({ modules: [mod], lessons: [l1], problems: [p1], traces: [], catalog });

describe('module page', () => {
  it('lists built and planned items with progress', () => {
    const store = memStore();
    store.update((s) => {
      s.lessons.l1 = { openedAt: 1, bestScore: 3, total: 3, passedAt: 2, updatedAt: 2 };
      s.problems.p1 = { marks: { understood: 1 }, solvedElsewhere: 1, resolveSteps: 0, updatedAt: 1 };
    });
    const host = document.createElement('div');
    const dispose = mountModulePage(host, mod, { registry, store, runner });
    expect(host.querySelector('[data-testid="module-progress"]')!.textContent).toBe('1 of 2 lessons done. 1 of 2 problems solved.');
    const items = [...host.querySelectorAll('.item-list li')].map((li) => li.textContent!.replace(/\s+/g, ' ').trim());
    expect(items[0]).toContain('L1');
    expect(items[0]).toContain('✅ Done');
    expect(items[1]).toContain('Planned lesson');
    expect(items[1]).toContain('coming in Part 1c');
    expect(items[2]).toContain('✅ Solved');
    expect(items[2]).toContain('Level 1: Understood');
    expect(items[3]).toContain('coming in Part 1c');
    expect(host.querySelector('[data-testid="module-drill"]')!.getAttribute('href')).toBe('#/drills/m');
    expect(host.querySelectorAll('.quiz-question')).toHaveLength(1);
    expect(host.querySelectorAll('.scenario')).toHaveLength(1);
    dispose();
    expect(host.innerHTML).toBe('');
  });

  it('hides an empty module quiz', () => {
    const empty = { ...mod, quiz: [] };
    expect(renderModule(empty, registry).__html).not.toContain('module-quiz');
  });
});

describe('mountScenarios', () => {
  it('shows the answer, then lets the learner mark it once', () => {
    const host = document.createElement('div');
    const marks: [number, number][] = [];
    mountScenarios(host, [{ type: 'scenario', q: 'Q1', answer: 'A1' }, { type: 'scenario', q: 'Q2', answer: 'A2' }], (r, m) => marks.push([r, m]));
    const answers = host.querySelectorAll<HTMLElement>('.scenario-answer');
    expect(answers[0]!.hidden).toBe(true);
    host.querySelectorAll<HTMLButtonElement>('[data-testid="scenario-show"]')[0]!.click();
    expect(answers[0]!.hidden).toBe(false);
    host.querySelectorAll<HTMLButtonElement>('[data-testid="scenario-right"]')[0]!.click();
    host.querySelectorAll<HTMLButtonElement>('[data-testid="scenario-wrong"]')[0]!.click();
    host.querySelectorAll<HTMLButtonElement>('[data-testid="scenario-wrong"]')[1]!.click();
    expect(marks).toEqual([[1, 1], [1, 2]]);
    expect(host.querySelectorAll('.scenario-result')[0]!.textContent).toBe('Marked right.');
  });
});
```

Append to `tests/unit/pages/lesson-page.test.ts`:

```ts

describe('lesson progress (Part 1b)', () => {
  function mount(now = 1000) {
    const registry = buildRegistry({ modules: [], lessons: [lesson], problems: [], traces: [] });
    const d: Record<string, string> = {};
    const store = createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } });
    const host = document.createElement('div');
    const dispose = mountLessonPage(host, { ...lesson, viz: [] }, { registry, store, runner: { ready: async () => {}, run: async () => ({ kind: 'runnerUnavailable', reason: '' }), stop() {} }, now: () => now });
    return { host, store, dispose };
  }
  const answer = (host: HTMLElement, picks: number[]) => {
    picks.forEach((k, qi) => host.querySelectorAll<HTMLButtonElement>(`.quiz-option[data-q="${qi}"]`)[k]!.click());
  };

  it('marks the lesson opened and asks for 2 of 3', () => {
    const { host, store, dispose } = mount();
    expect(store.get().lessons.l).toEqual({ openedAt: 1000, bestScore: 0, total: 0, updatedAt: 1000 });
    expect(host.querySelector('[data-testid="lesson-status"]')!.textContent).toBe('Get 2 of 3 right to finish this lesson.');
    dispose();
  });

  it('saves the best score, passes at 2 of 3, and can retry', () => {
    const { host, store, dispose } = mount();
    const retry = host.querySelector<HTMLButtonElement>('[data-testid="quiz-retry"]')!;
    expect(retry.hidden).toBe(true);
    answer(host, [0, 1, 1]);
    expect(store.get().lessons.l).toMatchObject({ bestScore: 0, total: 3 });
    expect(host.querySelector('[data-testid="lesson-status"]')!.textContent).toBe('Your best score is 0 of 3. Get 2 of 3 right to finish this lesson.');
    expect(retry.hidden).toBe(false);
    retry.click();
    expect(host.querySelectorAll('.quiz-question')).toHaveLength(3);
    answer(host, [1, 0, 0]);
    expect(store.get().lessons.l).toMatchObject({ bestScore: 3, passedAt: 1000 });
    expect(host.querySelector('[data-testid="lesson-status"]')!.textContent).toBe('✅ Lesson done. Your best score is 3 of 3.');
    dispose();
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/unit/pages`
Expected: FAIL. `mountScenarios` and `mountModulePage` do not exist, and the lesson page has no status line.

- [ ] **Step 3: Append `mountScenarios` to `src/engine/quiz.ts`**

Change the first import to:

```ts
import type { QuizQuestion, ScenarioQuestion } from '../content-types';
```

Then append:

```ts

/**
 * Scenario questions (spec §7.4): the learner thinks, shows the answer, then marks themselves right or wrong.
 * `onMark` gets the number marked right and the number marked so far.
 */
export function mountScenarios(host: HTMLElement, questions: ScenarioQuestion[], onMark?: (right: number, marked: number) => void): () => void {
  const el = document.createElement('div');
  el.className = 'scenarios';
  render(el, html`${questions.map((q, i) => html`
    <div class="scenario card" data-index="${i}">
      <p><b>${i + 1}. ${q.q}</b></p>
      <button type="button" data-testid="scenario-show">Show the answer</button>
      <div class="scenario-answer" hidden>
        <p>${q.answer}</p>
        <p class="muted">Did you get it?</p>
        <button type="button" data-testid="scenario-right">✅ I got it right</button>
        <button type="button" data-testid="scenario-wrong">❌ Not this time</button>
      </div>
      <p class="scenario-result" aria-live="polite"></p>
    </div>`)}`);
  host.append(el);
  const marks = new Map<number, boolean>();
  el.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    const box = btn?.closest<HTMLElement>('.scenario');
    if (!btn || !box) return;
    const i = Number(box.dataset.index);
    if (btn.dataset.testid === 'scenario-show') {
      (box.querySelector('.scenario-answer') as HTMLElement).hidden = false;
      btn.disabled = true;
      return;
    }
    if (marks.has(i)) return;
    const right = btn.dataset.testid === 'scenario-right';
    marks.set(i, right);
    box.querySelectorAll<HTMLButtonElement>('.scenario-answer button').forEach((b) => { b.disabled = true; });
    (box.querySelector('.scenario-result') as HTMLElement).textContent = right ? 'Marked right.' : 'Marked as not yet. Try it again later.';
    onMark?.([...marks.values()].filter(Boolean).length, marks.size);
  });
  return () => el.remove();
}
```

- [ ] **Step 4: Create `src/pages/clock.ts` and `src/pages/progress-tags.ts`**

```ts
/** A page's clock: `ctx.now` in tests, Date.now on the site. Kept apart from router-view to avoid an import cycle. */
export const clockOf = (ctx: { now?: () => number }): (() => number) => ctx.now ?? (() => Date.now());
```

```ts
import { html, type SafeHtml } from '../core/html';
import type { Registry } from '../core/registry';
import type { StoredState } from '../core/store';
import { lessonDone, problemLevel } from '../engine/mastery';
import { LEVEL_LABELS, isSolved } from '../engine/tracker';

/** "coming in Part 2" for content that is planned but not built. */
export function comingTag(part: string): SafeHtml {
  return html`<span class="tag tag-coming">${part ? `coming in Part ${part}` : 'coming later'}</span>`;
}

export function lessonTag(state: Readonly<StoredState>, lessonId: string): SafeHtml | null {
  if (lessonDone(state, lessonId)) return html`<span class="tag tag-done">✅ Done</span>`;
  if (state.lessons[lessonId]) return html`<span class="tag">📖 Started</span>`;
  return null;
}

export function problemTag(state: Readonly<StoredState>, problemId: string, registry: Registry): SafeHtml | null {
  const level = problemLevel(problemId, state, registry);
  const solved = isSolved(state.problems[problemId]);
  if (!solved && level === 0) return null;
  return html`${solved ? html`<span class="tag tag-done">✅ Solved</span>` : null}${level > 0 ? html` <span class="tag">Level ${level}: ${LEVEL_LABELS[level]}</span>` : null}`;
}
```

- [ ] **Step 5: Add the clock to the page context and mount the module page**

In `src/pages/router-view.ts`, add the field to `PageContext`:

```ts
export interface PageContext {
  registry: Registry;
  store: Store;
  runner: JavaRunner;
  makeEditor?: typeof createEditor;
  /** the clock, so tests can pick the time. Defaults to Date.now. */
  now?: () => number;
}
```

Change the import `import { renderModule } from './module-page';` to `import { mountModulePage } from './module-page';`, and the module branch to:

```ts
  if (route.name === 'module') {
    const m = ctx.registry.module(route.id);
    if (m) {
      const cleanup = mountModulePage(outlet, m, ctx);
      return { title: `${m.title} · DSA Playbook`, cleanup };
    }
  }
```

- [ ] **Step 6: Replace `src/pages/module-page.ts`**

```ts
import type { Module, QuizQuestion, ScenarioQuestion } from '../content-types';
import { html, render, type SafeHtml } from '../core/html';
import type { Registry } from '../core/registry';
import { href } from '../core/router';
import type { StoredState } from '../core/store';
import { lessonDone } from '../engine/mastery';
import { mountQuiz, mountScenarios } from '../engine/quiz';
import { isSolved } from '../engine/tracker';
import { comingTag, lessonTag, problemTag } from './progress-tags';
import type { PageContext } from './router-view';

/** The module page. With `state`, each lesson and problem shows its progress. */
export function renderModule(m: Module, registry: Registry, state?: Readonly<StoredState>): SafeHtml {
  const road = registry.roadmapModule(m.id);
  const lessons = road?.lessons ?? [];
  const problems = road?.problems ?? [];
  const doneLessons = state ? lessons.filter((l) => lessonDone(state, l.id)).length : 0;
  const solved = state ? problems.filter((p) => isSolved(state.problems[p.id])).length : 0;
  const hasQuiz = m.quiz.length > 0;
  return html`
    <h1><span aria-hidden="true">${m.icon}</span> ${m.title}</h1>
    <p class="muted">${m.summary}</p>
    ${state ? html`<p class="module-progress" data-testid="module-progress">${doneLessons} of ${lessons.length} lessons done. ${solved} of ${problems.length} problems solved.</p>` : null}
    <p class="module-actions"><a class="button" data-testid="module-drill" href="${href({ name: 'drills', moduleId: m.id })}">🎯 Mixed drill for this module</a></p>
    <h2>After this module you can</h2>
    <ul>${m.outcomes.map((o) => html`<li>${o}</li>`)}</ul>
    <h2>Lessons</h2>
    <ul class="item-list">${lessons.map((l) => {
      const real = registry.lesson(l.id);
      return real
        ? html`<li class="card"><a href="${href({ name: 'lesson', id: l.id })}">📖 ${l.title}</a> <span class="muted">${l.minutes} min</span> ${state ? lessonTag(state, l.id) : null}<br /><span class="muted">${real.summary}</span></li>`
        : html`<li class="card planned">📖 ${l.title} <span class="muted">${l.minutes} min</span> ${comingTag(l.part)}</li>`;
    })}</ul>
    <h2>Problems</h2>
    <ul class="item-list">${problems.map((p) => (p.built
      ? html`<li class="card"><a href="${href({ name: 'problem', id: p.id })}">🧪 ${p.title}</a> <span class="tag">${p.difficulty}</span> ${state ? problemTag(state, p.id, registry) : null}</li>`
      : html`<li class="card planned">🧪 ${p.title} <span class="tag">${p.difficulty}</span> ${comingTag(p.part)}</li>`))}</ul>
    ${hasQuiz ? html`<section id="module-quiz"><h2>🧪 Module quiz</h2><div class="mcq-host"></div><div class="scenario-host"></div><p class="scenario-score" aria-live="polite"></p></section>` : null}`;
}

export function mountModulePage(host: HTMLElement, m: Module, ctx: PageContext): () => void {
  render(host, renderModule(m, ctx.registry, ctx.store.get()));
  const mcq = m.quiz.filter((q): q is QuizQuestion => !('type' in q));
  const scenarios = m.quiz.filter((q): q is ScenarioQuestion => 'type' in q && q.type === 'scenario');
  const disposers: (() => void)[] = [];
  const mcqHost = host.querySelector<HTMLElement>('.mcq-host');
  const scenarioHost = host.querySelector<HTMLElement>('.scenario-host');
  if (mcqHost && mcq.length) disposers.push(mountQuiz(mcqHost, mcq));
  if (scenarioHost && scenarios.length) {
    const score = host.querySelector('.scenario-score') as HTMLElement;
    disposers.push(mountScenarios(scenarioHost, scenarios, (right, marked) => { score.textContent = `Scenarios: ${right} of ${marked} marked right.`; }));
  }
  return () => {
    for (const d of disposers) d();
    host.innerHTML = '';
  };
}
```

- [ ] **Step 7: Replace `src/pages/lesson-page.ts`**

```ts
import type { Lesson } from '../content-types';
import { html, raw, render } from '../core/html';
import { href } from '../core/router';
import { codeBlock } from '../engine/highlight';
import { mountVizGroup, type VizItem } from '../engine/player-view';
import { openLesson, quizPassed, saveQuizScore } from '../engine/progress';
import { mountQuiz } from '../engine/quiz';
import { clockOf } from './clock';
import type { PageContext } from './router-view';

/** The line above the quiz: what is needed, or that the lesson is done. */
function statusText(lesson: Lesson, ctx: PageContext): string {
  const total = lesson.quiz.length;
  const needed = Array.from({ length: total + 1 }, (_, k) => k).find((k) => quizPassed(k, total)) ?? total;
  const p = ctx.store.get().lessons[lesson.id];
  if (p?.passedAt !== undefined) return `✅ Lesson done. Your best score is ${p.bestScore} of ${p.total}.`;
  const best = p && p.total > 0 ? `Your best score is ${p.bestScore} of ${p.total}. ` : '';
  return `${best}Get ${needed} of ${total} right to finish this lesson.`;
}

export function mountLessonPage(host: HTMLElement, lesson: Lesson, ctx: PageContext): () => void {
  const now = clockOf(ctx);
  ctx.store.update((d) => openLesson(d, lesson.id, now()));
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
        <p class="lesson-status" data-testid="lesson-status" aria-live="polite"></p>
        <div class="quiz-host"></div>
        <p><button type="button" data-testid="quiz-retry" hidden>↺ Try the quiz again</button></p>
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
  const statusEl = host.querySelector('[data-testid="lesson-status"]') as HTMLElement;
  const retry = host.querySelector('[data-testid="quiz-retry"]') as HTMLButtonElement;
  const quizHost = host.querySelector('.quiz-host') as HTMLElement;
  statusEl.textContent = statusText(lesson, ctx);
  let disposeQuiz = () => {};
  const startQuiz = () => {
    disposeQuiz();
    retry.hidden = true;
    disposeQuiz = mountQuiz(quizHost, lesson.quiz, (score) => {
      ctx.store.update((d) => saveQuizScore(d, lesson.id, score, lesson.quiz.length, now()));
      statusEl.textContent = statusText(lesson, ctx);
      retry.hidden = false;
    });
  };
  retry.addEventListener('click', startQuiz);
  startQuiz();
  return () => {
    disposeViz();
    disposeQuiz();
    host.innerHTML = '';
  };
}
```

- [ ] **Step 8: Add the styles**

Create `src/styles/progress.css`:

```css
/* Part 1b: progress tags, links that look like buttons, module page and lesson status */
.button { display: inline-flex; align-items: center; gap: 0.4rem; min-height: 2.25rem; padding: 0.4rem 0.75rem; border: 1px solid var(--line); border-radius: 8px; background: var(--bg-2); color: var(--text); text-decoration: none; font-weight: 600; }
.button:hover { border-color: var(--accent); }
.button.primary { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
.tag-done { color: var(--ok); border-color: var(--ok); }
.tag-coming { font-style: italic; }
.item-list li.planned { border-style: dashed; }
.module-progress, .lesson-status { font-weight: 600; }
.module-actions { margin: 0.75rem 0; display: flex; flex-wrap: wrap; gap: 0.5rem; }
.scenarios { display: grid; gap: 0.75rem; margin-top: 0.75rem; }
.scenario p { margin: 0 0 0.4rem; overflow-wrap: anywhere; }
.scenario-answer:not([hidden]) { margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; }
.scenario-answer p { flex-basis: 100%; }
```

Append to `src/styles/index.css`:

```css
@import './progress.css';
```

- [ ] **Step 9: Run the tests and checks**

Run: `npx vitest run tests/unit/pages && npm test && npm run typecheck && npm run check:content && npm run test:e2e`
Expected: `Tests  16 passed (16)` for the page tests, the whole unit suite passes, no type errors, the content check passes, and every e2e test passes (the module page still has its `h1`).

- [ ] **Step 10: Commit (controller only, after review)**

```bash
git add src/pages/clock.ts src/pages/progress-tags.ts src/pages/module-page.ts src/pages/lesson-page.ts src/pages/router-view.ts src/engine/quiz.ts src/styles/progress.css src/styles/index.css tests/unit/pages/module-page.test.ts tests/unit/pages/lesson-page.test.ts
git commit -m "feat(pages): lesson progress, module quiz with scenarios and module progress (Part 1b Task 15)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Problem tracker, the Submit hook and the pagehide save

**Files:**
- Create: `src/pages/tracker.ts`
- Modify (replace the whole file): `src/pages/problem-page.ts`
- Modify: `src/lab/lab-view.ts` (`onSubmitResult`, `pagehide`), `src/styles/progress.css` (append)
- Test: `tests/unit/pages/tracker.test.ts` (new), `tests/unit/pages/problem-page.test.ts` (append), `tests/unit/lab/lab-view.test.ts` (append)

**Interfaces:**
- Consumes: `openProblem`, `revealSolutions`, `passSubmit`, `tickMark`, `markSolvedElsewhere` (Task 10), `allTestsPassed`, `isSolved`, `resolveDue`, `LEVEL_LABELS`, `TickMark` (Task 6), `problemLevel` (Task 11), `dayKey`, `formatDay` (Task 5), `clockOf` (Task 15), `Registry.sheet` (Task 3), `href({ name: 'sheet', id })` (Task 14).
- Produces:
  - `LabDeps.onSubmitResult?: (result: RunResult) => void`, called after every Submit run (never after Run).
  - The lab saves a pending edit on `pagehide` and removes that listener in `dispose()`.
  - `mountTracker(host: HTMLElement, problem: Problem, ctx: PageContext): () => void`. Test ids `track-level`, `track-solved`, `track-resolve`, `track-understood`, `track-alone`, `track-explain`, `track-memory`, `track-elsewhere`. It redraws on every store change and keeps focus on the pressed button.
  - The problem page records the open, stores `revealedAt` on the first Show solutions, records a full Submit pass, shows the "Your progress" box in `section#progress` right after the lab, and credits the problem's sheets.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/pages/tracker.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Problem } from '../../../src/content-types';
import { buildRegistry } from '../../../src/core/registry';
import { createStore } from '../../../src/core/store';
import { DAY_MS } from '../../../src/engine/days';
import { mountTracker } from '../../../src/pages/tracker';

const T0 = new Date(2026, 10, 24, 10).getTime();
const problem = { id: 'p', moduleId: 'm', title: 'P', patternIds: [], approaches: [] } as unknown as Problem;
const registry = buildRegistry({ modules: [], lessons: [], problems: [problem], traces: [] });
const runner = { ready: async () => {}, run: async () => ({ kind: 'runnerUnavailable' as const, reason: '' }), stop() {} };

function mount(now = T0) {
  const d: Record<string, string> = {};
  const store = createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } });
  const host = document.createElement('div');
  document.body.append(host);
  let t = now;
  const dispose = mountTracker(host, problem, { registry, store, runner, now: () => t });
  const q = (id: string) => host.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`)!;
  return { host, store, dispose, q, setNow: (v: number) => { t = v; } };
}

describe('tracker box', () => {
  it('starts at level 0', () => {
    const { q, dispose } = mount();
    expect(q('track-level').textContent).toBe('Level 0 of 5: Not started');
    expect(q('track-resolve').textContent).toBe('Solve it once to start the re-solve reminders.');
    expect(q('track-understood').getAttribute('aria-pressed')).toBe('false');
    dispose();
  });

  it('ticks levels 1, 3 and 4 and the self-marked level 2, and keeps focus', () => {
    const { q, store, dispose } = mount();
    q('track-understood').focus();
    q('track-understood').click();
    expect(q('track-level').textContent).toBe('Level 1 of 5: Understood');
    expect(q('track-understood').getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(q('track-understood'));
    q('track-alone').click();
    expect(q('track-level').textContent).toBe('Level 2 of 5: Solved alone');
    expect(q('track-level').closest('p')!.textContent).toContain('Self-marked');
    q('track-explain').click();
    q('track-memory').click();
    expect(q('track-level').textContent).toBe('Level 4 of 5: Code from memory');
    q('track-memory').click();
    expect(store.get().problems.p?.marks.fromMemory).toBeUndefined();
    dispose();
  });

  it('shows the automatic level 2 as done and not clickable', () => {
    const { q, store, dispose } = mount();
    store.update((s) => { s.problems.p = { marks: { solvedAlone: T0 }, solvedAt: T0, resolveSteps: 0, nextResolveAt: T0 + 3 * DAY_MS, updatedAt: T0 }; });
    expect(q('track-alone').disabled).toBe(true);
    expect(q('track-alone').textContent).toBe('2 · Solved alone ✓');
    expect(q('track-level').textContent).toBe('Level 2 of 5: Solved alone');
    expect(q('track-resolve').textContent).toBe('Next re-solve: 27 Nov 2026. 0 of 3 done.');
    dispose();
  });

  it('"I solved this elsewhere" counts as solved, then waits for the re-solve', () => {
    const { q, store, dispose, setNow } = mount();
    q('track-elsewhere').click();
    expect(store.get().problems.p?.solvedElsewhere).toBe(T0);
    expect(q('track-solved')).not.toBeNull();
    expect(q('track-elsewhere').disabled).toBe(true);
    setNow(T0 + 3 * DAY_MS);
    store.update(() => {});
    expect(q('track-resolve').textContent).toBe('A re-solve is due. Solve it again from scratch, then press Submit.');
    expect(q('track-elsewhere').textContent).toBe('I re-solved it elsewhere');
    q('track-elsewhere').click();
    expect(store.get().problems.p?.resolveSteps).toBe(1);
    dispose();
  });
});
```

In `tests/unit/pages/problem-page.test.ts`, add this import below the content-types import:

```ts
import type { RunResult } from '../../../src/lab/runner';
```

and append:

```ts

describe('problem progress (Part 1b)', () => {
  const pass = { id: 'h', kind: 'hidden' as const, pass: true, input: '', expected: '', actual: '', stdout: '', timeMs: 1 };
  function mountWith(result: RunResult) {
    const registry = buildRegistry({ modules: [], lessons: [], problems: [problem], traces: [trace] });
    const d: Record<string, string> = {};
    const store = createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } });
    const host = document.createElement('div');
    document.body.append(host);
    const makeEditor = () => ({ getValue: () => 'class Solution {}', setValue() {}, focus() {}, destroy() {} });
    const dispose = mountProblemPage(host, problem, { registry, makeEditor, store, runner: { ready: async () => {}, run: async () => result, stop() {} }, now: () => 5000 });
    return { host, store, dispose };
  }
  const flush = () => new Promise((r) => setTimeout(r, 0));

  it('records the open and the first peek, and has a progress box', () => {
    const { host, store, dispose } = mountWith({ kind: 'tests', results: [pass], stdout: '' });
    expect(store.get().problems.p?.openedAt).toBe(5000);
    expect(host.querySelector('#progress [data-testid="track-level"]')).not.toBeNull();
    (host.querySelector('[data-testid="show-solutions"]') as HTMLButtonElement).click();
    expect(store.get().problems.p?.revealedAt).toBe(5000);
    dispose();
    host.remove();
  });

  it('sets level 2 when Submit passes before a peek', async () => {
    const { host, store, dispose } = mountWith({ kind: 'tests', results: [pass], stdout: '' });
    (host.querySelector('[data-testid="lab-run"]') as HTMLButtonElement).click();
    await flush();
    expect(store.get().problems.p?.solvedAt).toBeUndefined();
    (host.querySelector('[data-testid="lab-submit"]') as HTMLButtonElement).click();
    await flush();
    expect(store.get().problems.p).toMatchObject({ solvedAt: 5000, marks: { solvedAlone: 5000 } });
    expect(host.querySelector('[data-testid="track-level"]')!.textContent).toBe('Level 2 of 5: Solved alone');
    dispose();
    host.remove();
  });

  it('does not solve on a failing Submit', async () => {
    const { host, store, dispose } = mountWith({ kind: 'tests', results: [{ ...pass, pass: false }], stdout: '' });
    (host.querySelector('[data-testid="lab-submit"]') as HTMLButtonElement).click();
    await flush();
    expect(store.get().problems.p?.solvedAt).toBeUndefined();
    dispose();
    host.remove();
  });
});
```

Append to `tests/unit/lab/lab-view.test.ts`:

```ts

describe('Part 1b lab hooks', () => {
  it('saves a pending edit when the page is hidden', () => {
    vi.useFakeTimers();
    const store = memStore();
    const ed = fakeEditor();
    const lab = mountLab(document.createElement('div'), problem, { runner: fakeRunner({ kind: 'tests', results: [], stdout: '' }), store, makeEditor: ed.make });
    ed.type('class Solution { /* closing the tab */ }');
    window.dispatchEvent(new Event('pagehide'));
    expect(store.get().code['contains-duplicate']?.source).toBe('class Solution { /* closing the tab */ }');
    lab.dispose();
    vi.useRealTimers();
  });

  it('reports Submit results, not Run results', async () => {
    const host = document.createElement('div');
    const seen: RunResult[] = [];
    const result: RunResult = { kind: 'tests', stdout: '', results: [] };
    mountLab(host, problem, { runner: fakeRunner(result), store: memStore(), makeEditor: fakeEditor().make, onSubmitResult: (r) => seen.push(r) });
    (host.querySelector('[data-testid="lab-run"]') as HTMLButtonElement).click();
    await flush();
    expect(seen).toEqual([]);
    (host.querySelector('[data-testid="lab-submit"]') as HTMLButtonElement).click();
    await flush();
    expect(seen).toEqual([result]);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/unit/pages tests/unit/lab`
Expected: FAIL. `src/pages/tracker.ts` does not exist, nothing is stored on open or Submit, and `pagehide` does not save.

- [ ] **Step 3: Add the hooks to `src/lab/lab-view.ts`**

Apply exactly these changes:

```diff
diff --git a/src/lab/lab-view.ts b/src/lab/lab-view.ts
index a6f613f..f743186 100644
--- a/src/lab/lab-view.ts
+++ b/src/lab/lab-view.ts
@@ -10,6 +10,8 @@ export interface LabDeps {
   store: Store;
   makeEditor?: typeof createEditor;
   confirm?: (msg: string) => boolean;
+  /** called after every Submit run, so the tracker can record a full pass */
+  onSubmitResult?: (result: RunResult) => void;
 }
 
 export interface LabHandle {
@@ -93,6 +95,8 @@ export function mountLab(host: HTMLElement, problem: Problem, deps: LabDeps): La
     if (pendingCode !== null) saveCode(pendingCode);
     pendingCode = null;
   };
+  // A tab can close before the save timer fires. pagehide is the last safe moment to save.
+  window.addEventListener('pagehide', flushSave);
   let startedAt: number | null = null;
   let clockTimer: ReturnType<typeof setInterval> | null = null;
   const custom: TestCase[] = [];
@@ -157,6 +161,7 @@ export function mountLab(host: HTMLElement, problem: Problem, deps: LabDeps): La
       status.textContent = mode === 'all' ? 'Running all tests…' : 'Running the examples…';
       const result = await deps.runner.run({ code: editor.getValue(), spec: problem.spec, mode, extraTests: [...custom], timeLimitMs: mode === 'all' ? 10_000 : 5_000 });
       show(result);
+      if (mode === 'all') deps.onSubmitResult?.(result);
     } catch (err) {
       status.textContent = `Something went wrong: ${err instanceof Error ? err.message : String(err)}`;
     } finally {
@@ -211,6 +216,7 @@ export function mountLab(host: HTMLElement, problem: Problem, deps: LabDeps): La
     dispose() {
       // A run still waiting for Java to load must not start after the learner leaves.
       cancelled = true;
+      window.removeEventListener('pagehide', flushSave);
       flushSave();
       if (clockTimer) clearInterval(clockTimer);
       deps.runner.stop();
```

- [ ] **Step 4: Create `src/pages/tracker.ts`**

```ts
import type { Problem } from '../content-types';
import { html, render } from '../core/html';
import { dayKey, formatDay } from '../engine/days';
import { problemLevel } from '../engine/mastery';
import { markSolvedElsewhere, tickMark } from '../engine/progress';
import { LEVEL_LABELS, isSolved, resolveDue, type TickMark } from '../engine/tracker';
import { clockOf } from './clock';
import type { PageContext } from './router-view';

const TICKS: { mark: TickMark; testid: string; label: string }[] = [
  { mark: 'understood', testid: 'track-understood', label: '1 · I understand it' },
  { mark: 'selfMarkedAlone', testid: 'track-alone', label: '2 · Mark solved alone' },
  { mark: 'canExplain', testid: 'track-explain', label: '3 · I can explain it' },
  { mark: 'fromMemory', testid: 'track-memory', label: '4 · I can code it from memory' },
];

/** The "Your progress" box on a problem page (spec §9.1, §9.2). It redraws when the store changes. */
export function mountTracker(host: HTMLElement, problem: Problem, ctx: PageContext): () => void {
  const now = clockOf(ctx);
  const el = document.createElement('div');
  el.className = 'tracker';
  host.append(el);

  const draw = () => {
    const state = ctx.store.get();
    const p = state.problems[problem.id];
    const level = problemLevel(problem.id, state, ctx.registry);
    const solved = isSolved(p);
    const due = resolveDue(p, now());
    const auto = p?.marks.solvedAlone !== undefined;
    let resolve = 'Solve it once to start the re-solve reminders.';
    if (p && solved) {
      if (p.resolveSteps >= 3) resolve = 'All 3 re-solves done.';
      else if (due) resolve = 'A re-solve is due. Solve it again from scratch, then press Submit.';
      else if (p.nextResolveAt !== undefined) resolve = `Next re-solve: ${formatDay(dayKey(p.nextResolveAt))}. ${p.resolveSteps} of 3 done.`;
    }
    // Redrawing replaces the buttons. Keep keyboard focus on the same button.
    const keep = el.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset.testid : undefined;
    render(el, html`
      <p class="tracker-level"><b data-testid="track-level">Level ${level} of 5: ${LEVEL_LABELS[level]}</b>
        ${solved ? html` <span class="tag tag-done" data-testid="track-solved">✅ Solved</span>` : null}
        ${p?.marks.selfMarkedAlone !== undefined ? html` <span class="tag">Self-marked</span>` : null}
        ${p?.solvedElsewhere !== undefined ? html` <span class="tag">Solved elsewhere</span>` : null}</p>
      <p class="muted" data-testid="track-resolve">${resolve}</p>
      <div class="tracker-buttons">
        ${TICKS.map((t) => (t.mark === 'selfMarkedAlone' && auto
          ? html`<button type="button" data-testid="${t.testid}" disabled>2 · Solved alone ✓</button>`
          : html`<button type="button" data-testid="${t.testid}" data-mark="${t.mark}" aria-pressed="${String(p?.marks[t.mark] !== undefined)}">${t.label}</button>`))}
        <button type="button" data-testid="track-elsewhere" ${solved && !due ? 'disabled' : ''}>${due ? 'I re-solved it elsewhere' : 'I solved this elsewhere'}</button>
      </div>
      <p class="muted">Level 2 is set for you when Submit passes before you open the solutions. Level 5 comes by itself at level 4 once you master the pattern.</p>`);
    if (keep) el.querySelector<HTMLElement>(`[data-testid="${keep}"]`)?.focus();
  };

  el.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!btn || btn.disabled) return;
    const mark = btn.dataset.mark as TickMark | undefined;
    if (mark) ctx.store.update((d) => tickMark(d, problem.id, mark, now()));
    else if (btn.dataset.testid === 'track-elsewhere') ctx.store.update((d) => markSolvedElsewhere(d, problem.id, now()));
  });
  draw();
  const off = ctx.store.subscribe(draw);
  return () => {
    off();
    el.remove();
  };
}
```

- [ ] **Step 5: Replace `src/pages/problem-page.ts`**

```ts
import type { Problem } from '../content-types';
import { html, raw, render } from '../core/html';
import { href } from '../core/router';
import { codeBlock } from '../engine/highlight';
import { parseMarkers } from '../engine/markers';
import { mountVizGroup } from '../engine/player-view';
import { openProblem, passSubmit, revealSolutions } from '../engine/progress';
import { allTestsPassed } from '../engine/tracker';
import { mountLab } from '../lab/lab-view';
import { clockOf } from './clock';
import type { PageContext } from './router-view';
import { mountSpotFirst } from './spot-first';
import { mountTracker } from './tracker';

const LEVEL_LABEL = { brute: '🐢 Brute force', better: '🚶 Better', optimal: '🚀 Optimal' } as const;

export function mountProblemPage(host: HTMLElement, problem: Problem, ctx: PageContext): () => void {
  const now = clockOf(ctx);
  ctx.store.update((d) => openProblem(d, problem.id, now()));
  const lists = problem.sheets.map((id) => ctx.registry.sheet(id)).filter((s) => s !== undefined);
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
        ${lists.length ? html`<p class="muted">On these lists: ${lists.map((s, i) => html`${i ? ', ' : ''}<a href="${href({ name: 'sheet', id: s.id })}">${s.title}</a>`)}.</p>` : null}
      </section>

      <section id="spot"><h2>🔍 Spot it first</h2><div class="spot-host"></div></section>

      <section id="hints"><h2>💬 Hints</h2>
        <ol class="hints">${problem.hints.map((h) => html`<li class="hint" hidden>${h}</li>`)}</ol>
        <button type="button" data-testid="hint-next">Show a hint (0 of ${problem.hints.length})</button>
      </section>

      <section id="lab"><h2>🧪 Try it yourself</h2><div class="lab-host"></div></section>

      <section id="progress" class="your-progress card"><h2>📈 Your progress</h2><div class="tracker-host"></div></section>

      <section id="edge-cases"><h2>⚠️ Edge cases</h2><ul>${problem.edgeCases.map((e) => html`<li>${e}</li>`)}</ul></section>

      <section id="reveal" class="reveal-gate">
        <p>Try it yourself first. Opening the solutions counts as a peek.</p>
        <button type="button" data-testid="show-solutions">Show solutions</button>
      </section>

      <div id="solutions" hidden>
      <section id="approaches"><h2 tabindex="-1">🐢 → 🚀 Approaches</h2>
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

      <section id="mistakes"><h2>🚧 Common mistakes</h2><ul>${problem.mistakes.map((m) => html`<li>${m}</li>`)}</ul></section>

      <section id="explain"><h2>🗣️ The 30-second explanation</h2>
        <details class="card"><summary>Say it out loud first, then reveal</summary><p>${problem.explain30}</p></details>
      </section>

      <section id="hook"><h2>🪝 Memory hook</h2><p class="callout"><b>${problem.hook}</b></p></section>

      <section id="related"><h2>🔗 Related problems</h2>
        <ul>${problem.related.map(link)}</ul>
        ${problem.lookAlikes.length ? html`<h3>Look-alikes</h3><ul>${problem.lookAlikes.map(link)}</ul>` : null}
      </section>
      </div>
    </article>`);

  const disposeSpot = mountSpotFirst(host.querySelector('.spot-host') as HTMLElement, problem.spot);
  const lab = mountLab(host.querySelector('.lab-host') as HTMLElement, problem, {
    runner: ctx.runner,
    store: ctx.store,
    makeEditor: ctx.makeEditor,
    onSubmitResult: (result) => {
      if (allTestsPassed(result)) ctx.store.update((d) => passSubmit(d, problem.id, now()));
    },
  });
  const disposeTracker = mountTracker(host.querySelector('.tracker-host') as HTMLElement, problem, ctx);

  const hints = [...host.querySelectorAll<HTMLElement>('.hint')];
  const hintBtn = host.querySelector<HTMLButtonElement>('[data-testid="hint-next"]') as HTMLButtonElement;
  let shown = 0;
  hintBtn.addEventListener('click', () => {
    const next = hints[shown];
    if (!next) return;
    next.hidden = false;
    shown++;
    hintBtn.textContent = `Show a hint (${shown} of ${hints.length})`;
    if (shown >= hints.length) {
      hintBtn.disabled = true;
      next.tabIndex = -1;
      next.focus();
    }
  });

  for (const a of problem.approaches) {
    host.querySelector(`[data-testid="load-into-lab-${a.level}"]`)?.addEventListener('click', () => lab.loadCode(parseMarkers(a.java).code));
  }

  const optimal = problem.approaches.find((a) => a.level === 'optimal' && a.traceId);
  const trace = optimal?.traceId ? ctx.registry.trace(optimal.traceId) : undefined;
  const sample = problem.spec.samples[0];
  const vizHost = host.querySelector('.viz-host') as HTMLElement;
  let disposeViz = () => {};
  const solutions = host.querySelector<HTMLElement>('#solutions') as HTMLElement;
  const gateBtn = host.querySelector<HTMLButtonElement>('[data-testid="show-solutions"]') as HTMLButtonElement;
  gateBtn.addEventListener('click', () => {
    ctx.store.update((d) => revealSolutions(d, problem.id, now()));
    solutions.hidden = false;
    if (optimal && trace && sample) disposeViz = mountVizGroup(vizHost, [{ label: optimal.title, trace, java: optimal.java, input: trace.fromArgs(sample.args) }]);
    else vizHost.textContent = 'No dry run for this problem yet.';
    gateBtn.disabled = true;
    gateBtn.textContent = 'Solutions shown';
    host.querySelector<HTMLElement>('#approaches > h2')?.focus();
  }, { once: true });

  return () => {
    disposeSpot();
    disposeTracker();
    disposeViz();
    lab.dispose();
    host.innerHTML = '';
  };
}
```

- [ ] **Step 6: Append the tracker styles to `src/styles/progress.css`**

```css

/* The "Your progress" box on a problem page */
.your-progress h2 { margin-top: 0; }
.tracker-level { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; margin: 0 0 0.4rem; }
.tracker-buttons { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.5rem 0; }
.tracker-buttons button[aria-pressed='true'] { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
```

- [ ] **Step 7: Run the tests and checks**

Run: `npx vitest run tests/unit/pages tests/unit/lab && npm test && npm run typecheck && npm run check:content && npm run test:e2e`
Expected: `Tests  80 passed (80)` for pages and lab, the whole unit suite passes, no type errors, the content check passes, and every e2e test passes.

- [ ] **Step 8: Commit (controller only, after review)**

```bash
git add src/pages/tracker.ts src/pages/problem-page.ts src/lab/lab-view.ts src/styles/progress.css tests/unit/pages/tracker.test.ts tests/unit/pages/problem-page.test.ts tests/unit/lab/lab-view.test.ts
git commit -m "feat(tracker): add the Your progress box, the Submit hook and the pagehide save (Part 1b Task 16)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: Today, Roadmap and Sheet pages

**Files:**
- Create: `src/pages/today.ts`, `src/pages/roadmap-page.ts`, `src/pages/sheet-page.ts`
- Modify: `src/pages/home.ts` (start button), `src/styles/progress.css` (append)
- Test: `tests/unit/pages/today.test.ts`

**Interfaces:**
- Consumes: `Registry` (`roadmap`, `roadmapLesson`, `roadmapProblem`, `allProblems`, `cards`, `sheet`), `deckCards` (Task 8), `dayKey`, `streak` (Task 5), `hasProgress`, `lastOpened`, `startedModules` (Task 10), `resolveDue`, `isSolved` (Task 6), `lessonDone` (Task 11), `LEVELS` (Task 12), `comingTag`, `lessonTag`, `problemTag` (Task 15), `href` (Task 14).
- Produces:
  - `renderHome(registry)` gains a `[data-testid="start"]` link "Start with <first built module>" (no id is written in the code).
  - `renderToday(ctx: PageContext, now: number): SafeHtml`. A first-time visitor gets `renderHome`. Otherwise the page has `h1` "Today" and the boxes `today-cards`, `today-resolve`, `today-drill`, `today-continue`.
  - `renderRoadmap(ctx: PageContext): SafeHtml` (one `details[data-testid="roadmap-module"]` per catalog module, grouped by level).
  - `renderSheet(sheet: Sheet, ctx: PageContext): SafeHtml` (`sheet-progress`, one `sheet-row` per id in order).
  - Task 22 routes `#/` to `renderToday`, plus `#/roadmap` and `#/sheets/:id`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/pages/today.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { contentInput } from '../../../content';
import { buildRegistry } from '../../../src/core/registry';
import { createStore, type Store } from '../../../src/core/store';
import { DAY_MS } from '../../../src/engine/days';
import { openLesson, openProblem, passSubmit } from '../../../src/engine/progress';
import { renderRoadmap } from '../../../src/pages/roadmap-page';
import { renderSheet } from '../../../src/pages/sheet-page';
import { renderToday } from '../../../src/pages/today';

const NOW = new Date(2026, 10, 24, 10).getTime();
const registry = buildRegistry(contentInput);
const runner = { ready: async () => {}, run: async () => ({ kind: 'runnerUnavailable' as const, reason: '' }), stop() {} };
const memStore = (): Store => { const d: Record<string, string> = {}; return createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }); };
const view = (html: { __html: string }) => { const el = document.createElement('div'); el.innerHTML = html.__html; return el; };

describe('Today', () => {
  it('shows the intro and a start button to a first-time visitor', () => {
    const el = view(renderToday({ registry, store: memStore(), runner }, NOW));
    expect(el.querySelector('h1')!.textContent).toBe('Learn DSA by spotting patterns');
    const start = el.querySelector('[data-testid="start"]')!;
    expect(start.textContent).toBe(`Start with ${registry.modules[0]!.title}`);
    expect(start.getAttribute('href')).toBe(`#/m/${registry.modules[0]!.id}`);
  });

  it('shows cards due, problems to solve again, a drill and where to continue', () => {
    const store = memStore();
    const lessonId = registry.lessonIds[0]!;
    const problemId = registry.problemIds[0]!;
    store.update((d) => {
      openLesson(d, lessonId, NOW - 5 * DAY_MS);
      passSubmit(d, problemId, NOW - 4 * DAY_MS);
      openProblem(d, problemId, NOW - 4 * DAY_MS);
    });
    const el = view(renderToday({ registry, store, runner }, NOW));
    expect(el.querySelector('h1')!.textContent).toBe('Today');
    const cards = registry.cards.length;
    expect(el.querySelector('[data-testid="today-cards"]')!.textContent).toContain(`${cards} cards are due today.`);
    expect(el.querySelector('[data-testid="today-resolve"] a')!.getAttribute('href')).toBe(`#/p/${problemId}`);
    expect(el.querySelector('[data-testid="today-drill"] a')!.getAttribute('href')).toBe('#/drills');
    expect(el.querySelector('[data-testid="today-continue"] a')!.getAttribute('href')).toBe(`#/p/${problemId}`);
  });

  it('says when nothing is due', () => {
    const store = memStore();
    store.update((d) => openProblem(d, registry.problemIds[0]!, NOW));
    const el = view(renderToday({ registry, store, runner }, NOW));
    expect(el.querySelector('[data-testid="today-cards"]')!.textContent).toContain('No cards are due.');
    expect(el.querySelector('[data-testid="today-resolve"]')!.textContent).toContain('Nothing to solve again today.');
  });
});

describe('Roadmap and sheets', () => {
  it('lists every module by level, built and planned', () => {
    const el = view(renderRoadmap({ registry, store: memStore(), runner }));
    expect(el.querySelectorAll('[data-testid="roadmap-module"]')).toHaveLength(26);
    expect([...el.querySelectorAll('h2')].map((h) => h.textContent)).toEqual(['Basics', 'Core', 'Hard', 'Advanced', 'Interview']);
    expect(el.textContent).toContain('coming in Part 2');
    expect(el.querySelector(`a[href="#/l/${registry.lessonIds[0]}"]`)).not.toBeNull();
  });

  it('shows a sheet in its own order with progress', () => {
    const store = memStore();
    store.update((d) => passSubmit(d, registry.problemIds[0]!, NOW));
    const sheet = registry.sheet('neetcode150')!;
    const el = view(renderSheet(sheet, { registry, store, runner }));
    expect(el.querySelector('h1')!.textContent).toBe('NeetCode 150');
    expect(el.querySelector('[data-testid="sheet-progress"]')!.textContent).toBe('1 of 150 solved.');
    const rows = el.querySelectorAll('[data-testid="sheet-row"]');
    expect(rows).toHaveLength(150);
    expect(rows[0]!.textContent).toContain('✅ Solved');
    expect(rows[1]!.textContent).toContain('coming in Part 2');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/pages/today.test.ts`
Expected: FAIL, because `src/pages/today.ts` does not exist.

- [ ] **Step 3: Add the start button to `src/pages/home.ts`**

```diff
diff --git a/src/pages/home.ts b/src/pages/home.ts
index 3eb6a8f..bd7d931 100644
--- a/src/pages/home.ts
+++ b/src/pages/home.ts
@@ -2,11 +2,14 @@ import { html, type SafeHtml } from '../core/html';
 import type { Registry } from '../core/registry';
 import { href } from '../core/router';
 
+/** The intro for a first-time visitor. Today (today.ts) shows it until there is progress. */
 export function renderHome(registry: Registry): SafeHtml {
+  const first = registry.modules[0];
   return html`
     <section class="hero">
       <h1>Learn DSA by spotting patterns</h1>
       <p>Watch each algorithm run step by step. Try first, then reveal. Write real Java in your browser.</p>
+      ${first ? html`<p><a class="button primary" data-testid="start" href="${href({ name: 'module', id: first.id })}">Start with ${first.title}</a></p>` : null}
     </section>
     <h2>How this site teaches</h2>
     <ul class="how-list">
```

- [ ] **Step 4: Create `src/pages/today.ts`**

```ts
import { html, type SafeHtml } from '../core/html';
import { href } from '../core/router';
import { deckCards } from '../engine/cards';
import { dayKey, streak } from '../engine/days';
import { hasProgress, lastOpened, startedModules } from '../engine/progress';
import { resolveDue } from '../engine/tracker';
import { renderHome } from './home';
import type { PageContext } from './router-view';

/** `#/` (spec §7.1): cards due, problems to solve again, one mixed drill, and where to continue. */
export function renderToday(ctx: PageContext, now: number): SafeHtml {
  const { registry } = ctx;
  const state = ctx.store.get();
  if (!hasProgress(state)) return renderHome(registry);
  const today = dayKey(now);
  const started = startedModules(state, (id) => registry.roadmapLesson(id)?.moduleId);
  const due = deckCards('due', registry.cards, state.cards, started, today)?.length ?? 0;
  const resolves = registry.allProblems.filter((p) => p.built && resolveDue(state.problems[p.id], now));
  const last = lastOpened(state);
  const lastLesson = last?.kind === 'lesson' ? registry.lesson(last.id) : undefined;
  const lastProblem = last?.kind === 'problem' ? registry.problem(last.id) : undefined;
  const days = streak(state.days, today);
  return html`
    <h1>Today</h1>
    <p class="muted">🔥 ${days} day${days === 1 ? '' : 's'} in a row. <a href="${href({ name: 'dashboard' })}">See your dashboard</a>.</p>
    <div class="today-grid">
      <section class="card" data-testid="today-cards"><h2>🃏 Flashcards</h2>
        ${due > 0
          ? html`<p>${due} card${due === 1 ? ' is' : 's are'} due today.</p><p><a class="button primary" href="${href({ name: 'cards', deck: 'due' })}">Review cards</a></p>`
          : html`<p>No cards are due. Come back tomorrow.</p>`}
      </section>
      <section class="card" data-testid="today-resolve"><h2>🔁 Solve again</h2>
        ${resolves.length
          ? html`<p>Solve these again from scratch:</p><ul>${resolves.map((p) => html`<li><a href="${href({ name: 'problem', id: p.id })}">${p.title}</a></li>`)}</ul>`
          : html`<p>Nothing to solve again today.</p>`}
      </section>
      <section class="card" data-testid="today-drill"><h2>🎯 Spot-It drill</h2>
        <p>Up to 10 quick questions from the modules you started. You get 60 seconds for each.</p>
        <p><a class="button" href="${href({ name: 'drills' })}">Start a mixed drill</a></p>
      </section>
      <section class="card" data-testid="today-continue"><h2>▶️ Continue</h2>
        ${lastLesson
          ? html`<p>Pick up where you left off: <a href="${href({ name: 'lesson', id: lastLesson.id })}">📖 ${lastLesson.title}</a></p>`
          : lastProblem
            ? html`<p>Pick up where you left off: <a href="${href({ name: 'problem', id: lastProblem.id })}">🧪 ${lastProblem.title}</a></p>`
            : html`<p><a href="${href({ name: 'roadmap' })}">Pick a module on the roadmap</a>.</p>`}
      </section>
    </div>`;
}
```

- [ ] **Step 5: Create `src/pages/roadmap-page.ts`**

```ts
import { html, type SafeHtml } from '../core/html';
import { href } from '../core/router';
import { LEVELS } from '../engine/dashboard';
import { lessonDone } from '../engine/mastery';
import { isSolved } from '../engine/tracker';
import { comingTag, lessonTag, problemTag } from './progress-tags';
import type { PageContext } from './router-view';

/** `#/roadmap`: every module by level, built and planned, with progress (spec §7.1). */
export function renderRoadmap(ctx: PageContext): SafeHtml {
  const { registry } = ctx;
  const state = ctx.store.get();
  return html`
    <h1>Roadmap</h1>
    <p class="muted">All ${registry.roadmap.length} modules, built and planned. Built parts link to their pages.</p>
    ${LEVELS.map(({ level, title }) => {
      const modules = registry.roadmap.filter((m) => m.level === level);
      if (!modules.length) return null;
      return html`<h2>${title}</h2>
        <div class="roadmap-level">${modules.map((m) => {
          const done = m.lessons.filter((l) => lessonDone(state, l.id)).length;
          const solved = m.problems.filter((p) => isSolved(state.problems[p.id])).length;
          return html`<details class="card roadmap-module" data-testid="roadmap-module">
            <summary><span aria-hidden="true">${m.icon}</span> ${m.order}. ${m.title} ${m.built ? null : comingTag(m.part)}
              <span class="muted roadmap-count">${done} of ${m.lessons.length} lessons done, ${solved} of ${m.problems.length} problems solved</span></summary>
            ${m.built ? html`<p><a class="button" href="${href({ name: 'module', id: m.id })}">Open the module</a></p>` : null}
            <h3>Lessons</h3>
            <ul class="plain-list">${m.lessons.map((l) => (l.built
              ? html`<li><a href="${href({ name: 'lesson', id: l.id })}">📖 ${l.title}</a> ${lessonTag(state, l.id)}</li>`
              : html`<li>📖 ${l.title} ${comingTag(l.part)}</li>`))}</ul>
            ${m.problems.length ? html`<h3>Problems</h3>
            <ul class="plain-list">${m.problems.map((p) => (p.built
              ? html`<li><a href="${href({ name: 'problem', id: p.id })}">🧪 ${p.title}</a> <span class="tag">${p.difficulty}</span> ${problemTag(state, p.id, registry)}</li>`
              : html`<li>🧪 ${p.title} <span class="tag">${p.difficulty}</span> ${comingTag(p.part)}</li>`))}</ul>` : null}
          </details>`;
        })}</div>`;
    })}`;
}
```

- [ ] **Step 6: Create `src/pages/sheet-page.ts`**

```ts
import type { Sheet } from '../content-types';
import { html, type SafeHtml } from '../core/html';
import { href } from '../core/router';
import { isSolved } from '../engine/tracker';
import { comingTag, problemTag } from './progress-tags';
import type { PageContext } from './router-view';

/** `#/sheets/:id`: the list in its own order, with progress or "coming in Part N" (spec §15). */
export function renderSheet(sheet: Sheet, ctx: PageContext): SafeHtml {
  const { registry } = ctx;
  const state = ctx.store.get();
  const solved = sheet.problemIds.filter((id) => isSolved(state.problems[id])).length;
  return html`
    <h1>${sheet.title}</h1>
    <p class="muted">${sheet.credit}</p>
    <p data-testid="sheet-progress"><b>${solved} of ${sheet.problemIds.length} solved.</b></p>
    <ol class="sheet-list">${sheet.problemIds.map((id) => {
      const p = registry.roadmapProblem(id);
      if (!p) return null;
      return p.built
        ? html`<li data-testid="sheet-row"><a href="${href({ name: 'problem', id: p.id })}">${p.title}</a> <span class="tag">${p.difficulty}</span> ${problemTag(state, p.id, registry)}</li>`
        : html`<li data-testid="sheet-row">${p.title} <span class="tag">${p.difficulty}</span> ${comingTag(p.part)} <a href="${p.url}" target="_blank" rel="noopener">Open the original</a></li>`;
    })}</ol>`;
}
```

- [ ] **Step 7: Append the styles to `src/styles/progress.css`**

```css

/* Today, roadmap and sheet pages */
.today-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr)); }
.today-grid h2 { margin-top: 0; font-size: 1.15rem; }
.today-grid ul { padding-left: 1.2rem; }
.roadmap-level { display: grid; gap: 0.6rem; }
.roadmap-module summary { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: baseline; }
.roadmap-count { font-weight: 400; font-size: 0.9rem; flex-basis: 100%; }
.roadmap-module h3 { font-size: 1rem; margin: 0.8rem 0 0.3rem; }
.plain-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.3rem; }
.plain-list li, .sheet-list li { overflow-wrap: anywhere; }
.sheet-list { display: grid; gap: 0.35rem; padding-left: 2.2rem; }
```

- [ ] **Step 8: Run the tests and checks**

Run: `npx vitest run tests/unit/pages && npm test && npm run typecheck && npm run check:content && npm run test:e2e`
Expected: `Tests  28 passed (28)` for the page tests, everything else passes.

- [ ] **Step 9: Commit (controller only, after review)**

```bash
git add src/pages/today.ts src/pages/roadmap-page.ts src/pages/sheet-page.ts src/pages/home.ts src/styles/progress.css tests/unit/pages/today.test.ts
git commit -m "feat(pages): add Today, Roadmap and Sheet pages (Part 1b Task 17)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 18: Flashcard review page

**Files:**
- Create: `src/pages/cards-page.ts`, `src/styles/practice.css`
- Modify: `src/styles/index.css` (one import)
- Test: `tests/unit/pages/cards-page.test.ts`

**Interfaces:**
- Consumes: `deckCards`, `deckTitle`, `KIND_LABEL`, `Card` (Task 8), `RATINGS`, `Rating` (Task 7), `reviewCard`, `startedModules` (Task 10), `dayKey` (Task 5), `codeBlock` (`src/engine/highlight.ts`), `clockOf` (Task 15), `href` (Task 14).
- Produces:
  - `mountCardsPage(host: HTMLElement, ctx: PageContext, deck?: string): () => void`.
  - Without a deck it shows the deck picker (`deck-due`, `deck-weak`, `deck-interview`, `deck-module-<moduleId>` links). With no started module it asks the learner to open a lesson first.
  - With a deck it runs the review: `cards-left` ("X left today" for the due deck), `flashcard`, `card-flip`, `rate-again|hard|good|easy`, and `cards-done` at the end. Space or a tap flips. Keys 1 to 4 rate. An unknown deck shows "Deck not found".
  - `src/styles/practice.css` holds the card styles (fade and color only, no animation with reduced motion). Task 19 appends the drill styles.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/pages/cards-page.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { contentInput } from '../../../content';
import { buildRegistry } from '../../../src/core/registry';
import { createStore, type Store } from '../../../src/core/store';
import { openLesson } from '../../../src/engine/progress';
import { mountCardsPage } from '../../../src/pages/cards-page';

const NOW = new Date(2026, 10, 24, 10).getTime();
const registry = buildRegistry(contentInput);
const runner = { ready: async () => {}, run: async () => ({ kind: 'runnerUnavailable' as const, reason: '' }), stop() {} };
const memStore = (): Store => { const d: Record<string, string> = {}; return createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }); };
const startedStore = () => { const s = memStore(); s.update((d) => openLesson(d, registry.lessonIds[0]!, NOW)); return s; };
const key = (k: string) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

function mount(store: Store, deck?: string) {
  const host = document.createElement('div');
  document.body.append(host);
  const dispose = mountCardsPage(host, { registry, store, runner, now: () => NOW }, deck);
  return { host, dispose: () => { dispose(); host.remove(); } };
}

describe('deck picker', () => {
  it('asks to open a lesson first', () => {
    const { host, dispose } = mount(memStore());
    expect(host.querySelector('h1')!.textContent).toBe('Flashcards');
    expect(host.textContent).toContain('Open a lesson first.');
    dispose();
  });
  it('lists the decks with counts', () => {
    const { host, dispose } = mount(startedStore());
    const total = registry.cards.length;
    expect(host.querySelector('[data-testid="deck-due"]')!.textContent).toContain(`${total} cards`);
    expect(host.querySelector('[data-testid="deck-weak"]')!.textContent).toContain('0 cards');
    expect(host.querySelector('[data-testid="deck-interview"]')!.getAttribute('href')).toBe('#/cards/interview');
    expect(host.querySelector(`[data-testid="deck-module-${registry.modules[0]!.id}"]`)).not.toBeNull();
    dispose();
  });
});

describe('review', () => {
  it('flips with Space, rates with keys and buttons, and finishes', () => {
    const store = startedStore();
    const { host, dispose } = mount(store, 'due');
    const total = registry.cards.length;
    expect(host.querySelector('h1')!.textContent).toBe('Due today');
    expect(host.querySelector('[data-testid="cards-left"]')!.textContent).toBe(`${total} left today`);
    expect(host.querySelector('.card-back')).toBeNull();
    key('3');
    expect(Object.keys(store.get().cards)).toHaveLength(0);
    key(' ');
    expect(host.querySelector('.card-back')).not.toBeNull();
    expect(host.querySelector('.flashcard')!.classList.contains('flipped')).toBe(true);
    key('3');
    const first = registry.cards.find((c) => store.get().cards[c.id])!;
    expect(store.get().cards[first.id]).toMatchObject({ box: 2, dueDay: '2026-11-27' });
    expect(host.querySelector('[data-testid="cards-left"]')!.textContent).toBe(`${total - 1} left today`);
    for (let i = 1; i < total; i++) {
      (host.querySelector('[data-testid="card-flip"]') as HTMLButtonElement).click();
      (host.querySelector('[data-testid="rate-again"]') as HTMLButtonElement).click();
    }
    expect(host.querySelector('[data-testid="cards-done"]')).not.toBeNull();
    expect(Object.keys(store.get().cards)).toHaveLength(total);
    expect(Object.values(store.get().cards).filter((c) => c.again === 1)).toHaveLength(total - 1);
    dispose();
  });
  it('says when a deck does not exist', () => {
    const { host, dispose } = mount(startedStore(), 'nope');
    expect(host.querySelector('h1')!.textContent).toBe('Deck not found');
    dispose();
  });
  it('stops listening to keys after it closes', () => {
    const store = startedStore();
    const { dispose } = mount(store, 'due');
    dispose();
    key(' ');
    key('3');
    expect(store.get().cards).toEqual({});
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/pages/cards-page.test.ts`
Expected: FAIL, because `src/pages/cards-page.ts` does not exist.

- [ ] **Step 3: Create `src/pages/cards-page.ts`**

```ts
import { html, raw, render } from '../core/html';
import { href } from '../core/router';
import { deckCards, deckTitle, KIND_LABEL, type Card } from '../engine/cards';
import { dayKey } from '../engine/days';
import { codeBlock } from '../engine/highlight';
import { RATINGS, type Rating } from '../engine/leitner';
import { reviewCard, startedModules } from '../engine/progress';
import { clockOf } from './clock';
import type { PageContext } from './router-view';

const RATING_LABEL: Record<Rating, string> = { again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy' };

/** `#/cards` (deck picker) and `#/cards/:deck` (review), spec §9.5. */
export function mountCardsPage(host: HTMLElement, ctx: PageContext, deck?: string): () => void {
  const now = clockOf(ctx);
  const { registry } = ctx;
  const state = ctx.store.get();
  const started = startedModules(state, (id) => registry.roadmapLesson(id)?.moduleId);
  const today = dayKey(now());
  const moduleTitle = (id: string) => registry.roadmapModule(id)?.title;

  if (!deck) {
    const count = (d: string) => deckCards(d, registry.cards, state.cards, started, today)?.length ?? 0;
    const decks = [
      { id: 'due', note: 'Mixed from every module you started.' },
      { id: 'weak', note: 'The cards you missed most.' },
      { id: 'interview', note: 'Memory hooks and traps. About 10 minutes.' },
      ...registry.roadmap.filter((m) => started.has(m.id)).map((m) => ({ id: `module-${m.id}`, note: 'Every card of this module.' })),
    ];
    render(host, html`
      <h1>Flashcards</h1>
      ${started.size === 0
        ? html`<p>Open a lesson first. Cards come from the modules you start.</p>`
        : html`<p class="muted">Flip a card, then say how well you knew it. Cards you know come back less often.</p>
          <ul class="deck-list">${decks.map((d) => html`<li><a class="card deck-link" data-testid="deck-${d.id}" href="${href({ name: 'cards', deck: d.id })}"><b>${deckTitle(d.id, moduleTitle)}</b> <span class="tag">${count(d.id)} card${count(d.id) === 1 ? '' : 's'}</span><br /><span class="muted">${d.note}</span></a></li>`)}</ul>`}`);
    return () => { host.innerHTML = ''; };
  }

  const title = deckTitle(deck, moduleTitle);
  const cards = title ? deckCards(deck, registry.cards, state.cards, started, today) : null;
  if (!title || !cards) {
    render(host, html`<h1>Deck not found</h1><p><a href="${href({ name: 'cards' })}">See all decks</a></p>`);
    return () => { host.innerHTML = ''; };
  }

  let index = 0;
  let flipped = false;
  const leftText = (n: number) => (deck === 'due' ? `${n} left today` : `${n} left in this deck`);

  const draw = () => {
    const card: Card | undefined = cards[index];
    if (!card) {
      render(host, html`<h1>${title}</h1><p data-testid="cards-left">${leftText(0)}</p>
        <p class="callout" data-testid="cards-done">All done for now. 🎉</p>
        <p><a class="button" href="${href({ name: 'cards' })}">Back to the decks</a></p>`);
      return;
    }
    render(host, html`
      <h1>${title}</h1>
      <p data-testid="cards-left" aria-live="polite">${leftText(cards.length - index)}</p>
      <div class="flashcard${flipped ? ' flipped' : ''}" data-testid="flashcard" tabindex="-1" role="group" aria-label="Flashcard">
        <p class="card-kind"><span class="tag">${KIND_LABEL[card.kind]}</span> <span class="muted">${card.title}</span></p>
        <div class="card-front">${raw(card.front)}</div>
        ${flipped ? html`<div class="card-back">${raw(card.back)}${card.backCode ? codeBlock(card.backCode, { label: `${card.title} template in Java` }) : null}</div>` : null}
      </div>
      ${flipped
        ? html`<p class="muted">How well did you know it? Keys 1 to 4 work too.</p>
          <div class="rate-buttons">${RATINGS.map((r, i) => html`<button type="button" data-testid="rate-${r}" data-rating="${r}">${i + 1} · ${RATING_LABEL[r]}</button>`)}</div>`
        : html`<p><button type="button" class="primary" data-testid="card-flip">Show the answer</button> <span class="muted">or press Space</span></p>`}`);
    (host.querySelector('[data-testid="flashcard"]') as HTMLElement).focus({ preventScroll: true });
  };

  const flip = () => {
    if (flipped || !cards[index]) return;
    flipped = true;
    draw();
  };
  const rate = (rating: Rating) => {
    const card = cards[index];
    if (!flipped || !card) return;
    ctx.store.update((d) => reviewCard(d, card.id, rating, now()));
    index++;
    flipped = false;
    draw();
  };

  host.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const rating = target.closest<HTMLElement>('[data-rating]')?.dataset.rating as Rating | undefined;
    if (rating) rate(rating);
    else if (target.closest('[data-testid="card-flip"], [data-testid="flashcard"]')) flip();
  });
  const onKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === ' ' && tag !== 'BUTTON' && tag !== 'A' && !flipped) {
      e.preventDefault();
      flip();
    } else if (['1', '2', '3', '4'].includes(e.key)) {
      rate(RATINGS[Number(e.key) - 1]!);
    }
  };
  document.addEventListener('keydown', onKey);
  draw();
  return () => {
    document.removeEventListener('keydown', onKey);
    host.innerHTML = '';
  };
}
```

- [ ] **Step 4: Create `src/styles/practice.css` and import it**

```css
/* Part 1b: flashcards and Spot-It drills. Only fades and color changes. */
.deck-list { list-style: none; padding: 0; display: grid; gap: 0.6rem; }
.deck-link { display: block; color: var(--text); text-decoration: none; }
.deck-link:hover { border-color: var(--accent); }
.flashcard { background: var(--card); border: 2px solid var(--line); border-radius: var(--radius); padding: 1rem; min-height: 10rem; transition: border-color var(--dur) ease, background-color var(--dur) ease; overflow-wrap: anywhere; outline: none; }
.flashcard:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.flashcard.flipped { border-color: var(--accent); }
.card-kind { margin: 0 0 0.5rem; display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: baseline; }
.card-back { border-top: 1px dashed var(--line); margin-top: 0.8rem; padding-top: 0.8rem; animation: card-fade var(--dur) ease; }
.card-back pre.code, .card-front pre { max-width: 100%; overflow-x: auto; }
.card-limits { padding-left: 1.2rem; }
@keyframes card-fade { from { opacity: 0; background-color: var(--bg-2); } to { opacity: 1; background-color: transparent; } }
.rate-buttons { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.4rem; }
.rate-buttons button { padding-inline: 0.3rem; }
@media (prefers-reduced-motion: reduce) {
  .flashcard, .card-back { transition: none; animation: none; }
}
```

Append to `src/styles/index.css`:

```css
@import './practice.css';
```

- [ ] **Step 5: Run the tests and checks**

Run: `npx vitest run tests/unit/pages/cards-page.test.ts && npm test && npm run typecheck && npm run test:e2e`
Expected: `Tests  5 passed (5)` for the cards page, everything else passes.

- [ ] **Step 6: Commit (controller only, after review)**

```bash
git add src/pages/cards-page.ts src/styles/practice.css src/styles/index.css tests/unit/pages/cards-page.test.ts
git commit -m "feat(cards): add the deck picker and the flashcard review page (Part 1b Task 18)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 19: Spot-It drills page

**Files:**
- Create: `src/pages/drills-page.ts`
- Modify: `src/styles/practice.css` (append)
- Test: `tests/unit/pages/drills-page.test.ts`

**Interfaces:**
- Consumes: `drillPool`, `buildSession`, `attemptsNewestFirst`, `isCorrect`, `DRILL_SECONDS`, `DrillQuestion` (Task 9), `recordDrill`, `newAttemptId`, `startedModules` (Task 10), `Registry.drills`, `Registry.patterns`, `Registry.pattern`, `Registry.roadmapModule` (Tasks 3, 9), `clockOf` (Task 15).
- Produces:
  - `interface DrillPageOptions { moduleId?: string; seed?: number; seconds?: number }`
  - `mountDrillsPage(host: HTMLElement, ctx: PageContext, opts?: DrillPageOptions): () => void`. Test ids `drill-start`, `drill-count`, `drill-timer`, `drill-option` (with `data-pattern`), `drill-feedback`, `drill-next`, `drill-summary`, `drill-again`. Each answer (or a time out, which counts as wrong) stores one attempt. Feedback always shows the accepted patterns and the clue explanation.
  - Task 22 routes `#/drills` and `#/drills/:moduleId` here.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/pages/drills-page.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { contentInput } from '../../../content';
import { buildRegistry } from '../../../src/core/registry';
import { createStore, type Store } from '../../../src/core/store';
import { openLesson } from '../../../src/engine/progress';
import { mountDrillsPage } from '../../../src/pages/drills-page';

const NOW = new Date(2026, 10, 24, 10).getTime();
const registry = buildRegistry(contentInput);
const moduleId = registry.modules[0]!.id;
const runner = { ready: async () => {}, run: async () => ({ kind: 'runnerUnavailable' as const, reason: '' }), stop() {} };
const memStore = (): Store => { const d: Record<string, string> = {}; return createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }); };
const startedStore = () => { const s = memStore(); s.update((d) => openLesson(d, registry.lessonIds[0]!, NOW)); return s; };

function mount(store: Store, opts: { moduleId?: string } = {}) {
  const host = document.createElement('div');
  document.body.append(host);
  const dispose = mountDrillsPage(host, { registry, store, runner, now: () => NOW }, { ...opts, seed: 7 });
  const q = (id: string) => host.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`)!;
  return { host, q, dispose: () => { dispose(); host.remove(); } };
}
const currentItem = (host: HTMLElement) => {
  const prompt = host.querySelector('.drill-prompt')!.innerHTML;
  return registry.drills.find((d) => d.prompt === prompt)!;
};

afterEach(() => vi.useRealTimers());

describe('drills page', () => {
  it('asks to open a lesson first', () => {
    const { host, dispose } = mount(memStore());
    expect(host.querySelector('h1')!.textContent).toBe('Spot-It drill');
    expect(host.textContent).toContain('Open a lesson first.');
    dispose();
  });

  it('runs a full session: right, wrong, time out, then the score', () => {
    vi.useFakeTimers();
    const store = startedStore();
    const { host, q, dispose } = mount(store);
    const n = Math.min(10, registry.drills.length);
    q('drill-start').click();
    expect(q('drill-count').textContent).toBe(`Question 1 of ${n}`);
    expect(q('drill-timer').textContent).toBe('60 s left');
    const options = host.querySelectorAll('[data-testid="drill-option"]');
    expect(options.length).toBeGreaterThanOrEqual(4);

    const first = currentItem(host);
    host.querySelector<HTMLButtonElement>(`[data-testid="drill-option"][data-pattern="${first.acceptedPatternIds[0]}"]`)!.click();
    expect(q('drill-feedback').textContent).toContain('✅ Right.');
    expect(q('drill-feedback').textContent).toContain(first.clueExplanation);
    expect(Object.values(store.get().drills)).toEqual([{ itemId: first.id, patternIds: first.acceptedPatternIds, correct: true, at: NOW }]);
    q('drill-next').click();

    const second = currentItem(host);
    [...host.querySelectorAll<HTMLButtonElement>('[data-testid="drill-option"]')].find((b) => !second.acceptedPatternIds.includes(b.dataset.pattern!))!.click();
    expect(q('drill-feedback').textContent).toContain('❌ Not this time.');
    q('drill-next').click();

    vi.advanceTimersByTime(30_000);
    expect(q('drill-timer').textContent).toBe('30 s left');
    vi.advanceTimersByTime(30_000);
    expect(q('drill-feedback').textContent).toContain('⏰ Time is up.');
    expect(Object.values(store.get().drills).filter((a) => !a.correct)).toHaveLength(2);
    for (let i = 3; i < n; i++) {
      q('drill-next').click();
      host.querySelector<HTMLButtonElement>('[data-testid="drill-option"]')!.click();
    }
    q('drill-next').click();
    expect(q('drill-summary').textContent).toMatch(new RegExp(`^You got \\d+ of ${n} right\\.$`));
    expect(Object.keys(store.get().drills)).toHaveLength(n);
    dispose();
  });

  it('scopes a drill to one module, even before it is started', () => {
    const { host, q, dispose } = mount(memStore(), { moduleId });
    expect(host.querySelector('h1')!.textContent).toBe(`Spot-It drill: ${registry.modules[0]!.title}`);
    q('drill-start').click();
    expect(currentItem(host).moduleId).toBe(moduleId);
    dispose();
  });

  it('says when the module does not exist', () => {
    const { host, dispose } = mount(memStore(), { moduleId: 'no-such-module' });
    expect(host.querySelector('h1')!.textContent).toBe('Drill not found');
    dispose();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/pages/drills-page.test.ts`
Expected: FAIL, because `src/pages/drills-page.ts` does not exist.

- [ ] **Step 3: Create `src/pages/drills-page.ts`**

```ts
import { html, raw, render } from '../core/html';
import { href } from '../core/router';
import { attemptsNewestFirst, buildSession, drillPool, DRILL_SECONDS, isCorrect, type DrillQuestion } from '../engine/drills';
import { newAttemptId, recordDrill, startedModules } from '../engine/progress';
import { clockOf } from './clock';
import type { PageContext } from './router-view';

const KIND_TAG = { interview: 'Interview', lookalike: 'Look-alike', reallife: 'Real life' } as const;

export interface DrillPageOptions {
  /** scope the drill to one module (`#/drills/<moduleId>`) */
  moduleId?: string;
  /** fixes the session order in tests. Defaults to the time. */
  seed?: number;
  seconds?: number;
}

/** `#/drills` and `#/drills/:moduleId`: Spot-It drills (spec §6.2). */
export function mountDrillsPage(host: HTMLElement, ctx: PageContext, opts: DrillPageOptions = {}): () => void {
  const now = clockOf(ctx);
  const { registry } = ctx;
  const seconds = opts.seconds ?? DRILL_SECONDS;
  const scope = opts.moduleId ? registry.roadmapModule(opts.moduleId) : undefined;
  let timer: ReturnType<typeof setInterval> | null = null;
  const stopTimer = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };
  const cleanup = () => {
    stopTimer();
    host.innerHTML = '';
  };

  if (opts.moduleId && !scope) {
    render(host, html`<h1>Drill not found</h1><p><a href="${href({ name: 'drills' })}">Start a mixed drill</a></p>`);
    return cleanup;
  }
  const title = scope ? `Spot-It drill: ${scope.title}` : 'Spot-It drill';
  const started = startedModules(ctx.store.get(), (id) => registry.roadmapLesson(id)?.moduleId);
  const pool = drillPool(registry.drills, { started, moduleId: scope?.id });
  let seed = opts.seed ?? now();

  const startScreen = () => {
    if (pool.length === 0) {
      render(host, html`<h1>${title}</h1><p>${scope ? 'This module has no drill items yet.' : 'Open a lesson first. Drills use the modules you started.'}</p>`);
      return;
    }
    const n = Math.min(pool.length, 10);
    render(host, html`<h1>${title}</h1>
      <p>${n} quick question${n === 1 ? '' : 's'}. You get ${seconds} seconds for each. Pick the pattern that fits.</p>
      <p class="muted">Running out of time counts as a miss. The clues are always shown after you answer.</p>
      <p><button type="button" class="primary" data-testid="drill-start">Start</button></p>`);
  };

  let questions: DrillQuestion[] = [];
  let index = 0;
  let right = 0;

  const showQuestion = () => {
    const q = questions[index]!;
    let left = seconds;
    render(host, html`<h1>${title}</h1>
      <p class="drill-head"><span data-testid="drill-count">Question ${index + 1} of ${questions.length}</span>
        <span class="drill-timer" data-testid="drill-timer" role="timer">${left} s left</span></p>
      <div class="card drill-item">
        <p><span class="tag">${KIND_TAG[q.item.kind]}</span></p>
        <div class="drill-prompt">${raw(q.item.prompt)}</div>
        ${q.item.limits?.length ? html`<ul class="card-limits">${q.item.limits.map((l) => html`<li><code>${l}</code></li>`)}</ul>` : null}
      </div>
      <p><b>Which pattern fits?</b></p>
      <div class="drill-options">${q.options.map((o) => html`<button type="button" data-testid="drill-option" data-pattern="${o.patternId}">${o.title}</button>`)}</div>
      <div class="drill-feedback" data-testid="drill-feedback" aria-live="polite" tabindex="-1"></div>`);
    stopTimer();
    timer = setInterval(() => {
      left -= 1;
      const t = host.querySelector('[data-testid="drill-timer"]');
      if (t) t.textContent = `${left} s left`;
      if (left <= 0) answer(null);
    }, 1000);
  };

  const answer = (patternId: string | null) => {
    stopTimer();
    const q = questions[index];
    if (!q || host.querySelector('[data-testid="drill-next"]')) return;
    const correct = patternId !== null && isCorrect(q.item, patternId);
    if (correct) right++;
    const at = now();
    ctx.store.update((d) => recordDrill(d, newAttemptId(at), { itemId: q.item.id, patternIds: [...q.item.acceptedPatternIds], correct, at }));
    host.querySelectorAll<HTMLButtonElement>('[data-testid="drill-option"]').forEach((b) => {
      b.disabled = true;
      if (isCorrect(q.item, b.dataset.pattern ?? '')) b.classList.add('right');
      else if (b.dataset.pattern === patternId) b.classList.add('wrong');
    });
    const answers = q.item.acceptedPatternIds.map((id) => registry.pattern(id)?.title ?? id).join(' or ');
    const verdict = patternId === null ? '⏰ Time is up. That counts as a miss.' : correct ? '✅ Right.' : '❌ Not this time.';
    const last = index === questions.length - 1;
    const feedback = host.querySelector('[data-testid="drill-feedback"]') as HTMLElement;
    render(feedback, html`<p><b>${verdict}</b> The answer: <b>${answers}</b>.</p><p>${q.item.clueExplanation}</p>
      <p><button type="button" class="primary" data-testid="drill-next">${last ? 'See your score' : 'Next question'}</button></p>`);
    feedback.focus({ preventScroll: true });
  };

  const summary = () => {
    render(host, html`<h1>${title}</h1>
      <p class="callout" data-testid="drill-summary">You got ${right} of ${questions.length} right.</p>
      <p><button type="button" class="primary" data-testid="drill-again">Start another drill</button> <a href="${href({ name: 'dashboard' })}">See your dashboard</a></p>`);
  };

  const start = () => {
    questions = buildSession({ items: pool, patterns: registry.patterns, moduleOrder: (id) => registry.roadmapModule(id)?.order, attempts: attemptsNewestFirst(ctx.store.get().drills), seed });
    seed += 1;
    index = 0;
    right = 0;
    showQuestion();
  };

  host.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!btn || btn.disabled) return;
    const id = btn.dataset.testid;
    if (id === 'drill-start' || id === 'drill-again') start();
    else if (id === 'drill-option') answer(btn.dataset.pattern ?? null);
    else if (id === 'drill-next') {
      index++;
      if (index < questions.length) showQuestion();
      else summary();
    }
  });
  startScreen();
  return cleanup;
}
```

- [ ] **Step 4: Append the drill styles to `src/styles/practice.css`**

```css

/* Spot-It drills */
.drill-head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.5rem; font-weight: 600; }
.drill-timer { font-variant-numeric: tabular-nums; }
.drill-item { overflow-wrap: anywhere; }
.drill-options { display: grid; gap: 0.4rem; }
.drill-options button { text-align: left; }
.drill-options button.right { border-color: var(--ok); outline: 2px solid var(--ok); }
.drill-options button.wrong { border-color: var(--bad); outline: 2px solid var(--bad); }
.drill-feedback:focus { outline: none; }
.drill-feedback p { overflow-wrap: anywhere; }
```

- [ ] **Step 5: Run the tests and checks**

Run: `npx vitest run tests/unit/pages/drills-page.test.ts && npm test && npm run typecheck && npm run test:e2e`
Expected: `Tests  4 passed (4)` for the drills page, everything else passes.

- [ ] **Step 6: Commit (controller only, after review)**

```bash
git add src/pages/drills-page.ts src/styles/practice.css tests/unit/pages/drills-page.test.ts
git commit -m "feat(drills): add the Spot-It drill page with a timer (Part 1b Task 19)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 20: Dashboard page

**Files:**
- Create: `src/pages/dashboard-page.ts`, `src/styles/dashboard.css`
- Modify: `src/styles/index.css` (one import)
- Test: `tests/unit/pages/dashboard-page.test.ts`

**Interfaces:**
- Consumes: `computeDashboard`, `Counter` (Task 12), `PatternStatus` (Task 11), `formatDay` (Task 5), `href` (Task 14).
- Produces:
  - `renderDashboard(ctx: PageContext, now: number): SafeHtml`. Read-only. Test ids: `dash-headline`, `counter-lessons`, `counter-problems`, `counter-patterns`, `counter-hours` (each with a `.counter-value` "X of Y, Z left"), `level-<level>`, `pattern-box` (with `data-status`), `sheet-<sheetId>`, `interview-ready`, `weakest`, `activity`, `pace`, `milestones`.
  - Pattern boxes link to the pattern's lesson when it is built, else to `#/roadmap`. Each box also shows the status emoji, so color is never the only cue.
  - `--status-fading: #c2410c` (white text on it passes AA in both themes).

- [ ] **Step 1: Write the failing test**

Create `tests/unit/pages/dashboard-page.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { contentInput } from '../../../content';
import { buildRegistry } from '../../../src/core/registry';
import { createStore, type Store } from '../../../src/core/store';
import { openLesson, passSubmit, recordDrill, saveQuizScore } from '../../../src/engine/progress';
import { renderDashboard } from '../../../src/pages/dashboard-page';

const NOW = new Date(2026, 10, 24, 10).getTime();
const registry = buildRegistry(contentInput);
const runner = { ready: async () => {}, run: async () => ({ kind: 'runnerUnavailable' as const, reason: '' }), stop() {} };
const memStore = (): Store => { const d: Record<string, string> = {}; return createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }); };
const view = (store: Store) => { const el = document.createElement('div'); el.innerHTML = renderDashboard({ registry, store, runner }, NOW).__html; return el; };
const text = (el: Element, id: string) => el.querySelector(`[data-testid="${id}"]`)!.textContent!.replace(/\s+/g, ' ').trim();
const value = (el: Element, id: string) => el.querySelector(`[data-testid="${id}"] .counter-value`)!.textContent;

describe('dashboard page', () => {
  it('shows zeros against the whole course for a new learner', () => {
    const el = view(memStore());
    const lessons = registry.allLessons.length;
    expect(el.querySelector('h1')!.textContent).toBe('Dashboard');
    expect(value(el, 'counter-lessons')).toBe(`0 of ${lessons}, ${lessons} left`);
    expect(value(el, 'counter-problems')).toBe('0 of 319, 319 left');
    expect(value(el, 'counter-patterns')).toBe(`0 of ${registry.patterns.length}, ${registry.patterns.length} left`);
    expect(text(el, 'dash-headline')).toBe('🏅 0% of patterns mastered 🔥 0 days in a row 📌 0 due today');
    expect(el.querySelectorAll('[data-testid="pattern-box"]')).toHaveLength(registry.patterns.length);
    expect(el.querySelectorAll('[data-testid="activity"] span')).toHaveLength(84);
    expect(text(el, 'pace')).toContain('Not enough data yet.');
    expect(text(el, 'weakest')).toContain('No drills yet.');
    expect(el.querySelectorAll('[data-testid="milestones"] li[data-unlocked="false"]')).toHaveLength(5);
  });

  it('shows the numbers after a short session', () => {
    const store = memStore();
    const lessonId = registry.lessonIds[0]!;
    const problemId = registry.problemIds[0]!;
    store.update((d) => {
      openLesson(d, lessonId, NOW);
      saveQuizScore(d, lessonId, 3, 3, NOW);
      passSubmit(d, problemId, NOW);
      recordDrill(d, 'a1', { itemId: 'x', patternIds: registry.problem(problemId)!.patternIds, correct: true, at: NOW });
      recordDrill(d, 'a2', { itemId: 'y', patternIds: registry.problem(problemId)!.patternIds, correct: false, at: NOW + 1 });
    });
    const el = view(store);
    const lessons = registry.allLessons.length;
    expect(value(el, 'counter-lessons')).toBe(`1 of ${lessons}, ${lessons - 1} left`);
    expect(value(el, 'counter-problems')).toBe('1 of 319, 318 left');
    expect(text(el, 'dash-headline')).toContain('🔥 1 day in a row');
    expect(text(el, 'sheet-neetcode150')).toBe('NeetCode 150: 1 of 150 solved');
    expect(text(el, 'interview-ready')).toContain('Spot-It drills right, over your last 2 of up to 50: 50%');
    const box = el.querySelector(`[data-testid="pattern-box"][data-status="practicing"]`)!;
    expect(box.getAttribute('href')).toBe('#/roadmap');
    expect(text(el, 'weakest')).toContain('50% right in the last 2');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/pages/dashboard-page.test.ts`
Expected: FAIL, because `src/pages/dashboard-page.ts` does not exist.

- [ ] **Step 3: Create `src/pages/dashboard-page.ts`**

```ts
import { html, type SafeHtml } from '../core/html';
import { href } from '../core/router';
import { computeDashboard, type Counter } from '../engine/dashboard';
import { formatDay } from '../engine/days';
import type { PatternStatus } from '../engine/mastery';
import type { PageContext } from './router-view';

const STATUS: Record<PatternStatus, { emoji: string; label: string }> = {
  'not-started': { emoji: '⬜', label: 'not started' },
  learning: { emoji: '🟦', label: 'learning' },
  practicing: { emoji: '🟨', label: 'practicing' },
  mastered: { emoji: '🟩', label: 'mastered' },
  fading: { emoji: '🟧', label: 'fading' },
};

const counterText = (c: Counter) => `${c.done} of ${c.total}, ${c.left} left`;
const activityLevel = (n: number) => (n === 0 ? 0 : n <= 2 ? 1 : n <= 5 ? 2 : 3);

/** `#/dashboard` (spec §9.4). Read-only: every number comes from computeDashboard. */
export function renderDashboard(ctx: PageContext, now: number): SafeHtml {
  const d = computeDashboard(ctx.store.get(), ctx.registry, now);
  const activeDays = d.activity.filter((a) => a.count > 0).length;
  return html`
    <h1>Dashboard</h1>
    <p class="dash-headline" data-testid="dash-headline">
      <span>🏅 ${d.headline.masteredPct}% of patterns mastered</span>
      <span>🔥 ${d.headline.streak} day${d.headline.streak === 1 ? '' : 's'} in a row</span>
      <span>📌 ${d.headline.dueToday} due today</span>
    </p>

    <section aria-labelledby="dash-counters"><h2 id="dash-counters">What is done and what is left</h2>
      <div class="counter-grid">
        <div class="card" data-testid="counter-lessons"><p class="counter-label">📖 Lessons done</p><p class="counter-value">${counterText(d.lessons)}</p></div>
        <div class="card" data-testid="counter-problems"><p class="counter-label">🧪 Problems solved</p><p class="counter-value">${counterText(d.problems)}</p></div>
        <div class="card" data-testid="counter-patterns"><p class="counter-label">🧩 Patterns mastered</p><p class="counter-value">${counterText(d.patterns)}</p></div>
        <div class="card" data-testid="counter-hours"><p class="counter-label">⏱️ Hours of study (estimate)</p><p class="counter-value">${counterText(d.hours)}</p></div>
      </div>
    </section>

    <section aria-labelledby="dash-levels"><h2 id="dash-levels">Progress by level</h2>
      ${d.levels.map((l) => html`<div class="level-row" data-testid="level-${l.level}"><span>${l.title}</span><progress max="${Math.max(l.total, 1)}" value="${l.done}" aria-label="${l.title}: ${l.done} of ${l.total}"></progress><span class="muted">${l.done} of ${l.total} (${l.pct}%)</span></div>`)}
    </section>

    <section aria-labelledby="dash-map"><h2 id="dash-map">Pattern map</h2>
      <p class="muted legend">${Object.values(STATUS).map((s) => html`<span>${s.emoji} ${s.label}</span> `)}</p>
      ${d.patternMap.map((m) => html`<h3><span aria-hidden="true">${m.icon}</span> ${m.moduleTitle}</h3>
        <ul class="pattern-map">${m.patterns.map((p) => html`<li><a class="pattern-box" data-testid="pattern-box" data-status="${p.status}" href="${p.lessonBuilt ? href({ name: 'lesson', id: p.lessonId }) : href({ name: 'roadmap' })}" aria-label="${p.title}: ${STATUS[p.status].label}"><span aria-hidden="true">${STATUS[p.status].emoji}</span> ${p.title}</a></li>`)}</ul>`)}
    </section>

    <section aria-labelledby="dash-sheets"><h2 id="dash-sheets">Problem lists</h2>
      <ul>${d.sheets.map((s) => html`<li data-testid="sheet-${s.id}"><a href="${href({ name: 'sheet', id: s.id })}">${s.title}</a>: ${s.solved} of ${s.total} solved</li>`)}</ul>
    </section>

    <section aria-labelledby="dash-ready"><h2 id="dash-ready">Interview-ready score</h2>
      <div class="card" data-testid="interview-ready">
        <p class="counter-value">${d.interviewReady.score}%</p>
        <p>It is the average of two parts:</p>
        <ul>
          <li>NeetCode 150 problems at level 3 or higher: <b>${d.interviewReady.sheetShare}%</b></li>
          <li>Spot-It drills right, over your last ${d.interviewReady.drillsCounted} of up to 50: <b>${d.interviewReady.drillAccuracy}%</b></li>
        </ul>
      </div>
    </section>

    <section aria-labelledby="dash-weak"><h2 id="dash-weak">Weakest patterns</h2>
      ${d.weakest.length
        ? html`<ol data-testid="weakest">${d.weakest.map((w) => html`<li>${w.title}: ${w.accuracy === null ? 'no drills yet' : `${w.accuracy}% right in the last ${w.attempts}`}${w.fading ? html` <span class="tag">🟧 fading</span>` : null}</li>`)}</ol>`
        : html`<p data-testid="weakest">No drills yet. <a href="${href({ name: 'drills' })}">Try a Spot-It drill</a>.</p>`}
    </section>

    <section aria-labelledby="dash-activity"><h2 id="dash-activity">Activity, last 12 weeks</h2>
      <div class="activity-grid" data-testid="activity" role="img" aria-label="${activeDays} active days in the last 12 weeks">${d.activity.map((a) => html`<span data-level="${activityLevel(a.count)}" title="${formatDay(a.day)}: ${a.count}"></span>`)}</div>
    </section>

    <section aria-labelledby="dash-pace"><h2 id="dash-pace">Pace</h2>
      ${d.pace
        ? html`<ul data-testid="pace">${d.pace.map((p) => html`<li>${p.title}: ${p.finishDay ? `done by about ${formatDay(p.finishDay)} (${p.left} left)` : '✅ done'}</li>`)}</ul>`
        : html`<p data-testid="pace">Not enough data yet. Learn on 3 different days in 2 weeks to see your finish dates.</p>`}
    </section>

    <section aria-labelledby="dash-milestones"><h2 id="dash-milestones">Milestones</h2>
      <ul class="milestones" data-testid="milestones">${d.milestones.map((m) => html`<li data-unlocked="${String(m.unlocked)}">${m.unlocked ? '🏆' : '🔒'} ${m.title}</li>`)}</ul>
      <p class="muted">A milestone opens when every pattern in its level is mastered.</p>
    </section>`;
}
```

- [ ] **Step 4: Create `src/styles/dashboard.css` and import it**

```css
/* Part 1b: the dashboard. Status colors keep white text at AA contrast in both themes. */
:root { --status-fading: #c2410c; }
.dash-headline { display: flex; flex-wrap: wrap; gap: 0.4rem 1.2rem; font-size: 1.05rem; font-weight: 600; }
.counter-grid { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 12rem), 1fr)); }
.counter-label { margin: 0; color: var(--muted); font-size: 0.9rem; }
.counter-value { margin: 0.2rem 0 0; font-size: 1.15rem; font-weight: 700; }
.level-row { display: grid; grid-template-columns: 5.5rem minmax(0, 1fr); gap: 0.25rem 0.6rem; align-items: center; margin-bottom: 0.5rem; }
.level-row .muted { grid-column: 2; font-size: 0.9rem; }
.level-row progress { width: 100%; height: 0.8rem; accent-color: var(--accent); }
.legend { display: flex; flex-wrap: wrap; gap: 0.2rem 0.8rem; }
.pattern-map { list-style: none; padding: 0; margin: 0 0 0.5rem; display: flex; flex-wrap: wrap; gap: 0.4rem; }
.pattern-box { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 6px; border: 1px solid var(--line); background: var(--bg-2); color: var(--text); font-size: 0.85rem; text-decoration: none; overflow-wrap: anywhere; transition: background-color var(--dur) ease; }
.pattern-box[data-status='learning'] { background: var(--mark-current); border-color: var(--mark-current); color: #fff; }
.pattern-box[data-status='practicing'] { background: var(--mark-range); border-color: var(--mark-range); color: #fff; }
.pattern-box[data-status='mastered'] { background: var(--mark-answer); border-color: var(--mark-answer); color: #fff; }
.pattern-box[data-status='fading'] { background: var(--status-fading); border-color: var(--status-fading); color: #fff; }
.activity-grid { display: grid; grid-auto-flow: column; grid-template-rows: repeat(7, 0.85rem); grid-auto-columns: 0.85rem; gap: 3px; max-width: 100%; overflow-x: auto; }
.activity-grid span { border-radius: 2px; background: var(--bg-2); border: 1px solid var(--line); }
.activity-grid span[data-level='1'] { background: color-mix(in srgb, var(--accent) 40%, var(--bg-2)); }
.activity-grid span[data-level='2'] { background: color-mix(in srgb, var(--accent) 70%, var(--bg-2)); }
.activity-grid span[data-level='3'] { background: var(--accent); }
.milestones { list-style: none; padding: 0; display: grid; gap: 0.3rem; }
.milestones li[data-unlocked='false'] { color: var(--muted); }
```

Append to `src/styles/index.css`:

```css
@import './dashboard.css';
```

- [ ] **Step 5: Run the tests and checks**

Run: `npx vitest run tests/unit/pages/dashboard-page.test.ts && npm test && npm run typecheck && npm run test:e2e`
Expected: `Tests  2 passed (2)` for the dashboard page, everything else passes.

- [ ] **Step 6: Commit (controller only, after review)**

```bash
git add src/pages/dashboard-page.ts src/styles/dashboard.css src/styles/index.css tests/unit/pages/dashboard-page.test.ts
git commit -m "feat(dashboard): add the read-only dashboard page (Part 1b Task 20)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 21: Settings page with export and import

**Files:**
- Create: `src/pages/settings-page.ts`
- Modify: `src/styles/progress.css` (append)
- Test: `tests/unit/pages/settings-page.test.ts`

**Interfaces:**
- Consumes: `normalize`, `StoredState`, `ThemeSetting` (Task 4), `dayKey` (Task 5), `clockOf` (Task 15). `initTheme` already follows store changes, so the page only writes `settings.theme`.
- Produces:
  - `interface SettingsDeps { confirm?: (message: string) => boolean; download?: (fileName: string, text: string) => void }`
  - `parseProgressFile(text: string): { ok: true; state: StoredState } | { ok: false; message: string }`
  - `mountSettings(host: HTMLElement, ctx: PageContext, deps?: SettingsDeps): () => void`. Test ids `export`, `import-file`, `settings-status`. Theme radios use `name="theme"`. Import asks before it replaces anything. The page says sync comes later.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/pages/settings-page.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildRegistry } from '../../../src/core/registry';
import { createStore, defaultState, type Store } from '../../../src/core/store';
import { mountSettings, parseProgressFile } from '../../../src/pages/settings-page';

const NOW = new Date(2026, 10, 24, 10).getTime();
const registry = buildRegistry({ modules: [], lessons: [], problems: [], traces: [] });
const runner = { ready: async () => {}, run: async () => ({ kind: 'runnerUnavailable' as const, reason: '' }), stop() {} };
const memStore = (): Store => { const d: Record<string, string> = {}; return createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }); };
const flush = () => new Promise((r) => setTimeout(r, 0));

function mount(store: Store, confirm = () => true) {
  const host = document.createElement('div');
  const files: [string, string][] = [];
  const dispose = mountSettings(host, { registry, store, runner, now: () => NOW }, { confirm, download: (name, text) => files.push([name, text]) });
  const pick = async (text: string) => {
    const input = host.querySelector<HTMLInputElement>('[data-testid="import-file"]')!;
    Object.defineProperty(input, 'files', { configurable: true, value: [new File([text], 'progress.json', { type: 'application/json' })] });
    input.dispatchEvent(new Event('change'));
    await flush();
  };
  return { host, files, pick, dispose, status: () => host.querySelector('[data-testid="settings-status"]')!.textContent };
}

describe('parseProgressFile', () => {
  it('accepts an export and drops bad parts', () => {
    const r = parseProgressFile(JSON.stringify({ version: 1, settings: { theme: 'light', updatedAt: 1 }, lessons: { l: { openedAt: 'bad' } } }));
    expect(r.ok && r.state.settings.theme).toBe('light');
    expect(r.ok && r.state.lessons).toEqual({});
  });
  it('rejects other files', () => {
    expect(parseProgressFile('{nope')).toEqual({ ok: false, message: 'This file is not valid JSON. Pick a file you exported from this site.' });
    expect(parseProgressFile('[1, 2]')).toEqual({ ok: false, message: 'This is not a DSA Playbook progress file.' });
    expect(parseProgressFile('{"version": 2}')).toEqual({ ok: false, message: 'This is not a DSA Playbook progress file.' });
  });
});

describe('settings page', () => {
  it('changes the theme', () => {
    const store = memStore();
    const { host } = mount(store);
    expect(host.querySelector<HTMLInputElement>('input[value="system"]')!.checked).toBe(true);
    const light = host.querySelector<HTMLInputElement>('input[value="light"]')!;
    light.checked = true;
    light.dispatchEvent(new Event('change'));
    expect(store.get().settings).toEqual({ theme: 'light', updatedAt: NOW });
  });

  it('exports the whole progress as a dated JSON file', () => {
    const store = memStore();
    store.update((d) => { d.days['2026-11-24'] = 2; });
    const { host, files, status } = mount(store);
    host.querySelector<HTMLButtonElement>('[data-testid="export"]')!.click();
    expect(files[0]![0]).toBe('dsa-playbook-progress-2026-11-24.json');
    expect(JSON.parse(files[0]![1]).days).toEqual({ '2026-11-24': 2 });
    expect(status()).toBe('Progress exported.');
  });

  it('imports after asking, and keeps progress when the learner says no', async () => {
    const saved = { ...defaultState(), days: { '2026-11-20': 5 } };
    const store = memStore();
    store.update((d) => { d.days['2026-11-24'] = 1; });
    const no = mount(store, () => false);
    await no.pick(JSON.stringify(saved));
    expect(no.status()).toBe('Nothing was changed.');
    expect(store.get().days).toEqual({ '2026-11-24': 1 });
    const yes = mount(store, () => true);
    await yes.pick(JSON.stringify(saved));
    expect(yes.status()).toBe('Progress imported.');
    expect(store.get().days).toEqual({ '2026-11-20': 5 });
    await yes.pick('not json');
    expect(yes.status()).toContain('not valid JSON');
  });

  it('says sync comes later', () => {
    const { host } = mount(memStore());
    expect(host.textContent).toContain('Sync between devices comes later.');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/pages/settings-page.test.ts`
Expected: FAIL, because `src/pages/settings-page.ts` does not exist.

- [ ] **Step 3: Create `src/pages/settings-page.ts`**

```ts
import { html, render } from '../core/html';
import { normalize, type StoredState, type ThemeSetting } from '../core/store';
import { dayKey } from '../engine/days';
import { clockOf } from './clock';
import type { PageContext } from './router-view';

export interface SettingsDeps {
  confirm?: (message: string) => boolean;
  /** saves a text file. The default makes the browser download it. */
  download?: (fileName: string, text: string) => void;
}

const THEMES: { value: ThemeSetting; label: string }[] = [
  { value: 'system', label: 'Follow my device' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

function browserDownload(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Reads an exported progress file. It must be JSON with `version: 1`. `normalize` drops anything invalid. */
export function parseProgressFile(text: string): { ok: true; state: StoredState } | { ok: false; message: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, message: 'This file is not valid JSON. Pick a file you exported from this site.' };
  }
  if (typeof raw !== 'object' || raw === null || (raw as { version?: unknown }).version !== 1) {
    return { ok: false, message: 'This is not a DSA Playbook progress file.' };
  }
  return { ok: true, state: normalize(raw) };
}

/** `#/settings`: theme, export and import (spec §7.1, §12.2). Sync comes in Part 1d. */
export function mountSettings(host: HTMLElement, ctx: PageContext, deps: SettingsDeps = {}): () => void {
  const now = clockOf(ctx);
  const confirmFn = deps.confirm ?? ((m: string) => window.confirm(m));
  const download = deps.download ?? browserDownload;
  const theme = ctx.store.get().settings.theme;
  render(host, html`
    <h1>Settings</h1>
    <section aria-labelledby="set-theme"><h2 id="set-theme">Theme</h2>
      <fieldset class="theme-choice"><legend class="visually-hidden">Theme</legend>
        ${THEMES.map((t) => html`<label><input type="radio" name="theme" value="${t.value}" ${t.value === theme ? 'checked' : ''} /> ${t.label}</label>`)}
      </fieldset>
    </section>
    <section aria-labelledby="set-progress"><h2 id="set-progress">Your progress</h2>
      <p>Your progress lives in this browser. Export it to keep a copy, or to move it to another device.</p>
      <p><button type="button" data-testid="export">⬇️ Export progress</button></p>
      <p><label class="import-label">⬆️ Import progress <input type="file" accept="application/json,.json" data-testid="import-file" /></label></p>
      <p class="settings-status" data-testid="settings-status" role="status"></p>
    </section>
    <section aria-labelledby="set-sync"><h2 id="set-sync">Sync</h2>
      <p class="muted">Sync between devices comes later. Until then, use Export and Import.</p>
    </section>`);
  const status = host.querySelector('[data-testid="settings-status"]') as HTMLElement;

  host.querySelectorAll<HTMLInputElement>('input[name="theme"]').forEach((input) =>
    input.addEventListener('change', () => {
      ctx.store.update((d) => {
        d.settings.theme = input.value as ThemeSetting;
        d.settings.updatedAt = now();
      });
    }),
  );
  host.querySelector('[data-testid="export"]')!.addEventListener('click', () => {
    download(`dsa-playbook-progress-${dayKey(now())}.json`, `${JSON.stringify(ctx.store.get(), null, 2)}\n`);
    status.textContent = 'Progress exported.';
  });
  const fileInput = host.querySelector('[data-testid="import-file"]') as HTMLInputElement;
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const parsed = parseProgressFile(await file.text());
    fileInput.value = '';
    if (!parsed.ok) {
      status.textContent = parsed.message;
      return;
    }
    if (!confirmFn('Replace all your progress with this file? This cannot be undone.')) {
      status.textContent = 'Nothing was changed.';
      return;
    }
    ctx.store.update((d) => { Object.assign(d, parsed.state); });
    status.textContent = 'Progress imported.';
  });
  return () => { host.innerHTML = ''; };
}
```

- [ ] **Step 4: Append the styles to `src/styles/progress.css`**

```css

/* Settings */
.theme-choice { border: 0; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; }
.theme-choice label { display: inline-flex; gap: 0.4rem; align-items: center; min-height: 2.25rem; }
.import-label { display: inline-flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; font-weight: 600; }
.import-label input { max-width: 100%; }
```

- [ ] **Step 5: Run the tests and checks**

Run: `npx vitest run tests/unit/pages/settings-page.test.ts && npm test && npm run typecheck && npm run test:e2e`
Expected: `Tests  6 passed (6)` for the settings page, everything else passes.

- [ ] **Step 6: Commit (controller only, after review)**

```bash
git add src/pages/settings-page.ts src/styles/progress.css tests/unit/pages/settings-page.test.ts
git commit -m "feat(settings): add theme, export and import of progress (Part 1b Task 21)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 22: Wire the routes, the top nav, the module dots and boot

**Files:**
- Modify (replace the whole file): `src/pages/router-view.ts`, `src/pages/shell.ts`, `src/styles/shell.css`
- Modify: `src/core/registry.ts` (`allRoutes`), `src/main.ts` (pass the store), `src/styles/lesson.css` and `src/styles/problem.css` (scroll margin)
- Test: `tests/unit/core/registry.test.ts` (the route list), `tests/unit/pages/shell.test.ts` (append)

**Interfaces:**
- Consumes: every page from Tasks 15 to 21, `clockOf` (Task 15), `startedModules` (Task 10), `lessonDone` (Task 11), `isSolved` (Task 6), `Registry.sheets` (Task 3).
- Produces:
  - `renderRoute` handles every route of Task 14. `#/` is Today. An unknown sheet, module, lesson or problem shows "Page not found".
  - `allRoutes(registry)` returns, in order: `#/`, `#/dashboard`, `#/roadmap`, `#/settings`, `#/drills`, `#/drills/<moduleId>` per built module, `#/cards`, `#/cards/due`, `#/cards/weak`, `#/cards/interview`, `#/cards/module-<moduleId>` per built module, `#/sheets/<sheetId>` per sheet, then the module, lesson and problem routes as before. The e2e smoke test opens all of them.
  - `mountShell(root, registry, theme, store?)`. The header has a second row, `nav.topnav`, with Today, Dashboard, Cards, Drills and Roadmap. Each sidebar module link starts with `span.dot[data-module-dot][data-state="none|started|done"]`, redrawn on every store change. `setActive` marks top nav links too.
  - CSS variable `--top-h` (header height) replaces the hard-coded `3.3rem`.

Changing the expected list in `registry.test.ts` is required by D10 ("`allRoutes()` includes them"). It is not a test weakened to pass.

- [ ] **Step 1: Write the failing tests**

In `tests/unit/core/registry.test.ts`, replace the `lists every route` test with:

```ts
  it('lists every route', () => {
    expect(allRoutes(buildRegistry(input()))).toEqual([
      '#/', '#/dashboard', '#/roadmap', '#/settings',
      '#/drills', '#/drills/a', '#/drills/b',
      '#/cards', '#/cards/due', '#/cards/weak', '#/cards/interview', '#/cards/module-a', '#/cards/module-b',
      '#/m/a', '#/m/b', '#/l/l1', '#/p/p1',
    ]);
    const withSheet = buildRegistry({ ...input(), catalog: { modules: [], lessons: [], patterns: [], problems: [], sheets: [{ id: 'striver-bs', title: 'S', credit: 'c', problemIds: [] }] } });
    expect(allRoutes(withSheet)).toContain('#/sheets/striver-bs');
  });
```

In `tests/unit/pages/shell.test.ts`, change the content-types import and add the store import:

```ts
import type { Lesson, Module } from '../../../src/content-types';
import { createStore } from '../../../src/core/store';
```

Then append:

```ts

describe('top nav and module dots (Part 1b)', () => {
  const memStore = () => { const d: Record<string, string> = {}; return createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }); };
  const lesson = { id: 'l1', moduleId: 'foundations', title: 'L1' } as unknown as Lesson;
  const withLesson = buildRegistry({ modules: [{ ...m, lessonIds: ['l1'] }], lessons: [lesson], problems: [], traces: [] });

  it('has a compact top nav and marks the current page', () => {
    const root = document.createElement('div');
    const shell = mountShell(root, registry, { current: () => 'dark', toggle: () => {} });
    const links = [...root.querySelectorAll('.topnav a')];
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['🏠Today', '#/'], ['📊Dashboard', '#/dashboard'], ['🃏Cards', '#/cards'], ['🎯Drills', '#/drills'], ['🗺️Roadmap', '#/roadmap'],
    ]);
    shell.setActive({ name: 'dashboard' });
    expect(root.querySelector('.topnav a[aria-current="page"]')!.getAttribute('href')).toBe('#/dashboard');
  });

  it('fills the module dot as progress grows', () => {
    const root = document.createElement('div');
    const store = memStore();
    mountShell(root, withLesson, { current: () => 'dark', toggle: () => {} }, store);
    const dot = root.querySelector<HTMLElement>('[data-module-dot="foundations"]')!;
    expect(dot.dataset.state).toBe('none');
    expect(dot.getAttribute('aria-label')).toBe('Not started');
    store.update((s) => { s.lessons.l1 = { openedAt: 1, bestScore: 0, total: 0, updatedAt: 1 }; });
    expect(dot.dataset.state).toBe('started');
    store.update((s) => { s.lessons.l1 = { openedAt: 1, bestScore: 3, total: 3, passedAt: 2, updatedAt: 2 }; });
    expect(dot.dataset.state).toBe('done');
    expect(dot.getAttribute('aria-label')).toBe('Done');
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/unit/core/registry.test.ts tests/unit/pages/shell.test.ts`
Expected: FAIL. The route list is the old one, and the shell has no `.topnav` and no dots.

- [ ] **Step 3: Replace `allRoutes` in `src/core/registry.ts`**

```ts
/** Every page the site can show. The e2e smoke test opens each one. */
export function allRoutes(registry: Registry): string[] {
  return [
    '#/',
    '#/dashboard',
    '#/roadmap',
    '#/settings',
    '#/drills',
    ...registry.modules.map((m) => `#/drills/${m.id}`),
    '#/cards',
    '#/cards/due',
    '#/cards/weak',
    '#/cards/interview',
    ...registry.modules.map((m) => `#/cards/module-${m.id}`),
    ...registry.sheets.map((s) => `#/sheets/${s.id}`),
    ...registry.modules.map((m) => `#/m/${m.id}`),
    ...registry.lessonIds.map((id) => `#/l/${id}`),
    ...registry.problemIds.map((id) => `#/p/${id}`),
  ];
}
```

- [ ] **Step 4: Replace `src/pages/router-view.ts`**

```ts
import { render } from '../core/html';
import type { Registry } from '../core/registry';
import type { Route } from '../core/router';
import type { Store } from '../core/store';
import type { createEditor } from '../lab/editor';
import type { JavaRunner } from '../lab/runner';
import { mountCardsPage } from './cards-page';
import { clockOf } from './clock';
import { renderDashboard } from './dashboard-page';
import { mountDrillsPage } from './drills-page';
import { mountLessonPage } from './lesson-page';
import { mountModulePage } from './module-page';
import { renderNotFound } from './not-found';
import { mountProblemPage } from './problem-page';
import { renderRoadmap } from './roadmap-page';
import { mountSettings } from './settings-page';
import { renderSheet } from './sheet-page';
import { renderToday } from './today';

export interface PageContext {
  registry: Registry;
  store: Store;
  runner: JavaRunner;
  makeEditor?: typeof createEditor;
  /** the clock, so tests can pick the time. Defaults to Date.now. */
  now?: () => number;
}

const noop = () => {};
const titled = (title: string, cleanup: () => void = noop) => ({ title: `${title} · DSA Playbook`, cleanup });

export function renderRoute(route: Route, outlet: HTMLElement, ctx: PageContext): { title: string; cleanup: () => void } {
  outlet.innerHTML = '';
  const now = clockOf(ctx);
  switch (route.name) {
    case 'home':
      render(outlet, renderToday(ctx, now()));
      return { title: 'DSA Playbook', cleanup: noop };
    case 'dashboard':
      render(outlet, renderDashboard(ctx, now()));
      return titled('Dashboard');
    case 'roadmap':
      render(outlet, renderRoadmap(ctx));
      return titled('Roadmap');
    case 'settings':
      return titled('Settings', mountSettings(outlet, ctx));
    case 'drills':
      return titled('Spot-It drill', mountDrillsPage(outlet, ctx, { moduleId: route.moduleId }));
    case 'cards':
      return titled('Flashcards', mountCardsPage(outlet, ctx, route.deck));
    case 'sheet': {
      const sheet = ctx.registry.sheet(route.id);
      if (!sheet) break;
      render(outlet, renderSheet(sheet, ctx));
      return titled(sheet.title);
    }
    case 'module': {
      const m = ctx.registry.module(route.id);
      if (!m) break;
      return titled(m.title, mountModulePage(outlet, m, ctx));
    }
    case 'lesson': {
      const lesson = ctx.registry.lesson(route.id);
      if (!lesson) break;
      return titled(lesson.title, mountLessonPage(outlet, lesson, ctx));
    }
    case 'problem': {
      const problem = ctx.registry.problem(route.id);
      if (!problem) break;
      return titled(problem.title, mountProblemPage(outlet, problem, ctx));
    }
    case 'notFound':
      break;
  }
  render(outlet, renderNotFound());
  return { title: 'Not found · DSA Playbook', cleanup: noop };
}
```

- [ ] **Step 5: Replace `src/pages/shell.ts`**

```ts
import { html, render } from '../core/html';
import type { Registry } from '../core/registry';
import { href, type Route } from '../core/router';
import type { Store, StoredState } from '../core/store';
import type { ThemeControl } from '../core/theme';
import { lessonDone } from '../engine/mastery';
import { startedModules } from '../engine/progress';
import { isSolved } from '../engine/tracker';

export interface Shell {
  outlet: HTMLElement;
  setActive(route: Route): void;
}

type DotState = 'none' | 'started' | 'done';
const DOT_LABEL: Record<DotState, string> = { none: 'Not started', started: 'Started', done: 'Done' };

const NAV: { route: Exclude<Route, { name: 'notFound' }>; icon: string; label: string }[] = [
  { route: { name: 'home' }, icon: '🏠', label: 'Today' },
  { route: { name: 'dashboard' }, icon: '📊', label: 'Dashboard' },
  { route: { name: 'cards' }, icon: '🃏', label: 'Cards' },
  { route: { name: 'drills' }, icon: '🎯', label: 'Drills' },
  { route: { name: 'roadmap' }, icon: '🗺️', label: 'Roadmap' },
];

/** Empty until a lesson of the module is opened. Full when every built lesson is done and every built problem is solved. */
function moduleDot(registry: Registry, state: Readonly<StoredState>, moduleId: string, started: ReadonlySet<string>): DotState {
  const m = registry.module(moduleId);
  if (!m) return 'none';
  const items = m.lessonIds.length + m.problemIds.length;
  const done = items > 0 && m.lessonIds.every((id) => lessonDone(state, id)) && m.problemIds.every((id) => isSolved(state.problems[id]));
  if (done) return 'done';
  return started.has(moduleId) ? 'started' : 'none';
}

export function mountShell(root: HTMLElement, registry: Registry, theme: ThemeControl, store?: Store): Shell {
  render(root, html`
    <a class="visually-hidden" href="#main">Skip to content</a>
    <header class="topbar">
      <div class="topbar-row">
        <button type="button" class="menu-btn" data-action="menu" aria-label="Open menu" aria-expanded="false">☰</button>
        <a class="brand" href="#/">🧩 DSA Playbook</a>
        <span class="spacer"></span>
        <button type="button" data-action="theme" aria-label="Switch dark or light theme">🌓</button>
      </div>
      <nav class="topnav" aria-label="Main">
        ${NAV.map((n) => html`<a href="${href(n.route)}"><span class="nav-icon" aria-hidden="true">${n.icon}</span><span>${n.label}</span></a>`)}
      </nav>
    </header>
    <div class="layout">
      <aside class="sidebar" aria-label="Modules">
        <nav>
          ${registry.modules.map((m) => html`
            <h2>${m.level}</h2>
            <ul>
              <li><a class="module-link" href="${href({ name: 'module', id: m.id })}"><span class="dot" data-module-dot="${m.id}" data-state="none" role="img" aria-label="${DOT_LABEL.none}"></span> ${m.icon} ${m.title}</a></li>
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
  root.querySelector('a[href="#main"]')!.addEventListener('click', (e) => {
    e.preventDefault();
    (root.querySelector('main') as HTMLElement).focus();
  });
  root.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Escape' && document.body.classList.contains('nav-open')) {
      setMenu(false);
      menuBtn.focus();
    }
  });
  root.querySelector('[data-action="theme"]')!.addEventListener('click', () => theme.toggle());
  root.querySelector('.sidebar')!.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) setMenu(false);
  });

  const drawDots = (state: Readonly<StoredState>) => {
    const started = startedModules(state, (id) => registry.roadmapLesson(id)?.moduleId);
    root.querySelectorAll<HTMLElement>('[data-module-dot]').forEach((dot) => {
      const s = moduleDot(registry, state, dot.dataset.moduleDot ?? '', started);
      dot.dataset.state = s;
      dot.setAttribute('aria-label', DOT_LABEL[s]);
    });
  };
  if (store) {
    drawDots(store.get());
    store.subscribe(drawDots);
  }

  return {
    outlet: root.querySelector('main') as HTMLElement,
    setActive(route) {
      const target = route.name === 'notFound' ? null : href(route);
      root.querySelectorAll('.sidebar a, .topnav a').forEach((a) => {
        if (a.getAttribute('href') === target) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
    },
  };
}
```

- [ ] **Step 6: Replace `src/styles/shell.css`**

```css
:root { --top-h: calc(6rem + 2px); }
.topbar { position: sticky; top: 0; z-index: 20; background: var(--bg); border-bottom: 1px solid var(--line); }
.topbar-row { display: flex; align-items: center; gap: 0.75rem; padding: 0 1rem; height: 3.3rem; }
.brand { font-weight: 700; color: var(--text); text-decoration: none; font-size: 1.05rem; }
.topbar .spacer { flex: 1; }
.menu-btn { display: inline-flex; }
.topnav { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); height: 2.7rem; border-top: 1px solid var(--line); }
.topnav a { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.05rem; min-width: 0; padding: 0 0.15rem; font-size: 0.72rem; line-height: 1.15; color: var(--muted); text-decoration: none; transition: color var(--dur) ease; }
.topnav a span { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.topnav .nav-icon { font-size: 1rem; }
.topnav a:hover { color: var(--text); }
.topnav a[aria-current='page'] { color: var(--accent); font-weight: 700; box-shadow: inset 0 -3px 0 var(--accent); }
@media (min-width: 700px) { .topnav a { flex-direction: row; gap: 0.4rem; font-size: 0.9rem; } }
.layout { display: grid; grid-template-columns: minmax(0, 1fr); }
.sidebar { position: fixed; inset: var(--top-h) auto 0 0; width: min(18rem, 85vw); background: var(--bg-2); border-right: 1px solid var(--line); padding: 1rem; overflow-y: auto; transform: translateX(-105%); visibility: hidden; transition: transform var(--dur) ease, visibility var(--dur); z-index: 15; }
body.nav-open .sidebar { transform: none; visibility: visible; }
.sidebar h2 { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin: 1rem 0 0.3rem; }
.sidebar ul { list-style: none; margin: 0; padding: 0; }
.sidebar a { display: block; padding: 0.3rem 0.5rem; border-radius: 6px; color: var(--text); text-decoration: none; font-size: 0.95rem; }
.sidebar a[aria-current='page'] { background: var(--accent); color: var(--on-accent); }
.sidebar .module-link { font-weight: 600; }
.dot { display: inline-block; width: 0.7rem; height: 0.7rem; border-radius: 50%; border: 2px solid var(--muted); vertical-align: middle; }
.dot[data-state='started'] { border-color: var(--accent); background: linear-gradient(90deg, var(--accent) 50%, transparent 50%); }
.dot[data-state='done'] { border-color: var(--ok); background: var(--ok); }
.sidebar a[aria-current='page'] .dot { border-color: var(--on-accent); }
main.outlet { padding: 1.25rem 1rem 4rem; max-width: 56rem; width: 100%; margin: 0 auto; min-width: 0; outline: none; }
@media (min-width: 1000px) {
  .menu-btn { display: none; }
  .layout { grid-template-columns: 17rem minmax(0, 1fr); }
  .sidebar { position: sticky; top: var(--top-h); height: calc(100vh - var(--top-h)); transform: none; visibility: visible; width: auto; }
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

- [ ] **Step 7: Pass the store to the shell and fix the scroll margins**

```diff
diff --git a/src/main.ts b/src/main.ts
index 01f0a53..eed3c02 100644
--- a/src/main.ts
+++ b/src/main.ts
@@ -12,7 +12,7 @@ import './styles/index.css';
 const store = createStore(browserStorage(window), window);
 const theme = initTheme(window, store);
 const registry = buildRegistry(contentInput);
-const shell = mountShell(document.getElementById('app') as HTMLElement, registry, theme);
+const shell = mountShell(document.getElementById('app') as HTMLElement, registry, theme, store);
 const runner = new TeaVMRunner();
 window.__dsa = { routes: allRoutes(registry) };
 
diff --git a/src/styles/lesson.css b/src/styles/lesson.css
index b7ce04e..2134680 100644
--- a/src/styles/lesson.css
+++ b/src/styles/lesson.css
@@ -1,5 +1,5 @@
 .lesson .lead { font-size: 1.1rem; }
-.lesson section { scroll-margin-top: 4rem; }
+.lesson section { scroll-margin-top: calc(var(--top-h) + 0.5rem); }
 .picture-steps { list-style: none; padding: 0; counter-reset: step; display: grid; gap: 0.6rem; margin: 0 0 1rem; }
 .picture-steps li { display: grid; grid-template-columns: 2.5rem minmax(0, 1fr); gap: 0.6rem; align-items: start; background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 0.6rem 0.8rem; }
 .picture-steps p { margin: 0.1rem 0 0; }
diff --git a/src/styles/problem.css b/src/styles/problem.css
index da06b5b..5505023 100644
--- a/src/styles/problem.css
+++ b/src/styles/problem.css
@@ -1,4 +1,4 @@
-.problem section { scroll-margin-top: 4rem; }
+.problem section { scroll-margin-top: calc(var(--top-h) + 0.5rem); }
 .spot-first { display: grid; gap: 0.5rem; }
 .spot-options { display: grid; gap: 0.35rem; }
 .spot-options label { display: flex; gap: 0.5rem; align-items: center; padding: 0.4rem 0.6rem; border: 1px solid var(--line); border-radius: 8px; cursor: pointer; }
```

- [ ] **Step 8: Run the tests and checks**

Run: `npm test && npm run typecheck && npm run check:content && npm run test:e2e`
Expected: the whole unit suite passes (`tests/unit/pages/shell.test.ts` has 6 tests), no type errors, the content check passes, and every e2e test passes. The smoke test now opens every new route with no console errors.

- [ ] **Step 9: Commit (controller only, after review)**

```bash
git add src/pages/router-view.ts src/pages/shell.ts src/styles/shell.css src/styles/lesson.css src/styles/problem.css src/core/registry.ts src/main.ts tests/unit/core/registry.test.ts tests/unit/pages/shell.test.ts
git commit -m "feat(shell): route every new page, add the top nav and module dots (Part 1b Task 22)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 23: End-to-end tests, screenshots and reduced motion

**Files:**
- Create: `tests/e2e/progress.spec.ts`
- Modify: `tests/e2e/screens.spec.ts` (more pages)

**Interfaces:**
- Consumes: the whole site from Tasks 1 to 22, `catalogLessons` and `catalogProblems` (Tasks 1, 2; they only import types, so Playwright can load them), `window.__dsa.routes` (Task 22), the test ids listed in Tasks 15 to 22.
- Produces: browser coverage for the new routes (the existing smoke test already opens every route from `allRoutes`), a full flashcard review with the keyboard, a full drill session, the automatic level 2 after a real Submit (TeaVM in the browser), the dashboard numbers after a scripted session, 360 px checks for the review and drill screens, and a reduced-motion check for the card flip. Screenshots of every new page type in both themes at 360 px and 1280 px land in `test-results/screens/` (spec §15.1).

Playwright already uses the local `channel: 'chrome'` outside CI (`playwright.config.ts`). Nothing there changes.

- [ ] **Step 1: Write the new e2e tests**

Create `tests/e2e/progress.spec.ts`:

```ts
import { expect, test, type Page } from '@playwright/test';
import { catalogLessons } from '../../content/catalog/lessons';
import { catalogProblems } from '../../content/catalog/problems';

const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('dsa:v1') ?? '{}') as { cards?: object; drills?: object });
const firstRoute = async (page: Page, prefix: string) => {
  await page.goto('./');
  const routes = await page.evaluate(() => window.__dsa?.routes ?? []);
  return routes.find((r) => r.startsWith(prefix)) as string;
};
/** Opening a lesson starts its module, so its cards and drills show up. */
async function startFirstModule(page: Page) {
  await page.goto(`./${await firstRoute(page, '#/l/')}`);
  await expect(page.locator('main h1')).toBeVisible();
}
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('the top nav opens the new pages', async ({ page }) => {
  await page.goto('./');
  const pages: [string, string][] = [['Dashboard', 'Dashboard'], ['Cards', 'Flashcards'], ['Drills', 'Spot-It drill'], ['Roadmap', 'Roadmap'], ['Today', 'Learn DSA by spotting patterns']];
  for (const [label, h1] of pages) {
    await page.locator('.topnav a', { hasText: label }).click();
    await expect(page.locator('main h1')).toHaveText(h1);
    await expect(page.locator('.topnav a[aria-current="page"]')).toHaveText(new RegExp(label));
  }
});

test('a full flashcard review with the keyboard', async ({ page }) => {
  await startFirstModule(page);
  await page.goto('./#/cards/due');
  const left = page.getByTestId('cards-left');
  const total = Number(/^(\d+) left today$/.exec((await left.textContent()) ?? '')?.[1]);
  expect(total).toBeGreaterThan(0);
  for (let i = 0; i < total; i++) {
    await expect(left).toHaveText(`${total - i} left today`);
    await page.keyboard.press('Space');
    await expect(page.locator('.card-back')).toBeVisible();
    await page.keyboard.press('3');
  }
  await expect(page.getByTestId('cards-done')).toBeVisible();
  expect(Object.keys((await stored(page)).cards ?? {})).toHaveLength(total);
  // Good moves every card to box 2, so nothing is due again today.
  await page.goto('./#/cards/due');
  await expect(page.getByTestId('cards-done')).toBeVisible();
});

test('a Spot-It drill session', async ({ page }) => {
  await startFirstModule(page);
  await page.goto('./#/drills');
  await page.getByTestId('drill-start').click();
  const count = page.getByTestId('drill-count');
  const n = Number(/of (\d+)$/.exec((await count.textContent()) ?? '')?.[1]);
  expect(n).toBeGreaterThan(0);
  for (let i = 1; i <= n; i++) {
    await expect(count).toHaveText(`Question ${i} of ${n}`);
    await page.getByTestId('drill-option').first().click();
    await expect(page.getByTestId('drill-feedback')).toContainText('The answer:');
    await page.getByTestId('drill-next').click();
  }
  await expect(page.getByTestId('drill-summary')).toHaveText(new RegExp(`^You got \\d+ of ${n} right\\.$`));
  expect(Object.keys((await stored(page)).drills ?? {})).toHaveLength(n);
});

test('Submit passing before any peek sets level 2 by itself', async ({ page }) => {
  await page.goto('./#/p/contains-duplicate');
  await expect(page.getByTestId('track-level')).toHaveText('Level 0 of 5: Not started');
  await page.locator('.cm-content').fill('import java.util.*;\n\nclass Solution {\n    public boolean containsDuplicate(int[] nums) {\n        Set<Integer> seen = new HashSet<>();\n        for (int x : nums) {\n            if (!seen.add(x)) return true;\n        }\n        return false;\n    }\n}\n');
  await page.getByTestId('lab-submit').click();
  await expect(page.getByTestId('lab-status')).toContainText('All tests passed', { timeout: 90_000 });
  await expect(page.getByTestId('track-level')).toHaveText('Level 2 of 5: Solved alone');
  await expect(page.getByTestId('track-alone')).toBeDisabled();
  await expect(page.getByTestId('track-resolve')).toContainText('Next re-solve:');
});

test('dashboard numbers after a scripted session', async ({ page }) => {
  // 1. Pass the first lesson's quiz. Answer once to learn the right options, then retry with them.
  await startFirstModule(page);
  const questions = page.locator('.quiz-question');
  const q = await questions.count();
  for (let i = 0; i < q; i++) await questions.nth(i).locator('.quiz-option').first().click();
  const right = await questions.evaluateAll((els) => els.map((fs) => [...fs.querySelectorAll('.quiz-option')].findIndex((b) => b.classList.contains('right'))));
  await page.getByTestId('quiz-retry').click();
  for (let i = 0; i < q; i++) await page.locator('.quiz-question').nth(i).locator('.quiz-option').nth(right[i]!).click();
  await expect(page.getByTestId('lesson-status')).toContainText('Lesson done');
  // 2. Mark the first problem as solved elsewhere and understood.
  await page.goto(`./${await firstRoute(page, '#/p/')}`);
  await page.getByTestId('track-elsewhere').click();
  await page.getByTestId('track-understood').click();
  await expect(page.getByTestId('track-level')).toHaveText('Level 1 of 5: Understood');
  // 3. Check the dashboard against the whole catalog.
  await page.goto('./#/dashboard');
  const value = (id: string) => page.locator(`[data-testid="${id}"] .counter-value`);
  const lessons = catalogLessons.length;
  const problems = catalogProblems.length;
  await expect(value('counter-lessons')).toHaveText(`1 of ${lessons}, ${lessons - 1} left`);
  await expect(value('counter-problems')).toHaveText(`1 of ${problems}, ${problems - 1} left`);
  await expect(page.getByTestId('dash-headline')).toContainText('1 day in a row');
  await expect(page.locator('[data-testid="pattern-box"][data-status="practicing"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="activity"] span:not([data-level="0"])')).toHaveCount(1);
  await expect(page.getByTestId('pace')).toContainText('Not enough data yet.');
  await expect(page.locator('[data-testid="milestones"] li[data-unlocked="true"]')).toHaveCount(0);
});

test('review and drill pages fit a 360 px phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await startFirstModule(page);
  await page.goto('./#/cards/due');
  await page.getByTestId('card-flip').click();
  await expect(page.locator('.card-back')).toBeVisible();
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  await page.goto('./#/drills');
  await page.getByTestId('drill-start').click();
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  await page.getByTestId('drill-option').first().click();
  expect(await overflow(page)).toBeLessThanOrEqual(0);
});

test('reduced motion: the card flip does not animate', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await startFirstModule(page);
  await page.goto('./#/cards/due');
  await page.keyboard.press('Space');
  await expect(page.locator('.card-back')).toBeVisible();
  expect(await page.locator('.card-back').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});
```

- [ ] **Step 2: Add the new pages to the screenshot test**

In `tests/e2e/screens.spec.ts`, replace the `pages` line:

```ts
const pages: [string, string][] = [['home', '#/'], ['lesson', '#/l/brute-better-optimal'], ['problem', '#/p/contains-duplicate']];
```

with:

```ts
const pages: [string, string][] = [
  ['home', '#/'], ['lesson', '#/l/brute-better-optimal'], ['problem', '#/p/contains-duplicate'],
  ['module', '#/m/foundations'], ['dashboard', '#/dashboard'], ['roadmap', '#/roadmap'], ['cards', '#/cards'],
  ['drills', '#/drills'], ['sheet', '#/sheets/neetcode150'], ['settings', '#/settings'],
];
```

- [ ] **Step 3: Run the browser tests**

Run: `npm run test:e2e`
Expected: every test passes, including the 7 tests in `progress.spec.ts` and the 4 screenshot tests that now cover 10 page types. The smoke test opens every route with no console errors.

If a test fails, fix the app code, not the test (`AGENTS.md` rule 3). Then look at `test-results/screens/*-360.png` in both themes. The header shows two rows, and nothing sticks out to the side.

- [ ] **Step 4: Run every check**

Run: `npm run typecheck && npm run check:catalog && npm run check:content && npm test && npm run verify:java`
Expected: all pass.

- [ ] **Step 5: Commit (controller only, after review)**

```bash
git add tests/e2e/progress.spec.ts tests/e2e/screens.spec.ts
git commit -m "test(e2e): cover cards, drills, tracker, dashboard and the new pages (Part 1b Task 23)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 24: Docs, the full check run and one pull request

**Files:**
- Modify: `README.md`, `docs/notes/part-1a-followups.md`

**Interfaces:**
- Consumes: everything above.
- Produces: an up-to-date README, a follow-up list without the items Part 1b fixed, a green `npm run ci`, and one pull request from `part-1b` into `main`. Nobody merges it except the owner.

- [ ] **Step 1: Update the README and the follow-up notes**

Apply exactly these changes:

```diff
diff --git a/README.md b/README.md
index 6dd5511..e3cfdbd 100644
--- a/README.md
+++ b/README.md
@@ -8,6 +8,12 @@ Live site: https://akashkumarchoudhary.github.io/dsa-playbook/
 
 - Foundations: the model lesson "Brute force, better, optimal".
 - Model problem: Contains Duplicate. It has brute, better and optimal solutions, dry runs and a Java lab.
+- A Today page, a dashboard and a roadmap. They count against the whole planned course: 26 modules, 126 lessons, 107 patterns and 319 problems.
+- A progress tracker on every problem, with reminders to solve it again after 3, 7 and 21 days.
+- Flashcards made from the lessons and problems, scheduled with 5 Leitner boxes.
+- Spot-It drills: up to 10 quick questions, 60 seconds each, from the modules you started.
+- The NeetCode 150, Striver Binary Search and Striver Recursion lists in their own order.
+- Settings: the theme, and export or import of your progress.
 
 ## Run it on your computer
 
@@ -17,6 +23,7 @@ Live site: https://akashkumarchoudhary.github.io/dsa-playbook/
 ## Checks
 
     npm run typecheck
+    npm run check:catalog   # the catalog matches docs/curriculum/problem-map.md
     npm run check:content   # writing rules and structure
     npm test                # unit tests and dry-run checks
     npm run verify:java     # runs every solution on a real JDK 21
@@ -26,6 +33,8 @@ Live site: https://akashkumarchoudhary.github.io/dsa-playbook/
 
 It uses Vite and TypeScript. There is no UI framework. The content is in `content/` as typed data and plain `.java` files. Java runs in the browser with TeaVM. See `THIRD_PARTY_NOTICES.md`.
 
+The problem catalog is generated. Change `docs/curriculum/problem-map.md` (and the map table in `scripts/build-catalog.mjs`), then run `npm run build:catalog`. After you add or change lessons or problems, run `npm run cards:lock` and check the warnings.
+
 Read `CONTENT-RULES.md` before you write content. Read `AGENTS.md` before you use an AI agent on this repo.
 
 Design: `docs/superpowers/specs/2026-11-23-dsa-playbook-design.md`
diff --git a/docs/notes/part-1a-followups.md b/docs/notes/part-1a-followups.md
index f15876a..ce16f02 100644
--- a/docs/notes/part-1a-followups.md
+++ b/docs/notes/part-1a-followups.md
@@ -6,7 +6,7 @@ These are small issues found in the Part 1a reviews. None of them blocked the re
 - **with first use**: fix when the first content needs it.
 - **owner review**: an owner wording or teaching choice.
 
-Items fixed in the final review wave are not listed.
+Items fixed in the final review wave are not listed. Part 1b fixed the corrupt backup, the pagehide save, the `__proto__` key and the topbar offset, so they are gone too.
 
 - **Task 1**: index.html favicon data-URI not URL-encoded (plan-mandated).
 - **Task 2**: isSafe() trusts any object with `__html` key (brief-mandated); harden with a private brand if content ever holds untrusted JSON.
@@ -19,7 +19,6 @@ Items fixed in the final review wave are not listed.
 - **Task 4**: parser does not strip query strings or percent-decode (fine for current 4 routes).
 - **Task 5**: valid JSON of wrong shape ("42", [], null) gets no dsa:corrupt backup and is overwritten on next save (plan-mandated).
 - **Task 5**: normalize drops unknown (future) fields and forces version 1 (plan-mandated).
-- **Task 5**: "__proto__" code id from stored JSON; use Object.create(null).
 - **Task 5**: a throwing listener skips later listeners in update().
 - **Task 5**: no test for system-follow (prefers-color-scheme change) or explicit setting ignoring it.
 - **Task 5**: corrupt-data test does not check backup content.
@@ -48,7 +47,7 @@ Items fixed in the final review wave are not listed.
 - **Task 15**: copy button gives no feedback / unhandled writeText rejection; custom inputs not cleared after Add; old results stay visible during a new run; clock starts on Reset/loadCode; tests miss busy/Stop/progress/throwing run/escaping/fallback copy.
 - **Task 16**: stripHtml `<[^>]+>` on plain text can swallow `i < n ... >` spans; test gaps (30-word error, 20-word warn, kebab ids, approach order, glossary dup, spot clues); console.warn noise in real-content test; CONTENT-RULES topic-order sentence is 23 words.
 - **Task 16**: stray bare block around the topic loop in content-check.ts.
-- **Task 17**: menu aria-label static; level heading repeated per module in sidebar; hard-coded 3.3rem topbar offset; focus ring may show on main after script focus; renderRoute untested for notFound/cleanup.
+- **Task 17**: menu aria-label static; level heading repeated per module in sidebar; focus ring may show on main after script focus; renderRoute untested for notFound/cleanup.
 - **Task 18**: weak "locked" test (guard never exercised), no onComplete-timing/dispose/escaping/route tests; missing viz trace or problemIds dropped silently; emoji in feedback read aloud.
 - **Task 18**: focus test cleanup not in try/finally.
 - **Task 19**: last-hint focus and counter text untested; "You used:" shows raw clue keys; raw/fallback paths untested.
@@ -59,4 +58,4 @@ Items fixed in the final review wave are not listed.
 - **Task 21**: dialog handler should assert confirm type/message; smoke hash nav does not prove the new route rendered; overflow uses innerWidth not clientWidth; reduced-motion test uses a fixed 3.5 s sleep and does not check animations; lab.spec toContainText('true') scope; viz tab pressed state hard to see at 360px.
 - **Task 21**: very fast run could flake the Stop-enabled wait; compile error in solutions spec shows as a timeout; duplicate outline rule in base.css and shell.css.
 - **Task 22**: no timeout-minutes on jobs; README lists the live URL before Pages exists; CI calls playwright directly vs local test:e2e; README omits `npm run ci`; Vite main chunk 530 kB warning.
-- **Final**: corrupt value backed up twice (startup + first update); M8 regex false positives (`i < n; int ones =` in code, "Unlike JavaScript:") and misses (`<svg/onload=`); no pagehide flush (edit <400 ms lost on tab close); `@@`-prefixed learner lines skip the cap; long numbers make cells taller.
+- **Final**: M8 regex false positives (`i < n; int ones =` in code, "Unlike JavaScript:") and misses (`<svg/onload=`); `@@`-prefixed learner lines skip the cap; long numbers make cells taller.
```

- [ ] **Step 2: Run every check**

Run: `npm run ci`
Expected: it ends with exit code 0. On the way you see `Catalog files match docs/curriculum/problem-map.md`, `Tests  21 passed (21)` for the content check, `Tests  300 passed (300)` for the unit tests, the JDK check passes, and `32 passed` for Playwright.

- [ ] **Step 3: Check the rules by hand**

Run: `grep -rnE "'(contains-duplicate|brute-better-optimal|foundations|hashing|neetcode150)'" src/ || echo "no content ids in src"`
Expected: exactly two matches, both the sheet id `'neetcode150'`: the `SheetId` type in `src/content-types.ts` and `INTERVIEW_SHEET` in `src/engine/dashboard.ts`. The spec defines the interview-ready score on NeetCode 150, so this is a sheet id, not a lesson or problem id (`AGENTS.md` rule 5). Any other match is a bug: move that id into `content/`.

- [ ] **Step 4: Commit (controller only, after review)**

```bash
git add README.md docs/notes/part-1a-followups.md
git commit -m "docs: describe Part 1b and close the fixed follow-ups (Part 1b Task 24)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Push the branch and open ONE pull request (controller only)**

```bash
git push -u origin part-1b
gh pr create --base main --head part-1b --title "Part 1b: progress, flashcards, drills and the dashboard" --body "$(cat <<'BODY'
## What this adds

- A catalog of the whole course: 26 modules, 126 planned lessons, 107 patterns and 319 problems, generated from docs/curriculum/problem-map.md.
- A progress tracker on every problem: ticks for levels 1, 3 and 4, an automatic level 2 when Submit passes before a peek, and re-solve reminders after 3, 7 and 21 days.
- Lesson quiz scores, the module quiz with scenario questions, and progress on module pages.
- Flashcards made from content, with 5 Leitner boxes and 4 decks.
- Spot-It drills: up to 10 questions, 60 seconds each, weighted toward weak patterns.
- Mastery and fading for every pattern.
- Today, Dashboard, Roadmap, the three sheet pages and Settings (theme, export and import).
- A top nav and a progress dot per module in the sidebar.

Decisions: docs/superpowers/specs/2026-11-24-part-1b-decisions.md. Plan: docs/superpowers/plans/2026-11-24-part-1b-progress-cards-drills-dashboard.md.

## How to review in the browser

1. Open a lesson, take its quiz, and check the dashboard counters.
2. Review cards at #/cards/due with Space and keys 1 to 4.
3. Run a drill at #/drills.
4. Submit the model problem before opening the solutions, then check "Your progress".
5. Try both themes at 360 px.

## Checks

`npm run ci` passes: type check, catalog check, content check, unit tests, JDK check and Playwright.

Please do not merge until the browser review is done. The owner merges.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
BODY
)"
```

Expected: `gh` prints the pull request URL. Do **not** merge it. Report the URL to the owner.

