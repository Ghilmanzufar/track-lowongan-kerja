# Product Requirement Document (PRD): JobTrack (Personal Job Application Tracker)

| Dokumen | Keterangan |
| :--- | :--- |
| **Status** | Ready for Review |
| **Versi** | 1.0 (MVP) |
| **Author** | Product Team |
| **Target Rilis** | Q4 2026 |

---

## 1. Latar Belakang & Pernyataan Masalah

Pencari kerja, khususnya lulusan baru (*fresh graduates*), rata-rata mengirimkan puluhan hingga ratusan lamaran pekerjaan di berbagai portal (LinkedIn, Jobstreet, Glints, Kalibrr, email langsung). Volume lamaran yang tinggi dan tersebar di berbagai platform memicu masalah operasional bagi individu:

* **Lupa riwayat lamaran:** Pengguna sering lupa kapan mereka melamar, posisi apa yang dilamar, dan profil perusahaan saat dihubungi oleh HR via telepon/WhatsApp.
* **Kehilangan konteks dokumen:** Sering menggunakan versi CV atau portofolio yang berbeda-beda (*tailored resume*), tetapi lupa versi mana yang dikirimkan ke perusahaan tertentu.
* **Tenggat waktu terlewat:** Tidak memantau jadwal tes teknis, batas pengiriman tugas, atau jadwal wawancara karena tidak ada integrasi pengingat terpusat.
* **Kelelahan mengelola spreadsheet:** Penggunaan Google Sheets atau Excel manual sering kali ditinggalkan karena merepotkan diakses via ponsel dan tidak memiliki otomatisasi status atau pengingat.

---

## 2. Target Pengguna (User Persona)

* **Segmen Utama:** *Fresh Graduates* & *Entry-Level Job Seekers* (usia 20–25 tahun).
* **Karakteristik:**
  * Aktif mengirimkan 5–20 lamaran per minggu.
  * Menggunakan *smartphone* untuk melihat notifikasi rekruter dan laptop saat mengirim lamaran.
  * Membutuhkan solusi cepat, tidak mau ribet membuat akun atau setup yang kompleks.
  * Mengutamakan privasi dan kontrol atas data pribadi mereka.

---

## 3. Tujuan Produk & Metrik Keberhasilan (Goals & Metrics)

### 3.1. Tujuan (Product Goals)
Membantu *fresh graduates* mendokumentasikan, melacak status, dan mengelola tindak lanjut setiap lamaran kerja secara instan dalam satu tempat agar tidak ada proses rekrutmen yang terlewat atau terbengkalai.

### 3.2. Metrik Keberhasilan (Success Metrics)

| Metrik | Definisi | Target MVP |
| :--- | :--- | :--- |
| **Task Completion Rate** | Persentase tugas (wawancara, tes, follow-up) yang diselesaikan tepat waktu | > 80% dari total tugas tercatat |
| **Weekly Active Retention** | Pengguna yang kembali memperbarui status lamaran tiap pekan | > 40% pada minggu ke-4 (W4 Retention) |
| **Time to Log an Application** | Waktu yang dibutuhkan pengguna untuk mencatat satu lowongan baru | < 45 detik via quick add / form |
| **Export/Backup Adoption** | Persentase pengguna yang melakukan ekspor data (JSON/CSV) | > 25% dari total pengguna aktif |

---

## 4. Ruang Lingkup Produk (Scope)

### 4.1. Dalam Cakupan (In-Scope - MVP)
* Penyimpanan lokal peramban (*local-first storage* via IndexedDB/LocalStorage, tanpa wajib register akun).
* Pencatatan lowongan manual dan *quick-add* berbasis URL.
* Manajemen jalur lamaran (*Kanban board* dan *List view*) dengan 9 status bawaan.
* Sistem tugas dan pengingat tanggal jatuh tempo (*due dates* & *overdue flags*).
* Pencatatan tautan dokumen (CV/portofolio) dan kontak rekruter per lamaran.
* Pencarian, filter multi-variabel, dan penandaan (*tagging*).
* Ekspor dan impor data (format CSV dan JSON).
* Dasbor analitik sederhana (total lamaran, rasio konversi tahapan, rata-rata durasi per tahap).

### 4.2. Luar Cakupan (Out-of-Scope - Post-MVP)
* Integrasi login OAuth dan sinkronisasi cloud multi-perangkat.
* Ekstraksi otomatis berbasis AI / *web scraping* langsung dari tautan portal kerja.
* Sinkronisasi dua arah ke Google Calendar / Outlook.
* Fitur kalkulator PPh 21 / simulasi *take-home pay*.

---

