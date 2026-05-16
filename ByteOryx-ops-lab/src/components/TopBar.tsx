import { FileDown, FolderOpen, ImageDown, Save, Upload } from 'lucide-react';

import { useWorkspaceStore } from '../store/workspaceStore';

const saveStatusLabels = {
  saved: '已保存',
  dirty: '未保存',
  saving: '保存中',
  error: '保存失败',
};

export function TopBar() {
  const projectName = useWorkspaceStore((state) => state.project.project.name);
  const saveStatus = useWorkspaceStore((state) => state.saveStatus);

  return (
    <header className="top-bar">
      <div className="top-bar__identity">
        <span className="top-bar__product">Ops Drawing Tool</span>
        <span className="top-bar__project">{projectName}</span>
        <span className={`save-status save-status--${saveStatus}`}>
          {saveStatusLabels[saveStatus]}
        </span>
      </div>
      <nav className="top-bar__actions" aria-label="文件操作">
        <button type="button" className="command-button">
          <FolderOpen size={16} aria-hidden="true" />
          打开
        </button>
        <button type="button" className="command-button">
          <Save size={16} aria-hidden="true" />
          保存
        </button>
        <button type="button" className="command-button">
          <Upload size={16} aria-hidden="true" />
          导入
        </button>
        <button type="button" className="command-button">
          <ImageDown size={16} aria-hidden="true" />
          PNG
        </button>
        <button type="button" className="command-button">
          <FileDown size={16} aria-hidden="true" />
          PDF
        </button>
      </nav>
    </header>
  );
}
