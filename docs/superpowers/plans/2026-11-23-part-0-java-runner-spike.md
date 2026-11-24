# Part 0: Java Runner Spike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decide how the Java lab runs code in the browser (CheerpJ, TeaVM, or the fallback) using measured numbers.

**Architecture:** Throwaway probe pages in the session scratchpad, served by a local static server and driven by Playwright (headless Chrome). Each probe compiles and runs one NeetCode-style `Solution` plus a test harness, and reports timings as JSON on `window.__probe`. Nothing from this part goes into the repo except the decision record.

**Tech Stack:** Playwright (Node 24, cached Chromium 1254), Python `http.server`, CheerpJ 5.0 (CDN loader), teavm-javac (`compiler.wasm` + classlibs, downloaded locally for measurement only).

**Spec:** `docs/superpowers/specs/2026-11-23-dsa-playbook-design.md` §10.4

## Global Constraints

- Pass bar: compile + run in **about 3 s or less after the first load**. `HashMap`, `PriorityQueue`, `ArrayDeque`, `TreeMap`, generics, records and streams must all work. The licence must allow a free public learning site.
- Probe code is **throwaway**. It lives only in the scratchpad (`$SP` below) and is never copied into `src/`.
- No git commits (owner decides commit plan later).
- `$SP` = `/tmp/claude-1001/-home-akashkumar-Documents-Learning-repos-dsa/6c612a41-1c1a-4406-a2c0-3b84322cc184/scratchpad/part0`

---

### Task 1: Shared probe program and harness

**Files:**
- Create: `$SP/java/Solution.java`, `$SP/java/Main.java`, `$SP/java/Broken.java`, `$SP/java/Crash.java`

**Interfaces:**
- Produces: a `Main` class whose `main` prints exactly one line `RESULT {"pass":N,"total":M,...}` when run; `Broken.java` with a compile error on line 4; `Crash.java` that throws `ArrayIndexOutOfBoundsException`.

- [ ] **Step 1:** Write `Solution.java` that uses `HashSet`, `HashMap`, `PriorityQueue`, `ArrayDeque`, `TreeMap`, generics, a `record`, `var`, `List.of` and a stream. Write `Main.java` that runs 5 Contains Duplicate tests plus a feature check of each collection and prints the `RESULT` line.
- [ ] **Step 2:** Verify on the real JDK: `cd $SP/java && javac Solution.java Main.java && java Main`. Expected: `RESULT {"pass":5,"total":5,"features":"ok"}`

### Task 2: CheerpJ probe

**Files:**
- Create: `$SP/cheerpj/index.html`, `$SP/run-cheerpj.mjs`

- [ ] **Step 1:** In `index.html`, load `https://cjrtnc.leaningtech.com/5.0/loader.js`, call `cheerpjInit({version: 21, status: 'none'})`, write both sources with `cheerpjAddStringFile('/str/…')`, compile with `cheerpjRunMain('com.sun.tools.javac.Main', '/files/', '/str/Solution.java', '/str/Main.java', '-d', '/files/')`, then run `cheerpjRunMain('Main', '/files/')`. Capture console text. Record `initMs`, `compile1Ms`, `run1Ms`, then a second compile + run (`compile2Ms`, `run2Ms`) on `window.__probe`.
- [ ] **Step 2:** In `run-cheerpj.mjs`, open the page with Playwright, wait up to 180 s for `window.__probe.done`, sum response body sizes for transferred bytes, print the JSON.
- [ ] **Step 3:** Run it and record the output. Then repeat with `Broken.java` (check the diagnostic includes line 4) and `Crash.java` (check the exception name appears).
- [ ] **Step 4:** Repeat Step 3 with CPU throttling 4× (CDP `Emulation.setCPUThrottlingRate`) as a rough phone estimate.

### Task 3: TeaVM probe

**Files:**
- Create: `$SP/teavm/index.html`, `$SP/teavm/assets/*` (downloaded), `$SP/run-teavm.mjs`

- [ ] **Step 1:** Download `compiler.wasm`, `compiler.wasm-runtime.js`, `compile-classlib-teavm.bin`, `runtime-classlib-teavm.bin` from `https://teavm.org/playground/` into `assets/`. These are for local measurement only.
- [ ] **Step 2:** In `index.html`: `load('./assets/compiler.wasm')` → `createCompiler()` → `setSdk`, `setTeaVMClasslib` → `addSourceFile` × 2 → `compile()` → `generateWebAssembly({outputName:'app', mainClass:'Main'})` → load the produced module with the TeaVM runtime and call `main`, capturing output. Record the same timing fields as Task 2.
- [ ] **Step 3:** Run with Playwright as in Task 2, including the broken, crash and 4× throttle runs.

### Task 4: Decision record

**Files:**
- Create: `docs/decisions/0001-java-runner.md`

- [ ] **Step 1:** Write a table of the measured numbers for both runners, the licence findings, and the chosen option, applying the pass bar from Global Constraints. If neither passes, record the fallback (editor + tests + "Copy to LeetCode" + self-marked solves).
- [ ] **Step 2:** **Checkpoint:** show the decision to the owner before Part 1a starts.
