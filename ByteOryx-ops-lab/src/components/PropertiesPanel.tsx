import { useWorkspaceStore } from '../store/workspaceStore';

export function PropertiesPanel() {
  const selectedNodeIds = useWorkspaceStore((state) => state.selectedNodeIds);
  const selectedEdgeIds = useWorkspaceStore((state) => state.selectedEdgeIds);
  const selectedCount = selectedNodeIds.length + selectedEdgeIds.length;

  return (
    <aside className="properties-panel" role="region" aria-label="属性面板">
      <div className="panel-header">
        <h2>属性面板</h2>
        <span>{selectedCount}</span>
      </div>
      {selectedCount === 0 ? (
        <p className="empty-state">请选择画布元素</p>
      ) : (
        <dl className="properties-list">
          <div>
            <dt>节点</dt>
            <dd>{selectedNodeIds.length}</dd>
          </div>
          <div>
            <dt>连线</dt>
            <dd>{selectedEdgeIds.length}</dd>
          </div>
        </dl>
      )}
    </aside>
  );
}
