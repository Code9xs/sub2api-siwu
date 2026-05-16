import { useMemo, useState } from 'react';

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

  const preview = useMemo<ImportPreview | null>(() => {
    if (rows.length === 0) {
      return null;
    }

    return buildImportPreview(rows, mapping);
  }, [mapping, rows]);

  if (!open) {
    return null;
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setError(null);
      const parsedRows = await parseImportFile(file);
      const parsedHeaders = collectHeaders(parsedRows);
      setRows(parsedRows);
      setHeaders(parsedHeaders);
      setMapping(guessFieldMapping(parsedHeaders));
    } catch (parseError) {
      setRows([]);
      setHeaders([]);
      setMapping({});
      setError(parseError instanceof Error ? parseError.message : '\u65e0\u6cd5\u89e3\u6790\u5bfc\u5165\u6587\u4ef6');
    }
  }

  function handleMappingChange(field: ImportAssetField, header: string) {
    setMapping((current) => ({
      ...current,
      [field]: header || undefined,
    }));
  }

  function handleConfirm() {
    if (!preview) {
      return;
    }

    importAssets(preview.validAssets);
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <section
        aria-label="\u5bfc\u5165\u8d44\u4ea7"
        aria-modal="true"
        className="import-dialog"
        role="dialog"
      >
        <header className="import-dialog__header">
          <div>
            <h2>{'\u5bfc\u5165\u8d44\u4ea7'}</h2>
            <p>CSV / XLSX</p>
          </div>
          <button className="icon-button" type="button" aria-label="\u5173\u95ed" onClick={onClose}>
            x
          </button>
        </header>

        <div className="import-dialog__body">
          <label className="file-picker">
            <span>{'\u9009\u62e9 CSV \u6216 XLSX \u6587\u4ef6'}</span>
            <input
              accept=".csv,.xlsx"
              aria-label="\u9009\u62e9 CSV \u6216 XLSX \u6587\u4ef6"
              onChange={handleFileChange}
              type="file"
            />
          </label>

          {error ? (
            <p className="import-error" role="alert">
              {error}
            </p>
          ) : null}

          {headers.length > 0 ? (
            <div className="mapping-grid" aria-label="\u5b57\u6bb5\u6620\u5c04">
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
            <div className="import-preview" aria-label="\u5bfc\u5165\u9884\u89c8">
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
        </div>

        <footer className="import-dialog__footer">
          <button type="button" className="command-button" onClick={onClose}>
            {'\u53d6\u6d88'}
          </button>
          <button
            type="button"
            className="command-button command-button--primary"
            disabled={!preview}
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
