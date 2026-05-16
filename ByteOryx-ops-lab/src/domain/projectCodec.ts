import type { OpsProject } from './types';

export type DecodeProjectResult = { ok: true; project: OpsProject } | { ok: false; message: string };

export function encodeProjectFile(project: OpsProject): string {
  return JSON.stringify(project, null, 2);
}

export function decodeProjectFile(raw: string): DecodeProjectResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: 'Invalid JSON: project file could not be parsed.' };
  }

  if (!isRecord(parsed)) {
    return { ok: false, message: 'Invalid project file: expected a top-level object.' };
  }

  if (parsed.version !== 1) {
    return { ok: false, message: `Unsupported project version: ${String(parsed.version)}.` };
  }

  if (!isRecord(parsed.project)) {
    return { ok: false, message: 'Invalid project file: expected project object.' };
  }

  if (typeof parsed.project.name !== 'string') {
    return { ok: false, message: 'Invalid project file: expected project.name to be a string.' };
  }

  if (!Array.isArray(parsed.assets)) {
    return { ok: false, message: 'Invalid project file: expected assets array.' };
  }

  if (!Array.isArray(parsed.diagrams) || parsed.diagrams.length === 0) {
    return { ok: false, message: 'Invalid project file: expected diagrams to be a non-empty array.' };
  }

  if (!isRecord(parsed.settings)) {
    return { ok: false, message: 'Invalid project file: expected settings object.' };
  }

  if (typeof parsed.settings.activeDiagramId !== 'string') {
    return {
      ok: false,
      message: 'Invalid project file: expected settings.activeDiagramId to be a string.',
    };
  }

  return { ok: true, project: parsed as unknown as OpsProject };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
