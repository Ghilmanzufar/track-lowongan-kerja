// Interview Tab Constants and Type Definitions

import type { InterviewType } from '../../../types';

export type WawancaraSubtab = 'schedule' | 'prep' | 'questions' | 'star' | 'notes' | 'evaluation' | 'followup';

export const DEFAULT_PREP_CHECKLIST = [
  'Pelajari profil, visi, dan model bisnis perusahaan',
  'Pahami produk/layanan utama & kompetitor mereka',
  'Review ulang Job Description & requirements posisi',
  'Siapkan 3 contoh pencapaian dengan metode STAR',
  'Siapkan 3-5 pertanyaan berbobot untuk pewawancara',
  'Cek koneksi internet, kamera, & mikrofon (jika online)',
  'Review tech stack & siapkan live coding environment'
];

export const DEFAULT_QUESTIONS_BY_TYPE: Record<InterviewType, Array<{ q: string; a: string; cat: string }>> = {
  HR: [
    { q: 'Ceritakan tentang diri Anda dan perjalanan karier Anda sejauh ini.', a: 'Fokus pada relevansi pengalaman dengan posisi ini, highlight pencapaian utama, dan motivasi.', cat: 'General' },
    { q: 'Mengapa Anda tertarik bergabung dengan perusahaan ini?', a: 'Sebutkan visi/produk perusahaan dan bagaimana itu sejalan dengan nilai serta rencana karier saya.', cat: 'Behavioral' },
    { q: 'Bagaimana Anda menghadapi tekanan atau deadline yang sangat ketat?', a: 'Gunakan contoh konkret: prioritasi tugas, komunikasi proaktif, dan fokus pada solusi.', cat: 'Behavioral' }
  ],
  Technical: [
    { q: 'Jelaskan arsitektur proyek tersulit yang pernah Anda bangun dan tantangannya.', a: 'Jelaskan komponen sistem, database, caching, scaling bottle-neck, dan keputusan teknologi yang diambil.', cat: 'Technical' },
    { q: 'Bagaimana pendekatan Anda dalam debugging issue kritis di production?', a: 'Cek logging/monitoring, replikasi issue di staging, apply hotfix/rollback, dan buat post-mortem.', cat: 'Technical' },
    { q: 'Bagaimana Anda menjaga kualitas kode dan performa aplikasi?', a: 'Unit testing, code review, linting, profiling, dan prinsip clean architecture.', cat: 'Technical' }
  ],
  User: [
    { q: 'Bagaimana gaya kerja Anda saat berkolaborasi dengan tim lintas fungsi (Product, QA, Design)?', a: 'Komunikasi terbuka, alignment di awal sprint, empati terhadap kebutuhan bisnis.', cat: 'Leadership' },
    { q: 'Ceritakan pengalaman saat Anda berbeda pendapat dengan rekan tim / tech lead.', a: 'Fokus pada data dan argumen objektif, diskusikan trade-off, dan dukung keputusan akhir (disagree and commit).', cat: 'Behavioral' }
  ],
  Final: [
    { q: 'Apa ekspektasi kontribusi Anda dalam 30, 60, dan 90 hari pertama?', a: '30 hari: onboarding & pahami domain. 60 hari: deliver feature mandiri. 90 hari: inisiatif perbaikan proses/arsitektur.', cat: 'Leadership' },
    { q: 'Bagaimana aspirasi karier Anda dalam 2-3 tahun ke depan?', a: 'Ingin bertumbuh menjadi technical specialist / lead yang memberi dampak signifikan bagi produk.', cat: 'General' }
  ],
  Other: [
    { q: 'Ceritakan pencapaian terbesar dalam karier profesional Anda.', a: 'Jelaskan metrik dampak nyata (angka efisiensi, revenue, atau stabilitas sistem).', cat: 'General' }
  ]
};
