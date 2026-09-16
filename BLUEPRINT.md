# 📘 Blueprint Proyek: JobTrack (Personal Job Application Tracker & Career Hub)

Dokumen ini merupakan spesifikasi teknis dan cetak biru (*blueprint*) komprehensif dari aplikasi **JobTrack**, mencakup visi produk, arsitektur sistem, struktur basis data, daftar seluruh modul dan fitur, serta panduan operasional.

---

## 1. Ringkasan Eksekutif & Identitas Proyek

* **Nama Proyek:** JobTrack
* **Kategori:** *Personal Productivity & Career Management Application*
* **Paradigma:** *Fullstack Modern Web Application* berbasis basis data relasional PostgreSQL dengan desain *utilitarian & modern* terinspirasi dari standar Linear dan Vercel.
* **Tujuan Utama:** Membantu para pencari kerja (*jobseekers*), *fresh graduates*, maupun profesional mengorganisir, melacak proses rekrutmen lamaran kerja secara sistematis, serta menyediakan akses cepat ke direktori karir resmi seluruh perusahaan terkemuka di Indonesia.

---

## 2. Arsitektur Teknologi (*Tech Stack*)

### Frontend Layer
* **Core:** Vanilla TypeScript (Clean Architecture, Modular Components, Zero Heavy UI Framework Overhead)
* **Build Tool:** Vite (Ultra-fast HMR & Production Bundler)
* **Styling:** Custom Vanilla CSS Design System dengan variabel CSS adaptif (*CSS Custom Properties*)
* **Theming:** Dual-Theme (*Light Mode* & *Dark Mode Monochromatic Slate*) dengan dukungan native `color-scheme` dan kontras WCAG terverifikasi
* **Routing:** Client-Side Hash Router (`#dashboard`, `#board`, `#list`, `#agenda`, `#analytics`, `#career-links`)

### Backend & Database Layer
* **Runtime:** Node.js (ES Modules)
* **Web Framework:** Express.js (RESTful API Server)
* **ORM:** Prisma ORM v6 (Type-safe Database Client & Schema Migration Tool)
* **Database:** PostgreSQL (Docker-ready via `localhost:5433` / Database `jobtrack_dev`)
* **Dev Runner:** `tsx watch` (TypeScript Execution with auto-restart)

```mermaid
graph TD
    Client["Frontend SPA (Vite + TypeScript)"] <-->|REST API JSON| Server["Backend API (Express.js)"]
    Server <-->|Prisma ORM Client| DB[("PostgreSQL Database")]
    Client -->|Local State / UI Cache| BrowserStore["Browser Cache / LocalStorage"]
```

---

## 3. Struktur Direktori Proyek

```text
track-lowongan/
├── BLUEPRINT.md                 # Cetak biru dokumentasi proyek (dokumen ini)
├── docker-compose.yml           # Konfigurasi container database PostgreSQL
├── package.json                 # Workspace root package manager
│
├── backend/                     # API Server & Database ORM
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                     # Konfigurasi DATABASE_URL & PORT
│   ├── prisma/
│   │   ├── schema.prisma        # Schema model relasional Prisma
│   │   └── seed.ts              # Seeder data 390+ direktori karir ber-sektor KBLI
│   └── src/
│       ├── index.ts             # Entry point Express server & middleware
│       └── routes/
│           ├── applications.ts  # Endpoint CRUD lamaran kerja
│           ├── tasks.ts         # Endpoint manajemen tugas & agenda
│           ├── contacts.ts      # Endpoint kontak HR / recruiter
│           ├── documents.ts     # Endpoint link dokumen pendukung
│           ├── attachments.ts   # Endpoint file attachment dataUrl
│           └── career-links.ts  # Endpoint Direktori Karir (Global & Personal)
│
├── frontend/                    # Single Page Application
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html               # Layout shell & sidebar navigasi
│   └── src/
│       ├── main.ts              # Router shell, modal handlers, view orchestrator
│       ├── types.ts             # Type definition & 18 konstanta sektor KBLI
│       ├── services/
│       │   └── api.ts           # HTTP Client wrapper API service
│       ├── components/
│       │   ├── DashboardView.ts # Tampilan ringkasan metrik & deadline
│       │   ├── KanbanBoardView.ts # Papan Kanban interaktif (9 stages)
│       │   ├── ListView.ts      # Tampilan tabel data lamaran kerja
│       │   ├── AgendaView.ts    # Tampilan jadwal & pengingat tugas
│       │   ├── AnalyticsView.ts # Tampilan grafik konversi & statistik
│       │   ├── CareerLinksView.ts # Tampilan direktori karir 390+ perusahaan
│       │   ├── ApplicationModal.ts # Modal form input lamaran baru
│       │   └── detail/          # Modular detail lamaran (6 sub-tab)
│       │       ├── DetailModal.ts   # Container tab modal detail
│       │       ├── RingkasanTab.ts  # Tab informasi umum & kompensasi
│       │       ├── TugasTab.ts      # Tab to-do list spesifik per lamaran
│       │       ├── KontakTab.ts     # Tab kontak personal recruiter/interviewer
│       │       ├── DokumenTab.ts    # Tab link CV/portofolio & upload attachment
│       │       ├── WawancaraTab.ts  # Tab persiapan & evaluasi interview
│       │       └── AktivitasTab.ts  # Tab riwayat log timeline otomatis
│       └── styles/
│           └── main.css         # Desain sistem global (utilitarian slate styling)
│
├── docs/                        # Dokumentasi teknis & riset awal
│   ├── PRD.md                   # Product Requirement Document
│   ├── FRD-FSD.md               # Functional Requirement & System Design
│   ├── architecture.md          # Arsitektur teknis
│   ├── design.md                # Panduan visual UI/UX
│   └── wireframes.md            # Cetak biru tata letak visual
└── extension/                   # Ekstensi browser (opsional / masa depan)
```

