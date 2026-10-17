# Decisions (confirmed 2026-10-17)

| Area | Decision | Why |
|---|---|---|
| Project | AP Bio + AP Chem pokedex-style dictionary with bridging concepts, flashcards, quizzes, saved concepts | Core idea |
| Audience / lifespan | High school AP students; hackathon throwaway | Light scope, solid foundation |
| Rules file | `CLAUDE.md` (Claude Code assumed; rename if another tool is used) | Matches the tool |
| Stack | TypeScript + Next.js, macOS | Well documented, good fit for design tokens |
| Hosting | Vercel free tier | Auto-deploy from GitHub, $0 |
| Data model | Relational-style static JSON in `data/` (option A) | SQL-like feel, no runtime risk, easy to cite |
| Data import | One-time dev-time script from public sources | Scale plus citations without runtime outages |
| Entry target | About 100 for v1 (default, adjustable) | Scale for grading, but reviewable for accuracy |
| User data | Browser localStorage only | No stored student data |
| Auth / roles | None | Nothing private; users include minors |
| External APIs at runtime | None | No keys to leak, no demo-day outages |
| Content sources | OpenStax Bio 2e / Chem 2e (main text), PubChem, ChEBI, UniProt, RCSB PDB, Wikimedia Commons | Free, citable, AP-appropriate |
| Citations | Every entry and diagram stores source, URL, license, date | License requirement, builds trust |
| Accuracy | Imported entries start `reviewed: false`; the owner reviews against the AP outline | Databases give facts, not AP scope |
| Repo | Public; `.gitignore` and gitleaks before first commit | Leaked secrets in a public repo are costly |
| Privacy | No analytics, tracking, cookies, or personal data | Many users are minors |
| Cost | $0 ceiling | Free tiers cover a demo |
| Testing | Vitest + React Testing Library; test-first for logic only; CI on every push | TDD where bugs hurt |
| AI permissions | Free: edit files, run tests. Ask first: install, delete, import, commit, push, deploy | Least privilege |
| Git | Branch per feature, small commits | Easy to undo |
| Nav | Search, Saved (count badge), Flashcards, Quiz | Template plus a Quiz tab |
| Name | "Nucleus" is a working title | Template placeholder |

## Design tokens (approximate, read by eye from the template screenshots; refine in the first UI feature)
- Page background: cream, about `#F3F3ED`
- Hero and primary buttons: near-black forest green, about `#1B241C`
- Accent: bright lime, about `#C8F07F`
- Small uppercase labels: muted olive, about `#8FAA4E`
- Category dots: tan about `#ECDDB9` (organic chemistry), pale green about `#E2EFD5` (others)
- Type: tight-tracked serif for headlines and term names; clean sans for body; monospace for
  formulas and key facts. Candidates loaded with `next/font` (self-hosted at build time).
  If the Figma file names exact fonts, use those.
- Layout: three-tab top nav (now four with Quiz); centered search bar on a dark hero with a faint
  grid; numbered concept list rows (category, term, one-line definition, key fact chip, arrow);
  empty states with headline, one line of guidance, and a dark button back to search.

## Still open
- Entry page layout (definition, diagram, citation, bridging concepts) and Quiz page designs are not in the screenshots yet.
- Search library choice (typo-friendly); ask before installing.

## User-authorized update: live database lookups (2026-10-17)

The user requested temporary PubChem and biology database integration. This supersedes the earlier no-runtime-external-API decision for the explicit live lookup panel only. PubChem and UniProt now return reference records through a bounded server proxy; the curated study catalog remains static and separately reviewed. See `LIVE-DATABASES.md` for behavior, limits, privacy changes and removal.
