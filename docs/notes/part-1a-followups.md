# Part 1a: follow-up notes

These are small issues found in the Part 1a reviews. None of them blocked the release. Fix them when a later part touches the same code. The tag after each line says how it was triaged.

- **later**: fix when that area is next touched.
- **with first use**: fix when the first content needs it.
- **owner review**: an owner wording or teaching choice.

Items fixed in the final review wave are not listed.

- **Task 1**: index.html favicon data-URI not URL-encoded (plan-mandated).
- **Task 2**: isSafe() trusts any object with `__html` key (brief-mandated); harden with a private brand if content ever holds untrusted JSON.
- **Task 2**: escaper assumes quoted attributes / text nodes; add a comment.
- **Task 2**: no test for strings inside arrays being escaped (html`${['<a>']}`), numbers, nested arrays.
- **Task 3**: approachForTrace map silently overwrites duplicate traceIds; throw or catch it in the content check.
- **Task 3**: only the duplicate-lesson case is tested.
- **Task 3**: trace.ts `any` comment says "eslint-style note" without saying why.
- **Task 4**: startRouter test does not assert call count 1 and leaves location.hash set (brief-mandated test text).
- **Task 4**: parser does not strip query strings or percent-decode (fine for current 4 routes).
- **Task 5**: valid JSON of wrong shape ("42", [], null) gets no dsa:corrupt backup and is overwritten on next save (plan-mandated).
- **Task 5**: normalize drops unknown (future) fields and forces version 1 (plan-mandated).
- **Task 5**: "__proto__" code id from stored JSON; use Object.create(null).
- **Task 5**: a throwing listener skips later listeners in update().
- **Task 5**: no test for system-follow (prefers-color-scheme change) or explicit setting ignoring it.
- **Task 5**: corrupt-data test does not check backup content.
- **Task 5**: initTheme never unsubscribes (no dispose).
- **Task 6**: markers/code-panel use plain {} so `@L:constructor` etc. collide with inherited keys; use Object.create(null)/Object.hasOwn (plan-mandated).
- **Task 6**: highlight escape test uses no '<' source; add generics/`a < b` test and unknown-marker setActive test.
- **Task 6**: code-panel.ts bare `as HTMLElement` cast.
- **Task 7**: parseIntList strips [ and ] independently (accepts "[3,8,1"); lenient splitter accepts "3,,8"; -0 / >2^53 edge.
- **Task 7**: recorder.finish returns live steps array.
- **Task 7**: thin tests (lower bound, exact bounds, decimals, var add/remove, multi-entry changed).
- **Task 8**: no dispose()/pause/toggle/back-while-playing/unsubscribe tests; methods still work after dispose; play() emits before schedule; one-step trace shows playing for one dwell.
- **Task 9**: mark-range white-on-#a16207 is ~4.9:1 (passes AA, reviewer worry not confirmed); mark-discarded opacity fades text.
- **Task 9**: .chip lacks mark-discarded / mark-range styles, so those highlight colors show nothing on chips.
- **Task 9**: chip-in uses scale (only slide/fade/color allowed); var-flash runs 3x --dur.
- **Task 9**: hash chips never reordered; vars panel rebuilds rows; no hostile-text test.
- **Task 10**: thin tests (identity across steps, too-many-steps, tab dispose, escaping); listeners left to GC; dispose not idempotent-tested.
- **Task 10**: tab switch makes a new view that autoplays once (user's earlier choice not carried across tabs).
- **Task 11**: HarnessJson.str emits raw non-ASCII; with an ASCII stdout locale on JDK 18+ CI, 'é' becomes '?'. Escape chars > 0x7e as \uXXXX or set -Dstdout.encoding=UTF-8.
- **Task 11**: Float widened via doubleValue; start==0L sentinel; duplicate test ids not rejected; 64KB method limit for huge literals; generator n > INT_MAX not range-checked; -0 -> 0.0; literal test gaps.
- **Task 12**: `@@END null` (learner output) makes data.id throw; validate parsed object shape.
- **Task 12**: glued test uses toContain not toBe; untested glued-with-no-open-test and marker+bad-JSON paths; float NaN/Infinity compare via JSON.stringify.
- **Task 13**: dir/label keyed by level only (two `better` approaches would collide); no tests for starter-compile-fail / crash / timeout; marker fixture does not prove stripping; stderr dropped on success.
- **Task 14**: raw technical text in learner messages ("Java could not load: <raw>", "The program crashed: <raw>"); plain-words rule.
- **Task 14**: ready() has no timeout; Worker constructor throw stores rejected promise; compile-timeout message says reload though runner resets; our own run-worker failures reported as learner crash; Blob from wasm.buffer; fetch-teavm DIR from cwd, no TeaVM release version recorded, download overwrites VERSION.json.
- **Task 14**: stop during compile leaves the worker compiling (a hung compile delays the next run up to 60 s); compile queue has no rejection handler; crash message says reload though it self-recovers; same compiler instance reused after an exception; Stop during a stuck ready() never resolves.
- **Task 15**: copy button gives no feedback / unhandled writeText rejection; custom inputs not cleared after Add; old results stay visible during a new run; clock starts on Reset/loadCode; tests miss busy/Stop/progress/throwing run/escaping/fallback copy.
- **Task 16**: stripHtml `<[^>]+>` on plain text can swallow `i < n ... >` spans; test gaps (30-word error, 20-word warn, kebab ids, approach order, glossary dup, spot clues); console.warn noise in real-content test; CONTENT-RULES topic-order sentence is 23 words.
- **Task 16**: stray bare block around the topic loop in content-check.ts.
- **Task 17**: menu aria-label static; level heading repeated per module in sidebar; hard-coded 3.3rem topbar offset; focus ring may show on main after script focus; renderRoute untested for notFound/cleanup.
- **Task 18**: weak "locked" test (guard never exercised), no onComplete-timing/dispose/escaping/route tests; missing viz trace or problemIds dropped silently; emoji in feedback read aloud.
- **Task 18**: focus test cleanup not in try/finally.
- **Task 19**: last-hint focus and counter text untested; "You used:" shows raw clue keys; raw/fallback paths untested.
- **Task 19**: cancel test's "nothing saved" check does not advance the debounce timer; no tests for empty / equals-src / trailing-newline starter cases.
- **Task 20** (owner review): distractor "Count up to the biggest number" vague; "order does not change the answer" lacks the why; Find the Duplicate trap misses the 1..n tell and "may not change the array"; real-life `confirmed` entry is a Java doc fact; both dry runs use [3,8,1,8] (does not show the cost gap); Valid Anagram is a weak related link; Big-O glossary mentions steps only.
- **Task 20**: trace inputFields/parseInput/formatInput/fromArgs duplicated in both traces; verify-java.test.ts mkdtemp folder never removed.
- **Task 20**: equal-case note and the next note both say "found a repeat"; quiz "Even the 5 billion..." slightly awkward.
- **Task 21**: dialog handler should assert confirm type/message; smoke hash nav does not prove the new route rendered; overflow uses innerWidth not clientWidth; reduced-motion test uses a fixed 3.5 s sleep and does not check animations; lab.spec toContainText('true') scope; viz tab pressed state hard to see at 360px.
- **Task 21**: very fast run could flake the Stop-enabled wait; compile error in solutions spec shows as a timeout; duplicate outline rule in base.css and shell.css.
- **Task 22**: no timeout-minutes on jobs; README lists the live URL before Pages exists; CI calls playwright directly vs local test:e2e; README omits `npm run ci`; Vite main chunk 530 kB warning.
- **Final**: corrupt value backed up twice (startup + first update); M8 regex false positives (`i < n; int ones =` in code, "Unlike JavaScript:") and misses (`<svg/onload=`); no pagehide flush (edit <400 ms lost on tab close); `@@`-prefixed learner lines skip the cap; long numbers make cells taller.
