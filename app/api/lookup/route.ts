import type { ExternalRecord, LookupResult, Provider } from '@/lib/external-types';

const cache = new Map<string, { until: number; data: LookupResult }>();
const pending = new Map<string, Promise<LookupResult>>();
let active = 0;
let lastStart = 0;
class LookupError extends Error { constructor(message: string, public status: number) { super(message); } }

async function fetchJson(url: URL): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(12000), cache: 'no-store', headers: { Accept: 'application/json' } });
  if (response.status === 404) return null;
  if (response.status === 429 || response.status === 503) throw new LookupError('The database is busy. Please try again in a moment.', 503);
  if (!response.ok) throw new LookupError('The database could not complete this lookup. Please try again.', 502);
  return response.json();
}
const obj = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const text = (value: unknown): string => typeof value === 'string' ? value : typeof value === 'number' && Number.isFinite(value) ? String(value) : '';

function excerpt(value: string): string {
  const sentences = value.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [value];
  const selected = sentences.slice(0, 2).join(' ').replace(/\s+/g, ' ').trim();
  return selected.length <= 800 ? selected : selected.slice(0, 800).replace(/\s+\S*$/, '') + '…';
}
function safeSourceUrl(value: unknown, fallback: string): string {
  try { const url = new URL(text(value)); return url.protocol === 'https:' ? url.href : fallback; } catch { return fallback; }
}

