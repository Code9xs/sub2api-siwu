import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';

import { guessFieldMapping } from './fieldMapping';
import { parseCsvText, parseImportFile } from './importParser';
import { buildImportPreview } from './importValidation';

describe('asset import workflow', () => {
  it('maps common Chinese and English columns', () => {
    const mapping = guessFieldMapping([
      '\u8bbe\u5907\u540d\u79f0',
      'IP\u5730\u5740',
      '\u7c7b\u578b',
      '\u533a\u57df',
      '\u6807\u7b7e',
      '\u5907\u6ce8',
    ]);

    expect(mapping).toEqual({
      name: '\u8bbe\u5907\u540d\u79f0',
      ip: 'IP\u5730\u5740',
      type: '\u7c7b\u578b',
      zone: '\u533a\u57df',
      tags: '\u6807\u7b7e',
      description: '\u5907\u6ce8',
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

  it('decodes GB18030 Chinese CSV files before mapping and preview validation', async () => {
    const file = new File([gb18030ChineseCsvBuffer()], 'assets.csv', { type: 'text/csv' });
    const rows = await parseImportFile(file);
    const mapping = guessFieldMapping(Object.keys(rows[0]));
    const preview = buildImportPreview(rows, mapping);

    expect(mapping).toEqual({
      name: '\u8bbe\u5907\u540d\u79f0',
      ip: 'IP\u5730\u5740',
      type: '\u7c7b\u578b',
      zone: '\u533a\u57df',
      tags: '\u6807\u7b7e',
      description: '\u5907\u6ce8',
    });
    expect(preview.validAssets).toHaveLength(1);
    expect(preview.validAssets[0]).toMatchObject({
      name: '\u6838\u5fc3\u4ea4\u6362\u673a',
      ip: '10.0.0.1',
      type: '\u4ea4\u6362\u673a',
      zone: '\u751f\u4ea7',
      tags: ['\u6838\u5fc3'],
      description: '\u4e3b\u5e72\u8bbe\u5907',
      source: 'import',
    });
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

function gb18030ChineseCsvBuffer(): ArrayBuffer {
  const bytes = new Uint8Array([
    201, 232, 177, 184, 195, 251, 179, 198, 44, 73, 80, 181, 216, 214, 183, 44, 192, 224, 208,
    205, 44, 199, 248, 211, 242, 44, 177, 234, 199, 169, 44, 177, 184, 215, 162, 10, 186,
    203, 208, 196, 189, 187, 187, 187, 187, 250, 44, 49, 48, 46, 48, 46, 48, 46, 49, 44,
    189, 187, 187, 187, 187, 250, 44, 201, 250, 178, 250, 44, 186, 203, 208, 196, 44, 214,
    247, 184, 201, 201, 232, 177, 184,
  ]);

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
