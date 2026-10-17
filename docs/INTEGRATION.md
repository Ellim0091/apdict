# Connecting the Figma frontend

The Figma Make interface is integrated in `app/page.tsx` and `app/globals.css`. `lib/` contains the shared application logic; `data/` is the static content store. The `lib/use-study.ts` client hook connects browser storage through React useSyncExternalStore. Fonts are bundled by next/font, with no browser request to Google Fonts. No new dependencies, accounts, database, API keys, runtime external fetches, or server endpoints are needed for this architecture.

## Content

```ts
import { getCatalog, getDraftCatalog, getEntry, searchEntries } from '@/lib/catalog';
const catalog = getCatalog();
const results = searchEntries(catalog, 'enzime', { course: 'ap-bio' });
const detail = getEntry(catalog, 'enzyme');
```

`getCatalog()` excludes unreviewed entries, questions and connections to unpublished entries. It currently returns zero entries: all 16 starter entries and 16 original questions await owner review. `getDraftCatalog()` is for an explicitly labeled editorial preview, not the public student catalog. Never silently substitute drafts when the published list is empty. The owner must review entry AND question flags separately. No content is advertised as AP-verified.

Search supports all query words, aliases, accents/case normalization, term-first ranking, limited typo tolerance, course/category/unit filters, and optional saved IDs. `both` entries match either subject; their unit is the primary biology unit and is not a separate chemistry alignment. Unit-specific cross-course alignment needs editorial expansion. Empty searches return alphabetic results. Details include resolved references, diagrams, and incoming/outgoing connections; keep the direction and reason in the UI.

## Saved terms and progress

```ts
import { loadStudy, saveStudy, toggleSaved, recordReview, recordQuiz } from '@/lib/storage';
// In a client effect or event, not during server rendering:
let state = loadStudy(window.localStorage);
state = toggleSaved(state, 'enzyme');
const persisted = saveStudy(state, window.localStorage);
```

The functions return new state: put it into React state as well as saving it. Check the save boolean and show a message if storage is blocked/full. Loads recover from malformed data; no browser globals are used during module import. Listen for the browser `storage` event if multiple tabs must stay synchronized. History is capped at 100 attempts. Data stays on the device and can be lost when browser storage is cleared.

## Flashcards

`getFlashcards(catalog, state.cards, { entryIds: state.savedIds, dueOnly: true })` returns due cards, unseen first. Omit `entryIds` for the whole catalog; an empty array intentionally means no cards. The UI controls front/back visibility. After a rating, use `recordReview(state, id, 'again' | 'hard' | 'good' | 'easy')` and save. Again schedules a one-minute retry; other ratings schedule increasing day intervals. This is a simple interval scheduler, not a validated adaptive learning model.

## Quizzes

`createQuiz(catalog, { count: 10, entryIds })` shuffles eligible questions without replacement and returns prompts without answers. Store the returned IDs with that quiz session. `gradeAnswer(catalog, id, choiceIndex)` returns correctness and explanation. At completion, `scoreQuiz(catalog, questionIds, answersById)` counts unanswered questions as incorrect, ignores answers outside the session, and deduplicates IDs. Persist the result with `recordQuiz`. Zero eligible questions should render an empty state, not a fake score. Question answers exist in the static client bundle; this is a practice tool, not a secure examination system.

## Editorial workflow

1. Add original draft prose to `data/entries.json`, with unique slug, alias list, course/unit and source references. Leave `reviewed: false`.
2. Add source-specific URLs, attribution, license and retrieval dates to `sources.json`. Distinguish reference links from copied/adapted material.
3. Add meaningful directed edges to `relations.json`, with an explanation of the connection.
4. Write questions with distinct options, zero-based answer index and explanation. Leave questions unreviewed.
5. Call `validateCatalog(candidate)` before accepting changes. It returns errors for duplicate IDs, missing references, empty content, malformed provenance and invalid question answers. TypeScript supplies the schema at development time; this is not an untrusted-upload parser.
6. The owner checks accuracy, scope and reuse rights, then changes review flags. Public reads automatically include approved entries/questions.

There is no automatic importer yet: the starter content is authored locally and nothing was scraped. A future importer should write drafts, preserve reviewed records, and validate before writing. No diagrams are included; add only images with verified per-file permissions and alt text.

## Integrated interface (2026-10-17)

Search, concept detail, saved concepts, flashcards and quizzes are wired to the shared modules. The default view reads the published catalog. Choose **Preview draft library** to explicitly inspect the 16 draft concepts and questions. Exiting preview hides drafts without deleting saved progress. Saved terms, card scheduling and completed quiz scores persist on the device; page/view state and unfinished quiz sessions reset on reload. The circular concept visual is decorative typography, not a scientific diagram. The Figma export source folder remains unchanged.

Verification: TypeScript and ESLint passed; the production build passed; manual browser checks covered typo search, details/sources, saved-term reload persistence, flashcard flip/rating/due filtering, saved-concept quiz feedback/scoring, and phone layout. No new packages or feature test files were added.
