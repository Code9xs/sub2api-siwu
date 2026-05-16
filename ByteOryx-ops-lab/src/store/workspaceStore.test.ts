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
});
