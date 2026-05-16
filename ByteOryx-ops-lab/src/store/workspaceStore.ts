import { create } from 'zustand';

import { createId } from '../domain/ids';
import { createProject } from '../domain/projectFactory';
import type {
  Asset,
  Diagram,
  DiagramEdge,
  DiagramNode,
  DiagramViewport,
  NodeStyle,
  OpsProject,
  Point,
  Size,
} from '../domain/types';
import type { DomainId } from '../domain/ids';

type SaveStatus = 'saved' | 'dirty' | 'saving' | 'error';

interface ManualNodeInput {
  name: string;
  type: string;
  position: Point;
  size?: DiagramNode['size'];
  style?: NodeStyle;
  metadata?: DiagramNode['metadata'];
}

interface WorkspaceClipboard {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

interface WorkspaceState {
  project: OpsProject;
  selectedNodeIds: DomainId<'node'>[];
  selectedEdgeIds: DomainId<'edge'>[];
  clipboard: WorkspaceClipboard | null;
  saveStatus: SaveStatus;
  resetWorkspace: () => void;
  loadProject: (project: OpsProject) => void;
  activeDiagram: () => Diagram;
  importAssets: (assets: Asset[]) => void;
  placeAssetOnCanvas: (assetId: DomainId<'asset'>, position: Point) => DomainId<'node'>;
  addManualNode: (input: ManualNodeInput) => DomainId<'node'>;
  connectNodes: (
    sourceNodeId: DomainId<'node'>,
    targetNodeId: DomainId<'node'>,
  ) => DomainId<'edge'>;
  updateNode: (nodeId: DomainId<'node'>, updates: Partial<Omit<DiagramNode, 'id'>>) => void;
  updateEdge: (edgeId: DomainId<'edge'>, updates: Partial<Omit<DiagramEdge, 'id'>>) => void;
  updateViewport: (viewport: DiagramViewport) => void;
  deleteSelection: () => void;
  copySelection: () => void;
  pasteClipboard: () => DomainId<'node'>[];
  setSelection: (selection: {
    nodeIds?: DomainId<'node'>[];
    edgeIds?: DomainId<'edge'>[];
  }) => void;
  setSaveStatus: (saveStatus: SaveStatus) => void;
}

const defaultNodeStyle: NodeStyle = {
  fill: '#ffffff',
  stroke: '#2563eb',
  textColor: '#111827',
};

const defaultEdgeStyle: NodeStyle = {
  stroke: '#64748b',
  textColor: '#334155',
};

const initialProjectName = '未命名运维图纸';

function createInitialProject(): OpsProject {
  return createProject({ name: initialProjectName, template: 'network' });
}

function markProjectDirty(project: OpsProject): OpsProject {
  return {
    ...project,
    project: {
      ...project.project,
      updatedAt: new Date().toISOString(),
    },
  };
}

function updateActiveDiagram(project: OpsProject, update: (diagram: Diagram) => Diagram): OpsProject {
  const activeDiagramId = project.settings.activeDiagramId;

  return {
    ...project,
    diagrams: project.diagrams.map((diagram) =>
      diagram.id === activeDiagramId ? update(diagram) : diagram,
    ),
  };
}

function copyAssetMetadata(asset: Asset): DiagramNode['metadata'] {
  return {
    ...(asset.ip ? { ip: asset.ip } : {}),
    ...(asset.zone ? { zone: asset.zone } : {}),
    ...(asset.vendor ? { vendor: asset.vendor } : {}),
    ...(asset.description ? { description: asset.description } : {}),
    tags: [...asset.tags],
  };
}

function cloneStyle(style: NodeStyle): NodeStyle {
  return { ...style };
}

function clonePoint(point: Point): Point {
  return { ...point };
}

function cloneSize(size: Size): Size {
  return { ...size };
}

function cloneViewport(viewport: DiagramViewport): DiagramViewport {
  return { ...viewport };
}

function cloneMetadata<TMetadata extends DiagramNode['metadata'] | DiagramEdge['metadata']>(
  metadata: TMetadata,
): TMetadata {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      Array.isArray(value) ? [...value] : value,
    ]),
  ) as TMetadata;
}

function cloneNodeUpdates(
  updates: Partial<Omit<DiagramNode, 'id'>>,
): Partial<Omit<DiagramNode, 'id'>> {
  return {
    ...updates,
    ...(updates.position ? { position: clonePoint(updates.position) } : {}),
    ...(updates.size ? { size: cloneSize(updates.size) } : {}),
    ...(updates.style ? { style: cloneStyle(updates.style) } : {}),
    ...(updates.metadata ? { metadata: cloneMetadata(updates.metadata) } : {}),
  };
}

