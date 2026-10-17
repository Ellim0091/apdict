"use client";
import { useEffect, useRef, useState } from 'react';
import type { ExternalRecord, RelatedChemical, RelatedChemicalsResult } from '@/lib/external-types';

export default function RelatedChemicals({compound,onExplore}:{compound:ExternalRecord;onExplore:(record:RelatedChemical)=>void}) {
  const [data,setData] = useState<RelatedChemicalsResult|null>(null);
  const [error,setError] = useState('');
  const [attempt,setAttempt] = useState(0);
  const requestId = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    const id = ++requestId.current;
    fetch(`/api/related?${new URLSearchParams({cid:compound.id})}`,{signal:controller.signal}).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not load related chemicals.');
      if (requestId.current === id) setData(result);
    }).catch(e => {if (!controller.signal.aborted && requestId.current === id) setError(e instanceof Error ? e.message : 'Could not load related chemicals.');});
    return () => controller.abort();
  },[compound.id,attempt]);
  const points = data?.records.map((record,index) => {
    const angle = (index / data.records.length)*Math.PI*2-Math.PI/2;
    return {record,x:310+210*Math.cos(angle),y:175+115*Math.sin(angle)};
  }) ?? [];
  return <section className="chemical-neighborhood" aria-labelledby="neighborhood-heading">
    <span className="section-label">Follow the connections · ChEMBL</span><h3 id="neighborhood-heading">Related to {compound.title}</h3>
    <p className="neighborhood-intro">Molecules with similar structural fingerprints. Select one to explore its definition and properties.</p>
    {!data && !error && <p className="lookup-status" role="status">Finding chemically similar neighbors…</p>}
    {error && <div className="lookup-error" role="alert">{error} <button onClick={() => {setError('');setData(null);setAttempt(a=>a+1);}}>Retry connections</button></div>}
    {data && <>{data.records.length ? <><div className="neighborhood-graph"><svg viewBox="0 0 620 350" role="group" aria-label={`Structural similarity neighborhood for ${compound.title}`}>
      {points.map(({record,x,y}) => <line key={record.id} x1="310" y1="175" x2={x} y2={y} />)}
      <circle cx="310" cy="175" r="42" className="seed-node"/><text x="310" y="170" className="seed-label">{compound.title.length>17 ? compound.title.slice(0,15)+'…' : compound.title}</text><text x="310" y="188" className="seed-caption">STARTING COMPOUND</text>
      {points.map(({record,x,y}) => <g key={record.id} role="button" tabIndex={0} aria-label={`Explore ${record.title}, ${record.score}% structural similarity`} onClick={()=>onExplore(record)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onExplore(record);}}}><title>{record.title} · {record.score}% structural fingerprint similarity</title><rect x={x-90} y={y-30} width="180" height="85" fill="transparent" /><circle cx={x} cy={y} r="25"/><text x={x} y={y+4} className="node-score">{record.score}%</text><text x={x} y={y+43} className="node-name">{record.title.length>22 ? record.title.slice(0,20)+'…' : record.title}</text></g>)}
    </svg></div><div className="neighbor-list">{data.records.map(record=><div className="neighbor" key={record.id}><div><strong>{record.title}</strong><small>{record.formula || record.id}</small></div><span className="similarity-score">{record.score}% <small>structural similarity</small></span><button onClick={()=>onExplore(record)}>Explore <span aria-hidden="true">→</span></button><a href={record.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`View ${record.title} in ChEMBL`}>ChEMBL ↗</a></div>)}</div></> : <p className="lookup-status">No other compounds were found in the returned ChEMBL matches at the 70% cutoff. Try a different starting compound.</p>}
      <p className="similarity-note">Scores are ChEMBL fingerprint similarities at a 70% cutoff. Similar structures can have different biological effects; even a 100% fingerprint score does not establish identical molecules. Lines connect neighbors only to the starting compound.</p>
      <div className="external-attribution"><p>{data.attribution}</p><a href={data.licenseUrl} target="_blank" rel="noopener noreferrer">Similarity data: {data.license}</a><small>Retrieved {new Date(data.fetchedAt).toLocaleString()} · Up to 6 distinct neighbors from the first 12 matches; this is a sampled neighborhood.</small></div>
    </>}
  </section>;
}
