import { ApplicationItem, CONTACT_METHOD_CONFIG, FOLLOW_UP_STATUS_CONFIG } from '../../types';
import { store } from '../../services/store';
import { toast } from './shared';
import { escapeHtml } from '../../utils';

/**
 * Show Dialog to edit Follow-up schedule, method, response status, and notes
 */
export function showFollowUpEditDialog(
  item: ApplicationItem,
  onSaved: () => Promise<void>
): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'custom-dialog';
  dialog.style.maxWidth = '520px';
  dialog.style.width = '92vw';
  dialog.style.borderRadius = 'var(--radius-md)';
  dialog.style.border = '1px solid var(--border-color)';
  dialog.style.boxShadow = '0 12px 36px rgba(0,0,0,0.18)';
  dialog.style.padding = '0';
  dialog.style.backgroundColor = 'var(--bg-surface)';

  const app = item.application;
  const todayStr = new Date().toISOString().substring(0, 10);
  const currentContacted = app.lastContactedAt ? app.lastContactedAt.substring(0, 10) : '';
  const currentNextFollowUp = app.nextFollowUpAt ? app.nextFollowUpAt.substring(0, 10) : '';
  const currentMethod = app.contactMethod || 'Email';
  const currentStatus = app.responseStatus || 'WaitingResponse';
  const currentNotes = app.followUpNotes || '';

  dialog.innerHTML = `
    <div style="padding: 20px 24px; display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 20px;">📬</span>
          <div>
            <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary);">Atur Follow-up Lamaran</h3>
            <span style="font-size: 12px; color: var(--text-muted);">${escapeHtml(item.company.name)} • ${escapeHtml(item.jobPosting.title)}</span>
          </div>
        </div>
        <button type="button" class="btn btn-icon btn-sm btn-close-fu" style="border: none; background: transparent; cursor: pointer; font-size: 18px; color: var(--text-muted);">✕</button>
      </div>

      <form id="formFollowUpTracker" class="fu-modal-body">
        <div class="fu-form-row">
          <div class="form-group">
            <label class="form-label" for="fuLastContacted">Terakhir Dihubungi</label>
            <input type="date" id="fuLastContacted" class="form-input" value="${currentContacted}" />
            <button type="button" id="btnSetContactedToday" class="btn btn-xs btn-secondary" style="margin-top: 5px; font-size: 11px;">
              Set Hari Ini (${todayStr})
            </button>
          </div>

          <div class="form-group">
            <label class="form-label" for="fuNextFollowUp">Jadwal Follow-up Berikutnya</label>
            <input type="date" id="fuNextFollowUp" class="form-input" value="${currentNextFollowUp}" />
            <div style="display: flex; gap: 4px; margin-top: 5px; flex-wrap: wrap;">
              <button type="button" class="btn btn-xs btn-secondary btn-quick-next" data-days="3">+3 Hari</button>
              <button type="button" class="btn btn-xs btn-secondary btn-quick-next" data-days="7">+7 Hari</button>
              <button type="button" class="btn btn-xs btn-secondary btn-quick-next" data-days="14">+14 Hari</button>
            </div>
          </div>
        </div>

        <div class="fu-form-row">
          <div class="form-group">
            <label class="form-label" for="fuContactMethod">Metode Komunikasi</label>
            <select id="fuContactMethod" class="form-select">
              ${Object.entries(CONTACT_METHOD_CONFIG)
                .map(
                  ([key, val]) =>
                    `<option value="${key}" ${currentMethod === key ? 'selected' : ''}>${val.icon} ${val.label}</option>`
                )
                .join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="fuResponseStatus">Status Respon</label>
            <select id="fuResponseStatus" class="form-select">
              ${Object.entries(FOLLOW_UP_STATUS_CONFIG)
                .map(
                  ([key, val]) =>
                    `<option value="${key}" ${currentStatus === key ? 'selected' : ''}>${val.icon} ${val.label}</option>`
                )
                .join('')}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="fuNotes">Catatan Komunikasi</label>
          <textarea id="fuNotes" class="form-input" rows="3" placeholder="Contoh: Email dikirim ke HR (Ibu Sarah), menanyakan update tahap review portofolio...">${escapeHtml(currentNotes)}</textarea>
        </div>

        <label class="fu-sync-checkbox">
          <input type="checkbox" id="fuSyncTask" checked />
          <span>Sinkronkan ke <strong>Agenda / Tugas</strong> (otomatis buat/jadwalkan pengingat Follow-up)</span>
        </label>

        <div style="display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border-color); padding-top: 14px; margin-top: 6px;">
          <button type="button" class="btn btn-secondary btn-cancel-fu">Batal</button>
          <button type="submit" class="btn btn-primary" id="btnSaveFu">Simpan Pengaturan</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(dialog);

  const cleanup = () => {
    dialog.close();
    dialog.remove();
  };

  dialog.querySelector('.btn-close-fu')?.addEventListener('click', cleanup);
  dialog.querySelector('.btn-cancel-fu')?.addEventListener('click', cleanup);

  // Button quick set contacted today
  dialog.querySelector('#btnSetContactedToday')?.addEventListener('click', () => {
    const input = dialog.querySelector('#fuLastContacted') as HTMLInputElement;
    if (input) input.value = todayStr;
  });

  // Buttons quick next follow-up (+3, +7, +14 days)
  dialog.querySelectorAll('.btn-quick-next').forEach((b) => {
    b.addEventListener('click', () => {
      const days = parseInt(b.getAttribute('data-days') || '7', 10);
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + days);
      const nextStr = baseDate.toISOString().substring(0, 10);
      const input = dialog.querySelector('#fuNextFollowUp') as HTMLInputElement;
      if (input) input.value = nextStr;
    });
  });

  dialog.querySelector('#formFollowUpTracker')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSave = dialog.querySelector('#btnSaveFu') as HTMLButtonElement;
    btnSave.disabled = true;
    btnSave.textContent = 'Menyimpan...';

    const lastContactedAt = (dialog.querySelector('#fuLastContacted') as HTMLInputElement).value || null;
    const nextFollowUpAt = (dialog.querySelector('#fuNextFollowUp') as HTMLInputElement).value || null;
    const contactMethod = (dialog.querySelector('#fuContactMethod') as HTMLSelectElement).value;
    const responseStatus = (dialog.querySelector('#fuResponseStatus') as HTMLSelectElement).value;
    const followUpNotes = (dialog.querySelector('#fuNotes') as HTMLTextAreaElement).value.trim() || null;
    const syncTask = (dialog.querySelector('#fuSyncTask') as HTMLInputElement).checked;

    try {
      await store.updateFollowUp(item.application.id, {
        lastContactedAt,
        nextFollowUpAt,
        contactMethod,
        responseStatus,
        followUpNotes,
        syncTask
      });
      toast('Pengaturan follow-up berhasil diperbarui', 'success');
      cleanup();
      await onSaved();
    } catch (err) {
      console.error(err);
      toast('Gagal menyimpan pengaturan follow-up', 'error');
      btnSave.disabled = false;
      btnSave.textContent = 'Simpan Pengaturan';
    }
  });

  dialog.showModal();
}

/**
 * Show Dialog with pre-composed follow-up templates
 */
export function showFollowUpTemplatesDialog(item: ApplicationItem): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'custom-dialog';
  dialog.style.maxWidth = '640px';
  dialog.style.width = '92vw';
  dialog.style.borderRadius = 'var(--radius-md)';
  dialog.style.border = '1px solid var(--border-color)';
  dialog.style.boxShadow = '0 12px 36px rgba(0,0,0,0.18)';
  dialog.style.padding = '0';
  dialog.style.backgroundColor = 'var(--bg-surface)';

  const company = item.company.name;
  const position = item.jobPosting.title;

  const templates = [
    {
      id: 'formal-email-id',
      title: '✉️ Email Formal Follow-up Status Lamaran',
      desc: 'Cocok dikirim 5-7 hari kerja setelah mengirim lamaran',
      text: `Subjek: Follow-up Status Lamaran - ${position} - [Nama Anda]

