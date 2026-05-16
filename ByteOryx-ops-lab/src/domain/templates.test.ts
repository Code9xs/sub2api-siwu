import { describe, expect, it } from 'vitest';
import { createProject } from './projectFactory';
import { getTemplate } from './templates';

describe('diagram templates', () => {
  it('network template exposes styled switch node type and vlan edge metadata field', () => {
    const template = getTemplate('network');

    expect(template.nodeTypes).toContainEqual(
      expect.objectContaining({
        id: 'switch',
        icon: expect.any(String),
        color: expect.any(String),
      }),
    );
    expect(template.nodeMetadataFields.length).toBeGreaterThan(0);
    expect(template.nodeMetadataFields[0]).toEqual(
      expect.objectContaining({
        key: expect.any(String),
        kind: expect.any(String),
      }),
    );
    expect(template.edgeMetadataFields).toContainEqual(
      expect.objectContaining({
        key: 'vlan',
        kind: expect.any(String),
      }),
    );
  });

  it('system template exposes styled database node type, callDirection edge metadata field, and not vlan', () => {
    const template = getTemplate('system');

    expect(template.nodeTypes).toContainEqual(
      expect.objectContaining({
        id: 'database',
        icon: expect.any(String),
        color: expect.any(String),
      }),
    );
    expect(template.nodeMetadataFields.length).toBeGreaterThan(0);
    expect(template.edgeMetadataFields).toContainEqual(
      expect.objectContaining({
        key: 'callDirection',
        kind: 'select',
      }),
    );
    expect(template.edgeMetadataFields.some((field) => field.key === 'vlan')).toBe(false);
  });
});

describe('createProject', () => {
  it('creates a versioned project with nested project metadata, settings, and one empty diagram', () => {
    const project = createProject({ name: 'Core Network', template: 'network' });

    expect(project.version).toBe(1);
    expect(project.project.name).toBe('Core Network');
    expect(project.assets).toEqual([]);
    expect(project.diagrams).toHaveLength(1);
    expect(project.diagrams[0]).toMatchObject({
      template: 'network',
      nodes: [],
      edges: [],
    });
    expect(project.settings).toEqual({
      activeDiagramId: project.diagrams[0].id,
      snapToGrid: true,
      showGrid: true,
    });
  });
});
