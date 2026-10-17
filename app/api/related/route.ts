import type { RelatedChemicalsResult, RelatedChemical } from '@/lib/external-types';

const cache = new Map<string, {until:number; data: RelatedChemicalsResult}>();
const pending = new Map<string, Promise<RelatedChemicalsResult>>();
let active = 0;
let lastStart = 0;
const obj = (v: unknown): Record<string,unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string,unknown> : {};
const list = (v: unknown): unknown[] => Array.isArray(v) ? v : [];
const text = (v: unknown): string => typeof v === 'string' ? v : '';
class ServiceError extends Error { constructor(message:string, public status:number) {super(message);} }
async function json(url: URL): Promise<unknown> {
  const response = await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000),headers:{Accept:'application/json'}});
  if (response.status === 404) return null;
  if (response.status === 429 || response.status === 503) throw new ServiceError('The similarity service is busy. Try again in a moment.',503);
  if (!response.ok) throw new ServiceError('Related chemicals are unavailable right now. Your compound details are still available.',502);
  return response.json();
}
async function load(cid: string): Promise<RelatedChemicalsResult> {
  const data = obj(await json(new URL(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/SMILES,InChIKey/JSON`)));
  const seed = obj(list(obj(data.PropertyTable).Properties)[0]);
  const smiles = text(seed.SMILES);
  if (!smiles || smiles.length > 4000) throw new ServiceError('A searchable structure is not available for this compound.',404);
  const url = new URL(`https://www.ebi.ac.uk/chembl/api/data/similarity/${encodeURIComponent(smiles)}/70.json`);
  url.search = new URLSearchParams({limit:'12',only:'molecule_chembl_id,pref_name,similarity,molecule_structures,molecule_properties'}).toString();
  const response = obj(await json(url));
  const seen = new Set<string>([text(seed.InChIKey)]);
  const records: RelatedChemical[] = list(response.molecules).flatMap(value => {
    const molecule = obj(value), structures = obj(molecule.molecule_structures), properties = obj(molecule.molecule_properties);
    const id = text(molecule.molecule_chembl_id), key = text(structures.standard_inchi_key);
    const rawScore = molecule.similarity;
    const score = typeof rawScore === 'number' || typeof rawScore === 'string' && rawScore.trim() !== '' ? Number(rawScore) : NaN;
    if (!/^CHEMBL\d+$/.test(id) || !/^[A-Z]{14}-[A-Z]{10}-[A-Z]$/.test(key) || seen.has(key) || !Number.isFinite(score) || score < 70 || score > 100) return [];
    seen.add(key);
    return [{id,title:text(molecule.pref_name) || id,inchiKey:key,score:Math.round(score*10)/10,formula:text(properties.full_molformula),sourceUrl:`https://www.ebi.ac.uk/chembl/explore/compound/${id}`}];
  }).sort((a,b) => b.score-a.score || a.title.localeCompare(b.title)).slice(0,6);
  return {cid,records,threshold:70,provider:'ChEMBL',fetchedAt:new Date().toISOString(),attribution:'ChEMBL, EMBL-EBI. Similarity results and molecule fields reformatted; seed structure from PubChem.',license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/'};
}
export async function GET(request: Request) {
  const cid = new URL(request.url).searchParams.get('cid') ?? '';
  if (!/^[1-9]\d{0,9}$/.test(cid)) return Response.json({error:'A valid PubChem compound ID is required.'},{status:400});
  const cached = cache.get(cid);
  if (cached && cached.until > Date.now()) return Response.json(cached.data);
  if (cached) cache.delete(cid);
  let task = pending.get(cid);
  if (!task) {
    if (active >= 3 || Date.now()-lastStart < 300) return Response.json({error:'Please wait a moment before exploring another neighborhood.'},{status:429,headers:{'Retry-After':'1'}});
    active++; lastStart = Date.now();
    task = load(cid).then(data => {if (cache.size >= 100) cache.delete(cache.keys().next().value!);cache.set(cid,{until:Date.now()+600000,data});return data;}).finally(() => {active--;pending.delete(cid);});
    pending.set(cid,task);
  }
  try {return Response.json(await task);} catch (error) {
    return Response.json({error:error instanceof ServiceError ? error.message : 'The similarity search timed out or could not connect. Try again.'},{status:error instanceof ServiceError ? error.status : 502});
  }
}
