import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

import type { OpsProject } from '../domain/types';
import { PROJECT_EXTENSION, downloadTextFile } from '../storage/fileAccess';
import { encodeProjectFile } from '../domain/projectCodec';

const FALLBACK_PROJECT_NAME = 'ops-project';

export function projectDownloadName(projectName: string): string {
  const safeName = projectName
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[ .-]+|[ .-]+$/g, '');

  return `${safeName || FALLBACK_PROJECT_NAME}${PROJECT_EXTENSION}`;
}

export function exportProject(project: OpsProject): void {
  downloadTextFile(projectDownloadName(project.project.name), encodeProjectFile(project));
}

export async function exportElementAsPng(element: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await toPng(element, { cacheBust: true });
  const anchor = document.createElement('a');

  anchor.href = dataUrl;
  anchor.download = withExtension(filename, '.png');
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export async function exportElementAsPdf(element: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await toPng(element, { cacheBust: true });
  const pdf = new jsPDF({ format: 'a4', orientation: 'landscape', unit: 'mm' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidth, pageHeight);
  pdf.save(withExtension(filename, '.pdf'));
}

function withExtension(filename: string, extension: string): string {
  const safeBaseName = filename
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[ .-]+|[ .-]+$/g, '');

  if (!safeBaseName) {
    return `${FALLBACK_PROJECT_NAME}${extension}`;
  }

  return safeBaseName.endsWith(extension) ? safeBaseName : `${safeBaseName}${extension}`;
}
