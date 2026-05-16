import { beforeEach, describe, expect, it } from 'vitest';

import type { Asset } from '../domain/types';
import type { DomainId } from '../domain/ids';
import { useWorkspaceStore } from './workspaceStore';

const importedAsset: Asset = {
  id: 'asset-1' as DomainId<'asset'>,
  name: 'core-sw',
  type: 'switch',
  ip: '10.0.0.1',
  zone: 'dc-a',
  tags: ['core', 'network'],
  vendor: 'ByteOryx',
  description: 'Core aggregation switch',
  source: 'import',
  createdAt: '2026-05-16T00:00:00.000Z',
  updatedAt: '2026-05-16T00:00:00.000Z',
};

describe('workspace store', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().resetWorkspace();
  });

  it('imports assets into the active project', () => {
    useWorkspaceStore.getState().importAssets([importedAsset]);

    expect(useWorkspaceStore.getState().project.assets).toEqual([importedAsset]);
  });

  it('places an imported asset on the active diagram', () => {
    const store = useWorkspaceStore.getState();
    store.importAssets([importedAsset]);

    const nodeId = useWorkspaceStore.getState().placeAssetOnCanvas('asset-1' as DomainId<'asset'>, {
      x: 120,
      y: 80,
    });

    const node = useWorkspaceStore
      .getState()
      .activeDiagram()
      .nodes.find((candidate) => candidate.id === nodeId);

    expect(node).toMatchObject({
      id: nodeId,
      assetId: importedAsset.id,
      name: 'core-sw',
      position: { x: 120, y: 80 },
      metadata: {
        ip: '10.0.0.1',
        zone: 'dc-a',
        vendor: 'ByteOryx',
        description: 'Core aggregation switch',
        tags: ['core', 'network'],
      },
    });
  });

  it('connects two nodes in the active diagram', () => {
    const store = useWorkspaceStore.getState();
    store.importAssets([importedAsset]);
    const sourceNodeId = useWorkspaceStore
      .getState()
      .placeAssetOnCanvas(importedAsset.id, { x: 120, y: 80 });
    const targetNodeId = useWorkspaceStore.getState().addManualNode({
      name: 'api',
      type: 'service',
      position: { x: 320, y: 80 },
    });

    const edgeId = useWorkspaceStore.getState().connectNodes(sourceNodeId, targetNodeId);

    const edge = useWorkspaceStore
      .getState()
      .activeDiagram()
      .edges.find((candidate) => candidate.id === edgeId);

    expect(edge).toMatchObject({
      id: edgeId,
      sourceNodeId,
      targetNodeId,
      direction: 'none',
      relationshipType: 'connected-to',
    });
  });

  it('deletes selected nodes and any edges connected to them', () => {
    const sourceNodeId = useWorkspaceStore.getState().addManualNode({
      name: 'api',
      type: 'service',
      position: { x: 320, y: 80 },
    });
    const targetNodeId = useWorkspaceStore.getState().addManualNode({
      name: 'db',
      type: 'database',
      position: { x: 520, y: 80 },
    });
    const edgeId = useWorkspaceStore.getState().connectNodes(sourceNodeId, targetNodeId);
    useWorkspaceStore.getState().setSelection({ nodeIds: [sourceNodeId], edgeIds: [edgeId] });

    useWorkspaceStore.getState().deleteSelection();

    expect(useWorkspaceStore.getState().activeDiagram().nodes).toEqual([
      expect.objectContaining({ id: targetNodeId }),
    ]);
    expect(useWorkspaceStore.getState().activeDiagram().edges).toEqual([]);
    expect(useWorkspaceStore.getState().selectedNodeIds).toEqual([]);
    expect(useWorkspaceStore.getState().selectedEdgeIds).toEqual([]);
    expect(useWorkspaceStore.getState().saveStatus).toBe('dirty');
  });

  it('copies selected nodes and edges, then pastes an offset clone', () => {
    const sourceNodeId = useWorkspaceStore.getState().addManualNode({
      name: 'api',
      type: 'service',
      position: { x: 320, y: 80 },
      metadata: { tags: ['prod'] },
    });
    const targetNodeId = useWorkspaceStore.getState().addManualNode({
      name: 'db',
      type: 'database',
      position: { x: 520, y: 80 },
    });
    useWorkspaceStore.getState().connectNodes(sourceNodeId, targetNodeId);
    useWorkspaceStore.getState().setSelection({ nodeIds: [sourceNodeId, targetNodeId] });

    useWorkspaceStore.getState().copySelection();
    const pastedNodeIds = useWorkspaceStore.getState().pasteClipboard();

    expect(pastedNodeIds).toHaveLength(2);
    const diagram = useWorkspaceStore.getState().activeDiagram();
    expect(diagram.nodes).toHaveLength(4);
    expect(diagram.edges).toHaveLength(2);
    expect(diagram.nodes.find((node) => node.id === pastedNodeIds[0])).toMatchObject({
      name: 'api copy',
      position: { x: 344, y: 104 },
      metadata: { tags: ['prod'] },
    });
    expect(useWorkspaceStore.getState().selectedNodeIds).toEqual(pastedNodeIds);
  });

  it('updates the active diagram viewport', () => {
    useWorkspaceStore.getState().updateViewport({ x: -120, y: 48, zoom: 1.5 });

    expect(useWorkspaceStore.getState().activeDiagram().viewport).toEqual({
      x: -120,
      y: 48,
      zoom: 1.5,
    });
    expect(useWorkspaceStore.getState().saveStatus).toBe('dirty');
  });

  it('does not mutate the project when the source node is missing', () => {
    const targetNodeId = useWorkspaceStore.getState().addManualNode({
      name: 'api',
      type: 'service',
      position: { x: 320, y: 80 },
    });
    useWorkspaceStore.getState().setSaveStatus('saved');
    const projectBeforeConnect = useWorkspaceStore.getState().project;

    expect(() =>
      useWorkspaceStore
        .getState()
        .connectNodes('node-missing' as DomainId<'node'>, targetNodeId),
    ).toThrow('Source node not found: node-missing');

    expect(useWorkspaceStore.getState().project).toBe(projectBeforeConnect);
    expect(useWorkspaceStore.getState().saveStatus).toBe('saved');
  });

  it('does not mutate the project when the target node is missing', () => {
    const sourceNodeId = useWorkspaceStore.getState().addManualNode({
      name: 'api',
      type: 'service',
      position: { x: 320, y: 80 },
    });
    useWorkspaceStore.getState().setSaveStatus('saved');
    const projectBeforeConnect = useWorkspaceStore.getState().project;

    expect(() =>
      useWorkspaceStore
        .getState()
        .connectNodes(sourceNodeId, 'node-missing' as DomainId<'node'>),
    ).toThrow('Target node not found: node-missing');

    expect(useWorkspaceStore.getState().project).toBe(projectBeforeConnect);
    expect(useWorkspaceStore.getState().saveStatus).toBe('saved');
  });

  it('clones selection arrays on write', () => {
    const nodeIds = ['node-1' as DomainId<'node'>];
    const edgeIds = ['edge-1' as DomainId<'edge'>];

    useWorkspaceStore.getState().setSelection({ nodeIds, edgeIds });
    nodeIds.push('node-2' as DomainId<'node'>);
    edgeIds.push('edge-2' as DomainId<'edge'>);

    expect(useWorkspaceStore.getState().selectedNodeIds).toEqual(['node-1']);
    expect(useWorkspaceStore.getState().selectedEdgeIds).toEqual(['edge-1']);
  });

  it('clones manual node style and metadata on write', () => {
    const style = { fill: '#ffffff', stroke: '#111111' };
    const metadata = {
      owner: 'platform',
      tags: ['api', 'prod'],
    };

    const nodeId = useWorkspaceStore.getState().addManualNode({
      name: 'api',
      type: 'service',
      position: { x: 320, y: 80 },
      style,
      metadata,
    });
    style.stroke = '#ff0000';
    metadata.owner = 'network';
    metadata.tags.push('mutated');

    const node = useWorkspaceStore
      .getState()
      .activeDiagram()
      .nodes.find((candidate) => candidate.id === nodeId);

    expect(node?.style).toEqual({ fill: '#ffffff', stroke: '#111111' });
    expect(node?.metadata).toEqual({ owner: 'platform', tags: ['api', 'prod'] });
  });

  it('clones imported asset position on write', () => {
    useWorkspaceStore.getState().importAssets([importedAsset]);
    const position = { x: 120, y: 80 };

    const nodeId = useWorkspaceStore.getState().placeAssetOnCanvas(importedAsset.id, position);
    position.x = 999;
    position.y = 888;

    const node = useWorkspaceStore
      .getState()
      .activeDiagram()
      .nodes.find((candidate) => candidate.id === nodeId);

    expect(node?.position).toEqual({ x: 120, y: 80 });
  });

  it('clones manual node position and size on write', () => {
    const position = { x: 320, y: 80 };
    const size = { width: 160, height: 96 };

    const nodeId = useWorkspaceStore.getState().addManualNode({
      name: 'api',
      type: 'service',
      position,
      size,
    });
    position.x = 999;
    position.y = 888;
    size.width = 1;
    size.height = 2;

    const node = useWorkspaceStore
      .getState()
      .activeDiagram()
      .nodes.find((candidate) => candidate.id === nodeId);

    expect(node?.position).toEqual({ x: 320, y: 80 });
    expect(node?.size).toEqual({ width: 160, height: 96 });
  });

  it('clones node style and metadata updates on write', () => {
    const nodeId = useWorkspaceStore.getState().addManualNode({
      name: 'api',
      type: 'service',
      position: { x: 320, y: 80 },
    });
    const style = { fill: '#f8fafc', stroke: '#334155' };
    const metadata = {
      owner: 'platform',
      tags: ['api', 'prod'],
    };

    useWorkspaceStore.getState().updateNode(nodeId, { style, metadata });
    style.stroke = '#ff0000';
    metadata.owner = 'network';
    metadata.tags.push('mutated');

    const node = useWorkspaceStore
      .getState()
      .activeDiagram()
      .nodes.find((candidate) => candidate.id === nodeId);

    expect(node?.style).toEqual({ fill: '#f8fafc', stroke: '#334155' });
    expect(node?.metadata).toEqual({ owner: 'platform', tags: ['api', 'prod'] });
  });

  it('clones node position and size updates on write', () => {
    const nodeId = useWorkspaceStore.getState().addManualNode({
      name: 'api',
      type: 'service',
      position: { x: 320, y: 80 },
    });
    const position = { x: 520, y: 180 };
    const size = { width: 160, height: 96 };

    useWorkspaceStore.getState().updateNode(nodeId, { position, size });
    position.x = 999;
    position.y = 888;
    size.width = 1;
    size.height = 2;

    const node = useWorkspaceStore
      .getState()
      .activeDiagram()
      .nodes.find((candidate) => candidate.id === nodeId);

    expect(node?.position).toEqual({ x: 520, y: 180 });
    expect(node?.size).toEqual({ width: 160, height: 96 });
  });

  it('clones edge style and metadata updates on write', () => {
    const sourceNodeId = useWorkspaceStore.getState().addManualNode({
      name: 'api',
      type: 'service',
      position: { x: 320, y: 80 },
    });
    const targetNodeId = useWorkspaceStore.getState().addManualNode({
      name: 'db',
      type: 'database',
      position: { x: 520, y: 80 },
    });
    const edgeId = useWorkspaceStore.getState().connectNodes(sourceNodeId, targetNodeId);
    const style = { stroke: '#334155', textColor: '#0f172a' };
    const metadata = {
      protocol: 'https',
      tags: ['sync', 'prod'],
    };

    useWorkspaceStore.getState().updateEdge(edgeId, { style, metadata });
    style.stroke = '#ff0000';
    metadata.protocol = 'ssh';
    metadata.tags.push('mutated');

    const edge = useWorkspaceStore
      .getState()
      .activeDiagram()
      .edges.find((candidate) => candidate.id === edgeId);

    expect(edge?.style).toEqual({ stroke: '#334155', textColor: '#0f172a' });
    expect(edge?.metadata).toEqual({ protocol: 'https', tags: ['sync', 'prod'] });
  });
});