---

## 4. Rincian Fitur dan Modul Aplikasi

### 4.1. Kanban Pipeline Board (`#board`)
* **9 Tahapan Rekrutmen Lengkap:**
  1. `Saved` (Disimpan untuk dipelajari)
  2. `ToApply` (Siap untuk didaftarkan)
  3. `Applied` (Sudah dikirim)
  4. `Screening` (Seleksi berkas / asesmen online)
  5. `Interview` (Tahap wawancara HR / User / Direksi)
  6. `Offer` (Mendapatkan offering letter)
  7. `Accepted` (Penawaran diterima / bergabung)
  8. `Rejected` (Belum lolos seleksi)
  9. `Withdrawn` (Mengundurkan diri atas inisiatif sendiri)
* **Interaktivitas:** Drag-and-drop kartu antar-kolom dan tombol pindah cepat.
* **Card Meta:** Logo otomatis via Google favicon service, tanggal deadline, ekspektasi gaji, tag teknologi/bidang, penanda kontak referral, serta badge tugas yang belum selesai.

### 4.2. Dashboard & Quick Insights (`#dashboard`)
* **Statistik Cepat:** Jumlah lamaran aktif, tahap interview berjalan, penawaran masuk (*offers*), dan rasio kelolosan (*conversion rate*).
* **Agenda Mendesak:** Widget tugas yang mendekati tenggat waktu (*due today* dan *overdue*) dengan aksi centang selesai langsung dari dashboard.
* **Aktivitas Terkini:** Riwayat aksi lamaran yang baru saja diperbarui.

### 4.3. Daftar Tabel Lamaran (`#list`)
* **Tampilan Tabel Rinci:** Menyajikan seluruh atribut lamaran dalam format tabular yang efisien.
* **Pencarian Real-Time:** Filter seketika berdasarkan nama perusahaan, posisi, dan tag keahlian.
* **Filter Tahapan:** Filter multi-pilihan berdasarkan *stage* lamaran dan tipe kerja (*onsite*, *hybrid*, *remote*).
* **Aksi Cepat:** Tombol langsung menuju detail modal atau penghapusan data.

### 4.4. Agenda & Manajemen Tugas (`#agenda`)
* **Kategorisasi Tugas:** `Apply`, `FollowUp`, `Interview`, `Assignment` (tes teknis), dan `ThankYou`.
* **Tingkat Prioritas:** `Low`, `Med`, `High` dengan kode warna visual.
* **Penjadwalan:** Fitur penentuan tenggat waktu (*due date*) dan penundaan sementara (*snooze task*).
* **Status Tugas:** Checkbox status `Open` vs `Done`.

### 4.5. Analitik & Konversi Pelamar (`#analytics`)
* **Funnel Visualization:** Visualisasi corong rasio perpindahan dari status *Applied* $\rightarrow$ *Screening* $\rightarrow$ *Interview* $\rightarrow$ *Offer*.
* **Insight Kompensasi:** Analisis perbandingan antara ekspektasi gaji pelamar dengan status lamaran yang aktif.
* **Tren Lamaran Kerja:** Pemantauan frekuensi pengiriman lamaran per minggu/bulan.

### 4.6. Modal Detail Lamaran Modular (6 Sub-Tab)
Modal komprehensif yang memecah informasi lamaran menjadi 6 tab terfokus:
1. **Ringkasan:** Mengedit posisi, tautan lowongan asli, tanggal apply, tanggal deadline, tipe kerja (*onsite/hybrid/remote*), nominal gaji minimal/maksimal, benefit yang ditawarkan, status referral, dan catatan bebas.
2. **Tugas:** Menambah dan mengelola tugas khusus yang terikat pada lamaran terkait.
3. **Kontak:** Buku alamat personil rekruter, HRD, atau interviewer (nama, jabatan, email, telepon, LinkedIn).
4. **Dokumen & Lampiran:**
   * *Document Link:* Tautan CV Google Drive / Canva / Notion khusus yang digunakan saat melamar.
   * *Attachment:* Unggah berkas dokumen (PDF, gambar, dataUrl) langsung ke basis data PostgreSQL.
