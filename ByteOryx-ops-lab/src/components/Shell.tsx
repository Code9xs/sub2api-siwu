import { DiagramCanvas } from '../canvas/DiagramCanvas';
import { AssetPool } from './AssetPool';
import { CanvasToolbar } from './CanvasToolbar';
import { PropertiesPanel } from './PropertiesPanel';
import { StatusBar } from './StatusBar';
import { TopBar } from './TopBar';

export function Shell() {
  return (
    <main className="workspace-shell">
      <TopBar />
      <div className="workspace-body">
        <CanvasToolbar />
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
