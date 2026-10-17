"use client";
import { useSyncExternalStore } from 'react';
import { loadStudy, saveStudy, type StudyState } from './storage';
const server = { study: loadStudy(), ready: false, storageError: false };
let snapshot = server;
let initialized = false;
const listeners = new Set<() => void>();
function read() {
  let study = loadStudy();
  let storageError = false;
  try { study = loadStudy(window.localStorage); } catch { storageError = true; }
  snapshot = { study, ready: true, storageError };
  initialized = true;
}
function getSnapshot() { if (!initialized) read(); return snapshot; }
function notify() { listeners.forEach(listener => listener()); }
function subscribe(listener: () => void) {
  listeners.add(listener);
  function sync(event: StorageEvent) {
    if (event.key === 'nucleus:study:v1' || event.key === null) { read(); notify(); }
  }
  window.addEventListener('storage', sync);
  return () => { listeners.delete(listener); window.removeEventListener('storage', sync); };
}
function setStudy(update: (state: StudyState) => StudyState) {
  const study = update(getSnapshot().study);
  let persisted = false;
  try { persisted = saveStudy(study, window.localStorage); } catch { /* Session state remains usable. */ }
  snapshot = { study, ready: true, storageError: !persisted };
  notify();
}
export function useStudy() {
  return { ...useSyncExternalStore(subscribe, getSnapshot, () => server), setStudy };
}
