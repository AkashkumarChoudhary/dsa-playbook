# 🧩 DSA Playbook

Learn data structures and algorithms by spotting patterns. Every lesson has a step-by-step dry run. Every problem has a Java lab that runs in your browser.

Live site: https://akashkumarchoudhary.github.io/dsa-playbook/

## What is inside so far

- Foundations: the model lesson "Brute force, better, optimal".
- Model problem: Contains Duplicate. It has brute, better and optimal solutions, dry runs and a Java lab.

## Run it on your computer

    npm install
    npm run dev          # http://localhost:5173/dsa-playbook/

## Checks

    npm run typecheck
    npm run check:content   # writing rules and structure
    npm test                # unit tests and dry-run checks
    npm run verify:java     # runs every solution on a real JDK 21
    npm run test:e2e        # browser tests, including the Java runner

## How it is built

It uses Vite and TypeScript. There is no UI framework. The content is in `content/` as typed data and plain `.java` files. Java runs in the browser with TeaVM. See `THIRD_PARTY_NOTICES.md`.

Read `CONTENT-RULES.md` before you write content. Read `AGENTS.md` before you use an AI agent on this repo.

Design: `docs/superpowers/specs/2026-11-23-dsa-playbook-design.md`
