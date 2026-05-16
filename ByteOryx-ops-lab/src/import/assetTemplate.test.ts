import { describe, expect, it, vi } from 'vitest';
import * as XLSX from 'xlsx';

import { downloadAssetImportTemplate } from './assetTemplate';

describe('asset import template', () => {
  it('downloads an XLSX template with Chinese headers, examples, and type options', () => {
    let downloadedFilename = '';
    let blobParts: BlobPart[] | undefined;
    let blobType = '';
    const OriginalBlob = globalThis.Blob;

    vi.stubGlobal(
      'Blob',
      class MockBlob extends OriginalBlob {
        parts: BlobPart[];

        constructor(parts: BlobPart[], options?: BlobPropertyBag) {
          super(parts, options);
          this.parts = parts;
        }
      },
    );
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      const templateBlob = blob as Blob & { parts?: BlobPart[] };
      blobParts = templateBlob.parts;
      blobType = templateBlob.type;
      return 'blob:asset-template';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click(
      this: HTMLAnchorElement,
    ) {
      downloadedFilename = this.download;
    });

    downloadAssetImportTemplate();

    const workbook = XLSX.read(blobParts?.[0], { type: 'array' });
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(workbook.Sheets['资产导入模板'], {
      defval: '',
      raw: false,
    });
    const typeRows = XLSX.utils.sheet_to_json<Record<string, string>>(workbook.Sheets['类型选项'], {
      defval: '',
      raw: false,
    });

    expect(downloadedFilename).toBe('ops-assets-template.xlsx');
    expect(blobType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(Object.keys(rows[0])).toEqual([
      '名称',
      '类型',
      'IP地址',
      '区域',
      '标签',
      '厂商',
      '描述',
    ]);
    expect(rows[0]).toMatchObject({
      名称: 'app-01',
      类型: '应用服务器',
      IP地址: '10.0.1.10',
    });
    expect(typeRows.map((row) => row['类型'])).toEqual(
      expect.arrayContaining(['应用服务器', '数据库服务器', 'Elasticsearch服务器', 'Redis服务器']),
    );

    vi.unstubAllGlobals();
  });
});
