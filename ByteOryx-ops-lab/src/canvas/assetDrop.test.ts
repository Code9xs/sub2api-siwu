import { describe, expect, it } from 'vitest';

import {
  ASSET_DRAG_MIME,
  hasAssetDragPayload,
  readAssetDragPayload,
  writeAssetDragPayload,
} from '../components/AssetPool';

class TestDataTransfer {
  private readonly data = new Map<string, string>();

  get types() {
    return [...this.data.keys()];
  }

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

  it('detects an asset drag from types when payload data is not readable', () => {
    const dataTransfer = {
      types: [ASSET_DRAG_MIME],
      getData: () => '',
    } as unknown as DataTransfer;

    expect(readAssetDragPayload(dataTransfer)).toBeNull();
    expect(hasAssetDragPayload(dataTransfer)).toBe(true);
  });
});
