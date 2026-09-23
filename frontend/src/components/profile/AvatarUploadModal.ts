// Profile Avatar Upload & Interactive Cropper Modal Sub-component

import type { ProfileData } from './profileTypes';
import { loadProfile, getInitial } from './profileTypes';
import { getIconSvg } from '../../utils/icons';
import { showToast } from '../../ui/toast';
import { updateProfile } from '../../services/auth';
import { authStore } from '../../services/authStore';

export function renderAvatarUploadModalHtml(hasAvatar: boolean, avatarContent: string): string {
  return `
    <dialog id="avatarUploadModal" class="custom-dialog avatar-modal-dialog">
      <div class="modal-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:var(--accent-blue); display:flex; align-items:center;">
            ${getIconSvg('camera', { size: 18 })}
          </span>
          <h3 class="modal-title">Unggah Foto Profil</h3>
        </div>
        <button type="button" class="btn btn-secondary btn-icon btn-close-avatar-modal" style="width:28px; height:28px; padding:0; border-radius:50%;">
          ${getIconSvg('x', { size: 14 })}
        </button>
      </div>

      <div class="avatar-modal-body">
        <!-- Informasi Ketentuan Upload -->
        <div class="avatar-guidelines-grid">
          <div class="avatar-guideline-card">
            <div class="avatar-guideline-icon">
              ${getIconSvg('fileText', { size: 16 })}
            </div>
            <div class="avatar-guideline-text">
              <span class="avatar-guideline-label">Jenis File</span>
              <span class="avatar-guideline-val">JPG, JPEG, PNG, WEBP</span>
            </div>
          </div>

          <div class="avatar-guideline-card">
            <div class="avatar-guideline-icon">
              ${getIconSvg('scale', { size: 16 })}
            </div>
            <div class="avatar-guideline-text">
              <span class="avatar-guideline-label">Batas Ukuran</span>
              <span class="avatar-guideline-val">Maksimal 2 MB</span>
            </div>
          </div>
        </div>

        <!-- Area Dropzone Saat Belum Memilih Foto -->
        <div class="avatar-dropzone" id="avatarDropzone">
          <div class="avatar-preview-circle" id="modalAvatarPreview">
            ${avatarContent}
          </div>
          <div class="avatar-dropzone-texts">
            <p class="avatar-dropzone-prompt">Klik atau seret gambar ke sini</p>
            <p class="avatar-dropzone-sub">Foto dapat digeser dan diatur posisinya</p>
          </div>
          <input type="file" id="modalAvatarInput" accept="image/jpeg,image/jpg,image/png,image/webp" style="display:none;" />
        </div>

        <!-- Area Editor & Pengatur Posisi Foto (Cropper) -->
        <div class="avatar-cropper-wrap" id="avatarCropperWrap" style="display:none;">
          <div class="avatar-cropper-stage" id="avatarCropperStage" title="Klik dan geser untuk mengatur posisi foto">
            <canvas class="avatar-cropper-canvas" id="avatarCropperCanvas" width="220" height="220"></canvas>
            <div class="avatar-cropper-guide"></div>
          </div>

          <span class="avatar-cropper-hint">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="5 9 2 12 5 15"></polyline>
              <polyline points="9 5 12 2 15 5"></polyline>
              <polyline points="15 19 12 22 9 19"></polyline>
              <polyline points="19 9 22 12 19 15"></polyline>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <line x1="12" y1="2" x2="12" y2="22"></line>
            </svg>
            Geser foto untuk menyesuaikan posisi (atas, bawah, samping)
          </span>

          <div class="avatar-cropper-controls">
            ${getIconSvg('search', { size: 13 })}
            <input type="range" class="avatar-zoom-slider" id="avatarZoomSlider" min="1" max="3" step="0.02" value="1" title="Perbesar / Perkecil" />
            <button type="button" class="btn-cropper-reset" id="btnCropperReset" title="Kembalikan posisi dan zoom ke tengah">
              ${getIconSvg('repeat', { size: 11 })} Pusatkan
            </button>
          </div>
        </div>

        <!-- Pesan Error Validasi -->
        <div class="avatar-upload-error" id="avatarUploadError">
          <span style="display:flex; align-items:center; flex-shrink:0;">
            ${getIconSvg('alertCircle', { size: 16 })}
          </span>
          <span id="avatarUploadErrorText"></span>
        </div>
      </div>

      <div class="avatar-modal-footer">
        <div>
          <button type="button" class="btn btn-danger btn-sm" id="btnModalRemoveAvatar" style="display:${hasAvatar ? 'inline-flex' : 'none'}; align-items:center; gap:6px;">
            ${getIconSvg('trash', { size: 13 })} Hapus Foto
          </button>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button type="button" class="btn btn-secondary btn-sm" id="btnModalChangePhoto" style="display:none; align-items:center; gap:6px;">
            ${getIconSvg('upload', { size: 13 })} Ganti Foto
          </button>
          <button type="button" class="btn btn-primary btn-sm" id="btnModalBrowse">
            ${getIconSvg('upload', { size: 13 })} Pilih Foto
          </button>
          <button type="button" class="btn btn-primary btn-sm" id="btnModalApplyCrop" style="display:none; align-items:center; gap:6px;">
            ${getIconSvg('check', { size: 13 })} Terapkan Foto
          </button>
        </div>
      </div>
    </dialog>
  `;
}

