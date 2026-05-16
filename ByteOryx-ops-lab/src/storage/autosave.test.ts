import { openDB } from 'idb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { createProject } from '../domain/projectFactory';
import { clearAutosave, loadAutosave, saveAutosave } from './autosave';
import { downloadProjectFile, downloadTextFile } from './fileAccess';

const DB_NAME = 'ops-drawing-tool';
const STORE_NAME = 'autosave';
const LATEST_KEY = 'latest-project';

async function writeRawAutosave(value: unknown): Promise<void> {
  const db = await openDB(DB_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    },
  });

  await db.put(STORE_NAME, value, LATEST_KEY);
}

async function readRawAutosave(): Promise<unknown> {
  const db = await openDB(DB_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    },
  });

  return db.get(STORE_NAME, LATEST_KEY);
}

describe('autosave storage', () => {
  beforeEach(async () => {
    await clearAutosave();
  });

  it('saves and loads latest project', async () => {
    const project = createProject({ name: 'Autosaved Project', template: 'network' });

    await saveAutosave(project);
    const loaded = await loadAutosave();

    expect(loaded?.project.name).toBe('Autosaved Project');
  });

  it('returns null when no autosave exists', async () => {
    await expect(loadAutosave()).resolves.toBeNull();
  });

  it('returns null and clears corrupted autosave data', async () => {
    await writeRawAutosave('{bad json');

    await expect(loadAutosave()).resolves.toBeNull();
    await expect(readRawAutosave()).resolves.toBeUndefined();
  });

  it('returns null and clears non-string autosave data', async () => {
    await writeRawAutosave({ invalid: true });

    await expect(loadAutosave()).resolves.toBeNull();
    await expect(readRawAutosave()).resolves.toBeUndefined();
  });
});

describe('project file downloads', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves Chinese project names in downloaded filenames', () => {
    const project = createProject({ name: '运维拓扑', template: 'network' });
    let downloadedFilename = '';

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:project');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click(
      this: HTMLAnchorElement,
    ) {
      downloadedFilename = this.download;
    });

    downloadProjectFile(project);

    expect(downloadedFilename).toBe('运维拓扑.opsdraw.json');
  });

  it('appends clicks removes anchor and schedules object URL revoke', () => {
    vi.useFakeTimers();
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:download');

    downloadTextFile('project.opsdraw.json', '{}');

    expect(appendSpy).toHaveBeenCalledWith(expect.any(HTMLAnchorElement));
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(removeSpy).toHaveBeenCalledWith(expect.any(HTMLAnchorElement));
    expect(revokeSpy).not.toHaveBeenCalled();

    vi.runAllTimers();

    expect(revokeSpy).toHaveBeenCalledWith('blob:download');
    vi.useRealTimers();
  });
});
