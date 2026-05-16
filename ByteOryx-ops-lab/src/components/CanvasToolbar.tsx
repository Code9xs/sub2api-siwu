import {
  Grid3X3,
  Maximize,
  Minus,
  MousePointer2,
  Plus,
  Redo2,
  Route,
  Undo2,
} from 'lucide-react';

const tools = [
  { title: '选择', Icon: MousePointer2 },
  { title: '连线', Icon: Route },
  { title: '撤销', Icon: Undo2 },
  { title: '重做', Icon: Redo2 },
  { title: '放大', Icon: Plus },
  { title: '缩小', Icon: Minus },
  { title: '适应屏幕', Icon: Maximize },
  { title: '网格', Icon: Grid3X3 },
];

export function CanvasToolbar() {
  return (
    <div className="canvas-toolbar" aria-label="画布工具">
      {tools.map(({ title, Icon }) => (
        <button key={title} type="button" className="icon-button" title={title} aria-label={title}>
          <Icon size={18} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
