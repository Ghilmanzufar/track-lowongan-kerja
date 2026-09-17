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
  AppView,
  UserDocument,
  DocumentVersion,
  DocumentCategory,
  DocumentStorageType,
  InterviewItem,
  CalendarEvent,
  ReminderItem,
  TrashItem,
  TrashSummary,
  TrashEntityType,
  DuplicateCheckResult
} from '../types';
import { checkDuplicateLocal } from '../utils/duplicateDetector';
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
  saveInterviewPrep as apiSaveInterviewPrep,
  fetchUserDocuments as apiFetchUserDocuments,
  createUserDocument as apiCreateUserDocument,
  updateUserDocument as apiUpdateUserDocument,
  deleteUserDocument as apiDeleteUserDocument,
  createDocumentVersion as apiCreateDocumentVersion,
  updateDocumentVersion as apiUpdateDocumentVersion,
  deleteDocumentVersion as apiDeleteDocumentVersion,
  linkApplicationDocument as apiLinkApplicationDocument,
  unlinkApplicationDocument as apiUnlinkApplicationDocument,
  createInterview as apiCreateInterview,
  updateInterview as apiUpdateInterview,
  deleteInterview as apiDeleteInterview,
  syncInterviewTasks as apiSyncInterviewTasks,
  fetchCalendarEvents as apiFetchCalendarEvents,
  createCalendarEvent as apiCreateCalendarEvent,
  updateCalendarEvent as apiUpdateCalendarEvent,
  deleteCalendarEvent as apiDeleteCalendarEvent,
  fetchReminders as apiFetchReminders,
  createReminder as apiCreateReminder,
  deleteReminder as apiDeleteReminder,
  fetchTrash as apiFetchTrash,
  restoreTrashItem as apiRestoreTrashItem,
  permanentDeleteTrashItem as apiPermanentDeleteTrashItem,
  emptyTrash as apiEmptyTrash,
  checkDuplicateApplication as apiCheckDuplicateApplication,
  updateFollowUp as apiUpdateFollowUp
} from './api';

type Listener = () => void;

class JobTrackStore {
  private items: ApplicationItem[] = [];
  private userDocuments: UserDocument[] = [];
  private events: CalendarEvent[] = [];
  private reminders: ReminderItem[] = [];
  private trashItems: TrashItem[] = [];
  private trashSummary: TrashSummary = {
    total: 0,
    applications: 0,
    documents: 0,
    tasks: 0,
    events: 0
  };
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
    const [apps, docs, evts, rems, trash] = await Promise.all([
      fetchApplications(),
      apiFetchUserDocuments().catch((err) => {
        console.error('Failed to load user documents:', err);
        return [] as UserDocument[];
      }),
      apiFetchCalendarEvents().catch((err) => {
        console.error('Failed to load calendar events:', err);
        return [] as CalendarEvent[];
      }),
      apiFetchReminders().catch((err) => {
        console.error('Failed to load reminders:', err);
        return [] as ReminderItem[];
      }),
      apiFetchTrash().catch((err) => {
        console.error('Failed to load trash:', err);
        return { summary: { total: 0, applications: 0, documents: 0, tasks: 0, events: 0 }, items: [] };
      })
    ]);
    this.items = apps;
    this.userDocuments = docs;
    this.events = evts;
    this.reminders = rems;
    this.trashItems = trash.items;
    this.trashSummary = trash.summary;
    this.initialized = true;
    this.notify();
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public reset(): void {
    this.items = [];
    this.userDocuments = [];
    this.events = [];
    this.reminders = [];
    this.trashItems = [];
    this.trashSummary = { total: 0, applications: 0, documents: 0, tasks: 0, events: 0 };
    this.initialized = false;
    this.notify();
  }

  public isReady(): boolean {
    return this.initialized;
  }

  public getItems(): ApplicationItem[] {
    return this.items;
  }