async function lookup(provider: Provider, query: string): Promise<LookupResult> {
  let records: ExternalRecord[];
  if (provider === 'pubchem') {
    const identifier = /^\d+$/.test(query) ? 'cid' : /^[A-Z]{14}-[A-Z]{10}-[A-Z]$/.test(query) ? 'inchikey' : 'name';
    const url = new URL(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/${identifier}/${encodeURIComponent(query)}/property/Title,MolecularFormula,MolecularWeight,IUPACName/JSON`);
    const data = obj(await fetchJson(url));
    records = list(obj(data.PropertyTable).Properties).slice(0, 5).flatMap(value => {
      const p = obj(value);
      if (!Number.isSafeInteger(p.CID) || Number(p.CID) <= 0) return [];
      return [{ id: String(p.CID), title: text(p.Title) || `Compound ${p.CID}`, subtitle: `PubChem CID ${p.CID}`, sourceUrl: `https://pubchem.ncbi.nlm.nih.gov/compound/${p.CID}`, properties: [
        { label: 'Molecular formula', value: text(p.MolecularFormula) || 'Not supplied' },
        { label: 'Molecular weight', value: text(p.MolecularWeight) ? `${text(p.MolecularWeight)} g/mol` : 'Not supplied' },
        { label: 'IUPAC name', value: text(p.IUPACName) || 'Not supplied' },
      ] }];
    });
    if (records.length) {
      try {
        const descriptions = obj(await fetchJson(new URL(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${records.map(r => r.id).join(',')}/description/JSON`)));
        const information = list(obj(descriptions.InformationList).Information).map(obj);
        records = records.map(record => {
          // ChEBI has explicit CC BY reuse terms; do not assume all PubChem prose does.
          const description = information.find(d => String(d.CID) === record.id && text(d.DescriptionSourceName) === 'ChEBI' && text(d.Description));
          return description ? { ...record, definition: {
            text: excerpt(text(description.Description)), sourceName: 'ChEBI via PubChem',
            sourceUrl: safeSourceUrl(description.DescriptionURL, record.sourceUrl),
            license: 'CC BY 4.0 · Excerpt; formatting adjusted', licenseUrl: 'https://www.ebi.ac.uk/chebi/about',
          } } : { ...record, definitionUnavailable: true, definitionUnavailableReason: information.some(d => String(d.CID) === record.id && text(d.Description)) ? 'not-licensed' as const : 'not-provided' as const };
        });
      } catch {
        // Descriptions are optional: compound properties remain available on upstream failure.
        records = records.map(record => ({...record, definitionUnavailable: true, definitionUnavailableReason: 'request-failed' as const}));
      }
    }
  } else {
    const clean = query.replace(/["\\]/g, ' ').trim();
    const accession = /^(?:[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9](?:[A-Z][A-Z0-9]{2}[0-9]){1,2})$/i.test(clean);
    const expression = accession ? `accession:${clean.toUpperCase()}` : `(protein_name:"${clean}" OR gene:"${clean}")`;
    const url = new URL('https://rest.uniprot.org/uniprotkb/search');
    url.search = new URLSearchParams({ query: `${expression} AND reviewed:true AND organism_id:9606`, format: 'json', size: '5', fields: 'accession,protein_name,gene_names,organism_name,length,cc_function' }).toString();
    const data = obj(await fetchJson(url));
    records = list(data.results).slice(0, 5).flatMap(value => {
      const p = obj(value), id = text(p.primaryAccession);
      if (!/^[A-Z0-9]{6,10}$/.test(id)) return [];
      const recommended = obj(obj(p.proteinDescription).recommendedName);
      const functionText = list(p.comments).map(obj).filter(c => c.commentType === 'FUNCTION').flatMap(c => list(c.texts).map(t => text(obj(t).value))).filter(Boolean).join(' ');
      const definition = functionText ? {text: excerpt(functionText), sourceName: 'UniProt Consortium', sourceUrl: `https://www.uniprot.org/uniprotkb/${id}/entry`, license: 'CC BY 4.0 · Function excerpt; formatting adjusted', licenseUrl: 'https://www.uniprot.org/help/license'} : undefined;
      return [{ id, definition, definitionUnavailable: !definition, definitionUnavailableReason: !definition ? 'not-provided' as const : undefined, title: text(obj(recommended.fullName).value) || id, subtitle: `UniProt ${id} · Reviewed human protein`, sourceUrl: `https://www.uniprot.org/uniprotkb/${id}/entry`, properties: [
        { label: 'Organism', value: text(obj(p.organism).scientificName) || 'Not supplied' },
        { label: 'Gene', value: list(p.genes).map(g => text(obj(obj(g).geneName).value)).filter(Boolean).join(', ') || 'Not supplied' },
        { label: 'Sequence length', value: text(obj(p.sequence).length) ? `${text(obj(p.sequence).length)} amino acids` : 'Not supplied' },
      ] }];
    });
  }
  return { provider, query, fetchedAt: new Date().toISOString(), records,
    attribution: provider === 'pubchem' ? 'PubChem, National Library of Medicine / NCBI. Computed compound properties; see each record for provenance.' : 'UniProt Consortium, UniProtKB/Swiss-Prot. Selected fields from reviewed human protein records.',
    license: provider === 'pubchem' ? 'Reuse terms vary by underlying data source; check record provenance.' : 'CC BY 4.0 · Selected fields reformatted for display.',
    licenseUrl: provider === 'pubchem' ? 'https://pubchem.ncbi.nlm.nih.gov/docs/downloads' : 'https://www.uniprot.org/help/license',
  };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const provider = params.get('provider');
  const query = (params.get('q') ?? '').trim().replace(/\s+/g, ' ');
  if (provider !== 'pubchem' && provider !== 'uniprot') return Response.json({error:'Choose PubChem or UniProt.'}, {status:400});
  if (query.length < 2 || query.length > 100 || /[\u0000-\u001f\u007f]/.test(query)) return Response.json({error:'Enter a name or identifier between 2 and 100 characters.'}, {status:400});
  const key = `${provider}:${query.toLowerCase()}`;
  const cached = cache.get(key);
  if (cached && cached.until > Date.now()) return Response.json(cached.data);
  if (cached) cache.delete(key);
  let task = pending.get(key);
  if (!task) {
    // Small, process-local gate appropriate for the temporary prototype.
    if (active >= 3 || Date.now() - lastStart < 300) return Response.json({error:'Please wait a moment before another lookup.'}, {status:429,headers:{'Retry-After':'1'}});
    active++; lastStart = Date.now();
    task = lookup(provider, query).then(data => {
      if (cache.size >= 100) cache.delete(cache.keys().next().value!);
      cache.set(key, {until:Date.now()+600000,data});
      return data;
    }).finally(() => { active--; pending.delete(key); });
    pending.set(key, task);
  }
  try { return Response.json(await task); }
  catch (error) {
    if (error instanceof LookupError) return Response.json({error:error.message},{status:error.status});
    return Response.json({error:'The database is unavailable or the lookup timed out. Please try again.'},{status:502});
  }
}