Yth. Tim Rekrutmen ${company},

Semoga pesan ini menemui Bapak/Ibu dalam keadaan sehat.

Saya menulis pesan ini untuk menanyakan kelanjutan status berkas lamaran saya untuk posisi ${position} di ${company} yang telah saya kirimkan sebelumnya.

Saya sangat antusias dengan visi serta peluang kontribusi bersama tim ${company}. Apabila ada dokumen, portofolio, atau informasi pendukung lainnya yang dibutuhkan untuk proses review, saya dengan senang hati akan segera menyediakannya.

Terima kasih banyak atas waktu dan kesempatan yang diberikan.

Salam hormat,
[Nama Lengkap Anda]
[Nomor Kontak / WhatsApp]
[Tautan Profil LinkedIn]`
    },
    {
      id: 'linkedin-dm-id',
      title: '💼 LinkedIn DM / WhatsApp Singkat & Ramah',
      desc: 'Cocok untuk direct message ke recruiter atau HR di LinkedIn / WA',
      text: `Halo [Nama HR/Recruiter/Bapak/Ibu], salam kenal!

Semoga kabarnya sehat selalu. Saya sebelumnya telah mengirimkan lamaran untuk posisi ${position} di ${company}. Saya sangat mengagumi produk dan perkembangan tim di ${company}.

