// Lightweight Reactive Store for JobTrack (<150 lines, Zero external dependencies)
// Conforming to anti-slop.md (Section 2.1) & architecture.md (Section 3)

import {
  Application,
  JobPosting,
  Company,
  Task,
  Contact,
  DocumentLink,
  ActivityEvent,
  ApplicationItem,
  ApplicationStage,
  FilterCriteria,
  WorkType
} from '../types';
import {
  getAllRecords,
  putRecord,
  deleteRecord,
  generateId,
  getRecordById
} from './db';

type Listener = () => void;

class JobTrackStore {
  private items: ApplicationItem[] = [];
  private filter: FilterCriteria = {};
  private currentView: 'board' | 'list' | 'agenda' | 'analytics' | 'export' = 'board';
  private selectedAppId: string | null = null;
  private listeners: Set<Listener> = new Set();
  private initialized = false;

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('Store listener error:', err);
      }
    }
  }

  public async init(): Promise<void> {
    const [companies, jobPostings, applications, tasks, contacts, documents, activities] =
      await Promise.all([
        getAllRecords<Company>('companies'),
        getAllRecords<JobPosting>('jobPostings'),
        getAllRecords<Application>('applications'),
        getAllRecords<Task>('tasks'),
        getAllRecords<Contact>('contacts'),
        getAllRecords<DocumentLink>('documents'),
        getAllRecords<ActivityEvent>('activities')
      ]);

    const companyMap = new Map<string, Company>(companies.map((c) => [c.id, c]));
    const jobMap = new Map<string, JobPosting>(jobPostings.map((j) => [j.id, j]));

    this.items = applications.map((app) => {
      const job = jobMap.get(app.jobPostingId) || {
        id: app.jobPostingId,
        title: 'Posisi Tidak Diketahui',
        companyId: '',
        createdAt: app.createdAt,
        updatedAt: app.updatedAt
      };

      const company = companyMap.get(job.companyId) || {
        id: job.companyId || generateId(),
        name: 'Perusahaan Tidak Diketahui',
        createdAt: app.createdAt,
        updatedAt: app.updatedAt
      };

      return {
        application: app,
        jobPosting: job,
        company,
        tasks: tasks.filter((t) => t.applicationId === app.id),
        contacts: contacts.filter((c) => c.applicationId === app.id),
        documents: documents.filter((d) => d.applicationId === app.id),
        activities: activities
          .filter((a) => a.applicationId === app.id)
          .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      };
    });

    // Sort items by lastActivityAt descending
    this.items.sort(
      (a, b) =>
        new Date(b.application.lastActivityAt).getTime() -
        new Date(a.application.lastActivityAt).getTime()
    );

    this.initialized = true;
    this.notify();
  }

  public isReady(): boolean {
    return this.initialized;
  }

  public getItems(): ApplicationItem[] {
    return this.items;
  }

  public getFilteredItems(): ApplicationItem[] {
    return this.items.filter((item) => {
      const { application, jobPosting, company, tasks } = item;

      // Search query across position, company, notes, tags
      if (this.filter.searchQuery) {
        const q = this.filter.searchQuery.toLowerCase().trim();
        const titleMatch = jobPosting.title.toLowerCase().includes(q);
        const companyMatch = company.name.toLowerCase().includes(q);
        const notesMatch = (application.notes || '').toLowerCase().includes(q);
        const tagsMatch = (jobPosting.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!titleMatch && !companyMatch && !notesMatch && !tagsMatch) {
          return false;
        }
      }

      // Stage filter
      if (this.filter.stages && this.filter.stages.length > 0) {
        if (!this.filter.stages.includes(application.stage)) {
          return false;
        }
      }

      // Work type filter
      if (this.filter.workTypes && this.filter.workTypes.length > 0) {
        if (!jobPosting.workType || !this.filter.workTypes.includes(jobPosting.workType)) {
          return false;
        }
      }

      // Tags filter
      if (this.filter.tags && this.filter.tags.length > 0) {
        const itemTags = jobPosting.tags || [];
        const hasTag = this.filter.tags.some((t) => itemTags.includes(t));
        if (!hasTag) return false;
      }

      // Overdue tasks filter
      if (this.filter.hasOverdueTasks) {
        const now = new Date().toISOString();
        const hasOverdue = tasks.some(
          (t) => t.status === 'Open' && t.dueDate && t.dueDate < now
        );
        if (!hasOverdue) return false;
      }

      return true;
    });
  }

  public getFilter(): FilterCriteria {
    return this.filter;
  }

  public setFilter(criteria: Partial<FilterCriteria>): void {
    this.filter = { ...this.filter, ...criteria };
    this.notify();
  }

  public resetFilter(): void {
    this.filter = {};
    this.notify();
  }

  public getView(): 'board' | 'list' | 'agenda' | 'analytics' | 'export' {
    return this.currentView;
  }

  public setView(view: 'board' | 'list' | 'agenda' | 'analytics' | 'export'): void {
    this.currentView = view;
    this.notify();
  }

  public getSelectedApplicationId(): string | null {
    return this.selectedAppId;
  }

  public setSelectedApplicationId(id: string | null): void {
    this.selectedAppId = id;
    this.notify();
  }

  public getSelectedItem(): ApplicationItem | null {
    if (!this.selectedAppId) return null;
    return this.items.find((i) => i.application.id === this.selectedAppId) || null;
  }

  // --- Actions ---

  public async createApplication(data: {
    title: string;
    companyName: string;
    stage?: ApplicationStage;
    sourceUrl?: string;
    location?: string;
    workType?: WorkType;
    salaryMin?: number;
    salaryMax?: number;
    applyDeadline?: string;
    notes?: string;
    tags?: string[];
  }): Promise<string> {
    const now = new Date().toISOString();

    // 1. Find or create company
    const trimmedCompanyName = data.companyName.trim();
    let company = this.items.find(
      (i) => i.company.name.toLowerCase() === trimmedCompanyName.toLowerCase()
    )?.company;

    if (!company) {
      company = {
        id: generateId(),
        name: trimmedCompanyName,
        location: data.location,
        createdAt: now,
        updatedAt: now
      };
      await putRecord('companies', company);
    }

    // 2. Create JobPosting
    const jobPosting: JobPosting = {
      id: generateId(),
      title: data.title.trim(),
      companyId: company.id,
      sourceUrl: data.sourceUrl?.trim() || undefined,
      foundDate: now.substring(0, 10),
      applyDeadline: data.applyDeadline || undefined,
      location: data.location?.trim() || undefined,
      workType: data.workType,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now
    };
    await putRecord('jobPostings', jobPosting);

    // 3. Create Application
    const stage = data.stage || 'Saved';
    const applicationId = generateId();
    const application: Application = {
      id: applicationId,
      jobPostingId: jobPosting.id,
      stage,
      dateApplied: stage === 'Applied' ? now.substring(0, 10) : undefined,
      notes: data.notes?.trim() || undefined,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now
    };
    await putRecord('applications', application);

    // 4. Create Activity Event
    const activity: ActivityEvent = {
      id: generateId(),
      applicationId,
      type: 'Created',
      at: now,
      payload: { stage, title: jobPosting.title, company: company.name }
    };
    await putRecord('activities', activity);

    // Update in-memory state
    const newItem: ApplicationItem = {
      application,
      jobPosting,
      company,
      tasks: [],
      contacts: [],
      documents: [],
      activities: [activity]
    };

    this.items.unshift(newItem);
    this.notify();

    return applicationId;
  }

  public async updateApplicationStage(
    applicationId: string,
    newStage: ApplicationStage
  ): Promise<{ shouldOfferFollowUpTask: boolean }> {
    const item = this.items.find((i) => i.application.id === applicationId);
    if (!item || item.application.stage === newStage) {
      return { shouldOfferFollowUpTask: false };
    }

    const now = new Date().toISOString();
    const prevStage = item.application.stage;

    item.application.stage = newStage;
    item.application.lastActivityAt = now;
    item.application.updatedAt = now;
    if (newStage === 'Applied' && !item.application.dateApplied) {
      item.application.dateApplied = now.substring(0, 10);
    }

    await putRecord('applications', item.application);

    // Record activity
    const activity: ActivityEvent = {
      id: generateId(),
      applicationId,
      type: 'StageChanged',
      at: now,
      payload: { from: prevStage, to: newStage }
    };
    await putRecord('activities', activity);
    item.activities.unshift(activity);

    // Sort items by lastActivityAt
    this.items.sort(
      (a, b) =>
        new Date(b.application.lastActivityAt).getTime() -
        new Date(a.application.lastActivityAt).getTime()
    );

    this.notify();

    // Check FRD-FSD rule: moving to Applied offers auto follow-up task
    const shouldOfferFollowUpTask = newStage === 'Applied';
    return { shouldOfferFollowUpTask };
  }

  public async updateApplicationDetails(
    applicationId: string,
    data: {
      notes?: string;
      expectedSalary?: number;
      benefits?: string;
      title?: string;
      companyName?: string;
      location?: string;
      workType?: WorkType;
      salaryMin?: number;
      salaryMax?: number;
      applyDeadline?: string;
      sourceUrl?: string;
      tags?: string[];
    }
  ): Promise<void> {
    const item = this.items.find((i) => i.application.id === applicationId);
    if (!item) return;

    const now = new Date().toISOString();

    if (data.notes !== undefined) item.application.notes = data.notes;
    if (data.expectedSalary !== undefined) item.application.expectedSalary = data.expectedSalary;
    if (data.benefits !== undefined) item.application.benefits = data.benefits;
    item.application.lastActivityAt = now;
    item.application.updatedAt = now;
    await putRecord('applications', item.application);

    if (data.title !== undefined) item.jobPosting.title = data.title;
    if (data.location !== undefined) item.jobPosting.location = data.location;
    if (data.workType !== undefined) item.jobPosting.workType = data.workType;
    if (data.salaryMin !== undefined) item.jobPosting.salaryMin = data.salaryMin;
    if (data.salaryMax !== undefined) item.jobPosting.salaryMax = data.salaryMax;
    if (data.applyDeadline !== undefined) item.jobPosting.applyDeadline = data.applyDeadline;
    if (data.sourceUrl !== undefined) item.jobPosting.sourceUrl = data.sourceUrl;
    if (data.tags !== undefined) item.jobPosting.tags = data.tags;
    item.jobPosting.updatedAt = now;
    await putRecord('jobPostings', item.jobPosting);

    if (data.companyName !== undefined && data.companyName.trim()) {
      item.company.name = data.companyName.trim();
      item.company.updatedAt = now;
      await putRecord('companies', item.company);
    }

    const activity: ActivityEvent = {
      id: generateId(),
      applicationId,
      type: 'NoteEdited',
      at: now
    };
    await putRecord('activities', activity);
    item.activities.unshift(activity);

    this.notify();
  }

  public async deleteApplication(applicationId: string): Promise<void> {
    const itemIndex = this.items.findIndex((i) => i.application.id === applicationId);
    if (itemIndex === -1) return;

    const item = this.items[itemIndex];

    // Delete tasks, contacts, documents, activities
    for (const t of item.tasks) await deleteRecord('tasks', t.id);
    for (const c of item.contacts) await deleteRecord('contacts', c.id);
    for (const d of item.documents) await deleteRecord('documents', d.id);
    for (const a of item.activities) await deleteRecord('activities', a.id);

    await deleteRecord('applications', applicationId);
    await deleteRecord('jobPostings', item.jobPosting.id);

    this.items.splice(itemIndex, 1);
    if (this.selectedAppId === applicationId) {
      this.selectedAppId = null;
    }

    this.notify();
  }

  // --- Task Operations ---

  public async addTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      ...taskData,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    };

    await putRecord('tasks', task);

    const item = this.items.find((i) => i.application.id === task.applicationId);
    if (item) {
      item.tasks.push(task);
      item.application.lastActivityAt = now;
      await putRecord('applications', item.application);

      const activity: ActivityEvent = {
        id: generateId(),
        applicationId: task.applicationId,
        type: 'TaskAdded',
        at: now,
        payload: { title: task.title, type: task.type, dueDate: task.dueDate }
      };
      await putRecord('activities', activity);
      item.activities.unshift(activity);
    }

    this.notify();
    return task;
  }

  public async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const task = await getRecordById<Task>('tasks', taskId);
    if (!task) return;

    const now = new Date().toISOString();
    const updatedTask: Task = {
      ...task,
      ...updates,
      updatedAt: now
    };

    await putRecord('tasks', updatedTask);

    const item = this.items.find((i) => i.application.id === task.applicationId);
    if (item) {
      const idx = item.tasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        item.tasks[idx] = updatedTask;
      }

      if (updates.status === 'Done' && task.status !== 'Done') {
        const activity: ActivityEvent = {
          id: generateId(),
          applicationId: task.applicationId,
          type: 'TaskDone',
          at: now,
          payload: { title: task.title }
        };
        await putRecord('activities', activity);
        item.activities.unshift(activity);
      }
    }

    this.notify();
  }

  public async deleteTask(taskId: string): Promise<void> {
    await deleteRecord('tasks', taskId);
    for (const item of this.items) {
      const idx = item.tasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        item.tasks.splice(idx, 1);
        break;
      }
    }
    this.notify();
  }

  // --- Contact Operations ---

  public async addContact(
    contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Contact> {
    const now = new Date().toISOString();
    const contact: Contact = {
      ...contactData,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    };

    await putRecord('contacts', contact);

    if (contact.applicationId) {
      const item = this.items.find((i) => i.application.id === contact.applicationId);
      if (item) {
        item.contacts.push(contact);
        const activity: ActivityEvent = {
          id: generateId(),
          applicationId: contact.applicationId,
          type: 'ContactAdded',
          at: now,
          payload: { name: contact.name, role: contact.role }
        };
        await putRecord('activities', activity);
        item.activities.unshift(activity);
      }
    }

    this.notify();
    return contact;
  }

  public async deleteContact(contactId: string): Promise<void> {
    await deleteRecord('contacts', contactId);
    for (const item of this.items) {
      const idx = item.contacts.findIndex((c) => c.id === contactId);
      if (idx !== -1) {
        item.contacts.splice(idx, 1);
        break;
      }
    }
    this.notify();
  }

  // --- Document Operations ---

  public async addDocument(docData: Omit<DocumentLink, 'id' | 'createdAt'>): Promise<DocumentLink> {
    const now = new Date().toISOString();
    const doc: DocumentLink = {
      ...docData,
      id: generateId(),
      createdAt: now
    };

    await putRecord('documents', doc);

    const item = this.items.find((i) => i.application.id === doc.applicationId);
    if (item) {
      item.documents.push(doc);
    }

    this.notify();
    return doc;
  }

  public async deleteDocument(docId: string): Promise<void> {
    await deleteRecord('documents', docId);
    for (const item of this.items) {
      const idx = item.documents.findIndex((d) => d.id === docId);
      if (idx !== -1) {
        item.documents.splice(idx, 1);
        break;
      }
    }
    this.notify();
  }
}

export const store = new JobTrackStore();
