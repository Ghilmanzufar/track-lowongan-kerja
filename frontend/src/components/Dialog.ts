export function showConfirmDialog(message: string, title: string = 'Konfirmasi'): Promise<boolean> {
  return new Promise((resolve) => {
    // Buat elemen dialog
    const dialog = document.createElement('dialog');
    dialog.className = 'custom-dialog confirm-dialog';
    
    dialog.innerHTML = `
      <div class="dialog-content">
        <h3 class="dialog-title">${title}</h3>
        <p class="dialog-message">${message}</p>
        <div class="dialog-actions">
          <button type="button" class="btn btn-secondary btn-cancel">Batal</button>
          <button type="button" class="btn btn-danger btn-confirm">Ya, Lanjutkan</button>
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

    // Menangani escape key atau klik di backdrop jika memungkinkan, tapi dialog modal bawaan 
    // akan menutup pada escape. Kita harus menanganinya.
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      cleanup();
      resolve(false);
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
