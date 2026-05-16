import { useEffect, useRef, useState } from 'react';
import { FileDown, FolderOpen, ImageDown, Save, Table, Upload } from 'lucide-react';

import { exportElementAsPdf, exportElementAsPng, exportProject } from '../export/exportDiagram';
import { createSerializedAutosave } from '../export/serializedAutosave';
import { downloadAssetImportTemplate } from '../import/assetTemplate';
import { loadAutosave, saveAutosave } from '../storage/autosave';
import { PROJECT_EXTENSION, readProjectFile } from '../storage/fileAccess';
import { useWorkspaceStore } from '../store/workspaceStore';
import { ImportDialog } from './ImportDialog';

const saveStatusLabels = {
  saved: '已保存',
  dirty: '未保存',
  saving: '保存中',
  error: '保存失败',
};

export function TopBar() {
  const [importOpen, setImportOpen] = useState(false);
  const [autosaveReady, setAutosaveReady] = useState(false);
  const openInputRef = useRef<HTMLInputElement>(null);
  const importButtonRef = useRef<HTMLButtonElement>(null);
  const project = useWorkspaceStore((state) => state.project);
  const projectName = useWorkspaceStore((state) => state.project.project.name);
  const saveStatus = useWorkspaceStore((state) => state.saveStatus);
  const loadProject = useWorkspaceStore((state) => state.loadProject);
  const setSaveStatus = useWorkspaceStore((state) => state.setSaveStatus);
  const autosaveRef = useRef(
    createSerializedAutosave({
      getStatus: () => useWorkspaceStore.getState().saveStatus,
      save: saveAutosave,
      setStatus: (nextStatus) => useWorkspaceStore.getState().setSaveStatus(nextStatus),
    }),
  );

  useEffect(() => {
    let cancelled = false;
    const initialProject = useWorkspaceStore.getState().project;

    async function restoreAutosave() {
      try {
        const autosavedProject = await loadAutosave();
        const currentState = useWorkspaceStore.getState();

        if (
          !cancelled &&
          autosavedProject &&
          currentState.project === initialProject &&
          currentState.saveStatus === 'saved'
        ) {
          loadProject(autosavedProject);
        }
      } catch {
        if (!cancelled) {
          setSaveStatus('error');
        }
      } finally {
        if (!cancelled) {
          setAutosaveReady(true);
        }
      }
    }

    void restoreAutosave();

    return () => {
      cancelled = true;
    };
  }, [loadProject, setSaveStatus]);

  useEffect(() => {
    if (!autosaveReady) {
      return;
    }

    autosaveRef.current.schedule(project);
  }, [autosaveReady, project]);

  function closeImportDialog() {
    setImportOpen(false);
    importButtonRef.current?.focus();
  }

  async function openProjectFile(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      loadProject(await readProjectFile(file));
    } catch {
      setSaveStatus('error');
    } finally {
      if (openInputRef.current) {
        openInputRef.current.value = '';
      }
    }
  }

  function saveProject() {
    exportProject(project);
    setSaveStatus('saved');
  }

  async function exportCanvas(format: 'png' | 'pdf') {
    const canvasElement = document.querySelector<HTMLElement>('.react-flow, .diagram-canvas');

    if (!canvasElement) {
      setSaveStatus('error');
      return;
    }

    try {
      const filename = projectName || 'ops-project';

      if (format === 'png') {
        await exportElementAsPng(canvasElement, filename);
      } else {
        await exportElementAsPdf(canvasElement, filename);
      }
    } catch {
      setSaveStatus('error');
    }
  }

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
        <input
          ref={openInputRef}
          type="file"
          accept={`${PROJECT_EXTENSION},.json`}
          className="visually-hidden"
          onChange={(event) => void openProjectFile(event.currentTarget.files?.[0])}
        />
        <button
          type="button"
          className="command-button"
          onClick={() => openInputRef.current?.click()}
        >
          <FolderOpen size={16} aria-hidden="true" />
          打开
        </button>
        <button type="button" className="command-button" onClick={saveProject}>
          <Save size={16} aria-hidden="true" />
          保存
        </button>
        <button type="button" className="command-button" onClick={downloadAssetImportTemplate}>
          <Table size={16} aria-hidden="true" />
          下载模板
        </button>
        <button
          type="button"
          className="command-button"
          onClick={() => setImportOpen(true)}
          ref={importButtonRef}
        >
          <Upload size={16} aria-hidden="true" />
          导入
        </button>
        <button
          type="button"
          className="command-button"
          onClick={() => void exportCanvas('png')}
        >
          <ImageDown size={16} aria-hidden="true" />
          PNG
        </button>
        <button
          type="button"
          className="command-button"
          onClick={() => void exportCanvas('pdf')}
        >
          <FileDown size={16} aria-hidden="true" />
          PDF
        </button>
      </nav>
      <ImportDialog open={importOpen} onClose={closeImportDialog} />
    </header>
  );
}
