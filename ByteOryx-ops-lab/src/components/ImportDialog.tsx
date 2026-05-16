import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ImportAssetField, FieldMapping } from '../import/fieldMapping';
import { guessFieldMapping } from '../import/fieldMapping';
import { parseImportFile, type ImportRow } from '../import/importParser';
import { buildImportPreview, type ImportPreview } from '../import/importValidation';
import { useWorkspaceStore } from '../store/workspaceStore';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
}

const assetFields: ImportAssetField[] = [
  'name',
  'type',
  'ip',
  'zone',
  'tags',
  'vendor',
  'description',
];

const fieldLabels: Record<ImportAssetField, string> = {
  name: '\u540d\u79f0',
  type: '\u7c7b\u578b',
  ip: 'IP',
  zone: '\u533a\u57df',
  tags: '\u6807\u7b7e',
  vendor: '\u5382\u5546',
  description: '\u63cf\u8ff0',
};

export function ImportDialog({ open, onClose }: ImportDialogProps) {
  const importAssets = useWorkspaceStore((state) => state.importAssets);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<FieldMapping>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parseRequestIdRef = useRef(0);

  const preview = useMemo<ImportPreview | null>(() => {
    if (rows.length === 0) {
      return null;
    }

    return buildImportPreview(rows, mapping);
  }, [mapping, rows]);

  const resetState = useCallback(() => {
    parseRequestIdRef.current += 1;
    setRows([]);
    setHeaders([]);
    setMapping({});
    setError(null);
    setLoading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }

    fileInputRef.current?.focus();
  }, [open, resetState]);

  function closeDialog() {
    resetState();
    onClose();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const parseRequestId = parseRequestIdRef.current + 1;
    parseRequestIdRef.current = parseRequestId;
    setRows([]);
    setHeaders([]);
    setMapping({});
    setError(null);
    setLoading(true);

    try {
      const parsedRows = await parseImportFile(file);
      if (parseRequestId !== parseRequestIdRef.current) {
        return;
      }

      const parsedHeaders = collectHeaders(parsedRows);
      setRows(parsedRows);
      setHeaders(parsedHeaders);
      setMapping(guessFieldMapping(parsedHeaders));
    } catch (parseError) {
      if (parseRequestId !== parseRequestIdRef.current) {
        return;
      }

      setRows([]);
      setHeaders([]);
      setMapping({});
      setError(parseError instanceof Error ? parseError.message : '\u65e0\u6cd5\u89e3\u6790\u5bfc\u5165\u6587\u4ef6');
    } finally {
      if (parseRequestId === parseRequestIdRef.current) {
        setLoading(false);
      }
    }
  }

  function handleMappingChange(field: ImportAssetField, header: string) {
    setMapping((current) => ({
      ...current,
      [field]: header || undefined,
    }));
  }

  function handleConfirm() {
    if (!preview || preview.validAssets.length === 0) {
      return;
    }

    importAssets(preview.validAssets);
    closeDialog();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = getFocusableElements(dialogRef.current);

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <section
        aria-label={'\u5bfc\u5165\u8d44\u4ea7'}
        aria-modal="true"
        className="import-dialog"
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <header className="import-dialog__header">
          <div>
            <h2>{'\u5bfc\u5165\u8d44\u4ea7'}</h2>
            <p>CSV / XLSX</p>
          </div>
          <button className="icon-button" type="button" aria-label={'\u5173\u95ed'} onClick={closeDialog}>
            x
          </button>
        </header>

        <div className="import-dialog__body">
          <label className="file-picker">
            <span>{'\u9009\u62e9 CSV \u6216 XLSX \u6587\u4ef6'}</span>
            <input
              accept=".csv,.xlsx"
              aria-label={'\u9009\u62e9 CSV \u6216 XLSX \u6587\u4ef6'}
              onChange={handleFileChange}
              ref={fileInputRef}
              type="file"
            />
          </label>

          {loading ? <p className="import-loading">{'\u6b63\u5728\u89e3\u6790\u6587\u4ef6...'}</p> : null}

          {error ? (
            <p className="import-error" role="alert">
              {error}
            </p>
          ) : null}

          {headers.length > 0 ? (
            <div className="mapping-grid" aria-label={'\u5b57\u6bb5\u6620\u5c04'}>
              {assetFields.map((field) => (
                <label className="mapping-field" key={field}>
                  <span>{fieldLabels[field]}</span>
                  <select
                    value={mapping[field] ?? ''}
                    onChange={(event) => handleMappingChange(field, event.target.value)}
                  >
                    <option value="">{'\u4e0d\u5bfc\u5165'}</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          ) : null}

          {preview ? (
            <div className="import-preview" aria-label={'\u5bfc\u5165\u9884\u89c8'}>
              <span>
                {'\u603b\u884c\u6570'} <strong>{preview.totalRows}</strong>
              </span>
              <span>
                {'\u6709\u6548\u8d44\u4ea7'} <strong>{preview.validAssets.length}</strong>
              </span>
              <span>
                {'\u65e0\u6548\u884c'} <strong>{preview.invalidRows.length}</strong>
              </span>
            </div>
          ) : null}

          {preview && preview.validAssets.length === 0 ? (
            <p className="import-warning" role="status">
              {'\u6ca1\u6709\u53ef\u5bfc\u5165\u7684\u6709\u6548\u8d44\u4ea7'}
            </p>
          ) : null}
        </div>

        <footer className="import-dialog__footer">
          <button type="button" className="command-button" onClick={closeDialog}>
            {'\u53d6\u6d88'}
          </button>
          <button
            type="button"
            className="command-button command-button--primary"
            disabled={!preview || preview.validAssets.length === 0 || loading}
            onClick={handleConfirm}
          >
            {'\u786e\u8ba4\u5bfc\u5165'}
          </button>
        </footer>
      </section>
    </div>
  );
}

function collectHeaders(rows: ImportRow[]): string[] {
  return [...new Set(rows.flatMap((row) => Object.keys(row)))];
}

function getFocusableElements(root: HTMLElement | null): HTMLElement[] {
  if (!root) {
    return [];
  }

  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute('disabled') && element.tabIndex !== -1);
}
