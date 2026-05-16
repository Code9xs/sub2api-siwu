import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export type ImportRow = Record<string, string>;

export function parseCsvText(text: string): ImportRow[] {
  const result = Papa.parse<ImportRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  if (result.errors.length > 0) {
    const message = result.errors.map((error) => `row ${error.row ?? 'unknown'}: ${error.message}`).join('; ');
    throw new Error(`Unable to parse CSV import: ${message}`);
  }

  return result.data.map(trimRow);
}

export async function parseImportFile(file: File): Promise<ImportRow[]> {
  const extension = getFileExtension(file.name);

  if (extension === 'csv') {
    return parseCsvText(decodeCsvBuffer(await file.arrayBuffer()));
  }

  if (extension === 'xlsx') {
    return parseXlsxBuffer(await file.arrayBuffer());
  }

  throw new Error('Unsupported import file type. Please upload a .csv or .xlsx file.');
}

function parseXlsxBuffer(buffer: ArrayBuffer): ImportRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
    raw: false,
  });

  return rows.map((row) => trimRow(row));
}

function decodeCsvBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  if (hasUtf8Bom(bytes)) {
    return new TextDecoder('utf-8').decode(bytes);
  }

  const utf8Text = new TextDecoder('utf-8').decode(bytes);

  if (!utf8Text.includes('\uFFFD')) {
    return utf8Text;
  }

  return new TextDecoder('gb18030').decode(bytes);
}

function hasUtf8Bom(bytes: Uint8Array): boolean {
  return bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
}

function trimRow(row: Record<string, unknown>): ImportRow {
  return Object.entries(row).reduce<ImportRow>((trimmed, [key, value]) => {
    trimmed[key.trim()] = String(value ?? '').trim();
    return trimmed;
  }, {});
}

function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}
