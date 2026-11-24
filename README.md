# 🧩 DSA Playbook

Learn data structures and algorithms by spotting patterns. Every lesson has a step-by-step dry run. Every problem has a Java lab that runs in your browser.

Live site: https://akashkumarchoudhary.github.io/dsa-playbook/

## What is inside so far

- Foundations: the model lesson "Brute force, better, optimal".
- Model problem: Contains Duplicate. It has brute, better and optimal solutions, dry runs and a Java lab.
- A Today page, a dashboard and a roadmap. They count against the whole planned course: 26 modules, 126 lessons, 107 patterns and 319 problems.
- A progress tracker on every problem, with reminders to solve it again after 3, 7 and 21 days.
- Flashcards made from the lessons and problems, scheduled with 5 Leitner boxes.
- Spot-It drills: up to 10 quick questions, 60 seconds each, from the modules you started.
- The NeetCode 150, Striver Binary Search and Striver Recursion lists in their own order.
- Settings: the theme, and export or import of your progress.

## Run it on your computer

    npm install
    npm run dev          # http://localhost:5173/dsa-playbook/

## Checks

    npm run typecheck
    npm run check:catalog   # the catalog matches docs/curriculum/problem-map.md
    npm run check:content   # writing rules and structure
    npm test                # unit tests and dry-run checks
    npm run verify:java     # runs every solution on a real JDK 21
    npm run test:e2e        # browser tests, including the Java runner

## How it is built

It uses Vite and TypeScript. There is no UI framework. The content is in `content/` as typed data and plain `.java` files. Java runs in the browser with TeaVM. See `THIRD_PARTY_NOTICES.md`.

The problem catalog is generated. Change `docs/curriculum/problem-map.md` (and the map table in `scripts/build-catalog.mjs`), then run `npm run build:catalog`. After you add or change lessons or problems, run `npm run cards:lock` and check the warnings.

Read `CONTENT-RULES.md` before you write content. Read `AGENTS.md` before you use an AI agent on this repo.

Design: `docs/superpowers/specs/2026-11-23-dsa-playbook-design.md`

## Licence

- Code: MIT. See `LICENSE`.
- Learning content (`content/` and `docs/curriculum/`): CC BY-NC-SA 4.0. See `LICENSE-CONTENT.md`.
- Third-party parts (TeaVM, OpenJDK javac, CodeMirror): see `THIRD_PARTY_NOTICES.md`.
