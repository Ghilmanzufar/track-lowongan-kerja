// Reactive Store for JobTrack — data layer via REST API (backend)

import {
  Application,
  JobPosting,
  Company,
  Task,
  Contact,
  DocumentLink,
  Attachment,
  ActivityEvent,
  ApplicationItem,
  ApplicationStage,
  FilterCriteria,
  WorkType,
  JobSource,
  AppView
} from '../types';
import {
  fetchApplications,
  createApplication as apiCreateApplication,
  updateApplicationStage as apiUpdateApplicationStage,
  updateApplicationDetails as apiUpdateApplicationDetails,
  deleteApplication as apiDeleteApplication,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  createContact as apiCreateContact,
  updateContact as apiUpdateContact,
  deleteContact as apiDeleteContact,
  createDocument as apiCreateDocument,
  updateDocument as apiUpdateDocument,
  deleteDocument as apiDeleteDocument,
  createAttachment as apiCreateAttachment,
  deleteAttachment as apiDeleteAttachment,
  saveInterviewPrep as apiSaveInterviewPrep
} from './api';

type Listener = () => void;

class JobTrackStore {
  private items: ApplicationItem[] = [];
  private filter: FilterCriteria = {};
  private currentView: AppView = 'dashboard';
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
    this.items = await fetchApplications();
    this.initialized = true;
    this.notify();
  }

  public reset(): void {
    this.items = [];
    this.initialized = false;
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

      if (this.filter.stages && this.filter.stages.length > 0) {
        if (!this.filter.stages.includes(application.stage)) {
          return false;
        }
      }

      if (this.filter.workTypes && this.filter.workTypes.length > 0) {
        if (!jobPosting.workType || !this.filter.workTypes.includes(jobPosting.workType)) {
          return false;
        }
      }

      if (this.filter.tags && this.filter.tags.length > 0) {
        const itemTags = jobPosting.tags || [];
        const hasTag = this.filter.tags.some((t) => itemTags.includes(t));
        if (!hasTag) return false;
      }

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

  public getView(): AppView {
    return this.currentView;
  }

  public setView(view: AppView): void {
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
    companyIndustry?: string;
    stage?: ApplicationStage;
    source?: JobSource;
    sourceUrl?: string;
    description?: string;
    requirements?: string;
    responsibilities?: string;
    location?: string;
    workType?: WorkType;
    salaryMin?: number;
    salaryMax?: number;
    applyDeadline?: string;
    notes?: string;
    tags?: string[];
  }): Promise<string> {
    const newItem = await apiCreateApplication(data);
    this.items.unshift(newItem);
    this.notify();
    return newItem.application.id;
  }

  public async updateApplicationStage(
    applicationId: string,
    newStage: ApplicationStage
  ): Promise<{ shouldOfferFollowUpTask: boolean }> {
    const item = this.items.find((i) => i.application.id === applicationId);
    if (!item || item.application.stage === newStage) {
      return { shouldOfferFollowUpTask: false };
    }

    const { item: updatedItem, shouldOfferFollowUpTask } = await apiUpdateApplicationStage(
      applicationId,
      newStage
    );

    const idx = this.items.findIndex((i) => i.application.id === applicationId);
    if (idx !== -1) this.items[idx] = updatedItem;

    this.items.sort(
      (a, b) =>
        new Date(b.application.lastActivityAt).getTime() -
        new Date(a.application.lastActivityAt).getTime()
    );

    this.notify();
    return { shouldOfferFollowUpTask };
  }

  public async updateApplicationDetails(
    applicationId: string,
    data: {
      notes?: string;
      expectedSalary?: number;
      benefits?: string;
      dateApplied?: string;
      title?: string;
      companyName?: string;
      companyIndustry?: string;
      location?: string;
      workType?: WorkType;
      salaryMin?: number;
      salaryMax?: number;
      applyDeadline?: string;
      source?: JobSource;
      sourceUrl?: string;
      description?: string;
      requirements?: string;
      responsibilities?: string;
      tags?: string[];
      noteAction?: string;
      noteSnippet?: string;
    }
  ): Promise<void> {
    const updatedItem = await apiUpdateApplicationDetails(applicationId, data);
    const idx = this.items.findIndex((i) => i.application.id === applicationId);
    if (idx !== -1) this.items[idx] = updatedItem;
    this.notify();
  }

  public async deleteApplication(applicationId: string): Promise<void> {
    await apiDeleteApplication(applicationId);
    const idx = this.items.findIndex((i) => i.application.id === applicationId);
    if (idx !== -1) this.items.splice(idx, 1);
    if (this.selectedAppId === applicationId) this.selectedAppId = null;
    this.notify();
  }

  // --- Task Operations ---

  public async addTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const task = await apiCreateTask(taskData);
    const item = this.items.find((i) => i.application.id === task.applicationId);
    if (item) {
      item.tasks.push(task);
      item.application.lastActivityAt = new Date().toISOString();
    }
    this.notify();
    return task;
  }

  public async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const updated = await apiUpdateTask(taskId, updates);
    for (const item of this.items) {
      const idx = item.tasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        item.tasks[idx] = updated;
        break;
      }
    }
    this.notify();
  }

  public async deleteTask(taskId: string): Promise<void> {
    await apiDeleteTask(taskId);
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
    const contact = await apiCreateContact(contactData);
    if (contact.applicationId) {
      const item = this.items.find((i) => i.application.id === contact.applicationId);
      if (item) item.contacts.push(contact);
    }
    this.notify();
    return contact;
  }

  public async updateContact(contactId: string, updates: Partial<Contact>): Promise<void> {
    const updated = await apiUpdateContact(contactId, updates);
    for (const item of this.items) {
      const idx = item.contacts.findIndex((c) => c.id === contactId);
      if (idx !== -1) {
        item.contacts[idx] = updated;
        break;
      }
    }
    this.notify();
  }

  public async deleteContact(contactId: string): Promise<void> {
    await apiDeleteContact(contactId);
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
    const doc = await apiCreateDocument(docData);
    const item = this.items.find((i) => i.application.id === doc.applicationId);
    if (item) item.documents.push(doc);
    this.notify();
    return doc;
  }

  public async updateDocument(docId: string, updates: Partial<DocumentLink>): Promise<void> {
    const updated = await apiUpdateDocument(docId, updates);
    for (const item of this.items) {
      const idx = item.documents.findIndex((d) => d.id === docId);
      if (idx !== -1) {
        item.documents[idx] = updated;
        break;
      }
    }
    this.notify();
  }

  public async deleteDocument(docId: string): Promise<void> {
    await apiDeleteDocument(docId);
    for (const item of this.items) {
      const idx = item.documents.findIndex((d) => d.id === docId);
      if (idx !== -1) {
        item.documents.splice(idx, 1);
        break;
      }
    }
    this.notify();
  }

  // --- Attachment Operations ---

  public async addAttachment(
    attData: Omit<Attachment, 'id' | 'createdAt'>
  ): Promise<Attachment> {
    const att = await apiCreateAttachment(attData);
    const item = this.items.find((i) => i.application.id === att.applicationId);
    if (item) {
      if (!item.attachments) item.attachments = [];
      item.attachments.unshift(att);
    }
    this.notify();
    return att;
  }

  public async deleteAttachment(attachmentId: string): Promise<void> {
    await apiDeleteAttachment(attachmentId);
    for (const item of this.items) {
      if (item.attachments) {
        const idx = item.attachments.findIndex((a) => a.id === attachmentId);
        if (idx !== -1) {
          item.attachments.splice(idx, 1);
          break;
        }
      }
    }
    this.notify();
  }

  // --- Interview Prep Operations ---

  public async saveInterviewPrep(applicationId: string, prepData: unknown): Promise<void> {
    await apiSaveInterviewPrep(applicationId, prepData);
    const item = this.items.find((i) => i.application.id === applicationId);
    if (item) {
      item.interviewPrep = prepData as any;
    }
    this.notify();
  }
}

export const store = new JobTrackStore();

