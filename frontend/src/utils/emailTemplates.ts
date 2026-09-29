// Generator Template Email Komunikasi HRD & Rekruter
// Template profesional bilingual (Bahasa Indonesia & English) sesuai etika industri kerja

export interface EmailTemplate {
  id: string;
  category: 'followup' | 'interview' | 'offer' | 'declining';
  title: string;
  description: string;
  badge: string;
  subjectId: string;
  bodyId: string;
  subjectEn: string;
  bodyEn: string;
}

export interface EmailVariables {
  candidateName: string;
  companyName: string;
  jobTitle: string;
  hrName: string;
  interviewDate: string;
  portfolioUrl?: string;
  proposedSalary?: string;
  offeredSalary?: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'followup-application',
    category: 'followup',
    title: 'Follow-up Status Lamaran (7-14 Hari)',
    description: 'Menanyakan kabar kelanjutan berkas lamaran setelah 1-2 minggu tanpa kabar.',
    badge: 'Follow-up',
    subjectId: 'Follow-up Status Lamaran Kerja — {jobTitle} — {candidateName}',
    bodyId: `Yth. {hrName} / Tim Rekrutmen {companyName},

Semoga Bapak/Ibu dalam keadaan sehat.

Saya menulis email ini untuk menindaklanjuti berkas lamaran kerja yang saya kirimkan pada {interviewDate} untuk posisi {jobTitle} di {companyName}.

Saya sangat tertarik dengan visi dan perkembangan {companyName}, serta meyakini bahwa latar belakang dan keterampilan saya dapat memberikan kontribusi nyata bagi tim.

Apakah ada informasi terbaru mengenai status seleksi untuk posisi ini atau dokumen tambahan yang perlu saya lengkapi?

Terima kasih banyak atas waktu dan perhatian Bapak/Ibu.

Hormat saya,
{candidateName}`,
    subjectEn: 'Following Up on Job Application — {jobTitle} — {candidateName}',
    bodyEn: `Dear {hrName},

I hope this email finds you well.

I am writing to follow up on my application for the {jobTitle} position at {companyName}, submitted on {interviewDate}.

I remain very enthusiastic about the opportunity to join {companyName} and contribute to your team. Please let me know if there are any updates regarding the recruitment process or if you require any additional information from my side.

Thank you very much for your time and consideration.

Best regards,
{candidateName}`
  },
  {
    id: 'thank-you-interview',
    category: 'interview',
    title: 'Thank-You Note Pasca-Wawancara (H+0 / H+1)',
    description: 'Mengapresiasi waktu interviewer dan menegaskan kembali antusiasme serta kecocokan peran.',
    badge: 'Wawancara',
    subjectId: 'Terima Kasih atas Sesi Wawancara {jobTitle} — {candidateName}',
    bodyId: `Yth. {hrName},

Terima kasih banyak atas waktu dan kesempatan diskusi yang menyenangkan dalam sesi wawancara untuk posisi {jobTitle} pada {interviewDate}.

Melalui diskusi tersebut, saya semakin antusias terhadap rencana dan tantangan yang sedang dihadapi oleh tim di {companyName}. Saya semakin yakin bahwa pengalaman saya dapat selaras dan mendukung pencapaian target tim.

Jika Bapak/Ibu membutuhkan informasi atau portofolio pendukung tambahan, saya akan dengan senang hati menyediakannya.

Sekali lagi, terima kasih atas keramahan Bapak/Ibu. Saya sangat menantikan kabar baik selanjutnya.

Salam hangat,
{candidateName}`,
    subjectEn: 'Thank You — Interview for {jobTitle} — {candidateName}',
    bodyEn: `Dear {hrName},

Thank you very much for taking the time to speak with me on {interviewDate} regarding the {jobTitle} role at {companyName}.

I thoroughly enjoyed our conversation and learning more about the exciting initiatives your team is working on. The discussion reinforced my strong interest in joining {companyName} and contributing to its ongoing success.

Please feel free to reach out if you need any further materials or details regarding my experience.

Thank you once again, and I look forward to hearing from you.

Sincerely,
{candidateName}`
  },
  {
    id: 'interview-confirmation',
    category: 'interview',
    title: 'Konfirmasi Kehadiran Undangan Wawancara',
    description: 'Mengonfirmasi kesiapan menghadiri undangan wawancara atau tes seleksi secara resmi.',
    badge: 'Wawancara',
    subjectId: 'Konfirmasi Kehadiran Wawancara {jobTitle} — {candidateName}',
    bodyId: `Yth. {hrName} / Tim HR {companyName},

Terima kasih banyak atas undangan wawancara untuk posisi {jobTitle} di {companyName}.

Melalui email ini, saya mengonfirmasi kesiapan saya untuk hadir pada jadwal yang telah ditentukan:
Hari/Tanggal: {interviewDate}

Saya akan mempersiapkan diri dengan baik dan menunggu tautan ruang pertemuan virtual (Google Meet / Zoom) atau rincian lokasi pelaksanaan tes.

Terima kasih atas kesempatan yang diberikan.

Hormat saya,
{candidateName}`,
    subjectEn: 'Confirmation: Interview for {jobTitle} — {candidateName}',
    bodyEn: `Dear {hrName},

Thank you very much for the invitation to interview for the {jobTitle} position at {companyName}.

I am pleased to confirm my attendance for the scheduled interview on:
Date: {interviewDate}

I look forward to meeting with your team and discussing how my skill set aligns with your requirements.

Best regards,
{candidateName}`
  },
  {
    id: 'interview-reschedule',
    category: 'interview',
    title: 'Permohonan Penjadwalan Ulang Wawancara (Reschedule)',
    description: 'Memohon perubahan waktu wawancara secara sopan dengan alasan profesional dan opsi waktu baru.',
    badge: 'Wawancara',
    subjectId: 'Permohonan Penjadwalan Ulang Wawancara {jobTitle} — {candidateName}',
    bodyId: `Yth. {hrName},

Terima kasih atas undangan wawancara untuk posisi {jobTitle} di {companyName} yang dijadwalkan pada {interviewDate}.

Sebelumnya saya memohon maaf yang sebesar-besarnya. Dikarenakan adanya agenda mendesak yang tidak dapat saya tinggalkan pada waktu tersebut, dengan kerendahan hati saya memohon apakah memungkinkan untuk menjadwalkan ulang sesi wawancara ke waktu alternatif?

Saya sangat fleksibel pada beberapa pilihan waktu berikut:
1. Satu hari setelah jadwal semula (pagi / siang)
2. Dua hari setelah jadwal semula (pukul 13.00 - 17.00 WIB)

Saya tetap sangat berkomitmen dan antusias untuk mengikuti proses seleksi di {companyName}. Mohon maaf atas ketidaknyamanan yang ditimbulkan.

Terima kasih banyak atas pengertian dan fleksibilitas Bapak/Ibu.

Hormat saya,
{candidateName}`,
    subjectEn: 'Request to Reschedule Interview — {jobTitle} — {candidateName}',
    bodyEn: `Dear {hrName},

Thank you very much for inviting me to interview for the {jobTitle} position, originally scheduled for {interviewDate}.

Unfortunately, due to an unavoidable prior commitment, I will be unable to attend the interview at the proposed time. I sincerely apologize for any inconvenience this may cause.

Would it be possible to reschedule our conversation to an alternative time? I am widely available on the following days:
- [Alternative Date 1, Time]
- [Alternative Date 2, Time]

I remain deeply interested in the role and look forward to the opportunity to speak with your team.

Thank you very much for your understanding.

Best regards,
{candidateName}`
  },
  {
    id: 'salary-negotiation',
    category: 'offer',
    title: 'Negosiasi Penawaran Gaji (Salary Counter-Offer)',
    description: 'Mengajukan penyesuaian nominal offering letter secara elegan berbasis riset dan nilai tambah.',
    badge: 'Penawaran',
    subjectId: 'Diskusi Penawaran Kerja — {jobTitle} — {candidateName}',
    bodyId: `Yth. {hrName},

Terima kasih banyak atas penawaran resmi (Offering Letter) untuk posisi {jobTitle} di {companyName}. Saya sangat senang dan bangga menerima apresiasi serta kepercayaan dari tim Bapak/Ibu.

Setelah mempelajari rincian kompensasi dan tanggung jawab peran ini, saya ingin mendiskusikan kemungkinan penyesuaian pada komponen gaji pokok. Berdasarkan riset pasar industri terkini serta bekal keahlian yang dapat saya bawa langsung ke tim, apakah memungkinkan jika nominal penawaran disesuaikan ke kisaran {proposedSalary}?

Saya sangat yakin dapat memberikan dampak positif dan nilai tambah yang sepadan bagi pertumbuhan {companyName}. Saya sangat terbuka untuk berdiskusi lebih lanjut guna mencapai kesepakatan terbaik bagi kedua belah pihak.

Terima kasih atas waktu dan keterbukaan Bapak/Ibu.

Hormat saya,
{candidateName}`,
    subjectEn: 'Job Offer Discussion — {jobTitle} — {candidateName}',
    bodyEn: `Dear {hrName},

Thank you very much for offering me the {jobTitle} position at {companyName}. I am thrilled about the prospect of joining the team and contributing to your company's mission.

After reviewing the details of the offer and considering the scope of responsibilities alongside current market benchmarks, I would like to inquire if there is flexibility regarding the base salary. Given my background and specialized skill set, I would like to respectfully propose a base compensation in the range of {proposedSalary}.

I am confident in my ability to deliver immediate value to {companyName} and would welcome the opportunity to discuss this further to find a mutually beneficial arrangement.

Thank you very much for your time and continued consideration.

Sincerely,
{candidateName}`
  },
  {
    id: 'offer-acceptance',
    category: 'offer',
    title: 'Konfirmasi Penerimaan Penawaran Kerja (Acceptance)',
    description: 'Menerima penawaran resmi, mengonfirmasi tanggal mulai kerja (start date), dan onboarding.',
    badge: 'Penawaran',
    subjectId: 'Konfirmasi Penerimaan Penawaran Kerja — {jobTitle} — {candidateName}',
    bodyId: `Yth. {hrName} dan Tim {companyName},

Terima kasih banyak atas penawaran resmi untuk posisi {jobTitle} di {companyName}.

Melalui email ini, dengan rasa bangga dan antusias, saya secara resmi menerima penawaran kerja tersebut sesuai dengan ketentuan yang tercantum pada surat penawaran (Offering Letter).

Sesuai kesepakatan, saya siap untuk mulai bergabung dan bekerja efektif pada tanggal:
Tanggal Mulai Kerja: {interviewDate}

Mohon informasikan jika terdapat dokumen atau prosedur onboarding tambahan yang perlu saya persiapkan sebelum hari pertama saya bekerja.

Sekali lagi terima kasih atas kepercayaan yang diberikan. Saya tidak sabar untuk mulai berkontribusi bersama tim {companyName}.

Salam hormat,
{candidateName}`,
    subjectEn: 'Formal Acceptance of Job Offer — {jobTitle} — {candidateName}',
    bodyEn: `Dear {hrName} and {companyName} Team,

Thank you very much for offering me the position of {jobTitle} at {companyName}.

I am delighted to formally accept the job offer and agree to the terms outlined in the offer letter. As discussed, I confirm my start date will be on:
Start Date: {interviewDate}

Please let me know if there are any onboarding documents or preparatory steps required from my side prior to my start date.

Thank you once again for this wonderful opportunity. I am excited to begin working with the team!

Warm regards,
{candidateName}`
  },
  {
    id: 'offer-declining',
    category: 'declining',
    title: 'Penolakan Penawaran Secara Sopan (Declining Offer)',
    description: 'Menolak tawaran kerja secara profesional tanpa merusak reputasi atau hubungan baik.',
    badge: 'Penolakan',
    subjectId: 'Tanggapan Mengenai Penawaran Kerja {jobTitle} — {candidateName}',
    bodyId: `Yth. {hrName} / Tim Rekrutmen {companyName},

Terima kasih sebesar-besarnya atas kesempatan dan penawaran kerja resmi untuk posisi {jobTitle} di {companyName}. Saya sangat mengapresiasi waktu dan interaksi positif selama seluruh tahapan proses seleksi bersama Bapak/Ibu.

Setelah pertimbangan yang sangat matang mengenai arah karir saya saat ini, dengan berat hati saya menyampaikan bahwa saya memutuskan untuk tidak dapat menerima penawaran kerja ini, dikarenakan [telah menerima tawaran lain yang lebih selaras dengan fokus spesifik saya saat ini / alasan pertimbangan pribadi].

Keputusan ini bukanlah hal yang mudah mengingat reputasi dan budaya kerja {companyName} yang sangat luar biasa.

Saya berharap {companyName} senantiasa sukses dan terus berkembang. Semoga kita dapat memiliki kesempatan untuk berkolaborasi kembali di masa mendatang.

Salam hangat dan hormat,
{candidateName}`,
    subjectEn: 'Response to Job Offer — {jobTitle} — {candidateName}',
    bodyEn: `Dear {hrName},

Thank you very much for offering me the position of {jobTitle} at {companyName}. I sincerely appreciate your time, support, and the positive interactions throughout the recruitment process.

After careful consideration of my current career trajectory, I regret to inform you that I must decline the offer. I have decided to pursue another opportunity that closely aligns with my immediate specialization.

This was a difficult decision, as I have immense respect for {companyName} and the great team you have built.

I wish you and {companyName} continued success, and I hope our paths may cross again in the future.

Best regards,
{candidateName}`
  }
];

/**
 * Mengisi variabel string dinamis seperti {candidateName}, {companyName}, dll.
 */
export function fillEmailTemplate(text: string, vars: EmailVariables): string {
  let result = text;
  result = result.replace(/\{candidateName\}/g, vars.candidateName || 'Pelamar Kerja');
  result = result.replace(/\{companyName\}/g, vars.companyName || 'Nama Perusahaan');
  result = result.replace(/\{jobTitle\}/g, vars.jobTitle || 'Posisi Lowongan');
  result = result.replace(/\{hrName\}/g, vars.hrName || 'Bapak/Ibu Tim Rekruter');
  result = result.replace(/\{interviewDate\}/g, vars.interviewDate || 'tanggal yang ditentukan');
  result = result.replace(/\{proposedSalary\}/g, vars.proposedSalary || 'Rp 15.000.000');
  result = result.replace(/\{offeredSalary\}/g, vars.offeredSalary || 'Rp 12.000.000');
  return result;
}
