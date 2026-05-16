import { ReactFlowProvider } from '@xyflow/react';
import { render, screen } from '@testing-library/react';
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
    expect(screen.queryByRole('button', { name: /撤销|重做|连线/ })).not.toBeInTheDocument();
  });
});
