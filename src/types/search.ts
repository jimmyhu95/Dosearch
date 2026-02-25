// 搜索类型定义

import type { DocumentWithCategories } from './document';

export type SearchMode = 'fulltext' | 'semantic' | 'hybrid';

export interface SearchQuery {
  q: string;
  mode?: SearchMode;
  categories?: string[];
  fileTypes?: string[];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'date' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  document: DocumentWithCategories;
  score: number;
  highlights: SearchHighlight[];
}

export interface SearchHighlight {
  field: string;
  snippet: string;
  matchedWords: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  query: string;
  mode: SearchMode;
  processingTime: number;
  facets?: SearchFacets;
}

export interface SearchFacets {
  categories: FacetCount[];
  fileTypes: FacetCount[];
  dateRanges: FacetCount[];
}

export interface FacetCount {
  value: string;
  label: string;
  count: number;
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'document' | 'category';
  documentId?: string;
  categorySlug?: string;
}

export interface IndexStats {
  totalDocuments: number;
  indexedDocuments: number;
  pendingDocuments: number;
  lastIndexedAt: Date | null;
  indexSize: number;
}
