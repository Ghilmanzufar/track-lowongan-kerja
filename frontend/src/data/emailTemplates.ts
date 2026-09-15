// Email & Message Templates for HRD / Recruiter Communication
// Provides tailored templates in Bahasa Indonesia & English with dynamic variable placeholders

export interface EmailTemplate {
  id: string;
  category: 'interview' | 'followup' | 'offer' | 'post-rejection';
  title: string;
  description: string;
  subjectTemplate: string;
  bodyTemplate: string;
  language: 'id' | 'en';
}

export interface TemplateVariables {
  candidateName?: string;
  candidatePhone?: string;
  candidateEmail?: string;
  recruiterName?: string;
  companyName?: string;
  jobTitle?: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewPlatform?: string;
  expectedSalary?: string;
  applicationDate?: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'interview-confirm-id',
    category: 'interview',
    title: 'Konfirmasi Kehadiran Wawancara',
    description: 'Menyatakan siap hadir dan mengonfirmasi waktu serta platform interview.',
    language: 'id',
    subjectTemplate: 'Konfirmasi Kehadiran Wawancara - [JobTitle] - [CandidateName]',
    bodyTemplate: `Yth. [RecruiterName] / Tim Rekrutmen [CompanyName],

Terima kasih atas kesempatan dan undangan wawancara untuk posisi [JobTitle] di [CompanyName].

Melalui pesan ini, saya mengonfirmasi bahwa saya bersedia dan siap menghadiri sesi wawancara yang dijadwalkan pada:
- Hari/Tanggal : [InterviewDate]
- Waktu        : [InterviewTime] WIB
- Media/Lokasi : [InterviewPlatform]

Apabila ada dokumen atau persiapan tambahan yang diperlukan sebelum sesi wawancara, mohon agar saya dapat diinformasikan.

Terima kasih banyak atas waktu dan kesempatan yang diberikan.

Salam hormat,
[CandidateName]
[CandidatePhone] | [CandidateEmail]`
  },
  {
    id: 'interview-confirm-en',
    category: 'interview',
    title: 'Interview Attendance Confirmation',
    description: 'Confirm attendance for the scheduled interview session in English.',
    language: 'en',
    subjectTemplate: 'Interview Confirmation - [JobTitle] - [CandidateName]',
    bodyTemplate: `Dear [RecruiterName] / Hiring Team at [CompanyName],

Thank you very much for inviting me to the interview for the [JobTitle] position.

I am writing to confirm my availability and attendance for the interview scheduled on:
- Date: [InterviewDate]
- Time: [InterviewTime]
- Platform/Location: [InterviewPlatform]

Please let me know if there are any specific materials or preparation required prior to our meeting.

Looking forward to speaking with you.

Best regards,
[CandidateName]
[CandidatePhone] | [CandidateEmail]`
  },
  {
    id: 'interview-reschedule-id',
    category: 'interview',
    title: 'Permintaan Reschedule Wawancara',
    description: 'Memohon izin perubahan jadwal interview dengan alasan profesional dan mengajukan opsi waktu baru.',
    language: 'id',
    subjectTemplate: 'Permohonan Penjadwalan Ulang Wawancara - [JobTitle] - [CandidateName]',
    bodyTemplate: `Yth. [RecruiterName] / Tim Rekrutmen [CompanyName],

Terima kasih banyak atas undangan wawancara untuk posisi [JobTitle] di [CompanyName].

Saya sangat antusias dengan kesempatan ini. Namun, dengan hormat saya ingin memohon maaf karena pada [InterviewDate] pukul [InterviewTime] saya memiliki komitmen mendesak yang belum dapat diubah.

Apakah memungkinkan jika sesi wawancara dijadwalkan ulang ke salah satu opsi berikut?
1. [Opsi Tanggal & Jam 1]
2. [Opsi Tanggal & Jam 2]

Saya memohon maaf atas ketidaknyamanan ini dan sangat menghargai fleksibilitas dari Bapak/Ibu.

Terima kasih atas pengertiannya.

Salam hormat,
[CandidateName]
[CandidatePhone] | [CandidateEmail]`
  },
  {
    id: 'followup-status-id',
    category: 'followup',
    title: 'Follow-up Status Lamaran (1-2 Minggu)',
    description: 'Menanyakan perkembangan status lamaran kerja yang telah dikirim.',
    language: 'id',
    subjectTemplate: 'Follow-up Lamaran Pekerjaan - [JobTitle] - [CandidateName]',
    bodyTemplate: `Yth. [RecruiterName] / Tim HRD [CompanyName],

Semoga Bapak/Ibu dalam keadaan sehat.

Saya mengirimkan lamaran untuk posisi [JobTitle] pada tanggal [ApplicationDate]. Saya ingin menanyakan apakah ada pembaruan mengenai proses seleksi untuk posisi tersebut.

Saya tetap sangat tertarik untuk dapat berkontribusi bersama tim [CompanyName] dan siap memberikan informasi tambahan yang dibutuhkan.

Terima kasih atas waktu dan perhatian Bapak/Ibu.

Salam hangat,
[CandidateName]
[CandidatePhone] | [CandidateEmail]`
  },
  {
    id: 'followup-interview-id',
    category: 'followup',
    title: 'Follow-up Hasil Wawancara & Ucapan Terima Kasih',
    description: 'Mengucapkan terima kasih setelah wawancara dan menanyakan kelanjutan tahapan seleksi.',
    language: 'id',
    subjectTemplate: 'Terima Kasih & Follow-up Wawancara - [JobTitle] - [CandidateName]',
    bodyTemplate: `Yth. [RecruiterName] / Tim Pewawancara [CompanyName],

Terima kasih atas waktu dan diskusi yang sangat menarik pada sesi wawancara posisi [JobTitle] pada [InterviewDate] lalu.

Diskusi tersebut semakin meyakinkan saya akan visi [CompanyName] dan bagaimana keahlian saya dapat mendukung pencapaian target tim.

Saya ingin menanyakan estimasi waktu untuk pengumuman tahap berikutnya. Apabila ada hal lain yang perlu saya lampirkan, jangan ragu untuk menghubungi saya.

Terima kasih sekali lagi atas kesempatan berharga ini.

Salam hormat,
[CandidateName]
[CandidatePhone] | [CandidateEmail]`
  },
  {
    id: 'offer-negotiation-id',
    category: 'offer',
    title: 'Penerimaan Tawaran & Negosiasi Gaji',
    description: 'Menyambut baik penawaran kerja dan mengajukan penyesuaian kompensasi dengan profesional.',
    language: 'id',
    subjectTemplate: 'Tanggapan Penawaran Kerja - [JobTitle] - [CandidateName]',
    bodyTemplate: `Yth. [RecruiterName] / Tim Manajemen [CompanyName],

Terima kasih banyak atas penawaran kerja resmi untuk posisi [JobTitle] di [CompanyName]. Saya sangat senang dan bersemangat menyambut kesempatan bergabung dengan tim.

Setelah meninjau rincian penawaran secara menyeluruh dan mempertimbangkan tanggung jawab peran serta pengalaman saya, saya ingin mendiskusikan apakah terdapat ruang untuk penyesuaian pada komponen gaji pokok menjadi kisaran [ExpectedSalary].

Saya sangat yakin dapat memberikan kontribusi signifikan sejak awal bergabung. Apakah kita dapat menjadwalkan panggilan singkat untuk mendiskusikan hal ini?

Terima kasih atas pertimbangan dan kesempatan yang diberikan.

Salam hormat,
[CandidateName]
[CandidatePhone] | [CandidateEmail]`
  },
  {
    id: 'offer-decline-id',
    category: 'offer',
    title: 'Menolak Tawaran Kerja dengan Sopan',
    description: 'Menolak penawaran kerja secara elegan demi menjaga hubungan baik dan networking.',
    language: 'id',
    subjectTemplate: 'Pemberitahuan Penawaran Kerja - [JobTitle] - [CandidateName]',
    bodyTemplate: `Yth. [RecruiterName] / Tim Rekrutmen [CompanyName],

Terima kasih banyak atas kepercayaan dan penawaran kerja untuk posisi [JobTitle] di [CompanyName].

Setelah mempertimbangkan rencana karir jangka panjang saya dengan matang, dengan berat hati saya menyampaikan bahwa saya tidak dapat menerima penawaran ini karena telah memutuskan untuk melanjutkan kesempatan lain yang lebih selaras dengan fokus saat ini.

Saya sangat terkesan dengan keramahan dan profesionalisme tim selama proses rekrutmen. Saya berharap kita tetap dapat menjalin hubungan baik di masa depan.

Sukses selalu untuk [CompanyName].

Salam hormat,
[CandidateName]`
  },
  {
    id: 'feedback-rejection-id',
    category: 'post-rejection',
    title: 'Permintaan Masukan / Feedback Pasca Penolakan',
    description: 'Merespons email penolakan secara positif untuk meminta masukan konstruktif demi perkembangan karir.',
    language: 'id',
    subjectTemplate: 'Terima Kasih atas Kesempatan - [JobTitle] - [CandidateName]',
    bodyTemplate: `Yth. [RecruiterName] / Tim Rekrutmen [CompanyName],

Terima kasih telah mengabarkan hasil seleksi untuk posisi [JobTitle].

Meskipun saya belum berkesempatan bergabung dengan [CompanyName] saat ini, saya sangat menghargai waktu dan kesempatan yang telah diberikan selama rangkaian proses rekrutmen.

Sebagai bahan evaluasi dan pengembangan diri, apabila berkenan, apakah Bapak/Ibu dapat memberikan masukan singkat mengenai aspek apa yang dapat saya tingkatkan untuk kesempatan di masa depan?

Terima kasih sekali lagi atas waktu dan perhatiannya. Semoga sukses untuk [CompanyName].

Salam hormat,
[CandidateName]`
  }
];

