import { describe, expect, it } from 'vitest';
import { createProject } from './projectFactory';
import { getTemplate } from './templates';

describe('diagram templates', () => {
  it('network template exposes node type switch and edge metadata field vlan', () => {
    const template = getTemplate('network');

    expect(template.nodeTypes.some((nodeType) => nodeType.id === 'switch')).toBe(true);
    expect(template.edgeMetadataFields.some((field) => field.id === 'vlan')).toBe(true);
  });

  it('system template exposes node type database, edge metadata field callDirection, and not vlan', () => {
    const template = getTemplate('system');

    expect(template.nodeTypes.some((nodeType) => nodeType.id === 'database')).toBe(true);
    expect(template.edgeMetadataFields.some((field) => field.id === 'callDirection')).toBe(true);
    expect(template.edgeMetadataFields.some((field) => field.id === 'vlan')).toBe(false);
  });
});

describe('createProject', () => {
  it('creates a versioned project with one empty diagram for the selected template', () => {
    const project = createProject({ name: 'Core Network', template: 'network' });

    expect(project.version).toBe(1);
    expect(project.name).toBe('Core Network');
    expect(project.assets).toEqual([]);
    expect(project.diagrams).toHaveLength(1);
    expect(project.diagrams[0]).toMatchObject({
      template: 'network',
      nodes: [],
      edges: [],
    });
  });
});
