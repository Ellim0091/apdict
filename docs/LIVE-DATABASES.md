# Temporary live database integration

Implemented 2026-10-17. The homepage's **Explore live databases** panel calls `GET /api/lookup?provider=pubchem|uniprot&q=...` on explicit submission. No external calls happen just from typing. No new package, API key, paid service, account, database, or imported content is required.

## Providers

- **PubChem PUG REST**: compound name or numeric CID → up to five matching compound property records, including title, CID, molecular formula, molecular weight and IUPAC name. Name lookup is a chemical synonym lookup, not a fuzzy general biology search. Source: https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest . Provenance/reuse terms: https://pubchem.ncbi.nlm.nih.gov/docs/downloads . No descriptions or contributor annotations are copied; underlying record provenance still matters for reuse.
- **UniProt REST**: protein name, gene symbol or accession → up to five reviewed human UniProtKB/Swiss-Prot records, with organism, gene symbol and sequence length. Nonhuman/unreviewed proteins are intentionally excluded from this first integration. Source: https://www.uniprot.org/help/api . License: CC BY 4.0, UniProt Consortium, https://www.uniprot.org/help/license . Only selected fields are reformatted; scientific interpretations are not generated.

The API uses fixed HTTPS hosts, encoded compound identifiers and constrained UniProt query construction. Input length is limited, upstream requests time out after 12 seconds, response counts are capped, identical pending lookups are deduplicated, and successful responses are cached for 10 minutes in a bounded 100-entry process-local cache. A process-local gate limits concurrency to three and starts to at most one every 300 ms. This is prototype protection, not a distributed production rate limiter. Provider 404s become empty results; busy services, rate limits and network errors return user-visible retry messages. The client cancels superseded requests and ignores stale responses.

## Content and study behavior

Live records are separate from the curated catalog and the editorial draft preview. Provider-reviewed records do not mean AP curriculum approval. There is no automatic import, automatic review flag change, flashcard generation, quiz generation, or persistent saving of external records. The study features continue to use the local catalog. All returned text is rendered as text, never HTML.

## Privacy and availability change

This intentionally changes the original offline-only design. Explicit submitted terms are transmitted from the server to the selected provider, and retained in a short-lived in-memory response cache. Student saved concepts, flashcard progress and quiz history are not sent. Application code does not log lookup terms; infrastructure may retain standard HTTP URL/access logs. The providers have their own data handling practices. Internet connectivity is required only for live lookup, and external outages do not prevent use of the local catalog. To disable live lookup, remove the `LiveLookup` component from the homepage and stop exposing `app/api/lookup/route.ts`.

Future useful adapters: ChEBI for chemical ontology relationships and RCSB PDB for structure identifiers/coordinates. These are not connected yet. Keep additional adapters server-side behind this normalized response interface and record per-provider attribution/licensing.
