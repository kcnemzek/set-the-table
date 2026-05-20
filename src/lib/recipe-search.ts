export interface WebSearchResult {
  title: string;
  url: string;
  domain: string;
  snippet: string;
}

export interface WebSearchService {
  search(query: string): Promise<WebSearchResult[]>;
}
