// Realistic Indonesian Job Seeker Seed Data for Demo / Testing
// Conforming to PRD & FRD-FSD specs

import {
  Company,
  JobPosting,
  Application,
  Task,
  Contact,
  DocumentLink,
  ActivityEvent
} from '../types';
import { putRecord, clearAllStores } from './db';
import { store } from './store';

export async function loadSeedData(): Promise<void> {
  await clearAllStores();

  const now = new Date();
  const isoNow = now.toISOString();

  const daysAgo = (days: number) => {
    const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return d.toISOString();
  };

  const daysFromNow = (days: number, hours: number = 10) => {
    const d = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    d.setHours(hours, 0, 0, 0);
    return d.toISOString();
  };

  // 1. Companies
  const companies: Company[] = [
    {
      id: 'comp-1',
      name: 'GoTo Financial',
      industry: 'Fintech & Payments',
      website: 'https://www.gotocompany.com',
      location: 'Jakarta Selatan',
      createdAt: daysAgo(20),
      updatedAt: daysAgo(2)
    },
    {
      id: 'comp-2',
      name: 'Traveloka',
      industry: 'Travel & Lifestyle Tech',
      website: 'https://www.traveloka.com',
      location: 'Tangerang / Hybrid',
      createdAt: daysAgo(15),
      updatedAt: daysAgo(1)
    },
    {
      id: 'comp-3',
      name: 'BCA Digital (blu)',
      industry: 'Digital Banking',
      website: 'https://bcadigital.co.id',
      location: 'Jakarta Pusat',
      createdAt: daysAgo(12),
      updatedAt: daysAgo(3)
    },
    {
      id: 'comp-4',
      name: 'Bibit (Stockbit Group)',
      industry: 'Wealthtech',
      website: 'https://bibit.id',
      location: 'Jakarta Selatan',
      createdAt: daysAgo(10),
      updatedAt: daysAgo(1)
    },
    {
      id: 'comp-5',
      name: 'DANA Indonesia',
      industry: 'Fintech',
      website: 'https://dana.id',
      location: 'Jakarta Selatan',
      createdAt: daysAgo(8),
      updatedAt: daysAgo(2)
    },
    {
      id: 'comp-6',
      name: 'Tiket.com',
      industry: 'OTA & Tech',
      website: 'https://tiket.com',
      location: 'Jakarta Barat',
      createdAt: daysAgo(5),
      updatedAt: daysAgo(4)
    }
  ];

  // 2. JobPostings
  const jobPostings: JobPosting[] = [
    {
      id: 'job-1',
      title: 'Junior Frontend Engineer (React/TypeScript)',
      companyId: 'comp-1',
      sourceUrl: 'https://www.linkedin.com/jobs/view/goto-fe-1234',
      foundDate: daysAgo(20).substring(0, 10),
      applyDeadline: daysFromNow(5).substring(0, 10),
      location: 'Jakarta Selatan',
      workType: 'hybrid',
      salaryMin: 9000000,
      salaryMax: 13000000,
      tags: ['Frontend', 'React', 'TypeScript', 'Fintech'],
      createdAt: daysAgo(20),
      updatedAt: daysAgo(2)
    },
    {
      id: 'job-2',
      title: 'Full Stack Developer - Associate',
      companyId: 'comp-2',
      sourceUrl: 'https://glints.com/id/opportunities/jobs/traveloka-fs',
      foundDate: daysAgo(15).substring(0, 10),
      applyDeadline: daysFromNow(10).substring(0, 10),
      location: 'BSD Tangerang',
      workType: 'hybrid',
      salaryMin: 10000000,
      salaryMax: 15000000,
      tags: ['FullStack', 'Node.js', 'React'],
      createdAt: daysAgo(15),
      updatedAt: daysAgo(1)
    },
    {
      id: 'job-3',
      title: 'Software Quality Assurance (QA) Automation',
      companyId: 'comp-3',
      sourceUrl: 'https://bcadigital.co.id/careers',
      foundDate: daysAgo(12).substring(0, 10),
      applyDeadline: daysFromNow(3).substring(0, 10),
      location: 'Jakarta Pusat',
      workType: 'onsite',
      salaryMin: 8500000,
      salaryMax: 12000000,
      tags: ['QA', 'Automation', 'Playwright', 'Banking'],
      createdAt: daysAgo(12),
      updatedAt: daysAgo(3)
    },
    {
      id: 'job-4',
      title: 'Frontend Engineer - Web Investment',
      companyId: 'comp-4',
      sourceUrl: 'https://www.linkedin.com/jobs/view/bibit-fe-5678',
      foundDate: daysAgo(10).substring(0, 10),
      applyDeadline: daysFromNow(7).substring(0, 10),
      location: 'Jakarta Selatan',
      workType: 'remote',
      salaryMin: 11000000,
      salaryMax: 16000000,
      tags: ['Frontend', 'Vue', 'TypeScript', 'Remote'],
      createdAt: daysAgo(10),
      updatedAt: daysAgo(1)
    },
    {
      id: 'job-5',
      title: 'Backend Engineer (Golang)',
      companyId: 'comp-5',
      sourceUrl: 'https://jobstreet.co.id/job/dana-be-999',
      foundDate: daysAgo(8).substring(0, 10),
      applyDeadline: daysFromNow(14).substring(0, 10),
      location: 'Jakarta Selatan',
      workType: 'hybrid',
      salaryMin: 10000000,
      salaryMax: 14000000,
      tags: ['Backend', 'Golang', 'Microservices'],
      createdAt: daysAgo(8),
      updatedAt: daysAgo(2)
    },
    {
      id: 'job-6',
      title: 'Associate Product Operations',
      companyId: 'comp-6',
      sourceUrl: 'https://kalibrr.com/c/tiket-po',
      foundDate: daysAgo(5).substring(0, 10),
      applyDeadline: daysFromNow(2).substring(0, 10),
      location: 'Jakarta Barat',
      workType: 'onsite',
      salaryMin: 7500000,
      salaryMax: 10000000,
      tags: ['Product', 'Operations', 'Entry-Level'],
      createdAt: daysAgo(5),
      updatedAt: daysAgo(4)
    }
  ];

  // 3. Applications
  const applications: Application[] = [
    {
      id: 'app-1',
      jobPostingId: 'job-1',
      stage: 'Interview',
      dateApplied: daysAgo(18).substring(0, 10),
      expectedSalary: 12000000,
      notes: 'Lolos screening HR, masuk tahap User Interview dengan Lead Frontend Engineer.',
      lastActivityAt: daysAgo(1),
      createdAt: daysAgo(20),
      updatedAt: daysAgo(1)
    },
    {
      id: 'app-2',
      jobPostingId: 'job-2',
      stage: 'Screening',
      dateApplied: daysAgo(14).substring(0, 10),
      expectedSalary: 13000000,
      notes: 'Sudah kirim online assessment hacker rank, sedang menunggu hasil penilaian.',
      lastActivityAt: daysAgo(2),
      createdAt: daysAgo(15),
      updatedAt: daysAgo(2)
    },
    {
      id: 'app-3',
      jobPostingId: 'job-3',
      stage: 'Offer',
      dateApplied: daysAgo(12).substring(0, 10),
      expectedSalary: 10000000,
      benefits: 'BPJS, Asuransi Swasta, Bonus Tahunan, Laptop Mac',
      notes: 'Penawaran offering letter diterima via email, batas konfirmasi akhir pekan ini.',
      lastActivityAt: daysAgo(1),
      createdAt: daysAgo(12),
      updatedAt: daysAgo(1)
    },
    {
      id: 'app-4',
      jobPostingId: 'job-4',
      stage: 'Applied',
      dateApplied: daysAgo(4).substring(0, 10),
      expectedSalary: 14000000,
      notes: 'Melamar via LinkedIn Easy Apply. Portofolio Next.js dilampirkan.',
      lastActivityAt: daysAgo(4),
      createdAt: daysAgo(10),
      updatedAt: daysAgo(4)
    },
    {
      id: 'app-5',
      jobPostingId: 'job-5',
      stage: 'ToApply',
      notes: 'Perlu menyesuaikan CV agar menonjolkan pengalaman project Golang & Docker.',
      lastActivityAt: daysAgo(2),
      createdAt: daysAgo(8),
      updatedAt: daysAgo(2)
    },
    {
      id: 'app-6',
      jobPostingId: 'job-6',
      stage: 'Saved',
      notes: 'Menunggu info referensi dari rekan kampus di tim ops.',
      lastActivityAt: daysAgo(4),
      createdAt: daysAgo(5),
      updatedAt: daysAgo(4)
    }
  ];

  // 4. Tasks (including an overdue task for realistic overdue highlight)
  const tasks: Task[] = [
    {
      id: 'task-1',
      applicationId: 'app-1',
      type: 'Interview',
      title: 'Wawancara User (Tech Deep Dive & Live Coding)',
      dueDate: daysFromNow(1, 14), // Besok jam 14:00
      priority: 'High',
      status: 'Open',
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2)
    },
    {
      id: 'task-2',
      applicationId: 'app-4',
      type: 'FollowUp',
      title: 'Kirim pesan follow-up status ke Recruiter via LinkedIn',
      dueDate: daysAgo(1), // KEMARIN -> OVERDUE (!)
      priority: 'Med',
      status: 'Open',
      createdAt: daysAgo(4),
      updatedAt: daysAgo(4)
    },
    {
      id: 'task-3',
      applicationId: 'app-3',
      type: 'Assignment',
      title: 'Review Offering Letter & Cek klausul probation',
      dueDate: daysFromNow(2, 17),
      priority: 'High',
      status: 'Open',
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1)
    },
    {
      id: 'task-4',
      applicationId: 'app-5',
      type: 'Apply',
      title: 'Kirim berkas lamaran backend sebelum deadline',
      dueDate: daysFromNow(4, 23),
      priority: 'Med',
      status: 'Open',
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2)
    }
  ];

  // 5. Contacts
  const contacts: Contact[] = [
    {
      id: 'contact-1',
      applicationId: 'app-1',
      companyId: 'comp-1',
      name: 'Aditya Pratama',
      role: 'Tech Talent Acquisition Specialist',
      email: 'aditya.p@gotofinancial.com',
      phone: '+628123456789',
      linkedinUrl: 'https://linkedin.com/in/aditya-pratama-ta',
      notes: 'Ramah dan responsif via WhatsApp saat jadwal interview di-reschedule.',
      createdAt: daysAgo(10),
      updatedAt: daysAgo(2)
    },
    {
      id: 'contact-2',
      applicationId: 'app-3',
      companyId: 'comp-3',
      name: 'Sari Wulandari',
      role: 'People & Culture Partner',
      email: 'sari.wulandari@bcadigital.co.id',
      phone: '+628198765432',
      linkedinUrl: 'https://linkedin.com/in/sari-wulandari-hr',
      notes: 'PIC yang mengirimkan penawaran resmi offering letter.',
      createdAt: daysAgo(5),
      updatedAt: daysAgo(1)
    }
  ];

  // 6. Documents
  const documents: DocumentLink[] = [
    {
      id: 'doc-1',
      applicationId: 'app-1',
      label: 'CV_Frontend_Ghilman_v3.pdf',
      url: 'https://drive.google.com/file/d/demo-cv-frontend-goto',
      createdAt: daysAgo(18)
    },
    {
      id: 'doc-2',
      applicationId: 'app-1',
      label: 'Live Web Portfolio (ghilmanzufar.my.id)',
      url: 'https://www.ghilmanzufar.my.id/',
      createdAt: daysAgo(18)
    },
    {
      id: 'doc-3',
      applicationId: 'app-3',
      label: 'CV_QA_Automation_Final.pdf',
      url: 'https://drive.google.com/file/d/demo-cv-qa-bca',
      createdAt: daysAgo(12)
    }
  ];

  // 7. Activity Events
  const activities: ActivityEvent[] = [
    {
      id: 'act-1',
      applicationId: 'app-1',
      type: 'StageChanged',
      at: daysAgo(1),
      payload: { from: 'Screening', to: 'Interview' }
    },
    {
      id: 'act-2',
      applicationId: 'app-1',
      type: 'StageChanged',
      at: daysAgo(10),
      payload: { from: 'Applied', to: 'Screening' }
    },
    {
      id: 'act-3',
      applicationId: 'app-3',
      type: 'StageChanged',
      at: daysAgo(1),
      payload: { from: 'Interview', to: 'Offer' }
    },
    {
      id: 'act-4',
      applicationId: 'app-4',
      type: 'StageChanged',
      at: daysAgo(4),
      payload: { from: 'ToApply', to: 'Applied' }
    }
  ];

  // Batch insert into IndexedDB
  for (const c of companies) await putRecord('companies', c);
  for (const j of jobPostings) await putRecord('jobPostings', j);
  for (const a of applications) await putRecord('applications', a);
  for (const t of tasks) await putRecord('tasks', t);
  for (const c of contacts) await putRecord('contacts', c);
  for (const d of documents) await putRecord('documents', d);
  for (const a of activities) await putRecord('activities', a);

  // Reload store
  await store.init();
}