Jika berkenan, apakah saya boleh menanyakan sekilas kabar terbaru mengenai proses seleksi untuk posisi tersebut?

Terima kasih banyak atas waktu dan perhatiannya! 🙏

Salam,
[Nama Anda]`
    },
    {
      id: 'post-interview-id',
      title: '🎯 Follow-up Pasca Wawancara (Thank You Note)',
      desc: 'Kirim dalam waktu 24 jam atau 4-5 hari setelah sesi wawancara selesai',
      text: `Subjek: Terima Kasih & Follow-up Wawancara ${position} - [Nama Anda]

Yth. [Nama Pewawancara / Tim Rekrutmen ${company}],

Terima kasih banyak atas waktu dan diskusi yang menyenangkan pada sesi wawancara untuk posisi ${position} tempo hari. 

Percakapan kita semakin memperjelas ekspektasi peran tersebut dan memantapkan keyakinan saya bahwa pengalaman serta keahlian saya dapat memberikan dampak positif bagi ${company}.

Apabila ada informasi lanjutan atau tugas studi kasus berikutnya yang perlu saya persiapkan, mohon kabari saya.

Semoga hari Bapak/Ibu menyenangkan.

Salam hangat,
[Nama Anda]`
    },
    {
      id: 'english-followup',
      title: '🌐 Professional Follow-up (English)',
      desc: 'For international companies, remote roles, or English job postings',
      text: `Subject: Following up on Application for ${position} - [Your Name]

Dear Hiring Team at ${company},

I hope you are having a wonderful week.

I am writing to politely follow up on the application I submitted for the ${position} position at ${company}.

I remain very eager about the prospect of joining your team and contributing to your ongoing projects. Please let me know if there are any additional materials, references, or details I can provide to support my candidacy.

Thank you very much for your time, consideration, and guidance.

Best regards,
[Your Name]
[Your Phone Number]
[Your LinkedIn Profile URL]`
    }
  ];

  dialog.innerHTML = `
    <div style="padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; max-height: 85vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 20px;">📋</span>
          <div>
            <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary);">Template Pesan Follow-up</h3>
            <span style="font-size: 12px; color: var(--text-muted);">Salin pesan siap pakai yang sudah disesuaikan dengan posisi <strong>${escapeHtml(position)}</strong> di <strong>${escapeHtml(company)}</strong></span>
          </div>
        </div>
        <button type="button" class="btn btn-icon btn-sm btn-close-tmpl" style="border: none; background: transparent; cursor: pointer; font-size: 18px; color: var(--text-muted);">✕</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${templates
          .map(
            (t) => `
          <div class="fu-template-card">
            <div class="fu-template-header">
              <div>
                <div style="font-size: 12.5px; font-weight: 700; color: var(--text-primary);">${t.title}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${t.desc}</div>
              </div>
              <button type="button" class="btn btn-sm btn-secondary btn-copy-tmpl" data-id="${t.id}" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; padding: 4px 10px;">
                📋 Salin Teks
              </button>
            </div>
            <pre class="fu-template-content" id="content-${t.id}">${escapeHtml(t.text)}</pre>
          </div>
        `
          )
          .join('')}
      </div>

      <div style="display: flex; justify-content: flex-end; border-top: 1px solid var(--border-color); padding-top: 12px;">
        <button type="button" class="btn btn-primary btn-close-tmpl">Tutup</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  const cleanup = () => {
    dialog.close();
    dialog.remove();
  };

  dialog.querySelectorAll('.btn-close-tmpl').forEach((b) => b.addEventListener('click', cleanup));

  dialog.querySelectorAll('.btn-copy-tmpl').forEach((b) => {
    b.addEventListener('click', async () => {
      const templateId = b.getAttribute('data-id');
      const targetPre = dialog.querySelector(`#content-${templateId}`);
      if (targetPre) {
        try {
          await navigator.clipboard.writeText(targetPre.textContent || '');
          const originalText = b.innerHTML;
          b.innerHTML = '✓ Disalin!';
          toast('Template pesan berhasil disalin ke clipboard!', 'success');
          setTimeout(() => {
            b.innerHTML = originalText;
          }, 2000);
        } catch {
          toast('Gagal menyalin template pesan', 'error');
        }
      }
    });
  });

  dialog.showModal();
}
