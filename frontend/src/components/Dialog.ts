export interface ConfirmDialogOptions {
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'success';
}

export function showConfirmDialog(
  message: string,
  title: string = 'Konfirmasi',
  options?: ConfirmDialogOptions
): Promise<boolean> {
  return new Promise((resolve) => {
    // Buat elemen dialog
    const dialog = document.createElement('dialog');
    dialog.className = 'custom-dialog confirm-dialog';
    
    const confirmText = options?.confirmText ?? 'Ya, Lanjutkan';
    const cancelText = options?.cancelText ?? 'Batal';
    const confirmVariant = options?.confirmVariant ?? 'danger';
    const variantClass = confirmVariant === 'primary' || confirmVariant === 'success'
      ? 'btn-primary'
      : 'btn-danger';

    dialog.innerHTML = `
      <div class="dialog-content">
        <h3 class="dialog-title">${title}</h3>
        <p class="dialog-message">${message}</p>
        <div class="dialog-actions">
          <button type="button" class="btn btn-secondary btn-cancel">${cancelText}</button>
          <button type="button" class="btn ${variantClass} btn-confirm">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    const btnCancel = dialog.querySelector('.btn-cancel') as HTMLButtonElement;
    const btnConfirm = dialog.querySelector('.btn-confirm') as HTMLButtonElement;

    const cleanup = () => {
      dialog.close();
      dialog.remove();
    };

    btnCancel.addEventListener('click', () => {
      cleanup();
      resolve(false);
    });

    btnConfirm.addEventListener('click', () => {
      cleanup();
      resolve(true);
    });

    // Menangani escape key atau klik di backdrop
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      cleanup();
      resolve(false);
    });

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        cleanup();
        resolve(false);
      }
    });

    dialog.showModal();
  });
}

export function showAlertDialog(message: string, title: string = 'Peringatan'): Promise<void> {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'custom-dialog alert-dialog';
    
    dialog.innerHTML = `
      <div class="dialog-content">
        <h3 class="dialog-title">${title}</h3>
        <p class="dialog-message">${message}</p>
        <div class="dialog-actions">
          <button type="button" class="btn btn-primary btn-ok">OK</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    const btnOk = dialog.querySelector('.btn-ok') as HTMLButtonElement;

    const cleanup = () => {
      dialog.close();
      dialog.remove();
    };

    btnOk.addEventListener('click', () => {
      cleanup();
      resolve();
    });

    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      cleanup();
      resolve();
    });

    dialog.showModal();
  });
}
