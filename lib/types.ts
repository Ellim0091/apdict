export type Course = 'ap-bio' | 'ap-chem' | 'both';
export interface Entry { id: string; term: string; aliases: string[]; type: 'term' | 'concept' | 'compound' | 'structure' | 'process'; course: Course; unit: number; category: string; summary: string; definition: string; keyFact: string; diagramIds: string[]; sourceIds: string[]; reviewed: boolean }
export interface Source { id: string; name: string; url: string; license: string; retrievedOn: string; attribution: string }
export interface Diagram { id: string; file: string; altText: string; sourceId: string }
export interface Relation { fromId: string; toId: string; kind: 'leads-to' | 'part-of' | 'requires' | 'contrasts' | 'example-of'; reason: string }
export interface Question { id: string; entryId: string; prompt: string; choices: string[]; answerIndex: number; explanation: string; reviewed: boolean }
export interface Catalog { entries: Entry[]; sources: Source[]; relations: Relation[]; diagrams: Diagram[]; quiz: Question[] }
