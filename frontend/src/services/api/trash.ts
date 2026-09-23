// Trash / Recently Deleted API Services

import type { TrashItem, TrashSummary, TrashEntityType } from '../../types';
import { request } from './client';

export function fetchTrash(type?: TrashEntityType): Promise<{ summary: TrashSummary; items: TrashItem[] }> {
  const query = type ? `?type=${encodeURIComponent(type)}` : '';
  return request<{ summary: TrashSummary; items: TrashItem[] }>(`/trash${query}`);
}

export function restoreTrashItem(entity: TrashEntityType, id: string): Promise<{ success: boolean; restoredId: string; message: string }> {
  return request<{ success: boolean; restoredId: string; message: string }>(`/trash/restore/${entity}/${id}`, {
    method: 'POST'
  });
}

export function permanentDeleteTrashItem(entity: TrashEntityType, id: string): Promise<{ success: boolean; deletedId: string; message: string }> {
  return request<{ success: boolean; deletedId: string; message: string }>(`/trash/permanent/${entity}/${id}`, {
    method: 'DELETE'
  });
}

export function emptyTrash(entity?: string): Promise<{ success: boolean; count: number; message: string }> {
  return request<{ success: boolean; count: number; message: string }>('/trash/empty', {
    method: 'POST',
    body: JSON.stringify({ entity: entity || 'all' })
  });
}