5. **Persiapan Wawancara (*Interview Prep*):** Lembar kerja persiapan interview (latar belakang perusahaan, pertanyaan teknis yang diprediksi, formulasi jawaban metode STAR, dan evaluasi pasca interview).
6. **Log Aktivitas:** Catatan otomatis (*audit trail*) setiap kali stage berubah atau catatan diperbarui.

---

### 4.7. Direktori Karir Nasional & Hub Tautan Resmi (`#career-links`)

Modul direktori karir terintegrasi yang menghimpun lebih dari **390 link halaman karir resmi** instansi terkemuka di Indonesia dengan kapabilitas penyaringan multi-dimensi:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        DIREKTORI KARIR JOBTRACK                        │
├────────────────────────────────────────────────────────────────────────┤
│  [🔍 Cari perusahaan...]  [🌐 Dropdown 18 Sektor Industri KBLI (Count)]│
├────────────────────────────────────────────────────────────────────────┤
│  Tabs: [Semua] [Swasta] [BUMN] [Kementerian/Lembaga] [Multinasional]   │
├────────────────────────────────────────────────────────────────────────┤
│  [Card Perusahaan]              [Card Perusahaan]                      │
│  - Logo Otomatis (Favicon)      - Logo Otomatis (Favicon)              │
│  - Nama Entitas Resmi           - Nama Entitas Resmi                   │
│  - Domain Tautan Resmi          - Domain Tautan Resmi                  │
│  - Badge Sektor (🌾, ⛏️, 🏭, 💻)  - Badge Sektor (💰, 🏛️, 🚚, 🛒)       │
│  - Tombol Buka Tautan           - Tombol Buka Tautan                   │
├────────────────────────────────────────────────────────────────────────┤
│  ⭐ TAMBAHAN SAYA (Personal Link tersimpan di PostgreSQL per user)      │
│  [+ Tambah Link Karir Pribadi: Nama, URL, Kategori, Sektor, Catatan]   │
└────────────────────────────────────────────────────────────────────────┘
```

#### A. Dimensi 1: Kategori Tipe Lembaga (5 Kategori)
1. **Perusahaan Swasta:** Konglomerasi, startup teknologi, perbankan swasta, FMCG, ritel nasional.
2. **BUMN & Anak Usaha:** Holding BUMN perbankan (Himbara), energi (Pertamina, PLN), karya/konstruksi (WIKA, Adhi), transportasi (KAI, Garuda), pertambangan (MIND ID).
3. **Kementerian & Lembaga Negara:** Seluruh kementerian Kabinet Merah Putih, lembaga non-kementerian (BRIN, BPS, BPOM, BMKG), lembaga tinggi negara (MK, MA, KPK, BPK, BI, OJK), serta penerimaan CASN (BKN).
4. **Multinasional:** Raksasa teknologi global (Google, Microsoft, AWS, Apple), konsultan manajemen top-tier (McKinsey, BCG, Big 4), farmasi & perbankan global.
5. **Job Board Umum:** Platform pencarian kerja (LinkedIn, Jobstreet, Glints, Kalibrr, dll).

#### B. Dimensi 2: 18 Sektor Industri Standar KBLI (BPS)
Sistem dilengkapi filter dropdown in-DOM kustom (menjamin kontras tinggi dan bebas dari masalah render bawaan sistem operasi) dengan pengelompokan 18 sektor:
1. 🌾 **Pertanian, Kehutanan, dan Perikanan**
2. ⛏️ **Pertambangan dan Penggalian**
3. 🏭 **Industri Pengolahan / Manufaktur**
4. ⚡ **Pengadaan Listrik, Gas, Uap/Air Panas, dan Udara Dingin**
5. ♻️ **Pengelolaan Air, Pengelolaan Air Limbah, Sampah, dan Remediasi**
6. 🏗️ **Konstruksi**
7. 🛒 **Perdagangan Besar dan Eceran; Reparasi Mobil dan Motor**
8. 🚚 **Pengangkutan dan Pergudangan**
9. 🍽️ **Penyediaan Akomodasi dan Makan Minum**
10. 💻 **Informasi dan Komunikasi**
11. 💰 **Aktivitas Keuangan dan Asuransi**
12. 🏢 **Real Estat**
13. 🔬 **Aktivitas Profesional, Ilmiah, dan Teknis**
14. 🤝 **Aktivitas Penyewaan, Ketenagakerjaan, dan Penunjang Usaha**
15. 🏛️ **Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib**
16. 🎓 **Pendidikan**
17. 🏥 **Aktivitas Kesehatan Manusia dan Aktivitas Sosial**
18. 🎨 **Kesenian, Hiburan, dan Rekreasi**

#### C. Kapabilitas Hybrid (Global Directory + Personal Links)
* **Global Links:** Data siap pakai berstatus *verified* sebanyak 390+ entri.
* **Personal Links (Tambahan Saya):** Pengguna dapat menambahkan link karir perusahaan incaran sendiri lengkap dengan penanda sektor industri, kategori, serta catatan khusus (disimpan langsung ke database PostgreSQL).

---

## 5. Model Data & Skema Basis Data (Prisma ORM)

```prisma
model User {
  id              String           @id @default(cuid())
  email           String           @unique
  displayName     String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  companies       Company[]
  applications    Application[]
  userCareerLinks UserCareerLink[]
}

