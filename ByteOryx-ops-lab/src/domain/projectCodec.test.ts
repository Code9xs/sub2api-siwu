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

  it('rejects malformed nested diagram and settings fields with path-specific messages', () => {
    const project = createProject({ name: 'Production Network', template: 'network' });
    const malformedProject = {
      ...project,
      project: {
        ...project.project,
        createdAt: 42,
      },
      settings: {
        ...project.settings,
        snapToGrid: 'yes',
      },
      diagrams: [
        {
          ...project.diagrams[0],
          viewport: {
            ...project.diagrams[0].viewport,
            zoom: '1',
          },
        },
      ],
    };

    const missingCreatedAt = decodeProjectFile(JSON.stringify(malformedProject));
    const invalidSnapToGrid = decodeProjectFile(
      JSON.stringify({
        ...malformedProject,
        project: project.project,
        diagrams: project.diagrams,
      }),
    );
    const invalidDiagramViewport = decodeProjectFile(
      JSON.stringify({
        ...malformedProject,
        project: project.project,
        settings: project.settings,
      }),
    );

    expect(missingCreatedAt.ok).toBe(false);
    if (missingCreatedAt.ok) {
      throw new Error('Expected malformed project.createdAt to be rejected');
    }
    expect(missingCreatedAt.message).toContain('project.createdAt');

    expect(invalidSnapToGrid.ok).toBe(false);
    if (invalidSnapToGrid.ok) {
      throw new Error('Expected malformed settings.snapToGrid to be rejected');
    }
    expect(invalidSnapToGrid.message).toContain('settings.snapToGrid');

    expect(invalidDiagramViewport.ok).toBe(false);
    if (invalidDiagramViewport.ok) {
      throw new Error('Expected malformed diagrams[0].viewport.zoom to be rejected');
    }
    expect(invalidDiagramViewport.message).toContain('diagrams[0].viewport.zoom');
  });

  it('rejects mismatched activeDiagramId with a path-specific message', () => {
    const project = createProject({ name: 'Production Network', template: 'network' });

    const decoded = decodeProjectFile(
      JSON.stringify({
        ...project,
        settings: {
          ...project.settings,
          activeDiagramId: 'diagram_missing',
        },
      }),
    );

    expect(decoded.ok).toBe(false);
    if (decoded.ok) {
      throw new Error('Expected mismatched activeDiagramId to be rejected');
    }
    expect(decoded.message).toContain('settings.activeDiagramId');
  });

  it('rejects malformed assets, nodes, edges, and dangling edge references', () => {
    const project = createProject({ name: 'Production Network', template: 'network' });
    const node = {
      id: 'node-1',
      name: 'api',
      type: 'service',
      position: { x: 10, y: 20 },
      style: {},
      metadata: {},
    };
    const targetNode = { ...node, id: 'node-2', name: 'db' };
    const edge = {
      id: 'edge-1',
      sourceNodeId: 'node-1',
      targetNodeId: 'node-2',
      direction: 'none',
      relationshipType: 'connected-to',
      style: {},
      metadata: {},
    };

    const malformedAsset = decodeProjectFile(
      JSON.stringify({ ...project, assets: [{ id: 'asset-1', name: 'core' }] }),
    );
    const malformedNode = decodeProjectFile(
      JSON.stringify({
        ...project,
        diagrams: [{ ...project.diagrams[0], nodes: [{ ...node, position: { x: '10', y: 20 } }] }],
      }),
    );
    const malformedEdge = decodeProjectFile(
      JSON.stringify({
        ...project,
        diagrams: [
          { ...project.diagrams[0], nodes: [node, targetNode], edges: [{ ...edge, direction: 'bad' }] },
        ],
      }),
    );
    const danglingEdge = decodeProjectFile(
      JSON.stringify({
        ...project,
        diagrams: [{ ...project.diagrams[0], nodes: [node], edges: [edge] }],
      }),
    );

    expect(malformedAsset.ok).toBe(false);
    if (malformedAsset.ok) throw new Error('Expected malformed asset to be rejected');
    expect(malformedAsset.message).toContain('assets[0].type');

    expect(malformedNode.ok).toBe(false);
    if (malformedNode.ok) throw new Error('Expected malformed node to be rejected');
    expect(malformedNode.message).toContain('diagrams[0].nodes[0].position.x');

    expect(malformedEdge.ok).toBe(false);
    if (malformedEdge.ok) throw new Error('Expected malformed edge to be rejected');
    expect(malformedEdge.message).toContain('diagrams[0].edges[0].direction');

    expect(danglingEdge.ok).toBe(false);
    if (danglingEdge.ok) throw new Error('Expected dangling edge to be rejected');
    expect(danglingEdge.message).toContain('diagrams[0].edges[0].targetNodeId');
  });
});
