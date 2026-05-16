import { decodeProjectFile, encodeProjectFile } from '../domain/projectCodec';
import type { OpsProject } from '../domain/types';

export const PROJECT_EXTENSION = '.opsdraw.json';

export function downloadTextFile(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadProjectFile(project: OpsProject): void {
  downloadTextFile(`${toSafeFilename(project.project.name)}${PROJECT_EXTENSION}`, encodeProjectFile(project));
}

export async function readProjectFile(file: File): Promise<OpsProject> {
  const decoded = decodeProjectFile(await file.text());

  if (!decoded.ok) {
    throw new Error(decoded.message);
  }

  return decoded.project;
}

function toSafeFilename(name: string): string {
  const safeName = name
    .trim()
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-+|-+$/g, '');

  return safeName || 'project';
}