export function compileTemplate(templateText: string, vars: TemplateVariables): string {
  let result = templateText;
  result = result.replace(/\[CandidateName\]/g, vars.candidateName || 'Nama Anda');
  result = result.replace(/\[CandidatePhone\]/g, vars.candidatePhone || '08xxxxxxxxxx');
  result = result.replace(/\[CandidateEmail\]/g, vars.candidateEmail || 'email@anda.com');
  result = result.replace(/\[RecruiterName\]/g, vars.recruiterName || 'Bapak/Ibu HRD');
  result = result.replace(/\[CompanyName\]/g, vars.companyName || 'Nama Perusahaan');
  result = result.replace(/\[JobTitle\]/g, vars.jobTitle || 'Nama Posisi');
  result = result.replace(/\[InterviewDate\]/g, vars.interviewDate || 'Tanggal Wawancara');
  result = result.replace(/\[InterviewTime\]/g, vars.interviewTime || '10:00');
  result = result.replace(/\[InterviewPlatform\]/g, vars.interviewPlatform || 'Google Meet / Zoom / Kantor');
  result = result.replace(/\[ExpectedSalary\]/g, vars.expectedSalary || 'Rp XX.000.000');
  result = result.replace(/\[ApplicationDate\]/g, vars.applicationDate || 'Tanggal Melamar');
  return result;
}
