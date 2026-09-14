# Anti-Slop Guidelines: JobTrack

Dokumen standar desain UI dan kode untuk mencegah *AI slop* (tampilan generik, hiasan tak berguna, abstraksi berlebih).
Referensi: https://github.com/miqdadbadjuber/anti-slop
Terkait: [`PRD.md`](PRD.md), [`FRD-FSD.md`](FRD-FSD.md), [`architecture.md`](architecture.md), [`wireframes.md`](wireframes.md).

---

## 1. Prinsip Desain UI (Anti-Slop UI)

### 1.1 Dilarang Keras (Banned Tropes)
- **Tanpa gradasi ungu/indigo generic SaaS**: Hapus latar belakang radial blob ungu, blur aurora, atau tombol gradient pelangi.
- **Tanpa radius raksasa**: Hindari `rounded-3xl` atau `rounded-full` pada kontainer data. Gunakan radius tajam/halus (`rounded-sm` atau `rounded-md`, 2px–6px).
- **Tanpa kartu mengambang berlebih (Card soup)**: Jangan bungkus setiap elemen kecil dalam kartu ber-shadow tebal. Gunakan garis pemisah halus (1px border) atau latar selang-seling.
- **Tanpa ilustrasi generik**: Tanpa karakter 3D kartun, manusia terbang, atau ikon abstrak tak bermakna. Gunakan data aktual dan teks jelas.
- **Tanpa whitespace kosong tak produktif**: Padding 64px untuk menampilkan 2 baris data dilarang. Utamakan kepadatan informasi (*high information density*).

### 1.2 Standar Visual & Layout
- **Density**: Compact dan utilitarian. Antarmuka pelacak kerja adalah alat kerja (*tool*), bukan landing page promosi.
- **Warna**: Palet netral monokromatik (Zinc/Slate/Neutral).
  - Latar: `#FFFFFF` / `#09090B` (dark mode opsional nanti).
  - Border: `1px solid #E4E4E7` (light) / `#27272A` (dark).
  - Teks: `#09090B` (primer), `#71717A` (sekunder).
  - Aksen status fungsional saja:
    - Netral/Disimpan: abu-abu (`#71717A`)
    - Aktif/Wawancara: biru teredam (`#2563EB`)
    - Terlambat/Overdue: merah tegas (`#DC2626`)
    - Tawaran/Diterima: hijau teredam (`#16A34A`)
- **Tipografi**:
  - Teks antarmuka: System UI font stack (`system-ui`, `-apple-system`, `Segoe UI`, `Roboto`).
  - Data teknis & angka: Font monospace (`ui-monospace`, `SFMono-Regular`, `Menlo`, `Consolas`) untuk tanggal, gaji, ID, tag status, dan durasi relatif (`3d`, `5h`).
  - Skala: 11px (label mikro), 12px (badge/tabel sekunder), 13px–14px (body/tabel utama), 16px (subheading), 18px–20px (heading layar).
- **Komponen Interaktif**:
  - Tombol: Kotak jelas, border 1px, state focus/hover kontras tinggi.
  - Tabel & List: Header ringkas, garis horizontal tipis, baris rapat (row height 36px–40px), teks rata kiri, angka rata kanan.
  - Keyboard-first: Tombol pintas jelas, focus ring terlihat (`outline: 2px solid #18181B`).

---

## 2. Prinsip Kode (Anti-Slop Code / YAGNI)

### 2.1 Aturan Minimalis
- **Native Platform First**: Gunakan kemampuan bawaan HTML/CSS/JS sebelum memasang library:
  - Gunakan elemen `<dialog>` untuk modal.
  - Gunakan atribut native form validation (`required`, `type="url"`).
  - Gunakan CSS Grid/Flexbox ringkas tanpa utility classes bersarang 10 tingkat.
- **Zero Premature Abstraction**:
  - Jangan buat class factory atau generic repository pattern jika hanya ada 1 implementasi IndexedDB.
  - Jangan buat wrapper component untuk elemen HTML standar jika styling bisa diaplikasikan langsung.
  - Fungsi utilitas hanya dibuat setelah pola berulang 3 kali (Rule of Three).
- **Minim Dependensi**:
  - Hindari paket eksternal untuk hal sepele (contoh: jangan install date library raksasa jika `Intl.DateTimeFormat` native cukup).
  - Tanpa state manager bloated jika store reaktif sederhana (<50 baris) sudah mencukupi kebutuhan MVP.
- **Pembersihan Kode**:
  - Hapus kode mati (*dead code*) segera; jangan tinggalkan komentar kode usang.
  - Setiap penyederhanaan sengaja ditandai dengan komentar `ponytail:` yang menyebutkan batas limit dan jalur peningkatannya.

---

## 3. Checklist Penerimaan Desain & Implementasi
- [ ] Antarmuka menggunakan layout padat informasi tanpa kartu dekoratif mengambang.
- [ ] Tidak ada warna gradasi ungu / ilustrasi kartun / bayangan tebal.
- [ ] Data status, tanggal, dan angka menggunakan aksen monospace.
- [ ] Aksesibilitas keyboard dan focus ring berfungsi di semua tombol dan field.
- [ ] Struktur kode langsung, minim layer abstraksi, dan bebas dependensi tak perlu.
