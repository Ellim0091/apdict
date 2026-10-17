# AP Bio + AP Chem Study Dictionary

A pokedex-style dictionary of biology and chemistry concepts for high school AP students.
Search terms, see cited definitions and diagrams, follow links between related concepts
(e.g. bacterial cell wall to penicillin), save concepts, and study with flashcards and quizzes.

Anonymous by design: no accounts, no tracking. Saved concepts and progress stay in your browser.

## Run it on another computer

Install Git and Node.js 24 (including npm). Then:

```sh
git clone https://github.com/Ellim0091/apdict.git
cd apdict
npm ci
npm run dev
```

Open http://localhost:3000 in your browser. If using nvm, run `nvm install` and `nvm use` inside the project before `npm ci`; `.nvmrc` selects Node 24.

If the repository is already cloned:

```sh
cd apdict
git pull --ff-only
npm ci
npm run dev
```

Stop the server with Ctrl+C. To use a production build instead, run `npm run build` followed by `npm start`.

No API keys, `.env` file, database setup, or accounts are required. Internet access is needed for installation, the first font build, and the live PubChem/UniProt lookups. The **Explore live databases** panel is available without draft preview. Select **Preview draft library** to try the 16 local draft concepts, saved terms, flashcards and quizzes. These drafts still require owner review.

Saved terms and study progress are stored in that browser on that computer; they do not sync between laptops.

## Test it
```
npm test
```

## Project docs
- `CLAUDE.md`: rules for the AI coding tool
- `docs/DECISIONS.md`: what we decided and why
- `docs/CONTENT.md`: data model, sources, licensing
- `docs/SECURITY.md`, `docs/PRIVACY.md`, `docs/COSTS.md`, `docs/TESTING.md`

## Content and credits
The local library contains original AI-assisted draft explanations and questions, with references for editorial review. No diagrams are included yet. Live database results include source links and attribution. See `docs/CONTENT-SOURCES.md` and `docs/LIVE-DATABASES.md` for provenance and reuse terms.
