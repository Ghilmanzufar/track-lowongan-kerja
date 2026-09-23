// Vault Document Card & Version Tree Sub-component

import type { UserDocument, DocumentVersion } from '../../types';
import { escapeHtml, formatDateWIB } from '../../utils';
import { getIconSvg } from '../../utils/icons';
import { CATEGORY_ICONS, CATEGORY_LABELS } from './vaultTypes';

export function renderVersionRow(ver: DocumentVersion): string {
  const isLink = ver.storageType === 'Link';
  const openUrl = isLink ? ver.url : ver.fileDataUrl;
  const isFile = ver.storageType === 'File';

  let storageBadge = `${getIconSvg('link', { size: 11 })} Tautan`;
  if (isLink && ver.url) {
    const urlLower = ver.url.toLowerCase();
    if (urlLower.includes('drive.google.com')) storageBadge = `${getIconSvg('externalLink', { size: 11 })} Google Drive`;
    else if (urlLower.includes('canva.com')) storageBadge = `${getIconSvg('externalLink', { size: 11 })} Canva`;
    else if (urlLower.includes('notion.')) storageBadge = `${getIconSvg('externalLink', { size: 11 })} Notion`;
    else if (urlLower.includes('github.')) storageBadge = `${getIconSvg('externalLink', { size: 11 })} GitHub`;
    else storageBadge = `${getIconSvg('externalLink', { size: 11 })} Tautan Web`;
  } else if (isFile) {
    storageBadge = `${getIconSvg('download', { size: 11 })} Berkas Unggah (${ver.fileName || 'PDF'})`;
  }

  const appliedCount = ver.appliedCount || 0;

  return `
    <div class="version-node-item ${ver.isDefault ? 'is-default' : ''}" data-version-id="${ver.id}">
      <div class="version-node-left">
        <span class="version-badge">
          ${escapeHtml(ver.versionName)}
        </span>

        <div class="version-info">
          <div class="version-title-row">
            ${
              ver.isDefault
                ? `<span class="tag-badge" style="font-size: 10px; background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 700; padding: 2px 6px; display:inline-flex; align-items:center; gap:4px;">${getIconSvg('star', { size: 11 })} Default</span>`
                : ''
            }
            <span class="tag-badge" style="font-size: 11px; font-weight: 500; padding: 2px 8px; display:inline-flex; align-items:center; gap:4px;">
              ${storageBadge}
            </span>
            ${
              appliedCount > 0
                ? `<button type="button" class="version-usage-badge" data-view-usage="${ver.id}" style="border: none; cursor: pointer;" title="Klik untuk melihat lamaran">
                     Digunakan di ${appliedCount} lamaran
                   </button>`
                : `<span style="font-size: 11px; color: var(--text-muted);">Belum dipakai</span>`
            }
          </div>

          <div class="version-meta">
            ${ver.notes ? `<span>"${escapeHtml(ver.notes)}"</span> • ` : ''}
            <span>Diperbarui ${formatDateWIB(ver.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div class="version-node-actions">
        ${
          isLink && openUrl
            ? `<a href="${openUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-xs" style="font-size: 11.5px; padding: 3px 9px; display:inline-flex; align-items:center; gap:4px;">
                 ${getIconSvg('externalLink', { size: 12 })} Buka
               </a>`
            : isFile && openUrl
            ? `
               <button type="button" class="btn btn-secondary btn-xs" data-preview-vault-version="${ver.id}" style="font-size: 11.5px; padding: 3px 8px; display:inline-flex; align-items:center; gap:4px;" title="Lihat pratinjau berkas">
                 ${getIconSvg('eye', { size: 11 })} Lihat
               </button>
               <a href="${openUrl}" download="${escapeHtml(ver.fileName || 'dokumen.pdf')}" class="btn btn-secondary btn-xs" style="font-size: 11.5px; padding: 3px 8px; display:inline-flex; align-items:center; gap:4px;" title="Unduh berkas">
                 ${getIconSvg('download', { size: 11 })} Unduh
               </a>
              `
            : ''
        }
        ${
          !ver.isDefault
            ? `<button type="button" class="btn btn-secondary btn-xs" data-set-default="${ver.id}" title="Jadikan versi default" style="font-size: 11px; padding: 3px 8px;">
                 Jadikan Default
               </button>`
            : ''
        }
        <button type="button" class="btn btn-secondary btn-xs" data-edit-version="${ver.id}" title="Edit versi" style="font-size: 11px; padding: 3px 7px; display:inline-flex; align-items:center;">
          ${getIconSvg('edit', { size: 12 })}
        </button>
        <button type="button" class="btn btn-danger btn-xs" data-delete-version="${ver.id}" title="Hapus versi" style="font-size: 11px; padding: 3px 7px; display:inline-flex; align-items:center;">
          ${getIconSvg('trash', { size: 12 })}
        </button>
      </div>
    </div>
  `;
}

export function renderDocumentCard(doc: UserDocument): string {
  const versions = doc.versions || [];

  return `
    <div class="doc-vault-card" data-doc-id="${doc.id}">
      <div class="doc-vault-header">
        <div class="doc-vault-title-area">
          <span class="doc-vault-icon">${CATEGORY_ICONS[doc.category] || getIconSvg('fileText', { size: 18 })}</span>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="doc-vault-title">${escapeHtml(doc.title)}</span>
              <span class="tag-badge" style="font-size: 10.5px; padding: 2px 7px; font-weight: 600;">
                ${CATEGORY_LABELS[doc.category] || doc.category}
              </span>
            </div>
            ${
              doc.description
                ? `<div class="doc-vault-desc">${escapeHtml(doc.description)}</div>`
                : ''
            }
          </div>
        </div>

        <div style="display: flex; gap: 6px; align-items: center;">
          <button type="button" class="btn btn-secondary btn-xs" data-add-version="${doc.id}" style="font-size: 11.5px; padding: 4px 10px;">
            + Versi Baru
          </button>
          <button type="button" class="btn btn-secondary btn-xs" data-edit-doc="${doc.id}" title="Edit judul / kategori" style="font-size: 11px; padding: 4px 8px; display:inline-flex; align-items:center;">
            ${getIconSvg('edit', { size: 12 })}
          </button>
          <button type="button" class="btn btn-danger btn-xs" data-delete-doc="${doc.id}" title="Hapus dokumen" style="font-size: 11px; padding: 4px 8px; display:inline-flex; align-items:center;">
            ${getIconSvg('trash', { size: 12 })}
          </button>
        </div>
      </div>

      <div class="version-tree-list">
        ${
          versions.length === 0
            ? `<div style="font-size: 12px; color: var(--text-muted); padding: 8px 0;">Belum ada versi untuk dokumen ini.</div>`
            : versions
                .map((ver) => renderVersionRow(ver))
                .join('')
        }
      </div>
    </div>
  `;
}
