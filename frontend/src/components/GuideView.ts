// GuideView Component (JobTrack Buku Panduan Penggunaan)
// Interactive, rich, utilitarian user guide with mobile-first responsive TOC, stage visualizer, and live feature launchers

import { getIconSvg } from '../utils/icons';
import { SalaryCalculatorModal } from './SalaryCalculatorModal';
import { EmailTemplatesModal } from './EmailTemplatesModal';
import { FeedbackModal } from './FeedbackModal';
import { store } from '../services/store';

interface StageInfo {
  name: string;
  badge: string;
  badgeColor: string;
  desc: string;
  tip: string;
  action: string;
}

const STAGE_DETAILS: Record<string, StageInfo> = {
  Saved: {
    name: 'Disimpan (Bookmarked)',
    badge: 'Tahap Awal',
    badgeColor: '#64748b',
    desc: 'Wadah awal untuk menampung lowongan yang menarik saat sedang riset di portal loker. Anda belum mengirimkan berkas apapun pada tahap ini.',
    tip: 'Riset latar belakang perusahaan, budaya kerja, dan sesuaikan resume Anda sebelum memindahkan ke tahap berikutnya.',
    action: 'Gunakan tombol Quick Add atau Ekstensi Browser Web Clipper untuk menyimpan lowongan dalam 5 detik.'
  },
  ToApply: {
    name: 'Siap Dilamar (Ready to Apply)',
    badge: 'Persiapan',
    badgeColor: '#0ea5e9',
    desc: 'Anda telah menyesuaikan CV, menyusun cover letter, dan mempersiapkan portofolio yang cocok dengan kriteria lowongan ini.',
    tip: 'Jangan tunda mengirim lamaran lebih dari 48 jam agar posisi belum ditutup oleh rekruter.',
    action: 'Buka tab Dokumen pada detail lamaran untuk menautkan versi CV yang telah dipersiapkan.'
  },
  Applied: {
    name: 'Terkirim (Applied)',
    badge: 'Proses Aktif',
    badgeColor: '#6366f1',
    desc: 'Lamaran resmi dikirimkan via portal karir, email HRD, form website, atau referal rekan kerja. Jam dan tanggal pengiriman dicatat otomatis.',
    tip: 'Pasang tugas "Follow-up" di tab Tugas dengan tenggat 7–14 hari setelah tanggal pengiriman lamaran.',
    action: 'Sistem otomatis mencatat riwayat perubahan status dengan timestamp akurat.'
  },
  Screening: {
    name: 'Skrining (Screening / Assessment)',
    badge: 'Review HR',
    badgeColor: '#8b5cf6',
    desc: 'CV Anda lolos penyaringan awal ATS dan sedang direview langsung oleh Talent Acquisition, atau Anda menerima tes asesmen online / psikotes.',
    tip: 'Catat nama rekruter yang menghubungi Anda di tab Kontak agar mudah dihubungi kembali.',
    action: 'Gunakan template email "Konfirmasi Pengerjaan Tes" jika diberikan batas waktu asesmen.'
  },
  Interview: {
    name: 'Wawancara (Interview)',
    badge: 'Tahap Krusial',
    badgeColor: '#f59e0b',
    desc: 'Proses wawancara tatap muka atau daring (HR Interview, User Interview, Technical Presentation, hingga Board Interview).',
    tip: 'Hubungkan jadwal ke Google Calendar dan kirimkan "Thank-You Note" maksimal 24 jam setelah sesi selesai.',
    action: 'Buat catatan ronde wawancara dan daftar pertanyaan yang diajukan di tab Wawancara.'
  },
  Offer: {
    name: 'Penawaran (Job Offer)',
    badge: 'Negosiasi',
    badgeColor: '#10b981',
    desc: 'Perusahaan resmi menerbitkan Offering Letter yang merinci gaji pokok, tunjangan, skema bonus, dan fasilitas kerja.',
    tip: 'Gunakan Kalkulator Gaji Bersih PPh 21 TER 2024 dan fitur Perbandingan Penawaran sebelum tanda tangan kontrak.',
    action: 'Hitung Take Home Pay bersih dan bandingkan beberapa offer sekaligus untuk negosiasi optimal.'
  },
  Accepted: {
    name: 'Diterima (Accepted)',
    badge: 'Berhasil',
    badgeColor: '#059669',
    desc: 'Selamat! Anda telah menyetujui offering letter dan resmi menandatangani kontrak kerja dengan perusahaan pilihan.',
    tip: 'Jangan lupa kirimkan email konfirmasi penerimaan dan persiapkan dokumen onboarding yang diminta.',
    action: 'Status ini menyelesaikan alur aktif dan dihitung sebagai konversi sukses di Analitik.'
  },
  Rejected: {
    name: 'Ditolak (Rejected)',
    badge: 'Evaluasi',
    badgeColor: '#ef4444',
    desc: 'Belum berhasil pada kesempatan kali ini. Penolakan adalah bagian alami dari proses pencarian kerja dan merupakan bahan evaluasi berharga.',
    tip: 'Analisis di tahap mana Anda paling sering gugur (apakah di skrining CV atau di wawancara teknis) lewat menu Analitik.',
    action: 'Simpan catatan evaluasi agar menjadi pembelajaran berharga untuk interview berikutnya.'
  },
  Withdrawn: {
    name: 'Mengundurkan Diri (Withdrawn)',
    badge: 'Mundur',
    badgeColor: '#94a3b8',
    desc: 'Anda memilih untuk tidak melanjutkan proses seleksi karena telah menerima tawaran lain yang lebih cocok atau alasan pribadi.',
    tip: 'Selalu sampaikan pengunduran diri secara sopan kepada HRD menggunakan template email yang tersedia.',
    action: 'Jaga relasi baik dengan rekruter untuk peluang kerja sama di masa depan.'
  }
};

