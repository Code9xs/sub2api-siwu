import { useWorkspaceStore } from '../store/workspaceStore';

const saveStatusLabels = {
  saved: '已保存',
  dirty: '未保存',
  saving: '保存中',
  error: '保存失败',
};

export function StatusBar() {
  const activeDiagram = useWorkspaceStore((state) => state.activeDiagram());
  const selectedNodeIds = useWorkspaceStore((state) => state.selectedNodeIds);
  const selectedEdgeIds = useWorkspaceStore((state) => state.selectedEdgeIds);
  const saveStatus = useWorkspaceStore((state) => state.saveStatus);
  const zoomRatio = `${Math.round(activeDiagram.viewport.zoom * 100)}%`;

  return (
    <footer className="status-bar">
      <span>缩放 {zoomRatio}</span>
      <span>节点 {activeDiagram.nodes.length}</span>
      <span>连线 {activeDiagram.edges.length}</span>
      <span>已选 {selectedNodeIds.length + selectedEdgeIds.length}</span>
      <span>{saveStatusLabels[saveStatus]}</span>
    </footer>
  );
}
