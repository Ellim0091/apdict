# Content, data model, and licensing

## Tables (JSON files in `data/`)
- `entries.json`: id (slug), term, type (term | concept | compound | structure | process),
  course (ap-bio | ap-chem | both), unit, category, summary (one line), definition,
  keyFact (formula or short tag), diagramIds[], sourceIds[], reviewed (boolean)
- `relations.json`: fromId, toId, kind (leads-to | part-of | requires | contrasts | example-of), reason
- `sources.json`: id, name, url, license, retrievedOn, attribution
- `diagrams.json`: id, file, altText, sourceId
- `quiz.json`: id, entryId, prompt, choices[], answerIndex, explanation

## Rules
- Only `reviewed: true` entries appear in the app. The owner sets this after checking the
  entry against the AP course outline. The import script and the AI never set it.
- Every entry and diagram links to a source with a license. No source, no entry.
- No AI-generated diagrams. Use own drawings or openly licensed images with attribution.
- Prefer CC BY and public-domain sources. Check each license before copying. Avoid copying
  share-alike or mixed-license text (e.g. Wikipedia, some LibreTexts pages) into the repo.

## Import script (dev-time only, not built yet)
- Run manually by the owner. Needs no API keys. Respects rate limits.
- Writes drafts only; never overwrites an entry that is `reviewed: true`.
- Records source, URL, license, and retrieval date on every row.
- Fails loudly if a row has no license.
