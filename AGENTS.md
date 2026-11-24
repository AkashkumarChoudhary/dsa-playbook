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
