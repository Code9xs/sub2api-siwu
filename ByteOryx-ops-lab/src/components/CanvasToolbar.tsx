import { Clipboard, Copy, Grid3X3, Trash2 } from 'lucide-react';

interface CanvasToolbarProps {
  gridPositioning: boolean;
  onCopy: () => void;
  onDelete: () => void;
  onPaste: () => void;
  onToggleGridPositioning: () => void;
}

export function CanvasToolbar({
  gridPositioning,
  onCopy,
  onDelete,
  onPaste,
  onToggleGridPositioning,
}: CanvasToolbarProps) {
  const tools = [
    { title: '删除', Icon: Trash2, onClick: onDelete },
    { title: '复制', Icon: Copy, onClick: onCopy },
    { title: '粘贴', Icon: Clipboard, onClick: onPaste },
  ];

  return (
    <div className="canvas-toolbar" aria-label="画布工具">
      {tools.map(({ title, Icon, onClick }) => (
        <button
          key={title}
          type="button"
          className="icon-button"
          title={title}
          aria-label={title}
          onClick={onClick}
        >
          <Icon size={18} aria-hidden="true" />
        </button>
      ))}
      <button
        type="button"
        className={`icon-button${gridPositioning ? ' icon-button--active' : ''}`}
        title="网格定位"
        aria-label="网格定位"
        aria-pressed={gridPositioning}
        onClick={onToggleGridPositioning}
      >
        <Grid3X3 size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
