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

  for (const [index, asset] of parsed.assets.entries()) {
    const result = validateAsset(asset, index);
    if (result) {
      return result;
    }
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

  for (const [nodeIndex, node] of diagram.nodes.entries()) {
    const result = validateNode(node, `${path}.nodes[${nodeIndex}]`);
    if (result) {
      return result;
    }
  }

  if (!Array.isArray(diagram.edges)) {
    return { ok: false, message: `Invalid project file: expected ${path}.edges to be an array.` };
  }

  const nodeIds = new Set(diagram.nodes.map((node) => (isRecord(node) ? node.id : undefined)));
  for (const [edgeIndex, edge] of diagram.edges.entries()) {
    const result = validateEdge(edge, `${path}.edges[${edgeIndex}]`, nodeIds);
    if (result) {
      return result;
    }
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

function validateAsset(asset: unknown, index: number): DecodeProjectResult | undefined {
  const path = `assets[${index}]`;

  if (!isRecord(asset)) {
    return { ok: false, message: `Invalid project file: expected ${path} to be an object.` };
  }

  for (const key of ['id', 'name', 'type', 'createdAt', 'updatedAt'] as const) {
    if (typeof asset[key] !== 'string') {
      return { ok: false, message: `Invalid project file: expected ${path}.${key} to be a string.` };
    }
  }

  for (const key of ['ip', 'zone', 'vendor', 'description'] as const) {
    if (asset[key] !== undefined && typeof asset[key] !== 'string') {
      return { ok: false, message: `Invalid project file: expected ${path}.${key} to be a string.` };
    }
  }

  if (!Array.isArray(asset.tags) || !asset.tags.every((tag) => typeof tag === 'string')) {
    return { ok: false, message: `Invalid project file: expected ${path}.tags to be a string array.` };
  }

  if (asset.source !== 'import' && asset.source !== 'manual') {
    return { ok: false, message: `Invalid project file: expected ${path}.source to be import or manual.` };
  }

  return undefined;
}

function validateNode(node: unknown, path: string): DecodeProjectResult | undefined {
  if (!isRecord(node)) {
    return { ok: false, message: `Invalid project file: expected ${path} to be an object.` };
  }

  for (const key of ['id', 'name', 'type'] as const) {
    if (typeof node[key] !== 'string') {
      return { ok: false, message: `Invalid project file: expected ${path}.${key} to be a string.` };
    }
  }

  if (node.assetId !== undefined && typeof node.assetId !== 'string') {
    return { ok: false, message: `Invalid project file: expected ${path}.assetId to be a string.` };
  }

  const positionResult = validatePoint(node.position, `${path}.position`);
  if (positionResult) {
    return positionResult;
  }

  if (node.size !== undefined) {
    const sizeResult = validateSize(node.size, `${path}.size`);
    if (sizeResult) {
      return sizeResult;
    }
  }

  return validateStyleAndMetadata(node, path);
}

function validateEdge(
  edge: unknown,
  path: string,
  nodeIds: Set<unknown>,
): DecodeProjectResult | undefined {
  if (!isRecord(edge)) {
    return { ok: false, message: `Invalid project file: expected ${path} to be an object.` };
  }

  for (const key of ['id', 'sourceNodeId', 'targetNodeId', 'relationshipType'] as const) {
    if (typeof edge[key] !== 'string') {
      return { ok: false, message: `Invalid project file: expected ${path}.${key} to be a string.` };
    }
  }

  if (!nodeIds.has(edge.sourceNodeId)) {
    return {
      ok: false,
      message: `Invalid project file: ${path}.sourceNodeId must match an existing node id.`,
    };
  }

  if (!nodeIds.has(edge.targetNodeId)) {
    return {
      ok: false,
      message: `Invalid project file: ${path}.targetNodeId must match an existing node id.`,
    };
  }

  if (edge.direction !== 'none' && edge.direction !== 'one-way' && edge.direction !== 'two-way') {
    return {
      ok: false,
      message: `Invalid project file: expected ${path}.direction to be none, one-way, or two-way.`,
    };
  }

  if (edge.label !== undefined && typeof edge.label !== 'string') {
    return { ok: false, message: `Invalid project file: expected ${path}.label to be a string.` };
  }

  return validateStyleAndMetadata(edge, path);
}

function validatePoint(value: unknown, path: string): DecodeProjectResult | undefined {
  if (!isRecord(value)) {
    return { ok: false, message: `Invalid project file: expected ${path} to be an object.` };
  }

  if (typeof value.x !== 'number') {
    return { ok: false, message: `Invalid project file: expected ${path}.x to be a number.` };
  }

  if (typeof value.y !== 'number') {
    return { ok: false, message: `Invalid project file: expected ${path}.y to be a number.` };
  }

  return undefined;
}

function validateSize(value: unknown, path: string): DecodeProjectResult | undefined {
  if (!isRecord(value)) {
    return { ok: false, message: `Invalid project file: expected ${path} to be an object.` };
  }

  if (typeof value.width !== 'number') {
    return { ok: false, message: `Invalid project file: expected ${path}.width to be a number.` };
  }

  if (typeof value.height !== 'number') {
    return { ok: false, message: `Invalid project file: expected ${path}.height to be a number.` };
  }

  return undefined;
}

function validateStyleAndMetadata(
  value: Record<string, unknown>,
  path: string,
): DecodeProjectResult | undefined {
  if (!isRecord(value.style)) {
    return { ok: false, message: `Invalid project file: expected ${path}.style to be an object.` };
  }

  for (const key of ['fill', 'stroke', 'textColor'] as const) {
    if (value.style[key] !== undefined && typeof value.style[key] !== 'string') {
      return { ok: false, message: `Invalid project file: expected ${path}.style.${key} to be a string.` };
    }
  }

  if (!isRecord(value.metadata)) {
    return { ok: false, message: `Invalid project file: expected ${path}.metadata to be an object.` };
  }

  for (const [key, metadataValue] of Object.entries(value.metadata)) {
    if (
      typeof metadataValue !== 'string' &&
      (!Array.isArray(metadataValue) || !metadataValue.every((item) => typeof item === 'string'))
    ) {
      return {
        ok: false,
        message: `Invalid project file: expected ${path}.metadata.${key} to be a string or string array.`,
      };
    }
  }

  return undefined;
}
