import entries from '../data/entries.json';
import sources from '../data/sources.json';
import relations from '../data/relations.json';
import diagrams from '../data/diagrams.json';
import quiz from '../data/quiz.json';
import type { Catalog, Course, Entry } from './types';

export function validateCatalog(data: Catalog): string[] {
  const errors: string[] = [];
  for (const [name, rows] of Object.entries(data)) {
    const seen = new Set<string>();
    for (const row of rows) {
      if (!row.id && name !== 'relations') errors.push(`${name}: missing id`);
      if (row.id && seen.has(row.id)) errors.push(`${name}: duplicate ${row.id}`);
      if (row.id) seen.add(row.id);
    }
  }
  const entryIds = new Set(data.entries.map(e => e.id));
  const sourceIds = new Set(data.sources.map(s => s.id));
  const diagramIds = new Set(data.diagrams.map(d => d.id));
  for (const e of data.entries) {
    if (!e.term.trim() || !e.definition.trim() || !e.summary.trim()) errors.push(`${e.id}: empty content`);
    if (!Number.isInteger(e.unit) || e.unit < 1 || e.unit > (e.course === 'ap-chem' ? 9 : 8)) errors.push(`${e.id}: invalid unit`);
    if (!e.sourceIds.length || e.sourceIds.some(id => !sourceIds.has(id))) errors.push(`${e.id}: invalid sources`);
    if (e.diagramIds.some(id => !diagramIds.has(id))) errors.push(`${e.id}: invalid diagrams`);
  }
  for (const s of data.sources) {
    if (!s.license.trim() || !s.attribution.trim() || !/^https:\/\//.test(s.url) || !/^\d{4}-\d{2}-\d{2}$/.test(s.retrievedOn)) errors.push(`${s.id}: incomplete provenance`);
  }
  for (const d of data.diagrams) if (!sourceIds.has(d.sourceId) || !d.altText || !d.file.startsWith('/')) errors.push(`${d.id}: invalid diagram`);
  for (const r of data.relations) if (!entryIds.has(r.fromId) || !entryIds.has(r.toId) || r.fromId === r.toId || !r.reason.trim()) errors.push(`Invalid relation: ${r.fromId} → ${r.toId}`);
  for (const q of data.quiz) if (!entryIds.has(q.entryId) || !q.prompt.trim() || !q.explanation.trim() || q.choices.length < 2 || new Set(q.choices).size !== q.choices.length || !Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= q.choices.length) errors.push(`${q.id}: invalid question`);
  return errors;
}

const raw = { entries, sources, relations, diagrams, quiz } as Catalog;
const errors = validateCatalog(raw);
if (errors.length) throw new Error(`Invalid content:\n${errors.join('\n')}`);
// Drafts are available only through this explicitly named editorial API.
export function getDraftCatalog(): Catalog { return structuredClone(raw); }
export function getCatalog(): Catalog {
  const published = raw.entries.filter(e => e.reviewed);
  const ids = new Set(published.map(e => e.id));
  return structuredClone({ ...raw, entries: published, relations: raw.relations.filter(r => ids.has(r.fromId) && ids.has(r.toId)), quiz: raw.quiz.filter(q => q.reviewed && ids.has(q.entryId)) });
}
export function getEntry(catalog: Catalog, id: string) {
  const entry = catalog.entries.find(e => e.id === id);
  if (!entry) return undefined;
  return { ...entry, sources: catalog.sources.filter(s => entry.sourceIds.includes(s.id)), diagrams: catalog.diagrams.filter(d => entry.diagramIds.includes(d.id)), connections: catalog.relations.filter(r => r.fromId === id || r.toId === id).map(r => ({ ...r, direction: r.fromId === id ? 'outgoing' as const : 'incoming' as const, entry: catalog.entries.find(e => e.id === (r.fromId === id ? r.toId : r.fromId))! })) };
}
const normalize = (s: string) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function distance(a: string, b: string): number {
  let prev = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const next = [i + 1];
    for (let j = 0; j < b.length; j++) next.push(Math.min(next[j] + 1, prev[j+1] + 1, prev[j] + (a[i] === b[j] ? 0 : 1)));
    prev = next;
  }
  return prev[b.length];
}
export function searchEntries(catalog: Catalog, query = '', filters: { course?: Course; category?: string; unit?: number; savedIds?: string[] } = {}): Entry[] {
  const tokens = normalize(query).slice(0, 200).split(' ').filter(Boolean);
  return catalog.entries.filter(e => (!filters.course || e.course === filters.course || e.course === 'both') && (!filters.category || e.category === filters.category) && (!filters.unit || e.unit === filters.unit) && (!filters.savedIds || filters.savedIds.includes(e.id))).map(e => {
    const names = [e.term, ...e.aliases].map(normalize);
    const words = names.join(' ').split(' ');
    const body = normalize(`${e.summary} ${e.definition} ${e.keyFact}`);
    const scores = tokens.map(t => names.some(n => n === t) ? 100 : names.some(n => n.startsWith(t)) ? 80 : names.some(n => n.includes(t)) ? 60 : words.some(w => t.length >= 4 && Math.abs(w.length-t.length) <= 2 && distance(t,w) <= (t.length > 7 ? 2 : 1)) ? 35 : body.includes(t) ? 10 : 0);
    return { e, score: scores.reduce<number>((a,b) => a+b, 0), match: scores.every(s => s > 0) };
  }).filter(r => r.match).sort((a,b) => b.score-a.score || a.e.term.localeCompare(b.e.term)).map(r => structuredClone(r.e));
}
