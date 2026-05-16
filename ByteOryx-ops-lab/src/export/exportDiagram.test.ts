import { describe, expect, it } from 'vitest';

import { projectDownloadName } from './exportDiagram';

describe('projectDownloadName', () => {
  it('preserves useful Unicode characters while replacing unsafe filename separators', () => {
    expect(projectDownloadName('生产 网络/拓扑')).toBe('生产-网络-拓扑.opsdraw.json');
  });

  it('falls back to ops-project for an empty project name', () => {
    expect(projectDownloadName('')).toBe('ops-project.opsdraw.json');
  });
});
