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

  if (typeof parsed.project.createdAt !== 'string') {
    return { ok: false, message: 'Invalid project file: expected project.createdAt to be a string.' };
  }

  if (typeof parsed.project.updatedAt !== 'string') {
    return { ok: false, message: 'Invalid project file: expected project.updatedAt to be a string.' };
  }

  if (!Array.isArray(parsed.assets)) {
    return { ok: false, message: 'Invalid project file: expected assets array.' };
  }

  if (!Array.isArray(parsed.diagrams) || parsed.diagrams.length === 0) {
    return { ok: false, message: 'Invalid project file: expected diagrams to be a non-empty array.' };
  }

  for (const [index, diagram] of parsed.diagrams.entries()) {
    const result = validateDiagram(diagram, index);
    if (result) {
      return result;
    }
  }

  if (!isRecord(parsed.settings)) {
    return { ok: false, message: 'Invalid project file: expected settings object.' };
  }

  const settings = parsed.settings;

  if (typeof settings.activeDiagramId !== 'string') {
    return {
      ok: false,
      message: 'Invalid project file: expected settings.activeDiagramId to be a string.',
    };
  }

  if (typeof settings.snapToGrid !== 'boolean') {
    return {
      ok: false,
      message: 'Invalid project file: expected settings.snapToGrid to be a boolean.',
    };
  }

  if (typeof settings.showGrid !== 'boolean') {
    return {
      ok: false,
      message: 'Invalid project file: expected settings.showGrid to be a boolean.',
    };
  }

  if (!parsed.diagrams.some((diagram) => diagram.id === settings.activeDiagramId)) {
    return {
      ok: false,
      message: 'Invalid project file: settings.activeDiagramId must match an existing diagram id.',
    };
  }

  return { ok: true, project: parsed as unknown as OpsProject };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateDiagram(diagram: unknown, index: number): DecodeProjectResult | undefined {
  const path = `diagrams[${index}]`;

  if (!isRecord(diagram)) {
    return { ok: false, message: `Invalid project file: expected ${path} to be an object.` };
  }

  if (typeof diagram.id !== 'string') {
    return { ok: false, message: `Invalid project file: expected ${path}.id to be a string.` };
  }

  if (typeof diagram.name !== 'string') {
    return { ok: false, message: `Invalid project file: expected ${path}.name to be a string.` };
  }

  if (diagram.template !== 'network' && diagram.template !== 'system') {
    return {
      ok: false,
      message: `Invalid project file: expected ${path}.template to be network or system.`,
    };
  }

  if (!Array.isArray(diagram.nodes)) {
    return { ok: false, message: `Invalid project file: expected ${path}.nodes to be an array.` };
  }

  if (!Array.isArray(diagram.edges)) {
    return { ok: false, message: `Invalid project file: expected ${path}.edges to be an array.` };
  }

  if (!isRecord(diagram.viewport)) {
    return { ok: false, message: `Invalid project file: expected ${path}.viewport to be an object.` };
  }

  if (typeof diagram.viewport.x !== 'number') {
    return {
      ok: false,
      message: `Invalid project file: expected ${path}.viewport.x to be a number.`,
    };
  }

  if (typeof diagram.viewport.y !== 'number') {
    return {
      ok: false,
      message: `Invalid project file: expected ${path}.viewport.y to be a number.`,
    };
  }

  if (typeof diagram.viewport.zoom !== 'number') {
    return {
      ok: false,
      message: `Invalid project file: expected ${path}.viewport.zoom to be a number.`,
    };
  }

  return undefined;
}
