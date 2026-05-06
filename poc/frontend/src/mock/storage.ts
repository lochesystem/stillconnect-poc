import type { Demand, MockDB, NegotiationMode } from "./types";

const STORAGE_KEY = "stillconnect.poc.db.v1";

const empty: MockDB = {
  orgs: [],
  demands: [],
  matches: [],
  auctions: [],
  bids: [],
  offers: [],
  contracts: [],
  audit: [],
  current_buyer_id: "",
  current_supplier_id: "",
  tenant_key_b64: "",
};

function migrateParsed(db: MockDB): boolean {
  let dirty = false;
  if (!Array.isArray(db.offers)) {
    db.offers = [];
    dirty = true;
  }
  for (const d of db.demands) {
    const dem = d as Demand & { negotiation_mode?: NegotiationMode; offers_close_at?: string };
    if (!dem.negotiation_mode) {
      dem.negotiation_mode = "AUCTION";
      dirty = true;
    }
    if (!dem.offers_close_at) {
      dem.offers_close_at = dem.expires_at || new Date().toISOString();
      dirty = true;
    }
  }
  return dirty;
}

export function readDB(): MockDB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...empty };
    const db = JSON.parse(raw) as MockDB;
    if (migrateParsed(db)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      notify();
    }
    return db;
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
