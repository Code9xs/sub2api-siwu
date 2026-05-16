import { createId } from '../domain/ids';
import type { Asset } from '../domain/types';
import type { FieldMapping } from './fieldMapping';
import type { ImportRow } from './importParser';

export interface InvalidImportRow {
  rowNumber: number;
  reason: string;
  row: ImportRow;
}

export interface ImportPreview {
  totalRows: number;
  validAssets: Asset[];
  invalidRows: InvalidImportRow[];
  duplicateNames: string[];
  duplicateIps: string[];
}

export function buildImportPreview(rows: ImportRow[], mapping: FieldMapping): ImportPreview {
  const invalidRows: InvalidImportRow[] = [];
  const validAssets: Asset[] = [];
  const seenNames = new Set<string>();
  const seenIps = new Set<string>();
  const duplicateNames = new Set<string>();
  const duplicateIps = new Set<string>();

  rows.forEach((row, index) => {
    const name = getMappedValue(row, mapping.name);

    if (!name) {
      invalidRows.push({
        rowNumber: index + 2,
        reason: 'Missing required name',
        row,
      });
      return;
    }

    const ip = getMappedValue(row, mapping.ip);
    const asset = createImportAsset({
      name,
      type: getMappedValue(row, mapping.type) || 'unknown-device',
      ip,
      zone: getMappedValue(row, mapping.zone),
      tags: splitTags(getMappedValue(row, mapping.tags)),
      vendor: getMappedValue(row, mapping.vendor),
      description: getMappedValue(row, mapping.description),
    });

    validAssets.push(asset);
    trackDuplicate(name, seenNames, duplicateNames);

    if (ip) {
      trackDuplicate(ip, seenIps, duplicateIps);
    }
  });

  return {
    totalRows: rows.length,
    validAssets,
    invalidRows,
    duplicateNames: [...duplicateNames],
    duplicateIps: [...duplicateIps],
  };
}

function createImportAsset(input: Omit<Asset, 'id' | 'source' | 'createdAt' | 'updatedAt'>): Asset {
  const now = new Date().toISOString();

  return {
    id: createId('asset'),
    ...input,
    source: 'import',
    createdAt: now,
    updatedAt: now,
  };
}

function getMappedValue(row: ImportRow, header: string | undefined): string {
  if (!header) {
    return '';
  }

  return row[header]?.trim() ?? '';
}

function splitTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function trackDuplicate(value: string, seenValues: Set<string>, duplicates: Set<string>): void {
  if (seenValues.has(value)) {
    duplicates.add(value);
    return;
  }

  seenValues.add(value);
}