function cloneEdgeUpdates(
  updates: Partial<Omit<DiagramEdge, 'id'>>,
): Partial<Omit<DiagramEdge, 'id'>> {
  return {
    ...updates,
    ...(updates.style ? { style: cloneStyle(updates.style) } : {}),
    ...(updates.metadata ? { metadata: cloneMetadata(updates.metadata) } : {}),
  };
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  project: createInitialProject(),
  selectedNodeIds: [],
  selectedEdgeIds: [],
  clipboard: null,
  saveStatus: 'saved',

  resetWorkspace: () => {
    set({
      project: createInitialProject(),
      selectedNodeIds: [],
      selectedEdgeIds: [],
      clipboard: null,
      saveStatus: 'saved',
    });
  },

  loadProject: (project) => {
    set({
      project,
      selectedNodeIds: [],
      selectedEdgeIds: [],
      clipboard: null,
      saveStatus: 'saved',
    });
  },

  activeDiagram: () => {
    const { project } = get();
    const activeDiagram = project.diagrams.find(
      (diagram) => diagram.id === project.settings.activeDiagramId,
    );

    if (!activeDiagram) {
      throw new Error(`Active diagram not found: ${project.settings.activeDiagramId}`);
    }

    return activeDiagram;
  },

  importAssets: (assets) => {
    set(({ project }) => ({
      project: markProjectDirty({
        ...project,
        assets: [...project.assets, ...assets],
      }),
      saveStatus: 'dirty',
    }));
  },

  placeAssetOnCanvas: (assetId, position) => {
    const asset = get().project.assets.find((candidate) => candidate.id === assetId);

    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    const nodeId = createId('node');
    const node: DiagramNode = {
      id: nodeId,
      assetId,
      name: asset.name,
      type: asset.type,
      position: clonePoint(position),
      style: { ...defaultNodeStyle },
      metadata: copyAssetMetadata(asset),
    };

    set(({ project }) => ({
      project: markProjectDirty(
        updateActiveDiagram(project, (diagram) => ({
          ...diagram,
          nodes: [...diagram.nodes, node],
        })),
      ),
      saveStatus: 'dirty',
    }));

    return nodeId;
  },

  addManualNode: (input) => {
    const nodeId = createId('node');
    const node: DiagramNode = {
      id: nodeId,
      name: input.name,
      type: input.type,
      position: clonePoint(input.position),
      ...(input.size ? { size: cloneSize(input.size) } : {}),
      style: input.style ? cloneStyle(input.style) : { ...defaultNodeStyle },
      metadata: input.metadata ? cloneMetadata(input.metadata) : {},
    };

    set(({ project }) => ({
      project: markProjectDirty(
        updateActiveDiagram(project, (diagram) => ({
          ...diagram,
          nodes: [...diagram.nodes, node],
        })),
      ),
      saveStatus: 'dirty',
    }));

    return nodeId;
  },

  connectNodes: (sourceNodeId, targetNodeId) => {
    const activeDiagram = get().activeDiagram();
    const sourceExists = activeDiagram.nodes.some((node) => node.id === sourceNodeId);
    const targetExists = activeDiagram.nodes.some((node) => node.id === targetNodeId);

    if (!sourceExists) {
      throw new Error(`Source node not found: ${sourceNodeId}`);
    }

    if (!targetExists) {
      throw new Error(`Target node not found: ${targetNodeId}`);
    }

    const edgeId = createId('edge');
    const edge: DiagramEdge = {
      id: edgeId,
      sourceNodeId,
      targetNodeId,
      direction: 'none',
      relationshipType: 'connected-to',
      style: { ...defaultEdgeStyle },
      metadata: {},
    };

    set(({ project }) => ({
      project: markProjectDirty(
        updateActiveDiagram(project, (diagram) => ({
          ...diagram,
          edges: [...diagram.edges, edge],
        })),
      ),
      saveStatus: 'dirty',
    }));

    return edgeId;
  },

  updateNode: (nodeId, updates) => {
    const clonedUpdates = cloneNodeUpdates(updates);

    set(({ project }) => ({
      project: markProjectDirty(
        updateActiveDiagram(project, (diagram) => ({
          ...diagram,
          nodes: diagram.nodes.map((node) =>
            node.id === nodeId ? { ...node, ...clonedUpdates } : node,
          ),
        })),
      ),
      saveStatus: 'dirty',
    }));
  },

  updateEdge: (edgeId, updates) => {
    const clonedUpdates = cloneEdgeUpdates(updates);

    set(({ project }) => ({
      project: markProjectDirty(
        updateActiveDiagram(project, (diagram) => ({
          ...diagram,
          edges: diagram.edges.map((edge) =>
            edge.id === edgeId ? { ...edge, ...clonedUpdates } : edge,
          ),
        })),
      ),
      saveStatus: 'dirty',
    }));
  },

  updateViewport: (viewport) => {
    const clonedViewport = cloneViewport(viewport);

    set(({ project }) => ({
      project: markProjectDirty(
        updateActiveDiagram(project, (diagram) => ({
          ...diagram,
          viewport: clonedViewport,
        })),
      ),
      saveStatus: 'dirty',
    }));
  },

  deleteSelection: () => {
    const { selectedNodeIds, selectedEdgeIds } = get();
    const selectedNodeIdSet = new Set(selectedNodeIds);
    const selectedEdgeIdSet = new Set(selectedEdgeIds);

    if (selectedNodeIdSet.size === 0 && selectedEdgeIdSet.size === 0) {
      return;
    }

    set(({ project }) => ({
      project: markProjectDirty(
        updateActiveDiagram(project, (diagram) => ({
          ...diagram,
          nodes: diagram.nodes.filter((node) => !selectedNodeIdSet.has(node.id)),
          edges: diagram.edges.filter(
            (edge) =>
              !selectedEdgeIdSet.has(edge.id) &&
              !selectedNodeIdSet.has(edge.sourceNodeId) &&
              !selectedNodeIdSet.has(edge.targetNodeId),
          ),
        })),
      ),
      selectedNodeIds: [],
      selectedEdgeIds: [],
      saveStatus: 'dirty',
    }));
  },

  copySelection: () => {
    const { selectedNodeIds, selectedEdgeIds } = get();
    const activeDiagram = get().activeDiagram();
    const selectedNodeIdSet = new Set(selectedNodeIds);
    const selectedEdgeIdSet = new Set(selectedEdgeIds);
    const copiedNodes = activeDiagram.nodes
      .filter((node) => selectedNodeIdSet.has(node.id))
      .map(cloneNode);
    const copiedNodeIdSet = new Set(copiedNodes.map((node) => node.id));
    const copiedEdges = activeDiagram.edges
      .filter(
        (edge) =>
          selectedEdgeIdSet.has(edge.id) ||
          (copiedNodeIdSet.has(edge.sourceNodeId) && copiedNodeIdSet.has(edge.targetNodeId)),
      )
      .map(cloneEdge);

    set({
      clipboard: copiedNodes.length > 0 ? { nodes: copiedNodes, edges: copiedEdges } : null,
    });
  },

  pasteClipboard: () => {
    const clipboard = get().clipboard;

    if (!clipboard || clipboard.nodes.length === 0) {
      return [];
    }

    const idMap = new Map<DomainId<'node'>, DomainId<'node'>>();
    const pastedNodes = clipboard.nodes.map((node) => {
      const nodeId = createId('node');
      idMap.set(node.id, nodeId);

      return {
        ...cloneNode(node),
        id: nodeId,
        name: `${node.name} copy`,
        position: { x: node.position.x + 24, y: node.position.y + 24 },
      };
    });
    const pastedEdges = clipboard.edges.flatMap((edge) => {
      const sourceNodeId = idMap.get(edge.sourceNodeId);
      const targetNodeId = idMap.get(edge.targetNodeId);

      if (!sourceNodeId || !targetNodeId) {
        return [];
      }

      return [
        {
          ...cloneEdge(edge),
          id: createId('edge'),
          sourceNodeId,
          targetNodeId,
        },
      ];
    });

    set(({ project }) => ({
      project: markProjectDirty(
        updateActiveDiagram(project, (diagram) => ({
          ...diagram,
          nodes: [...diagram.nodes, ...pastedNodes],
          edges: [...diagram.edges, ...pastedEdges],
        })),
      ),
      selectedNodeIds: pastedNodes.map((node) => node.id),
      selectedEdgeIds: [],
      saveStatus: 'dirty',
    }));

    return pastedNodes.map((node) => node.id);
  },

  setSelection: ({ nodeIds = [], edgeIds = [] }) => {
    set({
      selectedNodeIds: [...nodeIds],
      selectedEdgeIds: [...edgeIds],
    });
  },

  setSaveStatus: (saveStatus) => {
    set({ saveStatus });
  },
}));

function cloneNode(node: DiagramNode): DiagramNode {
  return {
    ...node,
    position: clonePoint(node.position),
    ...(node.size ? { size: cloneSize(node.size) } : {}),
    style: cloneStyle(node.style),
    metadata: cloneMetadata(node.metadata),
  };
}

function cloneEdge(edge: DiagramEdge): DiagramEdge {
  return {
    ...edge,
    style: cloneStyle(edge.style),
    metadata: cloneMetadata(edge.metadata),
  };
}
