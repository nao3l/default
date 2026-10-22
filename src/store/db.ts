import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Annotation, Expression } from '../domain/expression';

interface PhrasebookDB extends DBSchema {
  userExpressions: { key: string; value: Expression };
  annotations: { key: string; value: Annotation };
}

export type Database = IDBPDatabase<PhrasebookDB>;

export function openDatabase(name = 'gentlemans-phrasebook'): Promise<Database> {
  return openDB<PhrasebookDB>(name, 1, {
    upgrade(db) {
      db.createObjectStore('userExpressions', { keyPath: 'id' });
      db.createObjectStore('annotations', { keyPath: 'expressionId' });
    },
  });
}
