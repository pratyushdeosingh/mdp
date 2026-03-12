import { useEffect, useRef, useCallback } from 'react';
import type { AccidentEvent } from '../types';

const DB_NAME = 'mdp-helmet-db';
const DB_VERSION = 1;
const STORE_NAME = 'accidentEvents';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllEvents(): Promise<AccidentEvent[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const events = req.result as AccidentEvent[];
      events.sort((a, b) => b.timestamp - a.timestamp);
      resolve(events);
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function putEvents(events: AccidentEvent[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  for (const event of events) {
    store.put(event);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function clearAllEvents(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

/**
 * Hook to persist accident events to IndexedDB.
 * - Loads saved events on mount
 * - Saves events whenever they change
 */
export function useOfflineStore(
  accidentEvents: AccidentEvent[],
  setAccidentEvents: (events: AccidentEvent[]) => void,
): { isSynced: boolean; clearStorage: () => Promise<void> } {
  const isSynced = useRef(false);
  const hasLoadedRef = useRef(false);
  const prevLengthRef = useRef(0);

  // Load from IndexedDB on mount
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    getAllEvents()
      .then(saved => {
        if (saved.length > 0) {
          setAccidentEvents(saved);
        }
        isSynced.current = true;
      })
      .catch(err => {
        console.warn('[OfflineStore] Failed to load from IndexedDB:', err);
        isSynced.current = true;
      });
  }, [setAccidentEvents]);

  // Save to IndexedDB when events change
  useEffect(() => {
    if (!hasLoadedRef.current || !isSynced.current) return;
    // Only save if the array actually changed (length or content)
    if (accidentEvents.length === prevLengthRef.current && accidentEvents.length === 0) return;
    prevLengthRef.current = accidentEvents.length;

    putEvents(accidentEvents).catch(err => {
      console.warn('[OfflineStore] Failed to save to IndexedDB:', err);
    });
  }, [accidentEvents]);

  const clearStorage = useCallback(async () => {
    await clearAllEvents();
    setAccidentEvents([]);
  }, [setAccidentEvents]);

  return { isSynced: isSynced.current, clearStorage };
}
