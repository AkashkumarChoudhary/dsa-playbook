# Part 1b: follow-up notes

The Part 1b reviews found these small issues. None of them blocked the release. Fix each one when a later part touches the same code. The tag after each line says when.

- **before 1d**: fix before Part 1d (sync), because sync merges data from other devices.
- **with Part 2**: fix when Module 2 or 3 content ships.
- **later**: fix when that area is next touched.

Items fixed in the final review wave are not listed. That wave fixed the re-solve day check, the Settings link, tracker focus, the theme radios, quiz retry focus, the Today card message, the order of new cards and the import error text.

## Data and store

- **Task 4**: the drill log is trimmed to 1,000 only inside `recordDrill`. `merge()` keeps drills that `normalize()` trimmed. Trim `out.drills` by `at` after `merge()` in `update()`. **before 1d**
- **Task 4**: validation is loose. It accepts impossible dates and negative or fractional scores and counts. No test covers unknown nested fields surviving. **later**
- **Task 21**: export uses `store.get()`, the normalized state. Fields from a newer version are not exported. This needs a raw getter on the store. **before 1d**
- **Task 21**: "Progress imported." shows even if the storage write failed. The export file has no note that says what it is. **later**
- **Task 10**: the days count goes up on repeat actions (re-open, un-tick, quiz retake). `saveQuizScore` overwrites `total`, so a change in quiz length mixes scores. **later**

## Engines

- **Tasks 5-7**: no DST test. `parts()` falls back to 1970 for a bad key. **later**
- **Task 9**: when the distractor fallback runs, it drops nearby patterns instead of filling with them. That branch has no test. **later**
- **Task 11**: `hadGoodRun` accepts any good 10-drill window in the past. A pattern can show "fading" when it was never mastered at that time. It cannot trigger yet. **with Part 2**
- **Task 11**: the 30-day boundary uses `>` and is untested. `isMastered` re-sorts drills on every call. **later**
- **Task 12**: hours "left" is `round(total) - round(done)`, so it can be about 1 hour off. This is plan-mandated and tested. **later**
- **Task 12**: `patternStatus` re-sorts the drill log for each of the 107 patterns. It takes about 30 to 45 ms with 1,000 drills. Share one sorted log. **later**
- **Final wave**: re-solve steps are built with ms math (`first + gap*DAY_MS`). For a first solve within an hour of midnight, a step that crosses a clock change moves by one calendar day. Nothing is lost or counted twice. Work out due days with day keys instead. **later**
- **Final wave**: the clock-change guard assumes a change of 1 hour or less. A 2-hour change (Antarctica/Troll) can still count a re-solve twice that day. Loop until the day key moves on. **later**
- **Final wave**: seen cards with the same due day keep content order, so a lesson reviewed in one go comes back grouped. Only new cards are mixed. **later**
- **Final wave**: e2e does not pin the clock, so the card shown first in the 360 px and reduced-motion card tests changes each day. **later**
- **Task 12**: pace mixes a ms window with day keys. Test gaps: 0 drills, more than 50 drills, `finishDay` null. **later**
- **Task 8**: the due deck has no size cap. **later**

## Catalog and content check

- **Task 2**: `build-catalog.mjs` skips table rows that fail the row pattern without a warning. **later**
- **Task 3**: duplicate catalog pattern or sheet ids overwrite each other in the registry maps. The generator check covers it today. **later**
- **Task 13**: the NC150 size check runs only if the `neetcode150` sheet exists. `cards:lock` uses a POSIX env prefix, so it fails on Windows. **later**

## Pages

- **Task 15**: `openedAt` written once per mount is untested. The module scenario score is not stored. **later**
- **Task 16**: `onSubmitResult` is not guarded after dispose. Missing page tests: a timeout or compile error never records a solve, and a pass after a reveal does not set "solved alone". **later**
- **Task 17**: a planned problem with no url shows an empty "Open the original" link. A sheet id missing from the catalog is dropped without a warning. **later**
- **Task 18**: the "X left" live region is re-rendered, so screen readers may not announce the count. **later**
- **Task 19**: the drills remount test passes even without the fix. Check for one timer, or that the signal is aborted. **later**
- **Task 20**: pattern boxes use `#fff` and a fixed `--status-fading` colour. `.level-row` has a fixed 5.5rem title column. **later**
- **Task 22**: `store.subscribe(drawDots)` is never removed, which is fine for a page-long shell. `setActive` pairs top-nav links with `NAV` by index. Match by `data-route` instead. **later**

## Tests and screenshots

- **Task 23**: the reduced-motion check passes even with no animation at all. The dashboard quiz step needs at least one wrong first option. The nav test uses a substring match. **later**
- **Task 23**: at 360 px the dashboard level rows wrap loosely and empty bars are faint. The settings file input is unstyled next to the Export button. **later**
