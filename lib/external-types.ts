export type Provider = 'pubchem' | 'uniprot';
export interface ExternalRecord {
  id: string;
  title: string;
  subtitle: string;
  sourceUrl: string;
  definition?: { text: string; sourceName: string; sourceUrl: string; license: string; licenseUrl: string };
  definitionUnavailable?: boolean;
  definitionUnavailableReason?: 'not-provided' | 'not-licensed' | 'request-failed';
  sequenceDiagram?: { length: number; features: { label: string; start: number; end: number }[] };
  properties: { label: string; value: string }[];
}
export interface LookupResult {
  provider: Provider;
  query: string;
  selectedFrom?: 'ChEMBL';
  fetchedAt: string;
  attribution: string;
  license: string;
  licenseUrl: string;
  records: ExternalRecord[];
}

export interface RelatedChemical {
  id: string;
  title: string;
  inchiKey: string;
  score: number;
  formula: string;
  sourceUrl: string;
}
export interface RelatedChemicalsResult {
  cid: string;
  records: RelatedChemical[];
  threshold: number;
  provider: 'ChEMBL';
  fetchedAt: string;
  attribution: string;
  license: string;
  licenseUrl: string;
}
