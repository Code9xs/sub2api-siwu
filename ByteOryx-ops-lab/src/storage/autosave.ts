import { openDB } from 'idb';
import { decodeProjectFile, encodeProjectFile } from '../domain/projectCodec';
import type { OpsProject } from '../domain/types';

const DB_NAME = 'ops-drawing-tool';
const STORE_NAME = 'autosave';
const LATEST_KEY = 'latest-project';

async function getAutosaveDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function saveAutosave(project: OpsProject): Promise<void> {
  const db = await getAutosaveDb();
  await db.put(STORE_NAME, encodeProjectFile(project), LATEST_KEY);
}

export async function loadAutosave(): Promise<OpsProject | null> {
  const db = await getAutosaveDb();
  const encodedProject = await db.get(STORE_NAME, LATEST_KEY);

  if (typeof encodedProject !== 'string') {
    if (encodedProject !== undefined) {
      await clearAutosave();
    }

    return null;
  }

  const decoded = decodeProjectFile(encodedProject);

  if (!decoded.ok) {
    await clearAutosave();
    return null;
  }

  return decoded.project;
}

export async function clearAutosave(): Promise<void> {
  const db = await getAutosaveDb();
  await db.delete(STORE_NAME, LATEST_KEY);
}
