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

## Definitions and terminology

PubChem results now include a short ChEBI definition excerpt when supplied by its compound description endpoint. ChEBI is selected because it provides explicit CC BY 4.0 reuse terms; arbitrary contributor prose is not copied. UniProt results include a short FUNCTION annotation excerpt under CC BY 4.0. Each excerpt has its own source and license links. Missing or failed descriptions show an honest unavailable message while retaining property results. Excerpts contain at most two sentences/800 characters and are not AI-generated simplifications.

## Chemical neighborhoods (2026-10-17)

PubChem compound results now load a **Related to [compound]** neighborhood from ChEMBL. `GET /api/related?cid=...` resolves a PubChem CID to SMILES/InChIKey, then calls the ChEMBL similarity API with a 70% threshold. It selects up to six distinct InChIKey neighbors from the first twelve results, excludes the exact seed, and displays the provider's score, formula and ChEMBL link. This is a sampled one-hop star, not a complete chemical-space graph; no neighbor-to-neighbor edges are inferred. Salts/forms and other structures may have identical fingerprints, so 100% is not a claim of molecular identity.

Clicking a graph node or **Explore** resolves that neighbor's exact InChIKey through PubChem and opens its properties, definition (when available) and own neighborhood. Display names are kept separate from lookup identifiers to avoid confusing a salt or isomer with a similarly named compound. Unknown identities and missing data stay explicit rather than being guessed. Related search errors never hide the original compound result and can be retried.

ChEMBL was selected from the proposed chemical-space sources because it offers a hosted similarity endpoint without a new database, package or API key. Neo4j/Fragment Network and RDKit/NetworkX are potential future self-hosted graph/index approaches; they are not installed or represented as connected services. Global-Chem is not connected.

- API: https://chembl.gitbook.io/chembl-interface-documentation/web-services/chembl-data-web-services
- ChEMBL license: https://chembl.gitbook.io/chembl-interface-documentation/frequently-asked-questions/general-questions
- Redisplayed ChEMBL result data is provided under **CC BY-SA 3.0**, credited to ChEMBL / EMBL-EBI; fields are selected/reformatted. This is separate from application code and editorial content.

The endpoint validates numeric CIDs, fixes upstream hosts, uses 15-second upstream timeouts, deduplicates pending requests, and applies a process-local gate and bounded ten-minute response cache. It never fetches caller-provided URLs. It has the same prototype limitations as the original lookup gate; production needs shared upstream rate limiting. Structural similarity describes fingerprints, not shared biological function, efficacy or safety.

Privacy change: after a submitted PubChem lookup, the app sends the returned compound's identifier to PubChem for a structure and that structure to ChEMBL to find neighbors. Clicking a neighbor submits its identifier to PubChem. It does not send saved progress or use account credentials. No queries are sent merely from typing. Requests only occur for the first compound when a name lookup matches multiple records.
