# Product Requirement Document (PRD): JobTrack

| Dokumen | Keterangan |
| :--- | :--- |
| **Status** | Sesuai implementasi (bukan spesifikasi masa depan) |
| **Versi** | 2.0 |
| **Produk** | JobTrack, pelacak lamaran kerja pribadi |
| **Target** | Q4 2026 |

Dokumen ini mencatat apa yang **sudah ada di kode**, bukan rencana MVP lama. Versi 1.0 (local-first, IndexedDB, tanpa akun) tidak dibangun. Diganti akun + API + PostgreSQL.

---

## 1. Masalah

Pencari kerja, terutama fresh graduate, mengirim banyak lamaran lewat LinkedIn, Jobstreet, Glints, Kalibrr, Indeed, dan situs perusahaan. Akibatnya:

* Lupa kapan melamar, posisi apa, dan ke perusahaan mana saat HR menghubungi.
* Lupa versi CV atau portofolio yang dikirim ke perusahaan tertentu.
* Lewat jadwal tes, tugas, atau wawancara.
* Spreadsheet ditinggalkan karena lambat di ponsel dan tanpa status terpusat.

## 2. Pengguna

Fresh graduate dan pelamar entry-level (sekitar 20–25 tahun) yang mengirim beberapa lamaran per minggu, memakai laptop untuk melamar dan ponsel untuk balasan rekruter, dan butuh catat lamaran dalam hitungan detik.

Data lamaran, gaji, kontak HR, dan CV disimpan di server milik aplikasi (bukan hanya di peramban). Satu akun per orang. Privasi berarti data terikat ke akun pemiliknya, bukan "tidak pernah meninggalkan perangkat".

## 3. Tujuan

Satu tempat untuk mencatat, memindahkan status, dan menindaklanjuti setiap lamaran supaya tidak ada proses yang terbengkalai.

| Metrik | Arti | Target |
| :--- | :--- | :--- |
| Task selesai tepat waktu | Tugas wawancara, tes, follow-up yang ditutup sebelum atau pada jatuh tempo | > 80% |
| Balik mingguan | Pengguna yang mengubah status lamaran tiap pekan | > 40% di minggu ke-4 |
| Waktu catat satu lamaran | Dari buka quick-add atau ekstensi sampai tersimpan | < 45 detik |

Target ekspor/backup dari PRD 1.0 dihapus dari metrik. Fitur ekspor JSON/CSV seluruh data milik user **belum ada**.

## 4. Ruang lingkup

### 4.1. Yang sudah ada

* Akun: daftar, masuk, keluar, lupa kata sandi, verifikasi email. JWT akses singkat plus refresh token di cookie. Sesi bisa dicabut.
* Quick-add lamaran (posisi, perusahaan, status, URL, lokasi, tipe kerja, gaji, tenggat, catatan) plus deteksi duplikat URL/perusahaan/judul.
* Pipeline 9 tahap, tampilan Kanban (seret-lepas) dan daftar. Riwayat pindah tahap tersimpan.
* Tugas per lamaran: tipe, jatuh tempo, prioritas, status. Agenda menandai yang lewat jatuh tempo selama aplikasi terbuka.
* Kontak rekruter per lamaran atau perusahaan.
* Vault dokumen: master CV, cover letter, portofolio, versi (tautan atau berkas), dan jejak versi mana yang dipakai lamaran tertentu.
* Lampiran berkas per lamaran.
* Wawancara multi-ronde: jadwal, pewawancara, persiapan, pertanyaan, catatan, evaluasi.
* Kalender (acara berbatas waktu) dan pengingat in-app.
* Direktori tautan karir (global, hasil scraper) plus tautan pribadi, filter sektor, dan bintang favorit.
* Dasbor ringkasan dan analitik konversi.
* Pencarian.
* Tempat sampah (soft delete) untuk lamaran, perusahaan, dokumen, dan acara. Bisa dipulihkan.
* Profil: nama, avatar, telepon, lokasi, bio, preferensi pengingat.
* Ekstensi peramban yang mengisi form dari halaman lowongan (LinkedIn, Glints, Jobstreet/Seek, Indeed, Kalibrr, situs karir).
* Landing page publik dan aplikasi di balik login.

### 4.2. Belum ada (jangan dianggap selesai)

