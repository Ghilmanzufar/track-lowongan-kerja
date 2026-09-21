import { PrismaClient, ApplicationStage, JobSource, WorkType, TaskType, TaskPriority, TaskStatus, DocumentCategory, DocumentStorageType, InterviewType, InterviewStatus, ActivityEventType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedForUser(userId: string) {
  console.log(`Seeding dummy data for user: ${userId}`);

  // 1. Create Documents in Document Vault
  const cvDoc = await prisma.userDocument.create({
    data: {
      userId,
      title: 'Curriculum Vitae (CV) Software Engineer 2026',
      category: DocumentCategory.Resume,
      description: 'Master CV terupdate untuk posisi Frontend / Fullstack Engineer',
      versions: {
        create: [
          {
            versionName: 'v1.0 - Format ATS Standar',
            storageType: DocumentStorageType.Link,
            url: 'https://drive.google.com/file/d/dummy-cv-ats-2026/view',
            notes: 'CV hitam-putih ramah ATS tanpa tabel/grafik rumit',
            isDefault: false
          },
          {
            versionName: 'v2.1 - Modern Frontend & React Spesialis',
            storageType: DocumentStorageType.Link,
            url: 'https://drive.google.com/file/d/dummy-cv-frontend-2026/view',
            notes: 'Menonjolkan portofolio React, TypeScript, Next.js, dan optimasi performa',
            isDefault: true
          }
        ]
      }
    },
    include: { versions: true }
  });

  const clDoc = await prisma.userDocument.create({
    data: {
      userId,
      title: 'Surat Lamaran (Cover Letter) Tech',
      category: DocumentCategory.CoverLetter,
      description: 'Template surat pengantar lamaran kerja',
      versions: {
        create: [
          {
            versionName: 'v1.0 - Standar Bahasa Indonesia',
            storageType: DocumentStorageType.Link,
            url: 'https://drive.google.com/file/d/dummy-cover-letter-id/view',
            notes: 'Versi formal untuk perusahaan perbankan dan BUMN',
            isDefault: true
          }
        ]
      }
    },
    include: { versions: true }
  });

  const portDoc = await prisma.userDocument.create({
    data: {
      userId,
      title: 'Portofolio Proyek Web & Demo',
      category: DocumentCategory.Portfolio,
      description: 'Dokumentasi link live proyek dan repository GitHub',
      versions: {
        create: [
          {
            versionName: 'v2026 - Live Showcase',
            storageType: DocumentStorageType.Link,
            url: 'https://github.com/ghilmanzufar',
            notes: 'Tautan langsung ke repositori GitHub dan deployed web apps',
            isDefault: true
          }
        ]
      }
    },
    include: { versions: true }
  });

  const defaultCvVersion = cvDoc.versions.find(v => v.isDefault) || cvDoc.versions[0];
  const defaultClVersion = clDoc.versions[0];
  const defaultPortVersion = portDoc.versions[0];

  // Helper date generators
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  const daysAhead = (d: number, hour = 10) => {
    const dt = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
    dt.setHours(hour, 0, 0, 0);
    return dt;
  };

  // ── APP 1: Saved — BCA (Fullstack Web Developer) ──
  const compBca = await prisma.company.create({
    data: {
      userId,
      name: 'PT Bank Central Asia Tbk (BCA)',
      industry: 'Aktivitas Keuangan dan Perbankan',
      website: 'https://karir.bca.co.id',
      location: 'Jakarta Pusat (Menara BCA)'
    }
  });

  const jobBca = await prisma.jobPosting.create({
    data: {
      companyId: compBca.id,
      title: 'Fullstack Web Developer (Core Banking System)',
      source: JobSource.LinkedIn,
      sourceUrl: 'https://www.linkedin.com/jobs/view/bca-fullstack-dev',
      workType: WorkType.hybrid,
      location: 'Jakarta Pusat',
      salaryMin: 14000000,
      salaryMax: 19000000,
      tags: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
      description: 'Mengembangkan dan memelihara portal perbankan digital dan internal microservices.'
    }
  });

  const appBca = await prisma.application.create({
    data: {
      userId,
      jobPostingId: jobBca.id,
      stage: ApplicationStage.Saved,
      expectedSalary: 16000000,
      responseStatus: 'WaitingResponse',
      notes: 'Informasi lowongan dari kenalan di LinkedIn. Syarat pengalaman minimal 1-2 tahun dengan TypeScript.',
      lastActivityAt: daysAgo(1),
      tasks: {
        create: [
          {
            type: TaskType.Apply,
            title: 'Kirimkan berkas via website resmi BCA Karir',
            dueDate: daysAhead(2, 11),
            priority: TaskPriority.High,
            status: TaskStatus.Open
          }
        ]
      },
      stageHistory: {
        create: [{ fromStage: null, toStage: ApplicationStage.Saved, note: 'Menyimpan lowongan dari LinkedIn' }]
      }
    }
  });

  // ── APP 2: ToApply — Blibli (Frontend Engineer) ──
  const compBlibli = await prisma.company.create({
    data: {
      userId,
      name: 'Blibli (Global Digital Niaga)',
      industry: 'E-commerce & Teknologi',
      website: 'https://careers.blibli.com',
      location: 'Jakarta Barat'
    }
  });

  const jobBlibli = await prisma.jobPosting.create({
    data: {
      companyId: compBlibli.id,
      title: 'Senior Frontend Engineer (Seller Platform)',
      source: JobSource.Glints,
      sourceUrl: 'https://glints.com/id/jobs/blibli-frontend-seller',
      workType: WorkType.hybrid,
      location: 'Jakarta Barat',
      salaryMin: 18000000,
      salaryMax: 24000000,
      applyDeadline: daysAhead(3),
      tags: ['React', 'Next.js', 'TailwindCSS', 'Redux', 'Microfrontend'],
      description: 'Membangun antarmuka dashboard merchant seller Blibli dengan jutaan traffic aktif.'
    }
  });

  await prisma.application.create({
    data: {
      userId,
      jobPostingId: jobBlibli.id,
      stage: ApplicationStage.ToApply,
      expectedSalary: 20000000,
      responseStatus: 'WaitingResponse',
      notes: 'Sudah siapkan CV versi ATS. Perlu cek kembali kesesuaian kata kunci job description.',
      lastActivityAt: daysAgo(2),
      tasks: {
        create: [
          {
            type: TaskType.Apply,
            title: 'Review portofolio sebelum kirim lamaran ke Blibli',
            dueDate: daysAhead(1, 14),
            priority: TaskPriority.High,
            status: TaskStatus.Open
          }
        ]
      },
      stageHistory: {
        create: [
          { fromStage: null, toStage: ApplicationStage.Saved },
          { fromStage: ApplicationStage.Saved, toStage: ApplicationStage.ToApply, note: 'Kualifikasi sangat cocok, masuk daftar siap melamar' }
        ]
      }
    }
  });

  // ── APP 3: Applied — GoTo (Frontend Software Engineer) ──
  const compGoto = await prisma.company.create({
    data: {
      userId,
      name: 'GoTo (Gojek Tokopedia)',
      industry: 'Ekosistem Digital & SuperApp',
      website: 'https://gotocompany.com',
      location: 'Jakarta Selatan (Pasaraya Blok M)'
    }
  });

  const jobGoto = await prisma.jobPosting.create({
    data: {
      companyId: compGoto.id,
      title: 'Frontend Software Engineer - Core Logistics',
      source: JobSource.LinkedIn,
      sourceUrl: 'https://www.linkedin.com/jobs/view/goto-frontend-engineer',
      workType: WorkType.hybrid,
      location: 'Jakarta Selatan',
      salaryMin: 20000000,
      salaryMax: 28000000,
      tags: ['React', 'TypeScript', 'GraphQL', 'Webpack', 'CI/CD'],
      description: 'Mengembangkan fitur pelacakan pengiriman driver dan merchant pada platform logistik Gojek.'
    }
  });

  const appGoto = await prisma.application.create({
    data: {
      userId,
      jobPostingId: jobGoto.id,
      stage: ApplicationStage.Applied,
      dateApplied: daysAgo(4),
      expectedSalary: 22000000,
      lastContactedAt: daysAgo(4),
      nextFollowUpAt: daysAhead(3, 10),
      contactMethod: 'Email',
      responseStatus: 'WaitingResponse',
      followUpNotes: 'Lamaran dikirim melalui email Talent Acquisition dengan CV v2.1 dan link GitHub.',
      notes: 'Melamar via program referensi teman di Gojek. Menunggu kabar respon pertama.',
      lastActivityAt: daysAgo(4),
      tasks: {
        create: [
          {
            type: TaskType.FollowUp,
            title: 'Kirim follow-up pesan LinkedIn ke recruiter GoTo',
            dueDate: daysAhead(3, 10),
            priority: TaskPriority.Med,
            status: TaskStatus.Open
          }
        ]
      },
      stageHistory: {
        create: [
          { fromStage: null, toStage: ApplicationStage.Saved },
          { fromStage: ApplicationStage.Saved, toStage: ApplicationStage.Applied, note: 'Mengirimkan lamaran via website resmi GoTo' }
        ]
      }
    }
  });

  // Link CV v2.1 to GoTo application
  await prisma.applicationDocument.create({
    data: {
      applicationId: appGoto.id,
      documentVersionId: defaultCvVersion.id,
      roleType: DocumentCategory.Resume,
      notes: 'CV v2.1 dikirimkan saat apply'
    }
  });

  // ── APP 4: Screening — Traveloka (Web Platform Engineer) ──
  const compTraveloka = await prisma.company.create({
    data: {
      userId,
      name: 'Traveloka',
      industry: 'Travel & Financial Services Tech',
      website: 'https://careers.traveloka.com',
      location: 'BSD City, Tangerang'
    }
  });

  const jobTraveloka = await prisma.jobPosting.create({
    data: {
      companyId: compTraveloka.id,
      title: 'Web Platform Engineer (Remote)',
      source: JobSource.LinkedIn,
      sourceUrl: 'https://careers.traveloka.com/jobs/web-platform',
      workType: WorkType.remote,
      location: 'BSD City / Remote',
      salaryMin: 22000000,
      salaryMax: 30000000,
      tags: ['TypeScript', 'React', 'Node.js', 'Architecture', 'Web Performance'],
      description: 'Membangun shared design system UI kit dan performa render web Traveloka.'
    }
  });

  const appTraveloka = await prisma.application.create({
    data: {
      userId,
      jobPostingId: jobTraveloka.id,
      stage: ApplicationStage.Screening,
      dateApplied: daysAgo(9),
      expectedSalary: 25000000,
      lastContactedAt: daysAgo(2),
      nextFollowUpAt: daysAhead(1, 15),
      contactMethod: 'WhatsApp',
      responseStatus: 'WaitingResponse',
      followUpNotes: 'HR menghubungi via WhatsApp mengabarkan lolos seleksi berkas, meminta mengerjakan tes online HackerRank.',
      notes: 'Seleksi berkas lolos. Diberikan link tes koding berdurasi 75 menit.',
      lastActivityAt: daysAgo(1),
      contacts: {
        create: [
          {
            name: 'Nadira Maharani',
            role: 'Lead Tech Recruiter',
            email: 'nadira.recruiter@traveloka.com',
            phone: '081298765432',
            linkedinUrl: 'https://linkedin.com/in/nadira-maharani-traveloka',
            notes: 'Sangat responsif via WhatsApp dan email.'
          }
        ]
      },
      tasks: {
        create: [
          {
            type: TaskType.Assignment,
            title: 'Selesaikan Online Coding Assessment HackerRank Traveloka',
            dueDate: daysAgo(1), // OVERDUE TASK for visual demonstration in dashboard!
            priority: TaskPriority.High,
            status: TaskStatus.Open
          },
          {
            type: TaskType.FollowUp,
            title: 'Kirim email konfirmasi penyelesaian tes koding ke Nadira',
            dueDate: daysAhead(1, 10),
            priority: TaskPriority.Med,
            status: TaskStatus.Open
          }
        ]
      },
      stageHistory: {
        create: [
          { fromStage: null, toStage: ApplicationStage.Applied, note: 'Melamar via LinkedIn' },
          { fromStage: ApplicationStage.Applied, toStage: ApplicationStage.Screening, note: 'HR menghubungi, lanjut ke tahap HackerRank test' }
        ]
      }
    }
  });

  // Link documents to Traveloka
  await prisma.applicationDocument.create({
    data: {
      applicationId: appTraveloka.id,
      documentVersionId: defaultCvVersion.id,
      roleType: DocumentCategory.Resume
    }
  });
  await prisma.applicationDocument.create({
    data: {
      applicationId: appTraveloka.id,
      documentVersionId: defaultPortVersion.id,
      roleType: DocumentCategory.Portfolio
    }
  });

  // ── APP 5: Interview — Shopee (React Native / Mobile Web) ──
  const compShopee = await prisma.company.create({
    data: {
      userId,
      name: 'Shopee Indonesia (Sea Group)',
      industry: 'E-commerce & Digital Entertainment',
      website: 'https://careers.shopee.co.id',
      location: 'SCBD Jakarta Selatan (Pacific Century Place)'
    }
  });

  const jobShopee = await prisma.jobPosting.create({
    data: {
      companyId: compShopee.id,
      title: 'Frontend Engineer (ShopeePay & Logistics)',
      source: JobSource.Glints,
      sourceUrl: 'https://glints.com/id/jobs/shopee-frontend-engineer',
      workType: WorkType.hybrid,
      location: 'SCBD Jakarta',
      salaryMin: 24000000,
      salaryMax: 32000000,
      tags: ['React', 'TypeScript', 'Redux', 'System Design', 'WebSocket'],
      description: 'Mengembangkan checkout payment experience dan integrasi sistem pembayaran real-time.'
    }
  });

  const appShopee = await prisma.application.create({
    data: {
      userId,
      jobPostingId: jobShopee.id,
      stage: ApplicationStage.Interview,
      dateApplied: daysAgo(15),
      expectedSalary: 27000000,
      lastContactedAt: daysAgo(1),
      nextFollowUpAt: daysAhead(3, 17),
      contactMethod: 'Email',
      responseStatus: 'InterviewScheduled',
      followUpNotes: 'Undangan Google Calendar untuk sesi Technical Interview live coding sudah masuk.',
      notes: 'Lolos tahap tes koding dengan skor 95/100. Sekarang lanjut sesi wawancara teknis 1-on-1 dengan Engineering Manager.',
      lastActivityAt: daysAgo(1),
      contacts: {
        create: [
          {
            name: 'Rian Pratama',
            role: 'Engineering Manager - ShopeePay',
            email: 'rian.pratama@shopee.com',
            phone: '08119876543',
            notes: 'Pewawancara teknis pada sesi live coding'
          },
          {
            name: 'Cindy Claudia',
            role: 'HR Talent Acquisition Tech',
            email: 'cindy.c@shopee.com',
            notes: 'HR yang mengkoordinasikan jadwal wawancara'
          }
        ]
      },
      interviews: {
        create: [
          {
            roundTitle: 'Round 1: HR Screening & Behavioral',
            type: InterviewType.HR,
            status: InterviewStatus.Passed,
            scheduledAt: daysAgo(5),
            durationMinutes: 45,
            location: 'Google Meet',
            notes: 'Membahas latar belakang pengalaman, motivasi, dan ekspektasi gaji.'
          },
          {
            roundTitle: 'Round 2: Technical Live Coding & System Design',
            type: InterviewType.Technical,
            status: InterviewStatus.Scheduled,
            scheduledAt: daysAhead(2, 14),
            durationMinutes: 60,
            location: 'Google Meet',
            meetingLink: 'https://meet.google.com/shp-tech-live',
            interviewerName: 'Rian Pratama',
            interviewerRole: 'Engineering Manager',
            notes: 'Materi: Data structures, React lifecycle, custom hooks, dan arsitektur WebSocket realtime.'
          }
        ]
      },
      tasks: {
        create: [
          {
            type: TaskType.Interview,
            title: 'Latihan live coding problem solving & state management (Shopee)',
            dueDate: daysAhead(1, 19),
            priority: TaskPriority.High,
            status: TaskStatus.Open
          },
          {
            type: TaskType.FollowUp,
            title: 'Kirim thank-you note pasca wawancara ke Rian Pratama',
            dueDate: daysAhead(3, 10),
            priority: TaskPriority.Med,
            status: TaskStatus.Open
          }
        ]
      },
      stageHistory: {
        create: [
          { fromStage: null, toStage: ApplicationStage.Applied },
          { fromStage: ApplicationStage.Applied, toStage: ApplicationStage.Screening },
          { fromStage: ApplicationStage.Screening, toStage: ApplicationStage.Interview, note: 'Lolos tes algoritma, masuk tahap wawancara teknis' }
        ]
      }
    }
  });

  // ── APP 6: Offer — Tiket.com (Lead Frontend Engineer) ──
  const compTiket = await prisma.company.create({
    data: {
      userId,
      name: 'Tiket.com (PT Global Tiket Network)',
      industry: 'Online Travel Agent (OTA)',
      website: 'https://careers.tiket.com',
      location: 'Kuningan, Jakarta Selatan (Full Remote)'
    }
  });

  const jobTiket = await prisma.jobPosting.create({
    data: {
      companyId: compTiket.id,
      title: 'Lead Frontend Engineer (Accommodation Tech)',
      source: JobSource.JobStreet,
      sourceUrl: 'https://www.jobstreet.co.id/job/tiket-frontend-lead',
      workType: WorkType.remote,
      location: 'Jakarta / Full Remote',
      salaryMin: 28000000,
      salaryMax: 36000000,
      tags: ['React', 'Next.js', 'Performance', 'Team Leadership', 'GraphQL'],
      description: 'Memimpin tim engineering yang bertanggung jawab atas flow pemesanan hotel & akomodasi global.'
    }
  });

  await prisma.application.create({
    data: {
      userId,
      jobPostingId: jobTiket.id,
      stage: ApplicationStage.Offer,
      dateApplied: daysAgo(25),
      expectedSalary: 30000000,
      lastContactedAt: daysAgo(1),
      nextFollowUpAt: daysAhead(4, 11),
      contactMethod: 'Email',
      responseStatus: 'Replied',
      followUpNotes: 'Dokumen Offering Letter resmi telah diterima di email. Gaji pokok ditawarkan Rp 32.000.000.',
      benefits: 'Gaji Pokok Rp 32.000.000/bln, Asuransi rawat inap & jalan keluarga, budget laptop MacBook Pro M3 Max, bonus tahunan 2-3x gaji, tunjangan WFH bulanan.',
      notes: 'Lolos semua tahapan wawancara. Penawaran melebihi ekspektasi gaji awal! Perlu review klausul kontrak sebelum tanda tangan.',
      lastActivityAt: daysAgo(1),
      contacts: {
        create: [
          {
            name: 'Farhan Ramadhan',
            role: 'VP of Engineering',
            email: 'farhan.r@tiket.com',
            notes: 'Pewawancara sesi final culture fit'
          },
          {
            name: 'Jessica Tan',
            role: 'People & Culture Manager',
            email: 'jessica.tan@tiket.com',
            phone: '081233445566',
            notes: 'Menangani negosiasi offer dan kontrak kerja'
          }
        ]
      },
      tasks: {
        create: [
          {
            type: TaskType.FollowUp,
            title: 'Review kontrak kerja Tiket.com & kirim surat konfirmasi penerimaan (Acceptance)',
            dueDate: daysAhead(4, 11),
            priority: TaskPriority.High,
            status: TaskStatus.Open
          }
        ]
      },
      stageHistory: {
        create: [
          { fromStage: null, toStage: ApplicationStage.Applied },
          { fromStage: ApplicationStage.Applied, toStage: ApplicationStage.Screening },
          { fromStage: ApplicationStage.Screening, toStage: ApplicationStage.Interview },
          { fromStage: ApplicationStage.Interview, toStage: ApplicationStage.Offer, note: 'Menerima penawaran resmi dari HR Tiket.com' }
        ]
      }
    }
  });

  // ── APP 7: Accepted — Bank Jago (Senior Web Engineer) ──
  const compJago = await prisma.company.create({
    data: {
      userId,
      name: 'Bank Jago',
      industry: 'Fintech & Perbankan Digital',
      website: 'https://www.jago.com/career',
      location: 'Jakarta Selatan'
    }
  });

  const jobJago = await prisma.jobPosting.create({
    data: {
      companyId: compJago.id,
      title: 'Senior Web Platform Engineer',
      source: JobSource.CompanyWebsite,
      sourceUrl: 'https://www.jago.com/id/career/web-engineer',
      workType: WorkType.remote,
      location: 'Jakarta Selatan / Remote',
      salaryMin: 30000000,
      salaryMax: 40000000,
      tags: ['TypeScript', 'React', 'Security', 'Fintech', 'Microservices'],
      description: 'Membangun aplikasi perbankan digital generasi baru dengan reliabilitas tinggi.'
    }
  });

  await prisma.application.create({
    data: {
      userId,
      jobPostingId: jobJago.id,
      stage: ApplicationStage.Accepted,
      dateApplied: daysAgo(40),
      expectedSalary: 33000000,
      lastContactedAt: daysAgo(3),
      contactMethod: 'Email',
      responseStatus: 'Replied',
      benefits: 'Gaji Rp 34.500.000 gross, asuransi swasta Prudential, tunjangan internet Rp 1.500.000/bln, jatah cuti 18 hari.',
      notes: 'Penawaran resmi telah ditandatangani. Rencana mulai onboarding dan hari pertama kerja pada tanggal 1 bulan depan.',
      lastActivityAt: daysAgo(3),
      tasks: {
        create: [
          {
            type: TaskType.FollowUp,
            title: 'Kirim dokumen kelengkapan data BPJS Ketenagakerjaan & NPWP ke HR Bank Jago',
            dueDate: daysAhead(5, 10),
            priority: TaskPriority.Med,
            status: TaskStatus.Done
          }
        ]
      },
      stageHistory: {
        create: [
          { fromStage: null, toStage: ApplicationStage.Applied },
          { fromStage: ApplicationStage.Applied, toStage: ApplicationStage.Screening },
          { fromStage: ApplicationStage.Screening, toStage: ApplicationStage.Interview },
          { fromStage: ApplicationStage.Interview, toStage: ApplicationStage.Offer },
          { fromStage: ApplicationStage.Offer, toStage: ApplicationStage.Accepted, note: 'Tanda tangan kontrak kerja resmi (Onboarding Day 1)' }
        ]
      }
    }
  });

  // ── APP 8: Rejected — Dana Indonesia (Backend Engineer) ──
  const compDana = await prisma.company.create({
    data: {
      userId,
      name: 'DANA Indonesia (PT Espay Debit Indonesia Koe)',
      industry: 'Financial Technology / E-Wallet',
      website: 'https://dana.id/career',
      location: 'Jakarta Selatan'
    }
  });

  const jobDana = await prisma.jobPosting.create({
    data: {
      companyId: compDana.id,
      title: 'Backend Engineer - Payment Core',
      source: JobSource.LinkedIn,
      sourceUrl: 'https://www.linkedin.com/jobs/view/dana-backend',
      workType: WorkType.onsite,
      location: 'Capital Place, Jakarta',
      salaryMin: 16000000,
      salaryMax: 22000000,
      tags: ['Go', 'Microservices', 'Kafka', 'Redis', 'High Concurrency'],
      description: 'Mengelola transaksi pembayaran instan dengan konkurensi puluhan ribu TPS.'
    }
  });

  await prisma.application.create({
    data: {
      userId,
      jobPostingId: jobDana.id,
      stage: ApplicationStage.Rejected,
      dateApplied: daysAgo(30),
      expectedSalary: 18000000,
      lastContactedAt: daysAgo(12),
      contactMethod: 'Email',
      responseStatus: 'Replied',
      notes: 'Email penolakan diterima setelah sesi live coding tahap 1. Feedback: Perlu perdalam pengalaman konkurensi di bahasa Go.',
      lastActivityAt: daysAgo(12),
      stageHistory: {
        create: [
          { fromStage: null, toStage: ApplicationStage.Applied },
          { fromStage: ApplicationStage.Applied, toStage: ApplicationStage.Screening },
          { fromStage: ApplicationStage.Screening, toStage: ApplicationStage.Rejected, note: 'Tidak lolos sesi teknis Go language' }
        ]
      }
    }
  });

  // ── APP 9: Withdrawn — Telkom Indonesia ──
  const compTelkom = await prisma.company.create({
    data: {
      userId,
      name: 'Telkom Indonesia',
      industry: 'Telekomunikasi & Digital Connectivity',
      website: 'https://careers.telkom.co.id',
      location: 'Bandung / Jakarta'
    }
  });

  const jobTelkom = await prisma.jobPosting.create({
    data: {
      companyId: compTelkom.id,
      title: 'Web Software Engineer (B2B Platform)',
      source: JobSource.Referral,
      workType: WorkType.onsite,
      location: 'Bandung',
      salaryMin: 12000000,
      salaryMax: 16000000,
      tags: ['PHP', 'Laravel', 'Vue.js', 'MySQL'],
      description: 'Membangun aplikasi pemantauan jaringan internal pelanggan korporat.'
    }
  });

  await prisma.application.create({
    data: {
      userId,
      jobPostingId: jobTelkom.id,
      stage: ApplicationStage.Withdrawn,
      dateApplied: daysAgo(20),
      expectedSalary: 14000000,
      lastContactedAt: daysAgo(10),
      responseStatus: 'Replied',
      notes: 'Lamaran dibatalkan sendiri secara baik-baik karena telah menerima offer remote dari perusahaan lain.',
      lastActivityAt: daysAgo(10),
      stageHistory: {
        create: [
          { fromStage: null, toStage: ApplicationStage.Applied },
          { fromStage: ApplicationStage.Applied, toStage: ApplicationStage.Withdrawn, note: 'Menarik lamaran karena fokus ke proses offering Tiket.com & Bank Jago' }
        ]
      }
    }
  });

  console.log(`Successfully seeded comprehensive dummy applications for ${userId}!`);
}

async function main() {
  const users = await prisma.user.findMany();
  for (const u of users) {
    if (u.email === 'ghilmanzufar2004@gmail.com' || u.id === 'default-user') {
      await seedForUser(u.id);
    }
  }
}

main()
  .catch(e => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
