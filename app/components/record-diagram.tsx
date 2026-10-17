"use client";
import Image from 'next/image';
import { useState } from 'react';
import type { ExternalRecord, Provider } from '@/lib/external-types';

export default function RecordDiagram({record,provider,fetchedAt}:{record:ExternalRecord;provider:Provider;fetchedAt:string}) {
  const [status,setStatus] = useState<'loading'|'loaded'|'error'>('loading');
  const [attempt,setAttempt] = useState(0);
  if(provider==='pubchem') return <figure className="record-diagram">
    <div className="diagram-heading"><h4>Molecular structure</h4><span>2D · PubChem CID {record.id}</span></div>
    <div className="structure-canvas">
      {status==='loading' && <p className="diagram-status" role="status">Loading structure…</p>}
      {status==='error' ? <div className="diagram-fallback" role="status"><p>The structure diagram couldn’t be loaded.</p><button onClick={()=>{setAttempt(n=>n+1);setStatus('loading');}}>Retry diagram</button><a href={record.sourceUrl} target="_blank" rel="noopener noreferrer">View structure at PubChem ↗</a></div> : <Image key={attempt} src={`/api/diagram?cid=${record.id}&attempt=${attempt}`} alt={`PubChem 2D molecular structure of ${record.title}, compound ID ${record.id}`} width={600} height={450} unoptimized onLoad={()=>setStatus('loaded')} onError={()=>setStatus('error')} />}
    </div>
    <figcaption>Structure depiction supplied by <a href={record.sourceUrl} target="_blank" rel="noopener noreferrer">PubChem / NCBI ↗</a>. This depicts the selected database structure, including its recorded stereochemistry.<br /><a href="https://pubchem.ncbi.nlm.nih.gov/docs/downloads" target="_blank" rel="noopener noreferrer">Source and reuse information</a> · Record retrieved {fetchedAt.split('T')[0]}.</figcaption>
  </figure>;
  const sequence = record.sequenceDiagram;
  if(!sequence) return <figure className="record-diagram"><div className="diagram-heading"><h4>Protein sequence map</h4></div><p className="diagram-fallback">Sequence length wasn’t supplied for this record. <a href={record.sourceUrl} target="_blank" rel="noopener noreferrer">View UniProt ↗</a></p></figure>;
  const position = (residue:number)=>40+(residue-1)/Math.max(sequence.length-1,1)*520;
  return <figure className="record-diagram"><div className="diagram-heading"><h4>Protein sequence map</h4><span>{sequence.length} amino acids</span></div>
    <svg className="protein-diagram" viewBox={`0 0 600 ${125+sequence.features.length*38}`} role="img" aria-label={`Sequence map of ${record.title}, ${sequence.length} amino acids${sequence.features.length ? ', with annotated '+sequence.features.map(f=>`${f.label}, residues ${f.start} to ${f.end}`).join('; ') : ''}`}>
      <line x1="40" y1="48" x2="560" y2="48" className="sequence-backbone"/><circle cx="40" cy="48" r="5"/><circle cx="560" cy="48" r="5"/><text x="40" y="28">N terminus</text><text x="560" y="28" textAnchor="end">C terminus</text><text x="40" y="76">1</text><text x="560" y="76" textAnchor="end">{sequence.length}</text>
      {sequence.features.map((feature,index)=><g key={`${feature.label}-${index}`}><line x1="40" x2="560" y1={105+index*38} y2={105+index*38} className="sequence-guide"/><rect x={position(feature.start)} y={96+index*38} width={Math.max(4,position(feature.end)-position(feature.start))} height="13" rx="3"/><text x="40" y={124+index*38}>{feature.label} · residues {feature.start}–{feature.end}</text></g>)}
    </svg>
    <figcaption>Sequence length{sequence.features.length ? ' and selected processing annotations' : ''} from <a href={record.sourceUrl} target="_blank" rel="noopener noreferrer">UniProt Consortium ↗</a>. This linear map is not a 3D protein structure. {sequence.features.length===0 && 'No signal/chain/peptide ranges were supplied.'}<br /><a href="https://www.uniprot.org/help/license" target="_blank" rel="noopener noreferrer">CC BY 4.0 · Data rendered as a sequence diagram</a> · Retrieved {fetchedAt.split('T')[0]}.</figcaption>
  </figure>;
}