const STAGE_ICON_MAP: Record<string, string> = {
  Saved: 'pin',
  ToApply: 'fileText',
  Applied: 'send',
  Screening: 'search',
  Interview: 'users',
  Offer: 'dollar',
  Accepted: 'checkCircle',
  Rejected: 'xCircle',
  Withdrawn: 'ban'
};

const CHAPTERS = [
  { id: 'sec-quickstart', label: '1. Quick Start', icon: 'rocket' },
  { id: 'sec-pipeline', label: '2. Pipeline 9 Tahap', icon: 'target' },
  { id: 'sec-add', label: '3. Tambah & Anti-Duplikat', icon: 'plus' },
  { id: 'sec-clipper', label: '4. Ekstensi Web Clipper', icon: 'globe' },
  { id: 'sec-vault', label: '5. Vault & Versioning CV', icon: 'folder' },
  { id: 'sec-agenda', label: '6. Agenda & Google Calendar', icon: 'calendar' },
  { id: 'sec-salary', label: '7. Kalkulator Gaji PPh 21', icon: 'calculator' },
  { id: 'sec-templates', label: '8. Template Email HRD', icon: 'mail' },
  { id: 'sec-shortcuts', label: '9. Pintasan Keyboard', icon: 'zap' },
  { id: 'sec-faq', label: '10. Tanya Jawab (FAQ)', icon: 'helpCircle' }
];

const FAQ_ITEMS = [
  {
    q: 'Bagaimana cara menambahkan lowongan baru dalam waktu singkat?',
    a: 'Ada 2 cara cepat: (1) Klik tombol "+ Tambah Lamaran" di pojok kanan atas atau gunakan pintasan keyboard saat Command Palette terbuka (Ctrl + K). (2) Gunakan Ekstensi Browser Web Clipper JobTrack saat membuka loker di LinkedIn, Glints, atau Jobstreet untuk mengisi form otomatis.'
  },
  {
    q: 'Apakah JobTrack mendeteksi jika saya melamar posisi yang sama dua kali?',
    a: 'Ya! JobTrack dilengkapi mesin pendeteksi duplikasi cerdas. Jika URL lowongan atau kombinasi Nama Perusahaan dan Posisi sudah ada di database Anda, sistem akan memunculkan dialog peringatan untuk mencegah Anda mengirimkan lamaran ganda.'
  },
  {
    q: 'Bagaimana cara menghitung gaji bersih realistis dari offering letter?',
    a: 'Buka Kalkulator Gaji Bersih (ikon kalkulator di menu atas atau di Buku Panduan ini). Masukkan gaji pokok kotor dan tunjangan tetap, lalu pilih status PTKP Anda (misalnya TK/0 untuk lajang). Sistem otomatis menghitung potongan PPh 21 bulanan berdasarkan TER 2024 (PP 58/2023 & PMK 168/2023).'
  },
  {
    q: 'Apakah jadwal wawancara bisa masuk ke Google Calendar?',
    a: 'Tentu saja! Pada tab Wawancara di detail lamaran, klik tombol "Add to Google Calendar". Sistem akan membuka Google Calendar dengan data nama perusahaan, posisi, tanggal, waktu, dan format meeting (Google Meet/Zoom) yang sudah terisi otomatis.'
  },
  {
    q: 'Bagaimana jika saya tidak sengaja menghapus lamaran penting?',
    a: 'Tenang! JobTrack menerapkan sistem perlindungan Soft Delete. Lamaran yang dihapus tidak langsung hilang permanen, melainkan dipindahkan ke menu "Tempat Sampah (Trash)". Anda dapat memulihkannya kapan saja ke tahapan semula dengan satu kali klik "Pulihkan".'
  },
  {
    q: 'Apakah saya bisa menginstal JobTrack di HP Android atau iPhone?',
    a: 'Ya! JobTrack dibangun dengan dukungan Progressive Web App (PWA). Cukup buka JobTrack di browser HP Anda (Chrome di Android atau Safari di iOS), lalu pilih menu "Tambahkan ke Layar Utama" (Add to Home Screen). Aplikasi akan terinstal mandiri seperti aplikasi native tanpa makan memori besar.'
  },
  {
    q: 'Apakah data gaji dan kontak rekruter saya aman dari pengguna lain?',
    a: 'Sangat aman. Setiap data di JobTrack diisolasi secara ketat per ID pengguna (User-scoped isolation) di level API dan basis data PostgreSQL. Token autentikasi disimpan aman dengan verifikasi sesi JWT.'
  },
  {
    q: 'Bagaimana cara menyampaikan kendala atau melaporkan bug di aplikasi?',
    a: 'Anda dapat mengklik menu "Bantuan & Masukan" di sidebar kiri, ikon pesan di topbar, tombol di bawah panduan ini, atau tekan Ctrl+K lalu pilih "Bantuan & Kirim Masukan". Tiket Anda akan langsung ditinjau oleh tim administrator di Panel Helpdesk.'
  }
];

