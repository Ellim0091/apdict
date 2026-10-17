"use client";
import { useEffect, useRef, useState, type FormEvent } from 'react';
import RecordDiagram from './record-diagram';
import RelatedChemicals from './related-chemicals';
import type { LookupResult, Provider } from '@/lib/external-types';

export default function LiveLookup() {
  const [provider, setProvider] = useState<Provider>('pubchem');
  const [query, setQuery] = useState('');
  const [queryIdentifier, setQueryIdentifier] = useState('');
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  function changeProvider(next: Provider) {
    controller.current?.abort(); controller.current = null;
    setProvider(next); setQuery(''); setQueryIdentifier(''); setResult(null); setError(''); setLoading(false);
  }
  async function search(event: FormEvent) {
    event.preventDefault();
    return runLookup(queryIdentifier || query, query);
  }
  async function runLookup(term: string, label = term, selectedFrom?: 'ChEMBL') {
    controller.current?.abort();
    const current = new AbortController(); controller.current = current;
    setLoading(true); setError(''); setResult(null);
    try {
      const params = new URLSearchParams({provider,q:term.trim()});
      const response = await fetch(`/api/lookup?${params}`,{signal:current.signal});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Lookup failed. Please try again.');
      if (controller.current === current) setResult({...data,query:label,selectedFrom});
    } catch (e) {
      if (controller.current === current && !current.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to reach the database.');
    } finally { if (controller.current === current) setLoading(false); }
  }
  return <section className="live-lookup" aria-labelledby="live-heading">
    <div className="results-heading"><div><span>Go beyond the study library</span><h2 id="live-heading">Explore live databases.</h2></div><span className="live-badge">On-demand lookup</span></div>
    <p className="live-intro">Look up compounds with PubChem or human proteins with UniProt. These are database records, separate from the AP study explanations.</p>
    <div className="filters" aria-label="Database source"><button aria-pressed={provider === 'pubchem'} className={provider === 'pubchem' ? 'active' : ''} onClick={() => changeProvider('pubchem')}>PubChem · Compounds</button><button aria-pressed={provider === 'uniprot'} className={provider === 'uniprot' ? 'active' : ''} onClick={() => changeProvider('uniprot')}>UniProt · Proteins</button></div>
    <form className="live-form" onSubmit={search}><label htmlFor="database-query">{provider === 'pubchem' ? 'Compound name or PubChem CID' : 'Protein name, gene, or UniProt accession'}</label><div><input id="database-query" value={query} onChange={e => {setQuery(e.target.value);setQueryIdentifier('');}} placeholder={provider === 'pubchem' ? 'e.g. aspirin, caffeine, glucose, 2244' : 'e.g. insulin, hemoglobin, INS, P01308'} required minLength={2} maxLength={100} /><button disabled={loading || query.trim().length < 2} type="submit">{loading ? 'Searching…' : 'Look up'} <span aria-hidden="true">↗</span></button></div></form>
    <p className="lookup-disclosure">Submitted lookups go to {provider === 'pubchem' ? 'NCBI PubChem' : 'UniProt'}.{provider === 'pubchem' && ' Compound structures are also sent to ChEMBL for related chemicals.'} No account or API key needed.{provider === 'uniprot' && ' Showing up to 5 reviewed human protein records.'}</p>
    <div aria-live="polite" aria-busy={loading}>
      {loading && <p className="lookup-status">Looking up {query.trim()}…</p>}
      {error && <p className="lookup-error" role="alert">{error}</p>}
      {result && <><p className="lookup-status">{result.records.length ? `${result.records.length} ${result.records.length === 1 ? 'record' : 'records'} for “${result.query}”` : `No ${provider === 'pubchem' ? 'compound' : 'reviewed human protein'} records found for “${result.query}”. Try another name or identifier.`}</p><div className="external-records">{result.records.map(record => <article className="external-record" key={record.id}><span className="section-label">{record.subtitle}</span><h3>{record.title}</h3>{record.title.toLowerCase() !== result.query.toLowerCase() && <p className="record-name-note">{result.selectedFrom === 'ChEMBL' ? <>ChEMBL name: <strong>{result.query}</strong>. PubChem preferred name: <strong>{record.title}</strong>. This record was matched by its structure identifier.</> : <>Searched for <strong>{result.query}</strong>. {result.provider === 'pubchem' ? 'PubChem' : 'UniProt'} lists this record as <strong>{record.title}</strong>.</>}</p>}<section className="record-definition" aria-label={`Definition of ${record.title}`}><h4>What is {record.title}?</h4>{record.definition ? <><p>{record.definition.text}</p><small><a href={record.definition.sourceUrl} target="_blank" rel="noopener noreferrer">{record.definition.sourceName} ↗</a> · <a href={record.definition.licenseUrl} target="_blank" rel="noopener noreferrer">{record.definition.license}</a></small></> : <p className="definition-missing">{record.definitionUnavailableReason === 'request-failed' ? 'The description service could not be reached. Try the lookup again; the properties below are still available.' : record.definitionUnavailableReason === 'not-licensed' ? 'This record has source descriptions, but none from the openly licensed definition source used by this app. Follow the full record link below to read them.' : result.provider === 'pubchem' ? 'PubChem did not supply a definition for this compound. Its name and properties are available below; a reviewed study explanation has not been added yet.' : 'UniProt did not supply a function description for this protein. Its available properties are shown below.'}</p>}</section><RecordDiagram key={`${result.provider}-${record.id}`} record={record} provider={result.provider} fetchedAt={result.fetchedAt} /><dl>{record.properties.map(p => <div key={p.label}><dt>{p.label}</dt><dd>{p.value}</dd></div>)}</dl><a href={record.sourceUrl} target="_blank" rel="noopener noreferrer">Open full {result.provider === 'pubchem' ? 'PubChem' : 'UniProt'} record ↗</a></article>)}</div>{result.provider === 'pubchem' && result.records[0] && <RelatedChemicals key={result.records[0].id} compound={result.records[0]} onExplore={record => {setQuery(record.title);setQueryIdentifier(record.inchiKey);void runLookup(record.inchiKey,record.title,'ChEMBL');}} />}<div className="external-attribution"><p>{result.attribution}</p><a href={result.licenseUrl} target="_blank" rel="noopener noreferrer">{result.license}</a><small>Retrieved {new Date(result.fetchedAt).toLocaleString()} · May be cached for 10 minutes. Database review does not establish AP course alignment.</small></div></>}
    </div>
  </section>;
}
