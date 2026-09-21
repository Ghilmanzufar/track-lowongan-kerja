import { getIconSvg } from '../utils/icons';
import { escapeHtml, formatBytes } from '../utils';

export interface FilePreviewOptions {
  title: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  fileDataUrl: string;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  if (parts.length < 2) {
    return new Blob([], { type: 'application/octet-stream' });
  }
  const match = parts[0].match(/:(.*?);/);
  const mime = match ? match[1] : 'application/octet-stream';

  try {
    const byteString = atob(parts[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    return new Blob([uint8Array], { type: mime });
  } catch (err) {
    console.error('Failed to parse base64 dataUrl', err);
    return new Blob([], { type: mime });
  }
}

export function showFilePreviewModal(options: FilePreviewOptions): void {
  const fileName = options.fileName || options.title || 'dokumen';
  const ext = fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : '';
  const mime = (options.mimeType || '').toLowerCase();

  const isPdf =
    mime.includes('pdf') ||
    ext === 'pdf' ||
    options.fileDataUrl.startsWith('data:application/pdf');

  const isImage =
    mime.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'].includes(ext) ||
    options.fileDataUrl.startsWith('data:image/');

  let blobUrl: string | null = null;
  let isCreatedBlob = false;

  if (options.fileDataUrl.startsWith('data:')) {
    try {
      const blob = dataUrlToBlob(options.fileDataUrl);
      blobUrl = URL.createObjectURL(blob);
      isCreatedBlob = true;
    } catch (err) {
      console.error('Failed to create blob for preview:', err);
    }
  } else {
    blobUrl = options.fileDataUrl;
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'app-dialog file-preview-dialog';

  // Subtitle info
  const metaParts: string[] = [];
  if (options.fileName && options.fileName !== options.title) {
    metaParts.push(escapeHtml(options.fileName));
  }
  if (options.fileSize && options.fileSize > 0) {
    metaParts.push(formatBytes(options.fileSize));
  }
  if (isPdf) {
    metaParts.push('Dokumen PDF');
  } else if (isImage) {
    metaParts.push('Gambar (' + ext.toUpperCase() + ')');
  } else if (ext) {
    metaParts.push('Berkas ' + ext.toUpperCase());
  }
  const metaText = metaParts.join(' • ');

  let bodyContent = '';

  if (isPdf && blobUrl) {
    bodyContent = `
      <iframe 
        src="${blobUrl}#toolbar=1" 
        class="file-preview-iframe" 
        title="Pratinjau ${escapeHtml(fileName)}"
      ></iframe>
    `;
  } else if (isImage && (blobUrl || options.fileDataUrl)) {
    bodyContent = `
      <div class="file-preview-image-wrap">
        <img 
          src="${blobUrl || options.fileDataUrl}" 
          class="file-preview-image" 
          alt="${escapeHtml(fileName)}" 
        />
      </div>
    `;
  } else {
    bodyContent = `
      <div class="file-preview-unsupported">
        <div class="file-preview-unsupported-icon">${getIconSvg('fileText', { size: 48 })}</div>
        <h4 style="margin: 0; font-size: 15px; color: var(--text-primary); font-weight: 600;">
          Pratinjau Langsung Tidak Tersedia
        </h4>
        <p style="margin: 0; color: var(--text-muted); font-size: 12.5px; max-width: 400px; line-height: 1.5;">
          Peramban web tidak dapat menampilkan langsung berkas bertipe <strong>${escapeHtml(ext.toUpperCase() || 'dokumen')}</strong>. Silakan unduh berkas untuk membukanya di perangkat Anda.
        </p>
        <a 
          href="${options.fileDataUrl}" 
          download="${escapeHtml(fileName)}" 
          class="btn btn-primary btn-sm" 
          style="display: inline-flex; align-items: center; gap: 6px; margin-top: 6px;"
        >
          ${getIconSvg('download', { size: 14 })} Unduh ${escapeHtml(fileName)}
        </a>
      </div>
    `;
  }

  const openInNewTabUrl = blobUrl || options.fileDataUrl;
  const canOpenInTab = (isPdf || isImage || openInNewTabUrl.startsWith('http')) && blobUrl;

  dialog.innerHTML = `
    <div class="file-preview-header">
      <div class="file-preview-title-box">
        <div class="file-preview-title">
          <span>${isPdf ? getIconSvg('fileText', { size: 16 }) : isImage ? getIconSvg('camera', { size: 16 }) : getIconSvg('paperclip', { size: 16 })}</span>
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(options.title || fileName)}</span>
        </div>
        ${metaText ? `<div class="file-preview-meta">${metaText}</div>` : ''}
      </div>

      <div class="file-preview-actions">
        ${
          canOpenInTab
            ? `<a href="${openInNewTabUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="font-size: 11.5px; padding: 4px 10px; display: inline-flex; align-items: center; gap: 5px;" title="Buka berkas di tab baru">
                 ${getIconSvg('externalLink', { size: 12 })} Buka di Tab Baru
               </a>`
            : ''
        }
        <a href="${options.fileDataUrl}" download="${escapeHtml(fileName)}" class="btn btn-secondary btn-sm" style="font-size: 11.5px; padding: 4px 10px; display: inline-flex; align-items: center; gap: 5px;" title="Unduh berkas ini">
          ${getIconSvg('download', { size: 12 })} Unduh
        </a>
        <button type="button" class="btn-icon" data-close-preview style="cursor: pointer; background: transparent; border: none; color: var(--text-muted); font-size: 18px; padding: 4px 8px; border-radius: 4px; display: inline-flex; align-items: center;" title="Tutup pratinjau" aria-label="Tutup">
          ${getIconSvg('x', { size: 16 })}
        </button>
      </div>
    </div>

    <div class="file-preview-body">
      ${bodyContent}
    </div>
  `;

  document.body.appendChild(dialog);
  dialog.showModal();

  const cleanup = () => {
    if (isCreatedBlob && blobUrl && blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl);
    }
    dialog.close();
    dialog.remove();
  };

  dialog.querySelectorAll('[data-close-preview]').forEach((btn) => {
    btn.addEventListener('click', cleanup);
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) cleanup();
  });

  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    cleanup();
  });
}