export function renderGuideView(container: HTMLElement): void {
  let activeStageKey = 'Interview';

  container.innerHTML = `
    <div class="guide-page-container">
      
      <!-- Hero Banner -->
      <section class="guide-hero">
        <div class="guide-hero-content">
          <div class="guide-badge">
            <span class="guide-badge-dot"></span>
            Buku Panduan Resmi JobTrackId v2.0
          </div>
          <h1 class="guide-hero-title">Panduan Penggunaan &amp; Strategi Pelacakan Karir</h1>
          <p class="guide-hero-desc">
            Panduan lengkap langkah demi langkah untuk menguasai alur lamaran kerja terstruktur: dari pencatatan instan, visualisasi Kanban, manajemen versi CV, simulasi PPh 21 TER 2024, hingga penutupan offering kerja terbaik.
          </p>

          <!-- Search Input -->
          <div class="guide-search-wrapper">
            <span class="guide-search-icon">${getIconSvg('search', { size: 16 })}</span>
            <input type="text" id="guideSearchInput" class="guide-search-input" placeholder="Cari topik panduan, alur fitur, atau FAQ..." autocomplete="off" />
          </div>

          <!-- Quick Jump Pills (Desktop & Tablet) -->
          <div class="guide-quick-pills">
            <button type="button" class="guide-quick-pill" data-jump="sec-quickstart">
              <span>${getIconSvg('zap', { size: 13 })}</span> Alur Cepat
            </button>
            <button type="button" class="guide-quick-pill" data-jump="sec-pipeline">
              <span>${getIconSvg('target', { size: 13 })}</span> Pipeline 9 Tahap
            </button>
            <button type="button" class="guide-quick-pill" data-jump="sec-clipper">
              <span>${getIconSvg('globe', { size: 13 })}</span> Web Clipper
            </button>
            <button type="button" class="guide-quick-pill" data-jump="sec-salary">
              <span>${getIconSvg('calculator', { size: 13 })}</span> Kalkulator PPh 21
            </button>
            <button type="button" class="guide-quick-pill" data-jump="sec-templates">
              <span>${getIconSvg('mail', { size: 13 })}</span> Template Email
            </button>
            <button type="button" class="guide-quick-pill" data-jump="sec-faq">
              <span>${getIconSvg('helpCircle', { size: 13 })}</span> FAQ &amp; Bantuan
            </button>
          </div>
        </div>
      </section>

      <!-- Mobile Sticky Chapter Selector Bar (Visible <= 992px) -->
      <div class="guide-mobile-bar" id="guideMobileBar">
        <button type="button" class="guide-mobile-bar-btn" id="btnToggleMobileToc">
          <span class="guide-mobile-bar-label">
            <span>${getIconSvg('book', { size: 15 })}</span>
            <span>Bab Panduan: <strong id="mobileActiveChapterName">1. Quick Start</strong></span>
          </span>
          <span class="guide-mobile-bar-chevron">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </span>
        </button>
        <div class="guide-mobile-drawer-content">
          <nav class="guide-toc-nav" id="guideMobileTocNav">
            ${CHAPTERS.map(ch => `
              <a href="#${ch.id}" class="guide-toc-item ${ch.id === 'sec-quickstart' ? 'active' : ''}" data-target="${ch.id}">
                <span class="guide-toc-icon">${getIconSvg(ch.icon as any, { size: 13 })}</span>
                <span>${ch.label}</span>
              </a>
            `).join('')}
          </nav>
          <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 6px;">
            <button type="button" class="btn btn-primary btn-sm" id="btnGuideMobileSalary">
              ${getIconSvg('calculator', { size: 13 })}
              <span>Kalkulator Gaji PPh 21</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm" id="btnGuideMobileTemplates">
              ${getIconSvg('mail', { size: 13 })}
              <span>Template Email HR</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Horizontal Swipeable Chapter Strip (Visible <= 992px) -->
      <div class="guide-mobile-scroll-strip" id="guideMobileStrip">
        ${CHAPTERS.map((ch, idx) => `
          <button type="button" class="guide-strip-pill ${idx === 0 ? 'active' : ''}" data-jump="${ch.id}">
            <span>${getIconSvg(ch.icon as any, { size: 13 })}</span>
            <span>${ch.label}</span>
          </button>
        `).join('')}
      </div>

      <!-- Main Layout: Desktop Sidebar TOC + Chapters -->
      <div class="guide-layout">
        
        <!-- Desktop Sticky Sidebar Table of Contents (Hidden on <= 992px) -->
        <aside class="guide-sidebar">
          <div class="guide-toc-header">Daftar Bab Panduan</div>
          <nav class="guide-toc-nav" id="guideDesktopTocNav">
            ${CHAPTERS.map(ch => `
              <a href="#${ch.id}" class="guide-toc-item ${ch.id === 'sec-quickstart' ? 'active' : ''}" data-target="${ch.id}">
                <span class="guide-toc-icon">${getIconSvg(ch.icon as any, { size: 13 })}</span>
                <span>${ch.label}</span>
              </a>
            `).join('')}
          </nav>

          <!-- Quick Launch Floating Action Box -->
          <div class="guide-sidebar-card">
            <div class="guide-sidebar-card-title">
              <span>${getIconSvg('zap', { size: 14 })}</span> Akses Fitur Langsung
            </div>
            <p class="guide-sidebar-card-desc">Coba langsung kalkulator pajak atau buat draf email follow-up sekarang juga:</p>
            <button type="button" class="btn btn-primary btn-sm" id="btnGuideOpenSalary">
              ${getIconSvg('calculator', { size: 13 })}
              <span>Kalkulator Gaji PPh 21</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm" id="btnGuideOpenTemplates">
              ${getIconSvg('mail', { size: 13 })}
              <span>Template Email HR</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm" id="btnGuideOpenQuickAdd">
              ${getIconSvg('plus', { size: 13 })}
              <span>Tambah Lamaran</span>
            </button>
          </div>
        </aside>

        <!-- Main Chapters Content -->
        <main class="guide-content" id="guideMainContent">
          
          <!-- BAB 1: Quick Start -->
          <section class="guide-section" id="sec-quickstart">
            <div class="guide-section-header">
              <div class="guide-section-title-wrap">
                <span class="guide-section-number">01</span>
                <h2 class="guide-section-title">Alur Kerja Cepat (Quick Start 3 Langkah)</h2>
              </div>
            </div>
            <p class="guide-section-lead">
              Pencarian kerja yang efektif dimulai dari kedisiplinan mencatat dan menindaklanjuti. Dengan 3 langkah mudah ini, tidak ada lagi panggilan interview yang terlewat atau lupa posisi apa yang pernah dilamar:
            </p>

            <div class="guide-step-grid">
              <div class="guide-step-card">
                <span class="guide-step-badge">1</span>
                <h3 class="guide-step-title">Catat Lowongan Cepat</h3>
                <p class="guide-step-desc">Gunakan tombol <strong>+ Tambah Lamaran</strong> atau klip langsung dari halaman LinkedIn/Jobstreet via Ekstensi Browser. Cukup isi posisi, perusahaan, dan URL loker.</p>
              </div>

              <div class="guide-step-card">
                <span class="guide-step-badge">2</span>
                <h3 class="guide-step-title">Pindahkan Status di Board</h3>
                <p class="guide-step-desc">Pantau perkembangan melalui papan Kanban visual 9 tahap. Cukup seret dan lepas kartu saat ada perkembangan kabar dari rekruter.</p>
              </div>

              <div class="guide-step-card">
                <span class="guide-step-badge">3</span>
                <h3 class="guide-step-title">Pasang Tugas &amp; Pengingat</h3>
                <p class="guide-step-desc">Tambahkan jadwal wawancara ke Google Calendar atau buat tugas follow-up 7 hari pasca pengiriman agar lamaran tidak mengendap tanpa kejelasan.</p>
              </div>
            </div>

            <div class="guide-callout guide-callout-tip">
              <span class="guide-callout-icon">${getIconSvg('checkCircle', { size: 18 })}</span>
              <div>
                <strong>Tips Sukses:</strong> Rata-rata pelamar yang mencatat riwayat versi CV dan melakukan follow-up tepat waktu memiliki tingkat keberhasilan panggilan wawancara 40% lebih tinggi.
              </div>
            </div>
          </section>

          <!-- BAB 2: Pipeline 9 Tahap -->
          <section class="guide-section" id="sec-pipeline">
            <div class="guide-section-header">
              <div class="guide-section-title-wrap">
                <span class="guide-section-number">02</span>
                <h2 class="guide-section-title">Visualisasi Pipeline 9 Tahap (Interactive)</h2>
              </div>
            </div>
            <p class="guide-section-lead">
              Proses rekrutmen di JobTrack dibagi ke dalam 9 tahapan terstandarisasi. Klik salah satu tahapan di bawah ini untuk mempelajari makna, pemicu perubahan status, dan rekomendasi tindakan:
            </p>

            <!-- Interactive Stage Visualizer -->
            <div class="guide-stage-visualizer">
              <div class="guide-stage-tabs" id="guideStageTabs">
                ${Object.keys(STAGE_DETAILS).map(key => `
                  <button type="button" class="guide-stage-chip ${key === activeStageKey ? 'active' : ''}" data-stage="${key}">
                    <span>${getIconSvg((STAGE_ICON_MAP[key] || 'pin') as any, { size: 12 })}</span>
                    <span>${STAGE_DETAILS[key].name.split(' ')[0]}</span>
                  </button>
                `).join('')}
              </div>

              <div class="guide-stage-detail-box" id="guideStageDetailBox">
                <div class="guide-stage-detail-header">
                  <span class="guide-stage-detail-name" id="stageDetailName">${STAGE_DETAILS[activeStageKey].name}</span>
                  <span class="guide-stage-detail-badge" id="stageDetailBadge" style="background: ${STAGE_DETAILS[activeStageKey].badgeColor}22; color: ${STAGE_DETAILS[activeStageKey].badgeColor}; border: 1px solid ${STAGE_DETAILS[activeStageKey].badgeColor}44;">
                    ${STAGE_DETAILS[activeStageKey].badge}
                  </span>
                </div>
                <p class="guide-stage-detail-desc" id="stageDetailDesc">${STAGE_DETAILS[activeStageKey].desc}</p>
                <div class="guide-stage-detail-tip" id="stageDetailTip">${STAGE_DETAILS[activeStageKey].tip}</div>
              </div>
            </div>

            <div class="guide-feature-action-card">
              <div class="guide-feature-action-info">
                <span class="guide-feature-action-title">Coba Papan Kanban Sekarang</span>
                <span class="guide-feature-action-desc">Lihat seluruh lamaran Anda yang tersusun rapi berdasarkan kolom tahapannya.</span>
              </div>
              <button type="button" class="btn btn-primary btn-sm" id="btnGuideGoBoard">
                ${getIconSvg('target', { size: 14 })}
                <span>Buka Kanban Lamaran</span>
              </button>
            </div>
          </section>

          <!-- BAB 3: Tambah & Anti Duplikat -->
          <section class="guide-section" id="sec-add">
            <div class="guide-section-header">
              <div class="guide-section-title-wrap">
                <span class="guide-section-number">03</span>
                <h2 class="guide-section-title">Tambah Lamaran Cepat &amp; Deteksi Duplikat</h2>
              </div>
            </div>
            <p class="guide-section-lead">
              JobTrack memastikan formulir pencatatan bekerja seringkas mungkin tanpa membebani Anda dengan field yang tidak perlu:
            </p>

            <!-- Responsive Table Wrapper -->
            <div class="guide-table-responsive">
              <table class="guide-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Kebutuhan</th>
                    <th>Penjelasan &amp; Contoh</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Posisi / Role</strong></td>
                    <td><span style="color: #ef4444; font-weight: 600;">Wajib</span></td>
                    <td>Nama jabatan yang dilamar (misal: <em>Frontend Developer</em>, <em>Product Analyst</em>).</td>
                  </tr>
                  <tr>
                    <td><strong>Perusahaan</strong></td>
                    <td><span style="color: #ef4444; font-weight: 600;">Wajib</span></td>
                    <td>Nama entitas perusahaan (misal: <em>PT GoTo Gojek Tokopedia</em>).</td>
                  </tr>
                  <tr>
                    <td><strong>Tahap Awal</strong></td>
                    <td><span style="color: #ef4444; font-weight: 600;">Wajib</span></td>
                    <td>Status saat dicatat (default: <em>Disimpan</em> atau <em>Terkirim</em>).</td>
                  </tr>
                  <tr>
                    <td><strong>URL Lowongan</strong></td>
                    <td>Opsional</td>
                    <td>Tautan langsung posting loker untuk memudahkan pengecekan ulang requirement.</td>
                  </tr>
                  <tr>
                    <td><strong>Gaji &amp; Lokasi</strong></td>
                    <td>Opsional</td>
                    <td>Rentang kompensasi dan tipe kerja (Onsite / Hybrid / Remote).</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="guide-callout guide-callout-warning">
              <span class="guide-callout-icon">${getIconSvg('alertCircle', { size: 18 })}</span>
              <div>
                <strong>Deteksi Duplikasi Cerdas:</strong> Jika URL atau kombinasi <em>Perusahaan + Posisi</em> telah ada di database Anda, sistem akan memberikan notifikasi peringatan. Anda dapat memilih meninjau data lama atau tetap menyimpannya jika membuka proses baru.
              </div>
            </div>
          </section>

          <!-- BAB 4: Ekstensi Web Clipper -->
          <section class="guide-section" id="sec-clipper">
            <div class="guide-section-header">
              <div class="guide-section-title-wrap">
                <span class="guide-section-number">04</span>
                <h2 class="guide-section-title">Ekstensi Browser Web Clipper</h2>
              </div>
            </div>
            <p class="guide-section-lead">
              Klip lowongan pekerjaan langsung dari website lowongan tanpa perlu copy-paste manual:
            </p>

            <div class="guide-step-grid">
              <div class="guide-step-card">
                <span class="guide-step-badge">1</span>
                <h3 class="guide-step-title">Buka Menu Ekstensi</h3>
                <p class="guide-step-desc">Buka <code>chrome://extensions/</code> di Google Chrome atau Microsoft Edge, lalu aktifkan sakelar <strong>Developer mode</strong> di pojok kanan atas.</p>
              </div>

              <div class="guide-step-card">
                <span class="guide-step-badge">2</span>
                <h3 class="guide-step-title">Load Unpacked</h3>
                <p class="guide-step-desc">Klik tombol <strong>Load unpacked</strong> dan pilih folder <code>extension/</code> dari direktori proyek JobTrack.</p>
              </div>

              <div class="guide-step-card">
                <span class="guide-step-badge">3</span>
                <h3 class="guide-step-title">Klip 1-Klik</h3>
                <p class="guide-step-desc">Buka halaman loker di <strong>LinkedIn, Glints, Jobstreet, atau Kalibrr</strong>, klik ikon JobTrack di toolbar, lalu klik <strong>Simpan ke JobTrack</strong>.</p>
              </div>
            </div>
          </section>

          <!-- BAB 5: Vault Dokumen -->
          <section class="guide-section" id="sec-vault">
            <div class="guide-section-header">
              <div class="guide-section-title-wrap">
                <span class="guide-section-number">05</span>
                <h2 class="guide-section-title">Brankas Dokumen (Vault) &amp; Versioning CV</h2>
              </div>
            </div>
            <p class="guide-section-lead">
              Salah satu kesalahan fatal saat wawancara adalah lupa versi CV atau portfolio mana yang dikirim ke rekruter. Vault Dokumen menyelesaikan hal ini:
            </p>

            <div class="guide-step-grid">
              <div class="guide-step-card">
                <h3 class="guide-step-title" style="display: flex; align-items: center; gap: 6px;">
                  ${getIconSvg('fileText', { size: 15 })} Master CV
                </h3>
                <p class="guide-step-desc">Kelola CV ATS-Friendly, CV Kreatif, versi Bahasa Indonesia, dan versi Bahasa Inggris di satu tempat.</p>
              </div>
              <div class="guide-step-card">
                <h3 class="guide-step-title" style="display: flex; align-items: center; gap: 6px;">
                  ${getIconSvg('tag', { size: 15 })} Versioning Otomatis
                </h3>
                <p class="guide-step-desc">Setiap pembaruan berkas diberi nomor versi (v1, v2, v3) lengkap dengan catatan perubahan.</p>
              </div>
              <div class="guide-step-card">
                <h3 class="guide-step-title" style="display: flex; align-items: center; gap: 6px;">
                  ${getIconSvg('link', { size: 15 })} Jejak Dokumen Terkirim
                </h3>
                <p class="guide-step-desc">Pada setiap lamaran, tautkan versi dokumen yang dipakai sehingga Anda dapat meninjaunya kembali sebelum interview.</p>
              </div>
            </div>
          </section>

          <!-- BAB 6: Agenda & Google Calendar -->
          <section class="guide-section" id="sec-agenda">
            <div class="guide-section-header">
              <div class="guide-section-title-wrap">
                <span class="guide-section-number">06</span>
                <h2 class="guide-section-title">Agenda, Tugas &amp; Sinkronisasi Google Calendar</h2>
              </div>
            </div>
            <p class="guide-section-lead">
              Jangan biarkan jadwal psikotes, pengerjaan tugas studi kasus, atau sesi interview bentrok dengan kesibukan Anda:
            </p>

            <div class="guide-callout guide-callout-info">
              <span class="guide-callout-icon">${getIconSvg('calendar', { size: 18 })}</span>
              <div>
                <strong>Integrasi Google Calendar:</strong> Setiap jadwal wawancara yang dicatat di tab Wawancara dapat langsung disinkronkan ke kalender Google Anda dengan satu klik. Pengingat notifikasi akan otomatis aktif di smartphone Anda.
              </div>
            </div>

            <div class="guide-callout guide-callout-tip">
              <span class="guide-callout-icon">${getIconSvg('clock', { size: 18 })}</span>
              <div>
                <strong>Pengingat Email Otomatis:</strong> JobTrack memiliki background cron worker yang memeriksa tugas dan jadwal wawancara aktif setiap 15 menit, lalu mengirimkan rekap pengingat langsung ke email terdaftar Anda.
              </div>
            </div>
          </section>

          <!-- BAB 7: Kalkulator Gaji PPh 21 -->
          <section class="guide-section" id="sec-salary">
            <div class="guide-section-header">
              <div class="guide-section-title-wrap">
                <span class="guide-section-number">07</span>
                <h2 class="guide-section-title">Kalkulator Gaji Bersih (PPh 21 TER 2024)</h2>
              </div>
            </div>
            <p class="guide-section-lead">
              Simulasi nominal uang bersih (*Take Home Pay*) yang akan Anda terima setiap bulan berdasarkan regulasi resmi pajak penghasilan terbaru:
            </p>

            <div class="guide-callout guide-callout-info">
              <span class="guide-callout-icon">${getIconSvg('info', { size: 18 })}</span>
              <div>
                <strong>Dasar Hukum TER 2024:</strong> Mengacu pada <strong>PP No. 58 Tahun 2023</strong> dan <strong>PMK No. 168 Tahun 2023</strong> yang mengelompokkan tarif pajak efektif bulanan ke dalam Kategori TER A, B, atau C berdasarkan status PTKP karyawan.
              </div>
            </div>

            <div class="guide-feature-action-card">
              <div class="guide-feature-action-info">
                <span class="guide-feature-action-title">Coba Kalkulator Gaji Sekarang</span>
                <span class="guide-feature-action-desc">Hitung THP bulanan dan estimasi potongan PPh 21 TER secara instan.</span>
              </div>
              <button type="button" class="btn btn-primary btn-sm" id="btnGuideLaunchSalary">
                ${getIconSvg('calculator', { size: 14 })}
                <span>Buka Kalkulator Pajak</span>
              </button>
            </div>
          </section>

          <!-- BAB 8: Template Email HRD -->
          <section class="guide-section" id="sec-templates">
            <div class="guide-section-header">
              <div class="guide-section-title-wrap">
                <span class="guide-section-number">08</span>
                <h2 class="guide-section-title">Template Email HRD &amp; Etika Komunikasi</h2>
              </div>
            </div>
            <p class="guide-section-lead">
              Hemat waktu Anda saat berkomunikasi dengan rekruter menggunakan koleksi draf pesan profesional dwibahasa (Indonesia &amp; Inggris):
            </p>

            <div class="guide-step-grid">
              <div class="guide-step-card">
                <h3 class="guide-step-title" style="display: flex; align-items: center; gap: 6px;">
                  ${getIconSvg('mail', { size: 15 })} Follow-up Status
                </h3>
                <p class="guide-step-desc">Tanyakan perkembangan kabar setelah 7–14 hari pengiriman lamaran secara sopan tanpa terkesan memaksa.</p>
              </div>
              <div class="guide-step-card">
                <h3 class="guide-step-title" style="display: flex; align-items: center; gap: 6px;">
                  ${getIconSvg('checkCircle', { size: 15 })} Thank-You Note
                </h3>
                <p class="guide-step-desc">Kirimkan pesan apresiasi dalam waktu 24 jam setelah interview untuk memperkuat impresi positif.</p>
              </div>
              <div class="guide-step-card">
                <h3 class="guide-step-title" style="display: flex; align-items: center; gap: 6px;">
                  ${getIconSvg('dollar', { size: 15 })} Negosiasi Gaji
                </h3>
                <p class="guide-step-desc">Buka ruang diskusi penawaran kompensasi secara diplomatis dengan alasan riset pasar yang kuat.</p>
              </div>
              <div class="guide-step-card">
                <h3 class="guide-step-title" style="display: flex; align-items: center; gap: 6px;">
                  ${getIconSvg('calendar', { size: 15 })} Reschedule Wawancara
                </h3>
                <p class="guide-step-desc">Permohonan penjadwalan ulang jika ada halangan mendesak dengan opsi alternatif waktu yang jelas.</p>
              </div>
            </div>

            <div class="guide-feature-action-card">
              <div class="guide-feature-action-info">
                <span class="guide-feature-action-title">Akses Koleksi Template Lengkap</span>
                <span class="guide-feature-action-desc">Salin pesan siap pakai lengkap dengan auto-fill nama perusahaan dan posisi.</span>
              </div>
              <button type="button" class="btn btn-primary btn-sm" id="btnGuideLaunchTemplates">
                ${getIconSvg('mail', { size: 14 })}
                <span>Buka Template Email</span>
              </button>
            </div>
          </section>

          <!-- BAB 9: Pintasan Keyboard -->
          <section class="guide-section" id="sec-shortcuts">
            <div class="guide-section-header">
              <div class="guide-section-title-wrap">
                <span class="guide-section-number">09</span>
                <h2 class="guide-section-title">Pintasan Keyboard &amp; Navigasi Cepat</h2>
              </div>
            </div>
            <p class="guide-section-lead">
              Gunakan kombinasi tombol berikut untuk bernavigasi seperti pro tanpa perlu meraih mouse:
            </p>

            <!-- Responsive Table Wrapper -->
            <div class="guide-table-responsive">
              <table class="guide-table">
                <thead>
                  <tr>
                    <th>Tombol Pintas</th>
                    <th>Aksi / Fungsi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd></td>
                    <td>Buka <strong>Command Palette</strong> (Cari lamaran, lompat halaman, eksekusi aksi cepat).</td>
                  </tr>
                  <tr>
                    <td><kbd>Esc</kbd></td>
                    <td>Tutup modal, drawer filter, atau dialog yang sedang aktif.</td>
                  </tr>
                  <tr>
                    <td><kbd>Klik Logo</kbd></td>
                    <td>Kembali langsung ke halaman <strong>Dashboard</strong>.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- BAB 10: FAQ -->
          <section class="guide-section" id="sec-faq">
            <div class="guide-section-header">
              <div class="guide-section-title-wrap">
                <span class="guide-section-number">10</span>
                <h2 class="guide-section-title">Tanya Jawab (FAQ) &amp; Bantuan Pengguna</h2>
              </div>
            </div>
            <p class="guide-section-lead">
              Pertanyaan umum seputar fitur, privasi akun, dan tips penggunaan JobTrack:
            </p>

            <div class="guide-faq-list" id="guideFaqList">
              ${FAQ_ITEMS.map((item, index) => `
                <div class="guide-faq-item ${index === 0 ? 'open' : ''}" data-faq-index="${index}">
                  <button type="button" class="guide-faq-question">
                    <span>${item.q}</span>
                    <span class="guide-faq-arrow">${getIconSvg('arrowRight', { size: 14 })}</span>
                  </button>
                  <div class="guide-faq-answer">
                    ${item.a}
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Helpdesk / Feedback Direct Launcher inside Guide -->
            <div class="guide-feedback-cta">
              <div class="guide-feedback-cta-left">
                <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(99, 102, 241, 0.12); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div>
                  <h4 style="margin: 0; font-size: 0.98rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.01em;">
                    Punya pertanyaan lain atau ingin melaporkan kendala?
                  </h4>
                  <p style="margin: 4px 0 0 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">
                    Sampaikan masukan, kendala bug, atau usulan fitur langsung ke tim administrator kami.
                  </p>
                </div>
              </div>
              <button type="button" class="btn btn-primary btn-sm" id="btnGuideOpenFeedback" style="gap: 8px; font-weight: 600;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>Kirim Masukan &amp; Laporan</span>
              </button>
            </div>
          </section>

        </main>
      </div>

    </div>
  `;

  // ─── Attach Interactivity & Event Handlers ────────────────────────────────

  // 1. Stage tabs click
  const stageChips = container.querySelectorAll<HTMLButtonElement>('.guide-stage-chip');
  const stageDetailName = container.querySelector('#stageDetailName');
  const stageDetailBadge = container.querySelector('#stageDetailBadge') as HTMLElement;
  const stageDetailDesc = container.querySelector('#stageDetailDesc');
  const stageDetailTip = container.querySelector('#stageDetailTip');

  stageChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const stageKey = chip.getAttribute('data-stage');
      if (!stageKey || !STAGE_DETAILS[stageKey]) return;

      stageChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const info = STAGE_DETAILS[stageKey];
      if (stageDetailName) stageDetailName.textContent = info.name;
      if (stageDetailBadge) {
        stageDetailBadge.textContent = info.badge;
        stageDetailBadge.style.background = `${info.badgeColor}22`;
        stageDetailBadge.style.color = info.badgeColor;
        stageDetailBadge.style.borderColor = `${info.badgeColor}44`;
      }
      if (stageDetailDesc) stageDetailDesc.textContent = info.desc;
      if (stageDetailTip) stageDetailTip.textContent = info.tip;
    });
  });

  // 2. FAQ Accordion toggle
  const faqItems = container.querySelectorAll('.guide-faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.guide-faq-question');
    questionBtn?.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      item.classList.toggle('open', !isOpen);
    });
  });

  // 3. Navigation Scrolling Helper
  const scrollToTarget = (targetId: string, label?: string) => {
    const targetEl = container.querySelector(`#${targetId}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Update active state in desktop TOC
    container.querySelectorAll('.guide-toc-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-target') === targetId);
    });

    // Update active state in mobile strip
    container.querySelectorAll('.guide-strip-pill').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-jump') === targetId);
    });

    // Update mobile bar title
    const mobileTitle = container.querySelector('#mobileActiveChapterName');
    if (mobileTitle && label) {
      mobileTitle.textContent = label;
    }

    // Close mobile drawer if open
    const mobileBar = container.querySelector('#guideMobileBar');
    if (mobileBar) {
      mobileBar.classList.remove('open');
    }
  };

  // Quick Jump Pills (Hero)
  const jumpPills = container.querySelectorAll<HTMLButtonElement>('.guide-quick-pill');
  jumpPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const targetId = pill.getAttribute('data-jump');
      if (targetId) scrollToTarget(targetId, pill.textContent?.trim());
    });
  });

  // Mobile Horizontal Swipe Strip
  const stripPills = container.querySelectorAll<HTMLButtonElement>('.guide-strip-pill');
  stripPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const targetId = pill.getAttribute('data-jump');
      if (targetId) scrollToTarget(targetId, pill.textContent?.trim());
    });
  });

  // Desktop & Mobile TOC items
  const tocItems = container.querySelectorAll<HTMLAnchorElement>('.guide-toc-item');
  tocItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = item.getAttribute('data-target');
      if (targetId) scrollToTarget(targetId, item.textContent?.trim());
    });
  });

  // Mobile Drawer Toggle Button
  const btnToggleMobileToc = container.querySelector('#btnToggleMobileToc');
  const guideMobileBar = container.querySelector('#guideMobileBar');
  btnToggleMobileToc?.addEventListener('click', () => {
    guideMobileBar?.classList.toggle('open');
  });

  // 4. Live Search Filter
  const searchInput = container.querySelector<HTMLInputElement>('#guideSearchInput');
  searchInput?.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    const sections = container.querySelectorAll<HTMLElement>('.guide-section');

    sections.forEach(sec => {
      if (!query) {
        sec.style.display = 'block';
        return;
      }
      const text = sec.textContent?.toLowerCase() || '';
      sec.style.display = text.includes(query) ? 'block' : 'none';
    });

    // Also auto-expand matching FAQs
    faqItems.forEach(item => {
      if (!query) return;
      const qText = item.textContent?.toLowerCase() || '';
      if (qText.includes(query)) {
        item.classList.add('open');
      }
    });
  });

  // 5. Action Launchers (Desktop & Mobile)
  const bindAction = (selector: string, action: () => void) => {
    container.querySelectorAll(selector).forEach(btn => {
      btn.addEventListener('click', action);
    });
  };

  bindAction('#btnGuideOpenSalary', () => SalaryCalculatorModal.open());
  bindAction('#btnGuideLaunchSalary', () => SalaryCalculatorModal.open());
  bindAction('#btnGuideMobileSalary', () => {
    guideMobileBar?.classList.remove('open');
    SalaryCalculatorModal.open();
  });

  bindAction('#btnGuideOpenTemplates', () => EmailTemplatesModal.open());
  bindAction('#btnGuideLaunchTemplates', () => EmailTemplatesModal.open());
  bindAction('#btnGuideMobileTemplates', () => {
    guideMobileBar?.classList.remove('open');
    EmailTemplatesModal.open();
  });

  bindAction('#btnGuideOpenQuickAdd', () => {
    window.dispatchEvent(new CustomEvent('open-quick-add'));
  });

  bindAction('#btnGuideGoBoard', () => {
    store.setView('board');
    window.location.hash = 'board';
  });

  bindAction('#btnGuideOpenFeedback', () => {
    FeedbackModal.open();
  });
}
