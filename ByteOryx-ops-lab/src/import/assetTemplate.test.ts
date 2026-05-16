import { describe, expect, it, vi } from 'vitest';

import { downloadAssetImportTemplate } from './assetTemplate';

describe('asset import template', () => {
  it('downloads a CSV template with supported asset fields and examples', () => {
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

    const csv = blobParts?.join('');
    expect(downloadedFilename).toBe('ops-assets-template.csv');
    expect(blobType).toBe('text/csv;charset=utf-8');
    expect(csv).toContain('name,type,ip,zone,tags,vendor,description');
    expect(csv).toContain('core-sw-01,switch,10.0.0.1');

    vi.unstubAllGlobals();
});
});
