import { ReactFlowProvider } from '@xyflow/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useWorkspaceStore } from '../store/workspaceStore';
import { Shell } from './Shell';

function renderShell() {
  return render(
    <ReactFlowProvider>
      <Shell />
    </ReactFlowProvider>,
  );
}

describe('Shell', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().resetWorkspace();
  });

  it('renders the drawing workspace shell', () => {
    renderShell();

    expect(screen.getByText('Ops Drawing Tool')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下载模板' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '资产池' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '画布' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '属性面板' })).toBeInTheDocument();
    expect(screen.getByText('节点 0')).toBeInTheDocument();
    expect(screen.getByText('连线 0')).toBeInTheDocument();
  });
  it('renders only toolbar controls that perform implemented actions', () => {
    renderShell();

    expect(screen.getByRole('button', { name: '删除' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '复制' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '粘贴' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '网格定位' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: /撤销|重做|连线/ })).not.toBeInTheDocument();
  });
  it('lets users add, delete, and switch layout for pool assets while hiding placed assets', async () => {
    const user = userEvent.setup();
    const { unmount } = renderShell();

    await user.click(screen.getByRole('button', { name: '添加资产' }));
    await user.type(screen.getByLabelText('资产名称'), 'redis-01');
    await user.selectOptions(screen.getByLabelText('资产类型'), 'Redis服务器');
    await user.type(screen.getByLabelText('资产 IP'), '10.0.2.20');
    await user.click(screen.getByRole('button', { name: '保存资产' }));

    expect(within(screen.getByRole('list', { name: '资产列表' })).getByText('redis-01')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: '资产列表' })).toHaveClass('asset-list--single');

    await user.click(screen.getByRole('button', { name: '多行排列' }));
    expect(screen.getByRole('list', { name: '资产列表' })).toHaveClass('asset-list--multi');

    const assetId = useWorkspaceStore.getState().project.assets[0].id;
    useWorkspaceStore.getState().placeAssetOnCanvas(assetId, { x: 120, y: 80 });
    unmount();
    renderShell();

    expect(within(screen.getByRole('list', { name: '资产列表' })).queryByText('redis-01')).not.toBeInTheDocument();

    useWorkspaceStore.getState().deleteAsset(assetId);
    expect(useWorkspaceStore.getState().project.assets).toEqual([]);
  });
});
