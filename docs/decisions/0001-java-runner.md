# 0001: How the Java lab runs code in the browser

- **Date:** 2026-11-23
- **Status:** Accepted by the owner on 2026-11-23 (TeaVM, self-hosted, with credit).
- **Spec:** `docs/superpowers/specs/2026-11-23-dsa-playbook-design.md` §10.4
- **Plan:** `docs/superpowers/plans/2026-11-23-part-0-java-runner-spike.md`

## What was tested

Both runners were tested with the same program: a `Solution` (Contains Duplicate, with `HashSet`) plus a harness running 5 tests and a 100,000-item input. The program also used `HashMap.merge`, `PriorityQueue` with a comparator, `ArrayDeque`, `TreeMap.floorKey`, a `record`, `var`, `List.of`, `IntStream` and `Collectors.joining`.

Each runner was also given a program with a compile error on line 4, and one that throws `ArrayIndexOutOfBoundsException`.

The tests ran in headless Google Chrome 154 on a desktop, through Playwright. A 4× CPU slowdown was used as a rough stand-in for a phone. Every run gave the correct answers (5/5) and passed every feature check.

## Results

| | **CheerpJ 5.0** (Java 21 + javac, from its CDN) | **TeaVM** (teavm-javac: javac 21 + TeaVM → WasmGC) |
|---|---|---|
| Download (first visit) | 15–16 MB | 7.5 MB |
| Start-up | 1.7–2.2 s (65 ms when cached) | 0.2 s |
| First compile + run | 16–21 s (6.2 s when cached) | **1.0 s** (javac 85 ms, WASM build 0.88 s, run 11 ms) |
| Later compile + run | 4.1–4.7 s | **0.25 s** (javac 25 ms, WASM build 0.22 s, run 6 ms) |
| Later compile + run at 4× slower CPU | **~17 s** (javac 13–14 s, run 3.2 s) | **~1.0 s** (javac 0.1 s, WASM build 0.87 s, run 25 ms) |
| First compile + run at 4× slower CPU | ~19–21 s | 3.9 s |
| Compile error | `Main.java:4: error: illegal start of expression` (text output) | `javac:error:Main.java:4: illegal start of expression` (structured: file, line, message) |
| Runtime exception | Name shown, no line ("Unknown Source") | Message not passed to JS. **Fix:** the harness catches `Throwable` in Java and prints the class name and message itself |
| Works offline | No (loads from the CheerpJ CDN) | Yes (files hosted with the site) |
| Can host ourselves | No (Community licence requires the CDN) | Yes |
| Browser needs | Any modern browser | **WasmGC**: Chrome/Edge 119+, Firefox 120+, Safari 18.2+ |
| Licence | Community licence: free for personal, educational and non-commercial open-source use, if loaded from the CDN and showing a "Built with CheerpJ" credit | TeaVM: Apache-2.0. teavm-javac source files have Apache-2.0 headers, but the repo has **no root LICENSE file** (open issue #22). The bundled javac is OpenJDK code (GPLv2 + Classpath Exception) |

**Pass bar** (spec §10.4): about 3 s or less after the first load, the collections work, and the licence allows this use.

- **CheerpJ** passes on licence and features, but **fails on speed**: 4.1–4.7 s on desktop and about 17 s at phone speed.
- **TeaVM** **passes on speed and features by a wide margin**. Its licence is **likely fine but not formally stated** for the compiled `compiler.wasm`.

## Decision (proposed)

Use **TeaVM (teavm-javac)** as the v1 `JavaRunner`, with these safeguards:

1. **Self-host** `compiler.wasm`, `compiler.wasm-runtime.js`, `compile-classlib-teavm.bin` and `runtime-classlib-teavm.bin` under `public/runner/teavm/`, with the exact version recorded.
2. **Ship a `THIRD_PARTY_NOTICES.md`** that credits TeaVM (Apache-2.0) and OpenJDK javac (GPLv2 + Classpath Exception), with links to both source repos. Add a credit line on the lab.
3. **Follow teavm-javac issue #22.** If the owner wants extra certainty, a polite comment on that issue asking for the licence can be posted. That is an outward-facing action and only happens if the owner asks.
4. **Run user code in a Web Worker.** Infinite loops are stopped by terminating the worker after the time limit.
5. **The harness catches every `Throwable`** and prints the exception class and message per test, because TeaVM does not pass exception messages to JS.
6. **Detect WasmGC support.** Without it, the runner returns `runnerUnavailable` and the lab shows the fallback (editor, tests, Copy to LeetCode, self-marked solve).
7. **Keep CheerpJ as a backup option** behind the same `JavaRunner` interface. It is not built in v1. It is used only if TeaVM's licence becomes a blocker.
8. **CI check:** run every reference solution through the real browser runner with Playwright, as well as on the JDK, so classlib gaps in TeaVM are caught before deploy.

## Rejected

- **CheerpJ as v1:** too slow (about 17 s per run at phone speed), and needs internet.
- **A server-side runner:** needs a server and secrets, and free hosts sleep or need a card (spec §12).
