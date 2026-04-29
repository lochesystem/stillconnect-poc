import { useEffect, useState } from "react";
import { readDB, subscribe } from "../mock/storage";
import type { MockDB } from "../mock/types";

export function useDB(): MockDB {
  const [db, setDb] = useState<MockDB>(() => readDB());
  useEffect(() => subscribe(() => setDb(readDB())), []);
  return db;
}
