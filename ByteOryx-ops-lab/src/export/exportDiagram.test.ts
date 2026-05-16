import { describe, expect, it, vi } from 'vitest';

import { projectDownloadName } from './exportDiagram';
import { createSerializedAutosave } from './serializedAutosave';

describe('projectDownloadName', () => {
  it('preserves useful Unicode characters while replacing unsafe filename separators', () => {
    expect(projectDownloadName('生产 网络/拓扑')).toBe('生产-网络-拓扑.opsdraw.json');
  });

  it('falls back to ops-project for an empty project name', () => {
    expect(projectDownloadName('')).toBe('ops-project.opsdraw.json');
  });
});

describe('createSerializedAutosave', () => {
  it('coalesces pending saves so an older deferred save cannot be final', async () => {
    const firstSave = createDeferred<void>();
    const savedProjects: string[] = [];
    const save = vi.fn(async (projectName: string) => {
      savedProjects.push(projectName);

      if (projectName === 'first') {
        await firstSave.promise;
      }
    });

    const autosave = createSerializedAutosave({
      getStatus: () => 'dirty',
      save,
      setStatus: () => undefined,
    });

    autosave.schedule('first');
    autosave.schedule('second');
    autosave.schedule('latest');

    await Promise.resolve();
    expect(savedProjects).toEqual(['first']);

    firstSave.resolve();
    await autosave.flush();

    expect(savedProjects).toEqual(['first', 'latest']);
  });

  it('does not clear an unrelated error reported while autosave is in flight', async () => {
    const firstSave = createDeferred<void>();
    let status: 'saved' | 'dirty' | 'saving' | 'error' = 'dirty';
    const autosave = createSerializedAutosave({
      getStatus: () => status,
      save: async () => {
        await firstSave.promise;
      },
      setStatus: (nextStatus) => {
        status = nextStatus;
      },
    });

    autosave.schedule('project');
    await Promise.resolve();
    expect(status).toBe('saving');

    status = 'error';
    firstSave.resolve();
    await autosave.flush();

    expect(status).toBe('error');
  });
});

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
}
