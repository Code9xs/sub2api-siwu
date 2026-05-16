import { describe, expect, it } from 'vitest';
import { decodeProjectFile, encodeProjectFile } from './projectCodec';
import { createProject } from './projectFactory';

describe('project codec', () => {
  it('round-trips a valid project file', () => {
    const project = createProject({ name: 'Production Network', template: 'network' });

    const decoded = decodeProjectFile(encodeProjectFile(project));

    expect(decoded.ok).toBe(true);
    if (!decoded.ok) {
      throw new Error(decoded.message);
    }
    expect(decoded.project.project.name).toBe('Production Network');
    expect(decoded.project.version).toBe(1);
  });

  it('rejects incompatible project versions', () => {
    const decoded = decodeProjectFile(JSON.stringify({ version: 99 }));

    expect(decoded.ok).toBe(false);
    if (decoded.ok) {
      throw new Error('Expected invalid project version to be rejected');
    }
    expect(decoded.message).toContain('Unsupported project version');
  });

  it('rejects invalid JSON with a readable message', () => {
    const decoded = decodeProjectFile('{bad json');

    expect(decoded.ok).toBe(false);
    if (decoded.ok) {
      throw new Error('Expected invalid JSON to be rejected');
    }
    expect(decoded.message).toContain('Invalid JSON');
  });
});
