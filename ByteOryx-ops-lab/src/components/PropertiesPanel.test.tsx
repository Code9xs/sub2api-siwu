import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import type { DomainId } from '../domain/ids';
import type { Asset } from '../domain/types';
import { useWorkspaceStore } from '../store/workspaceStore';
import { PropertiesPanel } from './PropertiesPanel';

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

describe('PropertiesPanel', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().resetWorkspace();
  });

  it('edits the selected node name', async () => {
    const user = userEvent.setup();

    useWorkspaceStore.getState().importAssets([importedAsset]);
    const nodeId = useWorkspaceStore
      .getState()
      .placeAssetOnCanvas(importedAsset.id, { x: 120, y: 80 });
    useWorkspaceStore.getState().setSelection({ nodeIds: [nodeId] });

    render(<PropertiesPanel />);

    const nameInput = screen.getByLabelText('名称');
    await user.clear(nameInput);
    await user.type(nameInput, 'renamed-switch');

    expect(useWorkspaceStore.getState().activeDiagram().nodes[0].name).toBe('renamed-switch');
  });

  it('shows a multi-selection summary instead of editing the first selected object', () => {
    useWorkspaceStore.getState().importAssets([importedAsset]);
    const firstNodeId = useWorkspaceStore
      .getState()
      .placeAssetOnCanvas(importedAsset.id, { x: 120, y: 80 });
    const secondNodeId = useWorkspaceStore.getState().addManualNode({
      name: 'edge-fw',
      type: 'firewall',
      position: { x: 320, y: 80 },
    });
    useWorkspaceStore.getState().setSelection({ nodeIds: [firstNodeId, secondNodeId] });

    render(<PropertiesPanel />);

    expect(screen.queryByLabelText('名称')).not.toBeInTheDocument();
    expect(screen.getByText('已选择 2 个对象')).toBeInTheDocument();
  });

  it('preserves tag draft text while focused and commits parsed tags on blur', async () => {
    const user = userEvent.setup();

    useWorkspaceStore.getState().importAssets([importedAsset]);
    const nodeId = useWorkspaceStore
      .getState()
      .placeAssetOnCanvas(importedAsset.id, { x: 120, y: 80 });
    useWorkspaceStore.getState().setSelection({ nodeIds: [nodeId] });

    render(<PropertiesPanel />);

    const tagsInput = screen.getByLabelText('Tags');
    await user.clear(tagsInput);
    await user.type(tagsInput, 'core,  ');

    expect(tagsInput).toHaveValue('core,  ');
    expect(useWorkspaceStore.getState().activeDiagram().nodes[0].metadata.tags).toEqual([
      'core',
      'network',
    ]);

    await user.tab();

    expect(useWorkspaceStore.getState().activeDiagram().nodes[0].metadata.tags).toEqual(['core']);
  });
});
