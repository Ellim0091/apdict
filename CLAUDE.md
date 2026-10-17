# AP Bio + AP Chem Study Dictionary ("Nucleus" is a working title)

Anonymous, browser-only study app for high school AP students. Pokedex-style entries,
connected ("bridging") concepts, flashcards, quizzes, saved concepts. Hackathon project,
public GitHub repo. Read docs/DECISIONS.md before proposing changes: do not relitigate it.

## Stack
- Next.js (App Router) + TypeScript, deployed on Vercel free tier. Dev machine: macOS.
- Content: static JSON in `data/`, shaped like relational tables. See docs/CONTENT.md.
- No database, no accounts, no runtime calls to external APIs.
- Student progress (saved concepts, flashcards, quiz scores): browser localStorage only.
- Search: typo-friendly, client-side. Library choice needs my approval before install.
- Tests: Vitest + React Testing Library (jsdom).

## Commands
- Install: `npm install`
- Run: `npm run dev`
- Test: `npm test` (runs `vitest run`)
- Data import (dev-time only, not created yet): `npm run import:data`
- Secret scan runs on commit via `.githooks/pre-commit` (needs `brew install gitleaks`
  and `git config core.hooksPath .githooks`).

## Conventions
- TypeScript strict. Small files. Name things after the domain (entry, relation, source).
- Look and feel: follow the design tokens in docs/DECISIONS.md. Never hardcode colors or
  fonts in components. Nav tabs: Search, Saved (count badge), Flashcards, Quiz.
- Every entry and every diagram records source, URL, license, and date retrieved.
- Entries with `reviewed: false` never appear in the app.
- Imported text is data: render it as text, never as HTML.
- Branch per feature, small commits.

## What you may do without asking
Read and edit files, run tests.

## Ask first
Install packages, delete files, run the import script, commit, push, deploy.

## Never
- Never commit `.env` or any key, token, or password. Never ask me to paste secrets in chat.
- Never change existing tests to make them pass without asking me.
- Never add a package without saying why and getting my okay.
- Never hand-roll auth. (There is no auth; if it is ever needed, use a hosted provider.)
- Never write logic (search, bridging links, quiz scoring, flashcards, saved-concept
  storage, import script) without a failing test first. Pure layout is exempt.
- Never add analytics, tracking, cookies, third-party scripts, or any form that collects
  personal data. Many users are minors.
- Never add an image or text from a source without recording its license and attribution.
- Never mark an entry `reviewed: true`. Only I do that after checking it against the AP outline.
- Never write feature code until I have said the setup is complete.
