# DSA Playbook — Design Spec

- **Date:** 2026-11-23
- **Status:** Draft, waiting for owner review
- **Working name:** DSA Playbook (repo `dsa-playbook`). The name can change before Part 1 starts.
- **Model:** built the way [system-design-playbook](https://github.com/kishanraj427/system-design-playbook) is built: content as data, one engine, a fixed lesson shape, writing rules, automatic checks, a model lesson approved first, and the owner reviews each part before the next one starts.

---

## 1. Why this exists

Learning DSA from PDFs is hard:

1. You cannot **watch** an algorithm run. Pointers and recursion trees are frozen text.
2. Reading is **passive**. The answer sits right under the question.
3. It is hard to **find** things, and related problems are only numbers.
4. Progress is tracked on **paper**.
5. Most of all, nothing trains you to **spot the pattern** in a problem you have never seen. That is the main skill interviews and real work test.

The site fixes these with step-through animations, try-first-then-reveal pages, pattern-spotting drills, flashcards, a tracker, and a dashboard that shows what is learned and what is left.

## 2. Goals and non-goals

**Goals**

- Teach DSA from zero to interview-ready, organized **by pattern**.
- Train **pattern spotting** for interviews and real life (Section 6).
- Serve both **first-time learning** and **quick revision**.
- Let the learner **write and run Java** in the browser.
- Show honest progress: what is learned, what is left, and what is fading.
- Cost **$0** to host and run, with no paid database or server.
- Use **really simple wording** everywhere (Section 13).

**Non-goals for v1**

- Running languages other than Java. Java is the only lab language.
- A server that runs code.
- Social features, leaderboards, comments or AI hints.
- A paid custom domain.
- Offline use through a service worker. This can come later.

## 3. Source material

- The three PDFs in the repo root (NeetCode 150 Java, Striver A2Z Binary Search, Striver Recursion & Backtracking) are **helper notes only**. They are not the source of truth and they do not decide the structure.
- The owner made them, so their explanations and Java code may be reused and rewritten.
- The **curriculum** (Section 5) decides what is taught and in what order.
- Problem statements are written **in our own words**, with a link to LeetCode or the original.
- The NeetCode 150 list and the Striver lists are credited by name on the Sheets page and on each problem that belongs to them.
- **The PDFs are not published.** They live in a git-ignored `reference/` folder.

## 4. Tech stack

| Area | Choice | Why |
|---|---|---|
| Build | **Vite + TypeScript (strict)**, no UI framework | Plain web code like the reference, with type-checked content and tests |
| Rendering | Template-literal HTML + small DOM helpers | Same idea as the reference engine |
| Routing | Hash routes (`#/l/binary-search`) | Works on GitHub Pages with no server rewrites, deep links, back button |
| Editor | **CodeMirror 6** + `@codemirror/lang-java` | Light, and works on phones |
| Java runner | Decided in **Part 0** (CheerpJ or TeaVM), behind one interface | See Section 10 |
| Unit tests | **Vitest** | Engine logic and trace generators |
| Smoke tests | **Playwright** (headless Chromium) | Every route opens with 0 console errors |
| Java check in CI | **JDK 21** on GitHub Actions | Every reference solution must pass its tests |
| Sync | **Firebase** (Auth + Firestore, Spark plan) | See Section 12 |
| Hosting | **GitHub Pages** via GitHub Actions | Free, same as the reference |

## 5. Curriculum

Five levels. Each module has lessons (one per pattern or idea) and problems.

| Level | Modules |
|---|---|
| **Basics** | 1 Foundations · 2 Arrays & Strings · 3 Hashing · 4 Two Pointers · 5 Sliding Window · 6 Recursion Basics · 7 Sorting |
| **Core** | 8 Binary Search · 9 Stack & Queue · 10 Linked List · 11 Backtracking · 12 Trees · 13 Heap · 14 Tries |
| **Hard** | 15 Graphs · 16 Advanced Graphs · 17 1-D DP · 18 2-D DP · 19 Greedy & Intervals · 20 Bits & Math |
| **Advanced** | 21 Range Queries (segment tree, Fenwick tree, sparse table) · 22 String Algorithms (KMP, Z-function, Rabin-Karp, Manacher) · 23 Advanced DP (bitmask, digit, tree, interval DP, LIS with binary search) · 24 Graph Algorithms II (Tarjan bridges and articulation points, SCC, 0-1 BFS, bipartite check, Euler path) · 25 More Patterns (sweep line, quickselect, Morris traversal, reservoir sampling, monotonic deque, meet in the middle, ordered sets / `TreeMap`) |
| **Interview** | 26 Interview & Meta (the interview script, thinking out loud, choosing a pattern, mock rounds) |

**Foundations (Module 1) draft lessons:** `what-is-dsa`, `big-o-time`, `big-o-space`, `reading-limits` (uses the Size Reader), `java-toolkit` (arrays, `String`/`StringBuilder`, `ArrayList`, `HashMap`, `HashSet`, `ArrayDeque`, `PriorityQueue` and what each costs), `how-to-dry-run`, `brute-better-optimal` (the bottleneck → tool method), `edge-cases`, `interview-script`.

**Topic order rule:** a lesson, quiz, card or drill may only use ideas from earlier modules or ideas it explains on the spot. A later idea may appear only as a marked preview ("you will learn this in Module 13"). The content check enforces this with a topic-order map.

Lesson and module ids are drafts until each module's part starts. Once published, **ids never change**.

## 6. The "Spot It" system (the core of the site)

### 6.1 The four clues (taught in every lesson)

1. **📏 Size clue.** About 10⁸ simple steps run per second, so the input limit tells you the Big-O you need.

   | n up to | Needed | Think |
   |---|---|---|
   | 10 | O(n!) | permutations, backtracking |
   | 20 | O(2ⁿ) | subsets, bitmask |
   | 500 | O(n³) | triple loop, interval DP, Floyd-Warshall |
   | 5,000 | O(n²) | double loop, 2-D DP |
   | 10⁵ – 10⁶ | O(n log n) or O(n) | sorting, hashing, two pointers, sliding window, heap |
   | 10⁹ or more | O(log n) or O(1) | binary search on the answer, math |

2. **🔤 Word clue.** For example: "subarray / substring" + "longest / at most K" → sliding window; "top K" → heap; "all combinations" → backtracking; "number of ways / minimum cost" → DP; "connected groups" → Union-Find; "prerequisites / order" → topological sort.
3. **🧱 Shape clue.** Sorted? Grid? Tree? Intervals? Shared prefixes?
4. **🔁 Bottleneck clue** (the most reliable one). Write the brute force, then ask "what work am I repeating?" Repeated search → HashMap. Repeated range sums → prefix sum. Re-scanning a window → sliding window. Same subproblem again → DP / memo. A yes/no test that flips once → binary search.

Every pattern lesson also has a **❌ Trap** box: a problem that looks like this pattern but is not, and why. Example: "subarray sum equals K" with negative numbers looks like sliding window, but needs prefix sum + HashMap.

### 6.2 How the site trains it

- **Blocked, then mixed.** Each module is learned on its own. Drills and "Due today" flashcards then **mix all patterns learned so far**. Research on category learning shows mixed practice helps learners see what separates categories, even though learners feel blocked practice works better.
- **"Spot it first" on every problem page.** The learner sees only the statement and limits, picks a pattern and taps the clues used, then sees the expert clues.
- **Spot-It Drills.** 10 items per session, 60 seconds each, from patterns in started modules, weighted toward weak patterns. Three kinds:
  - **Interview:** a LeetCode-style statement with the title hidden.
  - **Look-alike:** two problems side by side that need different patterns.
  - **Real life:** a plain work problem, for example "500 deploys, one broke login, find it" → binary search (this is how `git bisect` works).
  - An item may accept more than one correct pattern. Feedback always shows the clues.
- **Size Reader tool.** A slider for `n` shows the needed Big-O and the matching patterns.
- **Pattern Finder tool.** A short yes/no question flow (sorted? continuous piece? all options? graph or grid? top K? number of ways?) that ends in likely patterns, with links.
- **Interview script**, practiced in Module 26 and in mock mode: Understand → brute force and its Big-O → find the repeated work → match a pattern using the clues → plan → code → dry run → final Big-O. Based on CodePath's UMPIRE method.

## 7. Pages

### 7.1 Routes

| Route | Page |
|---|---|
| `#/` | **Today**: cards due, problems to re-solve, one mixed drill, continue where you left off |
| `#/dashboard` | Dashboard (Section 9.4) |
| `#/roadmap` | All levels and modules, with progress |
| `#/m/:moduleId` | Module overview: lessons, problems, quiz, cheat sheet |
| `#/l/:lessonId` | Lesson page |
| `#/p/:problemId` | Problem page, including the Java lab |
| `#/viz/:vizId` | Standalone visualizer (the "playgrounds") |
| `#/drills` | Spot-It drills |
| `#/cards` and `#/cards/:deck` | Flashcards |
| `#/tools/size-reader`, `#/tools/pattern-finder` | The two tools |
| `#/sheets/:sheetId` | NeetCode 150, Striver Binary Search, Striver Recursion in their original order, with progress |
| `#/glossary`, `#/cheatsheets` | Glossary and the cheat-sheet hub |
| `#/settings` | Theme, sign in and sync, export and import |

### 7.2 Lesson page (one per pattern or idea)

1. 🔴 **A small example**: one tiny problem.
2. 💡 **Everyday picture**: a plain analogy.
3. ⚙️ **Step by step**: 3–6 picture steps plus a **dry-run animation**. **Go deeper** (collapsed) holds why it works, edge cases and variants.
4. 🔍 **How to spot it**: the four clues plus the ❌ trap.
5. 🧩 **Java template**: the reusable code shape with plain-word comments.
6. 🌍 **Where you meet this**: real-life and work uses. Real-world claims carry an accuracy tier like the reference: `confirmed` (public docs exist) or `educational` (simplified for teaching).
7. ⚠️ **Common mistakes** + 🎤 **interview angle** (what to say out loud).
8. 🧪 **Try it**: a 3-question quiz and the linked problems, easy → hard.

### 7.3 Problem page (try first, then reveal)

1. Problem in our own words, limits, and a link to the original.
2. 🔍 **Spot it first** (Section 6.2).
3. 💬 **Three hints**, opened one at a time.
4. 🧪 **Java lab** (Section 10).
5. ⚠️ Edge cases (the list only).
6. **"Show solutions" gate** (owner decision, 2026-11-24). Everything below stays hidden until the learner presses **Show solutions**. Pressing it counts as a peek. Part 1b uses that moment for the "Solved alone" level (Section 9.1). The dry-run player is only mounted after the reveal.
7. 🐢 Brute → 🚶 Better → 🚀 Optimal, each collapsed. Each has the idea, Java code, Big-O, and "what repeated work does the next step remove?" "Better" appears only when a real middle step exists.
8. Dry-run animation of the optimal solution.
9. A comparison table of the approaches.
10. Common mistakes.
11. 🗣️ **30-second explanation**: say it first, then reveal.
12. 🪝 Memory hook, 🔗 related problems and look-alikes.
13. Tracker buttons (Section 9.1).

### 7.4 Module page

Lessons, problems, module quiz (at least 8 multiple-choice and 2 scenario questions), cheat sheet (pattern templates + Big-O), glossary terms, and a "mixed drill for this module" button.

## 8. Dry-run animation and visualizers

### 8.1 Look and controls

- Simple 2D only: **slides, fades and color changes**, about 300 ms each. No 3D, no particles.
- Each step shows **one plain sentence**, the **highlighted Java line**, and the **variables**, with changed ones marked.
- Controls: Reset, Back, Play/Pause, Step, speed 0.5× / 1× / 2×. Keys ← → and Space.
- **Your own input** box. Invalid input shows a plain error, for example "The array must be sorted for binary search."
- Animations start when in view and pause when out of view.
- `prefers-reduced-motion`: steps only, no movement, no autoplay.
- Same color meaning everywhere: 🟦 current · ⬜ thrown away · 🟨 window or range · 🟩 answer · 🟥 conflict.

### 8.2 Visual pieces (shared by all lessons)

Array + pointers, string, hash map table, stack, queue / deque, linked list, tree, graph, grid, heap (tree and array together), recursion tree + call stack, DP table, intervals on a number line, bits.

### 8.3 How traces work

- Each animation has a **trace generator**: a small TypeScript copy of the algorithm that runs on the input and records one snapshot per step.
- A snapshot holds: the Java line marker, variables, which variables changed, the state of each visual piece, and the sentence.
- The player only draws snapshots, so it can step backwards for free.
- **Line markers:** Java solution files mark lines with end-of-line comments like `// @L:compare`. The build strips the markers for display and records their line numbers. Snapshots point to marker names, not raw line numbers.

### 8.4 How traces stay correct

- For every sample and hidden test case of the problem (not the speed test), a unit test runs the trace generator and checks that its final answer **equals the expected answer**, the same one the Java solution must produce.
- The content check fails if a snapshot points to a line marker that does not exist in the Java file.
- Each trace has a maximum step count, so a bug cannot create an endless animation.

## 9. Tracker, flashcards and dashboard

**Terms used below**

- A module is **started** when any of its lessons has been opened.
- A pattern's **core** problems are the ones marked `core: true`. Every pattern has at least one core problem.
- **Activity** on a pattern means a drill, a flashcard review or a problem solve for that pattern.

### 9.1 Problem levels

| Level | How it is set |
|---|---|
| 1 Understood | Learner ticks it |
| 2 Solved alone | Set automatically when **Submit** passes before any approach was revealed. The learner may also tick it, which shows a "self-marked" tag |
| 3 Can explain | Learner ticks it after the 30-second explanation |
| 4 Code from memory | Learner ticks it |
| 5 Spots it elsewhere | **Automatic:** the problem is at level 4 and its pattern is **mastered** (9.3) |

A problem counts as **solved** when Submit passes all tests, or when it is self-marked as solved elsewhere (tagged).

### 9.2 Re-solve reminders

After a problem is first solved, it comes back to be solved from scratch **3, 7 and 21 days** later. They appear on the Today page.

### 9.3 Done, mastered and fading

- **Lesson done:** its quiz is passed with at least 2 of 3 right.
- **Pattern mastered:** all three must hold.
  1. Every **core** problem of the pattern is at level 3 or higher.
  2. At least **8 of the last 10** drills for the pattern were right. At least 10 attempts are needed.
  3. At least **80%** of the pattern's flashcards are in box 3 or higher.
- **Fading:** a pattern that was mastered, but either has had **no activity for 30 days** or its last-10 drill accuracy dropped **below 80%**. It shows orange until it is mastered again.

### 9.4 Dashboard

- **Headline:** overall % mastered, current streak in days, items due today.
- **Four counters, each "X of Y, Z left":** lessons done, problems solved, patterns mastered, estimated hours left. Each lesson stores its `minutes`. Each problem's hours come from a per-difficulty estimate: Easy 20 min, Medium 40, Hard 60.
- **Progress bar per level** (Basics, Core, Hard, Advanced, Interview).
- **Pattern map:** one box per pattern. ⬜ not started · 🟦 learning (a lesson started) · 🟨 practicing (at least one problem solved) · 🟩 mastered · 🟧 fading. Tap to open it.
- **Sheet progress:** NeetCode 150, Striver BS and Striver Recursion as "X of Y solved".
- **Interview-ready score:** the average of (a) the share of NeetCode 150 problems at level 3 or higher, and (b) Spot-It accuracy over the last 50 drills. Both parts are shown, not only the total.
- **Weakest patterns:** the lowest drill accuracy, with fading patterns first.
- **Activity:** one square per day for the last 12 weeks.
- **Pace:** an estimated finish date per level, from lessons done and problems solved in the last 14 days. It shows "Not enough data yet" with fewer than 3 active days.
- **Milestones** ("Basics complete" and so on) unlock only when every pattern in the level is **mastered**.

The dashboard only reads tracker data. It stores nothing of its own.

### 9.5 Flashcards

- **Generated from content fields, not written by hand.** Each card has a stable id `<sourceId>:<kind>`. Hand-written extra cards are allowed.

  | Kind | Front | Back | Source field |
  |---|---|---|---|
  | Spot it | short statement + limits | pattern + key clue | `problem.spot` |
  | Memory hook | problem name | hook + Big-O | `problem.hook`, `problem.complexity` |
  | Template | "Write the … template" | Java template | `lesson.template` |
  | Big-O | an operation or approach | Big-O + one-line reason | `lesson.complexityFacts` |
  | Trap | a look-alike question | the right pattern + why | `lesson.traps` |
  | Explain it | problem name | 30-second explanation | `problem.explain30` |
  | Edge cases | problem name | edge cases | `problem.edgeCases` |
  | Real life | a plain work problem | pattern + why | `lesson.realLife` |

- **Review:** flip with tap or Space, then rate **Again / Hard / Good / Easy** (keys 1–4).
- **Scheduling (Leitner, 5 boxes).** The intervals are 1, 3, 7, 14 and 30 days.
  - **Again** → box 1.
  - **Hard** → same box, due again after that box's interval.
  - **Good** → next box.
  - **Easy** → two boxes up.
  - Box 5 is the top box. Moves past it stay in box 5.
  - A new card starts in box 1 the first time it is seen.
- **Decks:** Due today (mixed across learned patterns), By module, Weak spots (most "Again"), Interview tomorrow (memory hooks + traps only, about 10 minutes).
- Only cards from **started modules** appear.

## 10. Java code lab

### 10.1 What it does

- An editor with starter code (`class Solution { … }`, LeetCode style).
- **Run samples** checks the visible tests.
- **Submit** also runs the hidden tests: edge cases plus one **speed test**.
- Each test shows ✅ or ❌, the input, the expected value and the actual value. Printed output appears in the console.
- **Add your own test** (input + expected).
- **Speed test:** one large input with a generous time limit. A failure says "looks too slow for these limits", not a hard verdict.
- Compile errors point to lines in the learner's code. Runtime errors show the failing test.
- Runs in a **background thread** with a **Stop** button and a time limit, so an infinite loop cannot freeze the page.
- Code is saved per problem. **Reset** restores the starter. A stopwatch records the solve time.
- Each approach on the problem page has **Load into lab**.

### 10.2 Problem spec and harness

- Each problem has a `spec`: method name, parameter types, return type, comparison mode, and test cases.
- **Supported types (v1):** `int`, `long`, `double`, `boolean`, `char`, `String`, `int[]`, `int[][]`, `char[][]`, `String[]`, `List<Integer>`, `List<String>`, `List<List<Integer>>`, `List<List<String>>`, `ListNode`, `TreeNode`. More types are added in the part that first needs them.
- **Comparison modes:** `exact`, `unorderedList`, `unorderedNested` (order of the outer list and each inner list ignored), `float(1e-5)`, and `custom` (a Java checker method for problems with many valid answers).
- A **Java harness is generated** from the spec. It reads the tests, calls `Solution`, compares, and prints results as JSON.
- The **same harness runs in CI** on a real JDK, so browser results and CI results match.
- In CI, the **optimal** solution must pass every test, including the speed test. Brute and better solutions must pass every test **except** the speed test, since they are allowed to be slow.
- "Hidden" tests are only hidden in the UI. The repo is public.

### 10.3 Runner interface

```ts
interface JavaRunner {
  ready(): Promise<void>;                       // load the runtime; show progress
  run(req: { code: string; spec: ProblemSpec; mode: 'samples' | 'all';
             extraTests?: TestCase[]; timeLimitMs: number }): Promise<RunResult>;
  stop(): void;
}
type RunResult =
  | { kind: 'compileError'; errors: { line: number; message: string }[] }
  | { kind: 'tests'; results: { id: string; pass: boolean; input: string;
        expected: string; actual: string; stdout: string; timeMs: number;
        error?: string }[] }
  | { kind: 'timeout' } | { kind: 'runnerUnavailable'; reason: string };
```

### 10.4 Part 0: the runner test (throwaway code)

- Try **CheerpJ** and **TeaVM**. Each is tested on one NeetCode-style solution plus the generated harness.
- Measure: first-load download size and time, compile + run time after load, support for `HashMap`, `PriorityQueue`, `ArrayDeque`, `TreeMap`, generics, records and streams, quality of error messages, phone behaviour, and licence terms for a free public learning site.
- **Pass:** compile + run in about **3 s or less** after the first load, all of those collections work, and the licence allows this use.
- **Output:** a short written decision with the numbers. The test code is thrown away.
- **If both fail:** the lab keeps the editor and tests, adds **Copy to LeetCode**, and allows self-marked solves. `run()` returns `runnerUnavailable`.

## 11. Content model and project layout

### 11.1 Layout

```
src/
  core/        router, store, theme, render helpers, registry
  engine/      player, visual pieces, quiz, cards scheduler, drills, mastery, dashboard math
  lab/         editor, JavaRunner implementation, harness generator
  sync/        Firebase auth + Firestore sync (loaded lazily)
  pages/       today, dashboard, roadmap, module, lesson, problem, drills, cards, tools, sheets, settings
  styles/
content/
  modules/NN-<moduleId>/
    module.ts              module meta, quiz, cheat sheet, glossary
    lessons/<lessonId>.ts
    problems/<problemId>/
      problem.ts           statement, spot clues, hints, approaches, hook, edge cases …
      spec.json            signature, comparison mode, tests
      Brute.java  Better.java  Optimal.java   (with // @L: markers)
      trace.ts             trace generator (when the problem has an animation)
  drills/                  drill items (interview, look-alike, real-life)
  sheets/                  neetcode150.ts, striver-bs.ts, striver-recursion.ts (ordered problem ids)
tools/
  content-check.ts         writing rules, required fields, topic order, links, markers, glossary clashes
  verify-java.ts           compiles and runs every reference solution on a real JDK
tests/                     Vitest unit tests; Playwright smoke tests
reference/                 git-ignored: the PDFs
AGENTS.md                  rules for AI agents (like the reference)
CONTENT-RULES.md           the writing rulebook (Section 13)
```

Content files import Java with Vite's `?raw`, so the same `.java` file is shown on the page, loaded into the lab and checked in CI.

### 11.2 Main types (summary)

- **Module:** `id, order, level, icon, title, summary, outcomes[], lessonIds[], problemIds[], quiz[], cheatsheet[], glossary[]`.
- **Lesson:** `id, moduleId, title, minutes, summary, example, everyday, steps[], viz?, deep, spot{size, words, shape, bottleneck}, traps[], template, complexityFacts[], realLife[], mistakes[], interview[], quiz[3], problemIds[]`.
- **Problem:** `id, moduleId, patternIds[], difficulty, core(bool), sheets[], sourceLink, statement, limits, spot{answer, clues[]}, hints[3], approaches[{level:'brute'|'better'|'optimal', idea, file, time, space, nextStepRemoves}], traceId?, edgeCases[], mistakes[], explain30, hook, related[], lookAlikes[]`.
- **DrillItem:** `id, kind:'interview'|'lookalike'|'reallife', prompt, limits?, acceptedPatternIds[], clueExplanation, moduleId`.
- **Pattern:** `id, moduleId, lessonId, title`. A pattern is what mastery is measured on.

### 11.3 Local storage

- One localStorage key `dsa:v1` with a schema version and migrations.
- Stored: lesson quiz results, problem levels and solve log, saved code (latest only), card boxes and due dates, drill attempts (last 1,000 kept), streak days, settings.
- Every item has an `updatedAt` time for merging.

## 12. Hosting, sync and deployment ($0)

### 12.1 Hosting

- **GitHub Pages** from a public repo, deployed by a custom GitHub Actions workflow.
- Limits: 1 GB site and a soft 100 GB/month of bandwidth. Both are far above this site's needs.
- Backup host: Cloudflare Pages (free, no bandwidth cap) if ever needed.
- Address: `<user>.github.io/dsa-playbook`. No paid domain.

### 12.2 Sync with Firebase (Spark plan, free, no card)

- **Local-first:** the browser copy is the main copy. The site works fully without signing in.
- **Sign in (optional):** Google sign-in through Firebase Auth.
- **Firestore layout:** `users/{uid}/chunks/{chunkId}`. There is one chunk per module plus one `global` chunk for settings, streak, drills and cards.
- **Security rules:** a user may read and write only `users/{their uid}/**`.
- **When it syncs:** pull on sign-in and on app open. Push changed chunks at most once every 30 seconds, and when the tab is hidden.
- **Merge:** per item, the newer `updatedAt` wins. Drill attempts and solve logs are unions by id.
- **Limits:** the Spark plan allows about 50K reads and 20K writes per day per project. If a limit is hit, the site shows "Sync paused until tomorrow" and keeps working locally.
- The Firebase SDK is **loaded only when needed** (settings page, or a signed-in user), so first load stays small.
- The Firebase web config is public by design. Safety comes from the security rules.
- **Export / Import** of the full progress JSON stays available on the settings page.

### 12.3 CI/CD (GitHub Actions, free for public repos)

On every push to `main`, in order. Any failure stops the deploy.

1. Install.
2. Type check.
3. Content check (`tools/content-check.ts`).
4. Unit tests (Vitest), including trace correctness.
5. Java check (`tools/verify-java.ts` on JDK 21).
6. Build.
7. Smoke test (Playwright): open every route, 0 console errors and 0 exceptions.
8. Deploy to GitHub Pages.

Pull requests run steps 1–7 and do not deploy.

### 12.4 Local development

- `npm run dev` runs the site.
- `npm test`, `npm run check`, `npm run verify:java`.
- The **Firebase emulator** (free) is used for sync work, so the real project is never touched during development.

## 13. Writing rules (summary of `CONTENT-RULES.md`)

- Short sentences, about 20 words or fewer. Paragraphs of 3 sentences or fewer.
- Plain words. Explain every new term the first time it appears.
- The **simple part** of a lesson is about **350 words or fewer**. Everything longer goes in **Go deeper**.
- One example per lesson, reused across its parts.
- Numbers must be correct, with the math shown in small steps.
- Say a caveat once. Never repeat a point.
- Follow the topic order rule (Section 5).
- Avoid em dashes and semicolons in lesson text.

The content check enforces what can be measured: word counts, sentence length, required fields, topic order, links, line markers and glossary clashes.

## 14. Quality rules (from the reference)

- Works from a 360 px phone to an ultrawide screen, with no sideways page scroll.
- Dark and light themes. Dark is the default, and the site follows the system setting.
- Keyboard navigation, visible focus, ARIA labels, AA contrast.
- `prefers-reduced-motion` respected.
- No placeholders (`TODO`, "lorem", "rest of code").
- No external images. Use SVG, canvas, CSS and emoji.

## 15. Build order

Each part gets its own implementation plan. The owner reviews each part in the browser before the next one starts.

| Part | Contents |
|---|---|
| **0** | Java runner test (Section 10.4) → written decision |
| **1** | Engine and site shell: routes, theme, store, player and visual pieces, Java lab, quiz, flashcards, drills, tracker, Today, dashboard, Size Reader, Pattern Finder, Firebase sync, CI/CD, `AGENTS.md`, `CONTENT-RULES.md` · **Module 1 Foundations** · **Model lesson `brute-better-optimal` and model problem Contains Duplicate**, which are approved by the owner **before** the rest of Foundations is written |
| 2 | Arrays & Strings, Hashing |
| 3 | Two Pointers, Sliding Window |
| 4 | Recursion Basics, Sorting |
| 5 | Binary Search, Stack & Queue |
| 6 | Linked List, Backtracking |
| 7 | Trees, Heap, Tries |
| 8 | Graphs, Advanced Graphs |
| 9 | 1-D DP, 2-D DP |
| 10 | Greedy & Intervals, Bits & Math |
| 11 | Advanced: Range Queries, String Algorithms |
| 12 | Advanced: Advanced DP, Graph Algorithms II |
| 13 | Advanced: More Patterns |
| 14 | Interview & Meta, mock interview mode (timer + think-aloud prompts), site-wide search, cheat-sheet hub |

New visual pieces and harness types are added in the first part that needs them. Mixed drills and decks grow as modules are added.

**Part 1 milestones, in order:**

- **1a.** Shell, routes, theme, store, CI/CD and deploy, the player with the array + pointers and hash map pieces, the Java lab, the lesson and problem pages, then the **model lesson + model problem**. The owner approves these before anything else is written.
- **1b.** Quiz, flashcards, drills, tracker, Today and the dashboard.
- **1c.** The rest of Foundations, the Size Reader and the Pattern Finder.
- **1d.** Firebase sync.

**Sheets:** each sheet problem is added in the part that builds its module. Until then, the sheet page lists it as "coming in Part N".

### 15.1 Definition of done for each part

1. Type check, content check, unit tests, Java check and smoke test all pass.
2. Screenshots at desktop and 360 px, in both themes, for each new page type.
3. Reduced-motion check on each new animation.
4. Every new trace passes its correctness test on all of the problem's test cases.
5. The owner reviews the part in the browser.

### 15.2 Git workflow and licence (owner decisions, 2026-11-24)

- **Part 1a** went into git as task-by-task history, one commit per task and per review fix, pushed to `main`.
- **From Part 1b on**, each part is built on its own branch (`part-1b`, `part-2`, …) with one commit per reviewed task. It goes in as one pull request. The owner reviews the part in the browser, then merges it. A push to `main` deploys to GitHub Pages.
- **Licence:** code is MIT (`LICENSE`). Learning content (`content/`, `docs/curriculum/`) is CC BY-NC-SA 4.0 (`LICENSE-CONTENT.md`). Third-party parts are listed in `THIRD_PARTY_NOTICES.md`.
- **Full problem list:** `docs/curriculum/problem-map.md`. It has the NeetCode 150, the Striver lists and the extra problems, each with its module and its part.

## 16. Risks

| Risk | What we do |
|---|---|
| Java cannot run well in the browser | Part 0 decides first. The fallback keeps the lab useful (Section 10.4) |
| Free tiers change (several changed in 2026) | Local-first design, export and import, and no feature depends on the cloud |
| Animations teach something wrong | Trace correctness tests against the Java test cases (Section 8.4) |
| Too much content to write well | One part at a time, a model lesson first, automatic content checks |
| Copyright | Own-words statements, links to originals, credit for problem lists, PDFs not published |

## 17. Research sources (used for this design)

- Input size → complexity: Codeforces blog entry 106496; USACO Guide, Time Complexity.
- Pattern clues: TechInterview pattern cheat sheets; Educative LeetCode patterns.
- Interview script: CodePath, UMPIRE Interview Strategy.
- Mixed practice: Kornell & Bjork (2008) and the interleaving literature (Kang; Cambridge Handbook of Cognition and Education).
- `git bisect` as binary search: the official git documentation.
- Hosting and database limits: GitHub Pages docs; Cloudflare Pages and D1 docs; Firebase pricing page; Supabase pricing and pausing FAQ.
