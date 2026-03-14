import type { Task, SprintSession } from './types';

const DB_NAME = 'todo-orbit-db';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('status', 'status', { unique: false });
        taskStore.createIndex('starred', 'starred', { unique: false });
        taskStore.createIndex('completedAt', 'completedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('sprintSessions')) {
        const sprintStore = db.createObjectStore('sprintSessions', { keyPath: 'id' });
        sprintStore.createIndex('taskId', 'taskId', { unique: false });
        sprintStore.createIndex('startedAt', 'startedAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
  });
}

function getDB(): Promise<IDBDatabase> {
  return initDB();
}

export async function getAllTasks(): Promise<Task[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readonly');
    const store = tx.objectStore('tasks');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as Task[]);
    request.onerror = () => reject(request.error);
  });
}

export async function saveTask(task: Task): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    const request = store.put(task);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllSprints(): Promise<SprintSession[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sprintSessions', 'readonly');
    const store = tx.objectStore('sprintSessions');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as SprintSession[]);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSprint(session: SprintSession): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sprintSessions', 'readwrite');
    const store = tx.objectStore('sprintSessions');
    const request = store.put(session);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearCompletedTasks(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    const index = store.index('status');
    const request = index.openCursor(IDBKeyRange.only('done'));

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
