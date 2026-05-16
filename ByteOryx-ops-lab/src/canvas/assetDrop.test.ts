import { describe, expect, it } from 'vitest';

import { ASSET_DRAG_MIME, readAssetDragPayload, writeAssetDragPayload } from '../components/AssetPool';

class TestDataTransfer {
  private readonly data = new Map<string, string>();

  setData(type: string, value: string) {
    this.data.set(type, value);
  }

  getData(type: string) {
    return this.data.get(type) ?? '';
  }
}

const createDataTransfer = () =>
  typeof DataTransfer === 'undefined'
    ? (new TestDataTransfer() as unknown as DataTransfer)
    : new DataTransfer();

describe('asset drag payload', () => {
  it('writes and reads an asset id from DataTransfer', () => {
    const dataTransfer = createDataTransfer();

    writeAssetDragPayload(dataTransfer, 'asset-web-1');

    expect(dataTransfer.getData(ASSET_DRAG_MIME)).toBe('asset-web-1');
    expect(readAssetDragPayload(dataTransfer)).toBe('asset-web-1');
  });
});