  public async reloadApplications(): Promise<ApplicationItem[]> {
    this.items = await fetchApplications();
    this.notify();
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
    appliedDocumentVersionIds?: string[];
    allowDuplicate?: boolean;
  }): Promise<string> {
    const newItem = await apiCreateApplication(data);
    this.items.unshift(newItem);
    this.notify();
    return newItem.application.id;
  }

  // --- Duplicate Detection ---

  public checkDuplicate(data: {
    companyName: string;
    title: string;
    sourceUrl?: string;
    excludeApplicationId?: string;
  }): DuplicateCheckResult {
    return checkDuplicateLocal(data, this.items);
  }

  public async checkDuplicateAsync(data: {
    companyName: string;
    title: string;
    sourceUrl?: string;
    excludeApplicationId?: string;
  }): Promise<DuplicateCheckResult> {
    // First try fast local check
    const local = this.checkDuplicate(data);
    if (local.isDuplicate && local.confidence === 'exact') {
      return local;
    }
    try {
      return await apiCheckDuplicateApplication(data);
    } catch {
      return local;
    }
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
      lastContactedAt?: string | null;
      nextFollowUpAt?: string | null;
      contactMethod?: string | null;
      responseStatus?: string | null;
      followUpNotes?: string | null;
    }
  ): Promise<void> {
    const updatedItem = await apiUpdateApplicationDetails(applicationId, data);
    const idx = this.items.findIndex((i) => i.application.id === applicationId);
    if (idx !== -1) this.items[idx] = updatedItem;
    this.notify();
  }

  public async updateFollowUp(
    applicationId: string,
    data: {
      lastContactedAt?: string | null;
      nextFollowUpAt?: string | null;
      contactMethod?: string | null;
      responseStatus?: string | null;
      followUpNotes?: string | null;
      syncTask?: boolean;
    }
  ): Promise<ApplicationItem> {
    const updatedItem = await apiUpdateFollowUp(applicationId, data);
    const idx = this.items.findIndex((i) => i.application.id === applicationId);
    if (idx !== -1) this.items[idx] = updatedItem;
    this.notify();
    return updatedItem;
  }

  public async deleteApplication(applicationId: string): Promise<void> {
    await apiDeleteApplication(applicationId);
    const idx = this.items.findIndex((i) => i.application.id === applicationId);
    if (idx !== -1) this.items.splice(idx, 1);
    if (this.selectedAppId === applicationId) this.selectedAppId = null;
    await this.loadTrash();
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
    await this.loadTrash();
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

  // --- Master Document & Resume Vault Operations ---

  public getUserDocuments(): UserDocument[] {
    return this.userDocuments;
  }

  public getUserDocumentsByCategory(category: DocumentCategory): UserDocument[] {
    return this.userDocuments.filter((d) => d.category === category);
  }

  public async reloadUserDocuments(): Promise<UserDocument[]> {
    this.userDocuments = await apiFetchUserDocuments();
    this.notify();
    return this.userDocuments;
  }

  public async createUserDocument(data: {
    title: string;
    category?: DocumentCategory;
    description?: string;
    initialVersionName?: string;
    storageType?: DocumentStorageType;
    url?: string;
    fileDataUrl?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    notes?: string;
    isDefault?: boolean;
  }): Promise<UserDocument> {
    const newDoc = await apiCreateUserDocument(data);
    await this.reloadUserDocuments();
    return newDoc;
  }

  public async updateUserDocument(
    id: string,
    data: { title?: string; category?: DocumentCategory; description?: string }
  ): Promise<UserDocument> {
    const updated = await apiUpdateUserDocument(id, data);
    await this.reloadUserDocuments();
    return updated;
  }

  public async deleteUserDocument(id: string): Promise<void> {
    await apiDeleteUserDocument(id);
    await Promise.all([this.reloadUserDocuments(), this.loadTrash()]);
  }

  public async createDocumentVersion(
    documentId: string,
    data: {
      versionName: string;
      storageType?: DocumentStorageType;
      url?: string;
      fileDataUrl?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
      notes?: string;
      isDefault?: boolean;
    }
  ): Promise<DocumentVersion> {
    const version = await apiCreateDocumentVersion(documentId, data);
    await this.reloadUserDocuments();
    return version;
  }

  public async updateDocumentVersion(
    versionId: string,
    data: {
      versionName?: string;
      storageType?: DocumentStorageType;
      url?: string;
      fileDataUrl?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
      notes?: string;
      isDefault?: boolean;
    }
  ): Promise<DocumentVersion> {
    const updated = await apiUpdateDocumentVersion(versionId, data);
    await this.reloadUserDocuments();
    return updated;
  }

  public async deleteDocumentVersion(versionId: string): Promise<void> {
    await apiDeleteDocumentVersion(versionId);
    await this.reloadUserDocuments();
  }

  // --- Applied Using Application Document Linking ---

  public async linkDocumentToApplication(
    applicationId: string,
    documentVersionId: string,
    notes?: string
  ): Promise<ApplicationItem> {
    const updatedItem = await apiLinkApplicationDocument(applicationId, {
      documentVersionId,
      notes
    });

    const idx = this.items.findIndex((i) => i.application.id === applicationId);
    if (idx !== -1) {
      this.items[idx] = updatedItem;
    }
    // Also refresh document usage counters
    await this.reloadUserDocuments();
    this.notify();
    return updatedItem;
  }

  public async unlinkDocumentFromApplication(
    applicationId: string,
    versionId: string
  ): Promise<ApplicationItem> {
    const updatedItem = await apiUnlinkApplicationDocument(applicationId, versionId);

    const idx = this.items.findIndex((i) => i.application.id === applicationId);
    if (idx !== -1) {
      this.items[idx] = updatedItem;
    }
    await this.reloadUserDocuments();
    this.notify();
    return updatedItem;
  }

  // --- Expanded Interview Module Operations ---

  public getInterviews(applicationId: string): InterviewItem[] {
    const item = this.items.find((i) => i.application.id === applicationId);
    return item?.interviews || [];
  }

  public async createInterview(
    applicationId: string,
    data: Partial<InterviewItem> & {
      syncOptions?: {
        createInterviewTask?: boolean;
        createPrepTask?: boolean;
      };
    }
  ): Promise<InterviewItem> {
    const interview = await apiCreateInterview(applicationId, data);
    await this.reloadApplications();
    return interview;
  }

  public async updateInterview(
    id: string,
    data: Partial<InterviewItem>
  ): Promise<InterviewItem> {
    const interview = await apiUpdateInterview(id, data);
    await this.reloadApplications();
    return interview;
  }

  public async deleteInterview(id: string): Promise<void> {
    await apiDeleteInterview(id);
    await this.reloadApplications();
  }

  public async syncInterviewTasks(
    id: string,
    options?: {
      createInterviewTask?: boolean;
      createPrepTask?: boolean;
      createFollowUpTask?: boolean;
      prepOffsetHours?: number;
      followUpOffsetDays?: number;
    }
  ): Promise<{ success: boolean; interview: InterviewItem; syncedTasks: any[] }> {
    const res = await apiSyncInterviewTasks(id, options);
    await this.reloadApplications();
    await this.reloadEvents();
    await this.reloadReminders();
    return res;
  }

  // --- Dedicated Calendar Events Operations ---

  public getEvents(): CalendarEvent[] {
    return this.events;
  }

  public async reloadEvents(): Promise<CalendarEvent[]> {
    this.events = await apiFetchCalendarEvents();
    this.notify();
    return this.events;
  }

  public async createEvent(
    data: Partial<CalendarEvent> & {
      createReminder?: boolean;
      reminderOffsetMinutes?: number;
    }
  ): Promise<CalendarEvent> {
    const event = await apiCreateCalendarEvent(data);
    await this.reloadEvents();
    await this.reloadReminders();
    return event;
  }

  public async updateEvent(
    id: string,
    data: Partial<CalendarEvent>
  ): Promise<CalendarEvent> {
    const event = await apiUpdateCalendarEvent(id, data);
    await this.reloadEvents();
    return event;
  }

  public async deleteEvent(id: string): Promise<void> {
    await apiDeleteCalendarEvent(id);
    await Promise.all([this.reloadEvents(), this.reloadReminders(), this.loadTrash()]);
  }

  // --- Dedicated Reminders Operations ---

  public getReminders(): ReminderItem[] {
    return this.reminders;
  }

  public async reloadReminders(): Promise<ReminderItem[]> {
    this.reminders = await apiFetchReminders();
    this.notify();
    return this.reminders;
  }

  public async createReminder(data: {
    title: string;
    remindAt: string;
    eventId?: string;
    taskId?: string;
    channel?: string;
  }): Promise<ReminderItem> {
    const reminder = await apiCreateReminder(data);
    await this.reloadReminders();
    return reminder;
  }

  public async deleteReminder(id: string): Promise<void> {
    await apiDeleteReminder(id);
    await this.reloadReminders();
  }

  // --- Dedicated Trash Operations ---

  public async loadTrash(type?: TrashEntityType): Promise<{ summary: TrashSummary; items: TrashItem[] }> {
    try {
      const data = await apiFetchTrash(type);
      this.trashItems = data.items;
      this.trashSummary = data.summary;
      this.notify();
      return data;
    } catch (err) {
      console.error('Failed to load trash:', err);
      return { summary: this.trashSummary, items: [] };
    }
  }

  public getTrashItems(): TrashItem[] {
    return this.trashItems;
  }

  public getTrashSummary(): TrashSummary {
    return this.trashSummary;
  }

  public async restoreFromTrash(entity: TrashEntityType, id: string): Promise<void> {
    await apiRestoreTrashItem(entity, id);
    await Promise.all([
      this.loadTrash(),
      this.init()
    ]);
  }

  public async permanentlyDeleteFromTrash(entity: TrashEntityType, id: string): Promise<void> {
    await apiPermanentDeleteTrashItem(entity, id);
    await this.loadTrash();
  }

  public async emptyAllTrash(entity?: string): Promise<void> {
    await apiEmptyTrash(entity);
    await this.loadTrash();
  }
}

export const store = new JobTrackStore();


