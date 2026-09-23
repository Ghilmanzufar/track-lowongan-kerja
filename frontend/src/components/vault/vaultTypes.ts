// Document Vault Types, Category Icons, and Labels

import type { DocumentCategory } from '../../types';
import { getIconSvg } from '../../utils/icons';

export type VaultCategoryFilter = DocumentCategory | 'all';

export const CATEGORY_ICONS: Record<DocumentCategory, string> = {
  Resume: getIconSvg('fileText', { size: 18 }),
  CoverLetter: getIconSvg('mail', { size: 18 }),
  Portfolio: getIconSvg('briefcase', { size: 18 }),
  Other: getIconSvg('folder', { size: 18 })
};

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  Resume: 'Resume / CV',
  CoverLetter: 'Cover Letter',
  Portfolio: 'Portofolio',
  Other: 'Dokumen Lain'
};