* Ekspor dan impor cadangan JSON/CSV milik user.
* Hapus akun dan unduh seluruh data pribadi.
* Pengingat yang tetap terkirim saat tab ditutup (email, push, atau cron). Toggle di profil hanya menyimpan preferensi.
* Login OAuth.
* Sinkronisasi Google Calendar / Outlook. Yang ada: tautan "tambah ke Google Calendar" untuk satu tugas, bukan sinkron dua arah.
* Parsing lowongan pakai AI. Isi form dari ekstensi, bukan dari server yang membuka URL.
* Kalkulator PPh 21.
* Migrasi skema berversi (`prisma db push` saja, tanpa folder migrasi).
* Tes otomatis.

### 4.3. Sengaja di luar produk

* Papan lowongan multi-user, lamaran atas nama orang lain, atau ATS untuk perusahaan.
* Menyimpan kata sandi situs kerja.

## 5. Alur yang harus tetap benar

### US-01 Simpan lamaran

Wajib: posisi, nama perusahaan, tahap. Opsional: URL, sumber, lokasi, tipe kerja (onsite / hybrid / remote), rentang gaji, tenggat, deskripsi, catatan. Default tahap: Disimpan. Tersimpan langsung muncul di kolom Kanban itu. URL yang sama untuk perusahaan dan posisi yang sama ditolak sebagai duplikat.

### US-02 Pindah tahap

Sembilan tahap, urutan tampilan: Disimpan, Siap Dilamar, Terkirim, Skrining, Wawancara, Penawaran, Diterima, Ditolak, Mengundurkan Diri. Bisa lewat seret di Kanban atau aksi di daftar/detail. Setiap pindah menulis riwayat dari-tahap ke-tahap. Kartu menampilkan perusahaan, posisi, waktu sejak aktivitas terakhir, dan ada tidaknya tugas terbuka.

### US-03 Tugas

Tipe: Kirim Lamaran, Follow-up, Wawancara, Tugas/Tes, Thank-you. Prioritas Rendah / Sedang / Tinggi. Status Belum / Selesai. Agenda dan dasbor menyorot yang lewat jatuh tempo. Sorotan dihitung di klien saat aplikasi terbuka, bukan dikirim sebagai notifikasi latar.

### US-04 Dokumen dan kontak

Master dokumen punya kategori (Resume, Cover Letter, Portofolio, Lainnya) dan beberapa versi. Satu lamaran bisa menautkan versi yang benar-benar dikirim. Kontak menyimpan nama, peran, email, telepon, LinkedIn, catatan.

### US-05 Masuk dan sesi

Daftar butuh email dan kata sandi. Masuk mengembalikan sesi. Lupa kata sandi mengirim tautan sekali pakai lewat email bila SMTP dikonfigurasi. Email belum terverifikasi tetap bisa masuk, dengan ajakan verifikasi. Keluar mencabut refresh token sesi itu.

### US-06 Clip dari peramban

Di halaman lowongan yang didukung, ekstensi mengisi judul, perusahaan, lokasi, tautan, dan tipe kerja. Pengguna memilih tahap lalu menyimpan ke akun yang sedang masuk.

### US-07 Hapus yang bisa kembali

Hapus lamaran, dokumen, atau acara tidak langsung menghilangkan baris. Item masuk tempat sampah dan bisa dipulihkan. Hapus permanen baru benar-benar menghapus.

## 6. Bukan persyaratan kode

* Antarmuka harus tetap bisa dipakai dari lebar 360px ke desktop.
* Tanggal ditampilkan menurut zona lokal pengguna. Yang disimpan di basis data adalah timestamp.
* Setiap permintaan data lamaran harus terikat ke pengguna yang login. Pengguna A tidak boleh membaca lamaran pengguna B.
* Berkas unggahan dibatasi jenis dan ukuran (saat ini PDF, dokumen office, gambar; batas 10 MB per berkas).

## 7. Cara menjalankan (pengembangan)

Butuh Docker untuk Postgres, berkas `backend/.env` (salin dari `.env.example`), lalu `npm run dev:be` dan `npm run dev:fe`.

* Aplikasi: `http://localhost:5173`
* API: `http://localhost:3000`
* Postgres: `127.0.0.1:5433`, basis data `jobtrack_dev`

Detail modul ada di [architecture.md](architecture.md).


