# Privacy

- We collect no personal data. No accounts, no forms, no analytics, no cookies, no third-party scripts.
- Saved concepts, flashcard progress, and quiz scores live in the user's own browser (localStorage)
  and never leave the device. Clearing browser data erases them (known limitation).
- Fonts are loaded with `next/font` so the browser does not call a font provider.
- The host (Vercel) keeps standard web server logs, which can include IP addresses. We do not
  control or use these.
- Never log user input or progress anywhere.
- Many users are under 18. If accounts, analytics, or any data collection are ever added,
  review children's privacy rules (e.g. COPPA in the US) first.

## Temporary live lookups (2026-10-17)

The user enabled PubChem and UniProt integration. Submitting the live database form sends the submitted term through our server to the selected provider. Typing alone sends no external query. Server responses/terms may be cached in process memory for ten minutes. Saved concepts and student progress remain on the device. Application code does not log searches, but standard host HTTP access logs may contain request URLs, including lookup terms. See `LIVE-DATABASES.md`.

## Related chemical lookup

For a submitted PubChem search, the first result now also triggers structure retrieval from PubChem and a ChEMBL similarity lookup. The compound structure is sent to ChEMBL; selecting a neighbor sends its InChIKey to PubChem. Short-lived server caches and standard host request-log behavior apply as described in `LIVE-DATABASES.md`. Student study progress remains local.

Search-result compound diagrams are requested through our server from PubChem using the matched CID. The browser does not make a direct PubChem image request. Protein sequence diagrams are drawn locally from the existing UniProt lookup response.