model Company {
  id          String       @id @default(cuid())
  userId      String
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  industry    String?
  size        String?
  website     String?
  location    String?
  linkedinUrl String?
  notes       String?
  jobPostings JobPosting[]
  contacts    Contact[]
}

model JobPosting {
  id            String        @id @default(cuid())
  companyId     String
  company       Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  title         String
  sourceUrl     String?
  foundDate     DateTime?
  applyDeadline DateTime?
  location      String?
  workType      WorkType?
  salaryMin     Int?
  salaryMax     Int?
  tags          String[]
  keywords      String?
  applications  Application[]
}

model Application {
  id                 String           @id @default(cuid())
  userId             String
  user               User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobPostingId       String
  jobPosting         JobPosting       @relation(fields: [jobPostingId], references: [id], onDelete: Cascade)
  stage              ApplicationStage @default(Saved)
  dateApplied        DateTime?
  expectedSalary     Int?
  benefits           String?
  referral           Boolean          @default(false)
  referralContactId  String?
  notes              String?
  lastActivityAt     DateTime         @default(now())

  tasks              Task[]
  contacts           Contact[]
  documents          DocumentLink[]
  attachments        Attachment[]
  activities         ActivityEvent[]
  interviewPrep      Json?
}

model CareerLink {
  id         String             @id @default(cuid())
  name       String
  url        String
  category   CareerLinkCategory @default(Swasta)
  sector     String?
  logoUrl    String?
  isVerified Boolean            @default(true)

  @@unique([name, url], name: "name_url")
}

model UserCareerLink {
  id        String             @id @default(cuid())
  userId    String
  user      User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  url       String
  category  CareerLinkCategory @default(Swasta)
  sector    String?
  notes     String?
}
```

---

## 6. Panduan Operasional & Perintah Eksekusi (*Runbook*)

### 6.1. Menjalankan Database (PostgreSQL)
Jika menggunakan Docker:
```powershell
docker-compose up -d
```
Konfigurasi database berjalan di port `5433` (koneksi: `postgresql://postgres:postgres@localhost:5433/jobtrack_dev?schema=public`).

### 6.2. Sinkronisasi Skema & Seeder
Di dalam direktori `backend/`:
```powershell
# Menerapkan perubahan model schema.prisma ke database
npm run db:push

# Mengisi 390+ data direktori karir ber-sektor KBLI
npm run db:seed
```

### 6.3. Menjalankan Aplikasi dalam Mode Pengembangan (*Dev Mode*)
Jalankan dari direktori *root* proyek:
```powershell
# Terminal 1: Menjalankan backend server (Port 3000)
npm run dev:be

# Terminal 2: Menjalankan frontend Vite (Port 5173)
npm run dev:fe
```
Aplikasi dapat diakses melalui peramban di: **`http://localhost:5173`**

### 6.4. Validasi & Kompilasi Produksi (*Type-Checking & Build*)
```powershell
# Cek tipe data backend
npm --prefix backend run build

# Cek tipe data dan buat bundle produksi frontend
npm --prefix frontend run build
```

---

## 7. Rencana Pengembangan Selanjutnya (*Future Roadmap*)
* **Autentikasi Penuh (Multi-User):** Implementasi JWT / Session Auth untuk mendukung akun personal publik.
* **Browser Extension (Web Scraper):** Ekstensi Chrome untuk menyimpan lowongan langsung dari LinkedIn, Jobstreet, dan Glints ke JobTrack dengan sekali klik.
* **Export & Backup:** Fitur ekspor data lamaran ke format CSV / Excel / PDF untuk rekapitulasi personal.
* **Email Reminder Integration:** Pengingat otomatis via email untuk wawancara atau tugas yang akan jatuh tempo.

---
*Dokumen ini disusun sebagai panduan arsitektur resmi proyek JobTrack.*
