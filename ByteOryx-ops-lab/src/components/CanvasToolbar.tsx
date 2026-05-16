import { Clipboard, Copy, Trash2 } from 'lucide-react';

interface CanvasToolbarProps {
  onCopy: () => void;
  onDelete: () => void;
  onPaste: () => void;
}

export function CanvasToolbar({ onCopy, onDelete, onPaste }: CanvasToolbarProps) {
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
    </div>
  );
}
