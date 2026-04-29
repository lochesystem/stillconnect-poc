import type { MockDB } from "./types";

const STORAGE_KEY = "stillconnect.poc.db.v1";

const empty: MockDB = {
  orgs: [],
  demands: [],
  matches: [],
  auctions: [],
  bids: [],
  contracts: [],
  audit: [],
  current_buyer_id: "",
  current_supplier_id: "",
  tenant_key_b64: "",
};

export function readDB(): MockDB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...empty };
    return JSON.parse(raw) as MockDB;
  } catch {
    return { ...empty };
  }
}

export function writeDB(db: MockDB): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  notify();
}

export function patchDB(patch: (db: MockDB) => MockDB | void): MockDB {
  const db = readDB();
  const result = patch(db);
  const next = result === undefined ? db : result;
  writeDB(next);
  return next;
}

export function clearDB(): void {
  localStorage.removeItem(STORAGE_KEY);
  notify();
}

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn();
}

export function uid(prefix = "id"): string {
  return (
    prefix +
    "_" +
    Math.random().toString(36).slice(2, 10) +
    Date.now().toString(36).slice(-4)
  );
}