export function bindAvatarUploadModal(
  container: HTMLElement,
  profile: ProfileData,
  onAvatarUpdated?: (newUrl: string) => void
): { openModal: () => void; closeModal: () => void } {
  const avatarModal          = container.querySelector<HTMLDialogElement>('#avatarUploadModal');
  const avatarBig            = container.querySelector<HTMLElement>('#profileAvatarBig');
  const modalAvatarPreview   = container.querySelector<HTMLElement>('#modalAvatarPreview');
  const avatarDropzone       = container.querySelector<HTMLElement>('#avatarDropzone');
  const avatarCropperWrap    = container.querySelector<HTMLElement>('#avatarCropperWrap');
  const cropperStage         = container.querySelector<HTMLElement>('#avatarCropperStage');
  const cropperCanvas        = container.querySelector<HTMLCanvasElement>('#avatarCropperCanvas');
  const zoomSlider           = container.querySelector<HTMLInputElement>('#avatarZoomSlider');
  const btnCropperReset      = container.querySelector<HTMLButtonElement>('#btnCropperReset');
  const modalAvatarInput     = container.querySelector<HTMLInputElement>('#modalAvatarInput');
  const btnModalBrowse       = container.querySelector<HTMLButtonElement>('#btnModalBrowse');
  const btnModalChangePhoto  = container.querySelector<HTMLButtonElement>('#btnModalChangePhoto');
  const btnModalApplyCrop    = container.querySelector<HTMLButtonElement>('#btnModalApplyCrop');
  const btnModalRemoveAvatar = container.querySelector<HTMLButtonElement>('#btnModalRemoveAvatar');
  const avatarUploadError    = container.querySelector<HTMLElement>('#avatarUploadError');
  const avatarUploadErrorText= container.querySelector<HTMLElement>('#avatarUploadErrorText');

  // Cropper State
  const STAGE_SIZE = 220;
  let loadedImg: HTMLImageElement | null = null;
  let offsetX = 0;
  let offsetY = 0;
  let zoom = 1.0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialOffsetX = 0;
  let initialOffsetY = 0;

  function drawCropper() {
    if (!cropperCanvas || !loadedImg) return;
    const ctx = cropperCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, STAGE_SIZE, STAGE_SIZE);

    // Background fill
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, STAGE_SIZE, STAGE_SIZE);

    // Calculate scaling so image always covers the circle
    const baseScale = Math.max(STAGE_SIZE / loadedImg.width, STAGE_SIZE / loadedImg.height);
    const currentScale = baseScale * zoom;

    const drawW = loadedImg.width * currentScale;
    const drawH = loadedImg.height * currentScale;

    // Center + offset
    const drawX = (STAGE_SIZE / 2) + offsetX - (drawW / 2);
    const drawY = (STAGE_SIZE / 2) + offsetY - (drawH / 2);

    ctx.drawImage(loadedImg, drawX, drawY, drawW, drawH);
  }

  function startDrag(clientX: number, clientY: number) {
    if (!loadedImg) return;
    isDragging = true;
    dragStartX = clientX;
    dragStartY = clientY;
    initialOffsetX = offsetX;
    initialOffsetY = offsetY;
    cropperStage?.classList.add('is-dragging');
  }

  function moveDrag(clientX: number, clientY: number) {
    if (!isDragging || !loadedImg) return;
    offsetX = initialOffsetX + (clientX - dragStartX);
    offsetY = initialOffsetY + (clientY - dragStartY);
    drawCropper();
  }

  function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    cropperStage?.classList.remove('is-dragging');
  }

  // Mouse drag listeners
  cropperStage?.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  });

  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      moveDrag(e.clientX, e.clientY);
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      endDrag();
    }
  });

  // Touch drag listeners (mobile)
  cropperStage?.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  cropperStage?.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length === 1) {
      e.preventDefault();
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  cropperStage?.addEventListener('touchend', () => {
    endDrag();
  });

  // Mouse wheel zoom on stage
  cropperStage?.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    zoom = Math.min(3, Math.max(1, zoom + delta));
    if (zoomSlider) zoomSlider.value = zoom.toString();
    drawCropper();
  }, { passive: false });

  // Zoom slider control
  zoomSlider?.addEventListener('input', () => {
    zoom = parseFloat(zoomSlider.value) || 1;
    drawCropper();
  });

  // Reset / Center button
  btnCropperReset?.addEventListener('click', () => {
    offsetX = 0;
    offsetY = 0;
    zoom = 1;
    if (zoomSlider) zoomSlider.value = '1';
    drawCropper();
  });

  function updateAvatarDisplays(url: string, initChar: string) {
    if (avatarBig) {
      if (url) {
        avatarBig.innerHTML = `<img src="${url}" alt="Avatar" class="profile-avatar-img" />`;
      } else {
        avatarBig.textContent = initChar;
      }
    }
    const navAvatar = document.getElementById('navUserAvatar');
    if (navAvatar) {
      if (url) {
        navAvatar.innerHTML = `<img src="${url}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" />`;
      } else {
        navAvatar.textContent = initChar;
      }
    }
    const sidebarAvatar = document.getElementById('sidebarUserAvatar');
    if (sidebarAvatar) {
      if (url) {
        sidebarAvatar.innerHTML = `<img src="${url}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" />`;
      } else {
        sidebarAvatar.textContent = initChar;
      }
    }
  }

  function showError(msg: string) {
    if (avatarUploadError && avatarUploadErrorText) {
      avatarUploadErrorText.textContent = msg;
      avatarUploadError.style.display = 'flex';
    }
  }

  function hideError() {
    if (avatarUploadError) {
      avatarUploadError.style.display = 'none';
    }
  }

  function showDropzoneView() {
    if (avatarDropzone) avatarDropzone.style.display = 'flex';
    if (avatarCropperWrap) avatarCropperWrap.style.display = 'none';
    if (btnModalBrowse) btnModalBrowse.style.display = 'inline-flex';
    if (btnModalChangePhoto) btnModalChangePhoto.style.display = 'none';
    if (btnModalApplyCrop) btnModalApplyCrop.style.display = 'none';
  }

  function showCropperView() {
    if (avatarDropzone) avatarDropzone.style.display = 'none';
    if (avatarCropperWrap) avatarCropperWrap.style.display = 'flex';
    if (btnModalBrowse) btnModalBrowse.style.display = 'none';
    if (btnModalChangePhoto) btnModalChangePhoto.style.display = 'inline-flex';
    if (btnModalApplyCrop) btnModalApplyCrop.style.display = 'inline-flex';
    drawCropper();
  }

  function openAvatarModal() {
    hideError();
    const current = loadProfile();
    const initChar = getInitial(current.displayName || authStore.getUser()?.email || 'U');

    if (modalAvatarPreview) {
      if (current.avatarUrl) {
        modalAvatarPreview.innerHTML = `<img src="${current.avatarUrl}" alt="Avatar" />`;
      } else {
        modalAvatarPreview.textContent = initChar;
      }
    }

    if (btnModalRemoveAvatar) {
      btnModalRemoveAvatar.style.display = current.avatarUrl ? 'inline-flex' : 'none';
    }

    if (current.avatarUrl) {
      const img = new Image();
      img.onload = () => {
        loadedImg = img;
        offsetX = 0;
        offsetY = 0;
        zoom = 1;
        if (zoomSlider) zoomSlider.value = '1';
        showCropperView();
      };
      img.onerror = () => {
        showDropzoneView();
      };
      img.src = current.avatarUrl;
    } else {
      showDropzoneView();
    }

    avatarModal?.showModal();
  }

  function closeAvatarModal() {
    hideError();
    avatarModal?.close();
  }

  container.querySelectorAll('.btn-close-avatar-modal').forEach(btn => {
    btn.addEventListener('click', () => closeAvatarModal());
  });

  avatarModal?.addEventListener('click', (e) => {
    if (e.target === avatarModal) {
      closeAvatarModal();
    }
  });

  btnModalBrowse?.addEventListener('click', () => {
    modalAvatarInput?.click();
  });

  btnModalChangePhoto?.addEventListener('click', () => {
    modalAvatarInput?.click();
  });

  avatarDropzone?.addEventListener('click', (e) => {
    if (e.target !== modalAvatarInput) {
      modalAvatarInput?.click();
    }
  });

  avatarDropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    avatarDropzone.classList.add('dragover');
  });

  avatarDropzone?.addEventListener('dragleave', () => {
    avatarDropzone.classList.remove('dragover');
  });

  avatarDropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    avatarDropzone.classList.remove('dragover');
    const file = e.dataTransfer?.files?.[0];
    if (file) handleAvatarFile(file);
  });

  modalAvatarInput?.addEventListener('change', () => {
    const file = modalAvatarInput.files?.[0];
    if (file) handleAvatarFile(file);
    modalAvatarInput.value = '';
  });

  async function handleAvatarFile(file: File) {
    hideError();

    const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!ALLOWED.includes(file.type.toLowerCase())) {
      showError('Format file tidak didukung. Harap pilih gambar berformat JPG, JPEG, PNG, atau WEBP.');
      return;
    }

    if (file.size > MAX_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      showError(`Ukuran file terlalu besar (${sizeMb} MB). Batas maksimal ukuran file adalah 2 MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        loadedImg = img;
        offsetX = 0;
        offsetY = 0;
        zoom = 1;
        if (zoomSlider) zoomSlider.value = '1';
        showCropperView();
      };
      img.onerror = () => {
        showError('Gagal memuat gambar. Pastikan file gambar valid.');
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      showError('Gagal membaca berkas gambar.');
    };
    reader.readAsDataURL(file);
  }

  // Apply crop button
  btnModalApplyCrop?.addEventListener('click', async () => {
    if (!loadedImg) return;
    const applyBtn = btnModalApplyCrop;
    if (applyBtn) {
      applyBtn.disabled = true;
      applyBtn.innerHTML = `<span class="auth-spinner"></span> Menyimpan...`;
    }
    try {
      const outCanvas = document.createElement('canvas');
      const OUT_SIZE = 256;
      outCanvas.width = OUT_SIZE;
      outCanvas.height = OUT_SIZE;
      const outCtx = outCanvas.getContext('2d');
      if (!outCtx) return;

      const ratio = OUT_SIZE / STAGE_SIZE;
      const baseScale = Math.max(STAGE_SIZE / loadedImg.width, STAGE_SIZE / loadedImg.height);
      const outScale = (baseScale * zoom) * ratio;

      const outDrawW = loadedImg.width * outScale;
      const outDrawH = loadedImg.height * outScale;
      const outDrawX = (OUT_SIZE / 2) + (offsetX * ratio) - (outDrawW / 2);
      const outDrawY = (OUT_SIZE / 2) + (offsetY * ratio) - (outDrawH / 2);

      outCtx.drawImage(loadedImg, outDrawX, outDrawY, outDrawW, outDrawH);
      const dataUrl = outCanvas.toDataURL('image/jpeg', 0.9);

      const updatedUser = await updateProfile({ avatarUrl: dataUrl });
      profile.avatarUrl = updatedUser.avatarUrl || dataUrl;

      const initChar = getInitial(profile.displayName || authStore.getUser()?.email || 'U');
      updateAvatarDisplays(profile.avatarUrl, initChar);

      if (btnModalRemoveAvatar) btnModalRemoveAvatar.style.display = 'inline-flex';
      if (onAvatarUpdated) onAvatarUpdated(profile.avatarUrl);

      showToast('Foto profil berhasil disimpan!', 'success');
      closeAvatarModal();
    } catch (err) {
      console.error('Failed to crop and save avatar:', err);
      showError('Gagal menyimpan foto. Silakan coba lagi.');
    } finally {
      if (applyBtn) {
        applyBtn.disabled = false;
        applyBtn.innerHTML = `${getIconSvg('check', { size: 13 })} Terapkan Foto`;
      }
    }
  });

  async function removeAvatarPhoto() {
    try {
      await updateProfile({ avatarUrl: null });
      profile.avatarUrl = '';

      const initChar = getInitial(profile.displayName || authStore.getUser()?.email || 'U');
      updateAvatarDisplays('', initChar);

      loadedImg = null;
      if (btnModalRemoveAvatar) btnModalRemoveAvatar.style.display = 'none';
      if (modalAvatarPreview) modalAvatarPreview.textContent = initChar;
      if (onAvatarUpdated) onAvatarUpdated('');

      closeAvatarModal();
      showToast('Foto profil dihapus, kembali ke inisial huruf.', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus foto profil.', 'error');
    }
  }

  btnModalRemoveAvatar?.addEventListener('click', () => {
    removeAvatarPhoto();
  });

  return { openModal: openAvatarModal, closeModal: closeAvatarModal };
}
