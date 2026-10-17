export type Provider = 'pubchem' | 'uniprot';
export interface ExternalRecord {
  id: string;
  title: string;
  subtitle: string;
  sourceUrl: string;
  definition?: { text: string; sourceName: string; sourceUrl: string; license: string; licenseUrl: string };
  definitionUnavailable?: boolean;
  properties: { label: string; value: string }[];
}
export interface LookupResult {
  provider: Provider;
  query: string;
  fetchedAt: string;
  attribution: string;
  license: string;
  licenseUrl: string;
  records: ExternalRecord[];
}
