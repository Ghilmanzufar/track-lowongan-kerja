// Global Multi-Entity Search API Service

import type { GlobalSearchResults } from '../../types';
import { request } from './client';

export function searchGlobal(query: string): Promise<GlobalSearchResults> {
  const q = encodeURIComponent(query.trim());
  return request<GlobalSearchResults>(`/search?q=${q}`);
}
