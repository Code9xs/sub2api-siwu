import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';

import { guessFieldMapping } from './fieldMapping';
import { parseCsvText, parseImportFile } from './importParser';
import { buildImportPreview } from './importValidation';

describe('asset import workflow', () => {
  it('maps common Chinese and English columns', () => {
    const mapping = guessFieldMapping(['设备名称', 'IP地址', '类型', '区域', '标签', '备注']);

    expect(mapping).toEqual({
      name: '设备名称',
      ip: 'IP地址',
      type: '类型',
      zone: '区域',
      tags: '标签',
      description: '备注',
    });
  });

  it('parses CSV text and builds a validation preview', () => {
    const rows = parseCsvText('name,type,ip,tags\ncore-sw,switch,10.0.0.1,"core,prod"\n,server,10.0.0.2,prod');
    const preview = buildImportPreview(rows, {
      name: 'name',
      type: 'type',
      ip: 'ip',
      tags: 'tags',
    });

    expect(preview.totalRows).toBe(2);
    expect(preview.validAssets).toHaveLength(1);
    expect(preview.invalidRows).toHaveLength(1);
    expect(preview.invalidRows[0].reason).toContain('name');
    expect(preview.invalidRows[0].rowNumber).toBe(3);
    expect(preview.validAssets[0].tags).toEqual(['core', 'prod']);
  });

  it('trims CSV headers and values', () => {
    const rows = parseCsvText(' name , ip \n core-sw , 10.0.0.1 ');

    expect(rows).toEqual([{ name: 'core-sw', ip: '10.0.0.1' }]);
  });

  it('rejects malformed CSV with a readable error', () => {
    expect(() => parseCsvText('name,tags\ncore-sw,"core')).toThrow(/Unable to parse CSV import/);
  });

  it('parses CSV files and rejects unsupported file extensions', async () => {
    const file = new File(['name,ip\ncore-sw,10.0.0.1'], 'assets.csv', { type: 'text/csv' });

    await expect(parseImportFile(file)).resolves.toEqual([{ name: 'core-sw', ip: '10.0.0.1' }]);
    await expect(parseImportFile(new File(['{}'], 'assets.json'))).rejects.toThrow(/Unsupported import file type/);
  });

  it('parses the first sheet of XLSX files', async () => {
    const workbook = XLSX.utils.book_new();
    const firstSheet = XLSX.utils.json_to_sheet([{ name: 'core-sw', ip: '10.0.0.1' }]);
    const secondSheet = XLSX.utils.json_to_sheet([{ name: 'ignored' }]);
    XLSX.utils.book_append_sheet(workbook, firstSheet, 'Assets');
    XLSX.utils.book_append_sheet(workbook, secondSheet, 'Other');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const file = new File([buffer], 'assets.xlsx');

    await expect(parseImportFile(file)).resolves.toEqual([{ name: 'core-sw', ip: '10.0.0.1' }]);
  });

  it('uses defaults and reports duplicate names and IPs among valid rows', () => {
    const preview = buildImportPreview(
      [
        { name: 'core-sw', ip: '10.0.0.1' },
        { name: 'core-sw', ip: '10.0.0.1' },
        { name: '', ip: '10.0.0.1' },
      ],
      { name: 'name', ip: 'ip' },
    );

    expect(preview.validAssets).toHaveLength(2);
    expect(preview.validAssets[0]).toMatchObject({
      name: 'core-sw',
      type: 'unknown-device',
      tags: [],
      source: 'import',
    });
    expect(preview.duplicateNames).toEqual(['core-sw']);
    expect(preview.duplicateIps).toEqual(['10.0.0.1']);
  });
});
