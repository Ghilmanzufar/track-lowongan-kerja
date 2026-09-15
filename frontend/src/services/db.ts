// IndexedDB Thin Wrapper for JobTrack (Database: jobtrack_mvp_v1)
// Conforming to architecture.md (Section 6) & FRD-FSD.md (Section 3.4)

import {
  Company,
  JobPosting,
  Application,
  Task,
  Contact,
  DocumentLink,
  Attachment,
  ActivityEvent
} from '../types';

const DB_NAME = 'jobtrack_mvp_v1';
const DB_VERSION = 2;

export type StoreName =
  | 'companies'
  | 'jobPostings'
  | 'applications'
  | 'tasks'
  | 'contacts'
  | 'documents'
  | 'attachments'
  | 'activities';

let dbInstance: IDBDatabase | null = null;

export function getDb(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Companies
      if (!db.objectStoreNames.contains('companies')) {
        const store = db.createObjectStore('companies', { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
      }

      // 2. JobPostings
      if (!db.objectStoreNames.contains('jobPostings')) {
        const store = db.createObjectStore('jobPostings', { keyPath: 'id' });
        store.createIndex('companyId', 'companyId', { unique: false });
        store.createIndex('title', 'title', { unique: false });
        store.createIndex('applyDeadline', 'applyDeadline', { unique: false });
      }

      // 3. Applications
      if (!db.objectStoreNames.contains('applications')) {
        const store = db.createObjectStore('applications', { keyPath: 'id' });
        store.createIndex('jobPostingId', 'jobPostingId', { unique: false });
        store.createIndex('stage', 'stage', { unique: false });
        store.createIndex('lastActivityAt', 'lastActivityAt', { unique: false });
      }

      // 4. Tasks
      if (!db.objectStoreNames.contains('tasks')) {
        const store = db.createObjectStore('tasks', { keyPath: 'id' });
        store.createIndex('applicationId', 'applicationId', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('dueDate', 'dueDate', { unique: false });
      }

      // 5. Contacts
      if (!db.objectStoreNames.contains('contacts')) {
        const store = db.createObjectStore('contacts', { keyPath: 'id' });
        store.createIndex('companyId', 'companyId', { unique: false });
        store.createIndex('applicationId', 'applicationId', { unique: false });
        store.createIndex('name', 'name', { unique: false });
      }

      // 6. Documents
      if (!db.objectStoreNames.contains('documents')) {
        const store = db.createObjectStore('documents', { keyPath: 'id' });
        store.createIndex('applicationId', 'applicationId', { unique: false });
      }

      // 7. Attachments (CV, Portofolio & Tailored Files)
      if (!db.objectStoreNames.contains('attachments')) {
        const store = db.createObjectStore('attachments', { keyPath: 'id' });
        store.createIndex('applicationId', 'applicationId', { unique: false });
      }

      // 8. Activities
      if (!db.objectStoreNames.contains('activities')) {
        const store = db.createObjectStore('activities', { keyPath: 'id' });
        store.createIndex('applicationId', 'applicationId', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('at', 'at', { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
    };
  });
}

// Generic CRUD helpers
export async function getAllRecords<T>(storeName: StoreName): Promise<T[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function getRecordById<T>(storeName: StoreName, id: string): Promise<T | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve((request.result as T) || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getRecordsByIndex<T>(
  storeName: StoreName,
  indexName: string,
  key: IDBValidKey
): Promise<T[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(key);

    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function putRecord<T>(storeName: StoreName, item: T): Promise<T> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteRecord(storeName: StoreName, id: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllStores(): Promise<void> {
  const stores: StoreName[] = [
    'companies',
    'jobPostings',
    'applications',
    'tasks',
    'contacts',
    'documents',
    'attachments',
    'activities'
  ];
  for (const s of stores) {
    await clearStore(s);
  }
}

// UUID generator without external dependency
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
