import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { createProject } from '../domain/projectFactory';
import { clearAutosave, loadAutosave, saveAutosave } from './autosave';

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
});
