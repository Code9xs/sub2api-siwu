import { DiagramCanvas } from '../canvas/DiagramCanvas';
import { AssetPool } from './AssetPool';
import { CanvasToolbar } from './CanvasToolbar';
import { PropertiesPanel } from './PropertiesPanel';
import { StatusBar } from './StatusBar';
import { TopBar } from './TopBar';
import { useWorkspaceStore } from '../store/workspaceStore';

export function Shell() {
  const copySelection = useWorkspaceStore((state) => state.copySelection);
  const deleteSelection = useWorkspaceStore((state) => state.deleteSelection);
  const pasteClipboard = useWorkspaceStore((state) => state.pasteClipboard);
  const gridPositioning = useWorkspaceStore((state) => state.project.settings.snapToGrid);
  const setGridPositioning = useWorkspaceStore((state) => state.setGridPositioning);

  return (
    <main className="workspace-shell">
      <TopBar />
      <div className="workspace-body">
        <CanvasToolbar
          gridPositioning={gridPositioning}
          onCopy={copySelection}
          onDelete={deleteSelection}
          onPaste={pasteClipboard}
          onToggleGridPositioning={() => setGridPositioning(!gridPositioning)}
        />
        <AssetPool />
        <section className="canvas-region" role="region" aria-label="画布">
          <DiagramCanvas />
        </section>
        <PropertiesPanel />
      </div>
      <StatusBar />
    </main>
  );
}