## 5. Kebutuhan Fungsional (User Stories & Acceptance Criteria)

### US-01: Simpan Lowongan Kerja Cepat
* **User Story:** Sebagai pelamar, saya ingin menyimpan informasi lowongan pekerjaan dengan cepat agar saya tidak kehilangan jejak posisi yang sudah/akan saya lamar.
* **Kriteria Penerimaan (Acceptance Criteria):**
  * Pengguna dapat menempelkan (*paste*) URL sumber lowongan.
  * Form input minimal wajib mengisi: Posisi, Nama Perusahaan, dan Status.
  * Form input opsional: URL Sumber, Lokasi, Tipe Kerja (WFO/Hybrid/Remote), Rentang Gaji, Batas Akhir, Deskripsi Singkat/Catatan.
  * Lowongan yang baru disimpan langsung muncul di papan Kanban pada kolom yang dipilih (*default*: "Disimpan").

### US-02: Manajemen Jalur Lamaran (Pipeline Board)
* **User Story:** Sebagai pelamar, saya ingin melihat dan memindahkan tahapan lamaran secara visual agar saya tahu posisi mana saja yang masih berjalan.
* **Kriteria Penerimaan:**
  * Mendukung 9 tahapan default: *Disimpan*, *Siap Dilamar*, *Terkirim*, *Skrining*, *Wawancara*, *Penawaran*, *Diterima*, *Ditolak*, *Mengundurkan Diri*.
  * Terdapat dua mode tampilan: **Kanban Board** (dengan *drag-and-drop*) dan **List View** (tabel).
  * Kartu lamaran menampilkan: Nama Perusahaan, Posisi, Hari sejak update terakhir, dan indikator tugas aktif.

### US-03: Tugas dan Pengingat (Tasks & Reminders)
* **User Story:** Sebagai pelamar, saya ingin mencatat jadwal wawancara, tes teknis, atau jadwal *follow-up* agar saya tidak melewatkan kesempatan tersebut.
* **Kriteria Penerimaan:**
  * Pengguna dapat menambahkan tugas di dalam kartu lamaran dengan tipe: *Kirim Lamaran*, *Follow-up*, *Wawancara*, *Tugas/Tes*, *Kirim Thank-you Note*.
  * Tugas memiliki field: Tanggal/Waktu Jatuh Tempo, Prioritas (Low, Med, High), dan Status (Belum / Selesai).
  * Tampilan dashboard/agenda menampilkan peringatan warna merah (*overdue highlight*) untuk tugas yang melewati batas waktu.

### US-04: Pencatatan Dokumen & Kontak Rekruter
* **User Story:** Sebagai pelamar, saya ingin mencatat versi CV yang dikirim dan nama HR yang menghubungi saya agar saya tidak salah bicara saat dihubungi.
* **Kriteria Penerimaan:**
  * Field teks bebas untuk mencatat versi dokumen (misal: "CV_Frontend_v2.pdf", link Google Drive/Notion portofolio).
  * Bagian kontak untuk menyimpan: Nama PIC/HR, Nomor WhatsApp, Email, dan Tautan LinkedIn.

### US-05: Ekspor & Impor Data (Privacy-First)
* **User Story:** Sebagai pengguna, saya ingin mengekspor seluruh data saya ke format JSON/CSV agar data saya aman dan bisa dicadangkan secara mandiri.
* **Kriteria Penerimaan:**
  * Tombol "Ekspor Data" mengunduh file JSON atau CSV berisi seluruh entri lowongan, catatan, dan tugas.
  * Tombol "Impor Data" memungkinkan upload file cadangan untuk memulihkan seluruh data aplikasi.

---

## 6. Kebutuhan Non-Fungsional (Non-Functional Requirements)

* **Arsitektur & Privasi:** *Local-first architecture*. Semua data disimpan di peramban pengguna (IndexedDB). Tidak ada data sensitif pengguna yang dikirimkan ke server pihak ketiga pada rilis MVP.
* **Responsivitas:** Desain antarmuka adaptif penuh (*responsive mobile-first*), dapat dioperasikan dengan baik pada layar smartphone (360px ke atas) maupun desktop (hingga 4K).
* **Performa:** Waktu pemuatan awal (*First Contentful Paint*) < 1.5 detik. Operasi pencarian/filter data hingga 1.000 entri lamaran harus selesai dalam < 100 ms.
* **Lokalisasi:** Format tanggal dan zona waktu disesuaikan dengan zona waktu lokal pengguna (*default*: Asia/Jakarta / WIB, format DD/MM/YYYY).

---

## 7. Rencana Rilis & Fase Pengembangan