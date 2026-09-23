// JobTrack Web Clipper - Popup Script

const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  const backendStatus = document.getElementById('backendStatus');
  const backendStatusText = document.getElementById('backendStatusText');
  const clipForm = document.getElementById('clipForm');
  const btnSubmit = document.getElementById('btnSubmit');
  const btnReExtract = document.getElementById('btnReExtract');
  const noticeBox = document.getElementById('noticeBox');

  const inputTitle = document.getElementById('inputTitle');
  const inputCompany = document.getElementById('inputCompany');
  const selectStage = document.getElementById('selectStage');
  const selectWorkType = document.getElementById('selectWorkType');
  const inputLocation = document.getElementById('inputLocation');
  const inputSourceUrl = document.getElementById('inputSourceUrl');
  const inputNotes = document.getElementById('inputNotes');

  // Check Backend Status
  async function checkBackend() {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
      if (res.ok) {
        backendStatus.className = 'status-badge online';
        backendStatusText.textContent = 'Backend Terhubung';
        return true;
      }
    } catch {
      // Offline
    }
    backendStatus.className = 'status-badge offline';
    backendStatusText.textContent = 'Backend Offline';
    return false;
  }

  // Extract from Current Tab
  async function extractFromTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      inputSourceUrl.value = tab.url || '';

      chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_JOB_DETAILS' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          // Fallback title from tab if available
          if (tab.title && !inputTitle.value) {
            inputTitle.value = tab.title.split('-')[0].trim();
          }
          return;
        }

        if (response.title) inputTitle.value = response.title;
        if (response.companyName) inputCompany.value = response.companyName;
        if (response.location) inputLocation.value = response.location;
        if (response.sourceUrl) inputSourceUrl.value = response.sourceUrl;
        if (response.workType) selectWorkType.value = response.workType;
        if (response.notes && !inputNotes.value) inputNotes.value = response.notes;
      });
    } catch {
      // Ignored extraction failure fallback
    }
  }

  function showNotice(msg, type = 'success') {
    noticeBox.textContent = msg;
    noticeBox.className = `notice-box ${type}`;
    noticeBox.classList.remove('hidden');
  }

  // Initial load
  await checkBackend();
  await extractFromTab();

  btnReExtract.addEventListener('click', async () => {
    await extractFromTab();
  });

  // Handle Form Submit
  clipForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = inputTitle.value.trim();
    const companyName = inputCompany.value.trim();
    const stage = selectStage.value;
    const workType = selectWorkType.value;
    const location = inputLocation.value.trim() || undefined;
    const sourceUrl = inputSourceUrl.value.trim() || undefined;
    const notes = inputNotes.value.trim() || undefined;

    if (!title || !companyName) {
      showNotice('Judul lowongan dan nama perusahaan wajib diisi.', 'error');
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = '⏳ Menyimpan...';
    noticeBox.classList.add('hidden');

    try {
      const payload = {
        title,
        companyName,
        stage,
        workType,
        location,
        sourceUrl,
        notes
      };

      const res = await fetch(`${API_BASE}/api/v1/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (res.status === 401) {
        showNotice('⚠️ Sesi login berakhir atau belum login. Buka web JobTrack dan login terlebih dahulu.', 'error');
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      showNotice(`✅ Berhasil disimpan ke JobTrack sebagai "${stage}"!`, 'success');

      setTimeout(() => {
        window.close();
      }, 1500);
    } catch (err) {
      const isOnline = await checkBackend();
      if (!isOnline) {
        showNotice('⚠️ Backend JobTrack offline. Pastikan server backend berjalan di localhost:3000.', 'error');
      } else {
        showNotice(`⚠️ Gagal menyimpan: ${err.message || 'Terjadi kesalahan'}.`, 'error');
      }
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = '💾 Simpan ke JobTrack';
    }
  });
});
