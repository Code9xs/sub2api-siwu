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
});
