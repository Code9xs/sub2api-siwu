import '@xyflow/react/dist/style.css';

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type Edge,
  type NodeTypes,
  type OnNodesChange,
  type OnSelectionChangeFunc,
  type Viewport,
  useReactFlow,
} from '@xyflow/react';
import { useCallback, useMemo } from 'react';

import { hasAssetDragPayload, readAssetDragPayload } from '../components/AssetPool';
import type { DomainId } from '../domain/ids';
import { useWorkspaceStore } from '../store/workspaceStore';
import {
  shouldPersistPositionChange,
  toFlowEdges,
  toFlowNodes,
  type OpsFlowNode,
} from './edgeUtils';
import { OpsNode } from './OpsNode';

const nodeTypes: NodeTypes = {
  opsNode: OpsNode,
};

export function DiagramCanvas() {
  const { screenToFlowPosition } = useReactFlow<OpsFlowNode, Edge>();
  const activeDiagram = useWorkspaceStore((state) => state.activeDiagram());
  const showGrid = useWorkspaceStore((state) => state.project.settings.showGrid);
  const selectedNodeIds = useWorkspaceStore((state) => state.selectedNodeIds);
  const selectedEdgeIds = useWorkspaceStore((state) => state.selectedEdgeIds);
  const connectNodes = useWorkspaceStore((state) => state.connectNodes);
  const copySelection = useWorkspaceStore((state) => state.copySelection);
  const deleteSelection = useWorkspaceStore((state) => state.deleteSelection);
  const pasteClipboard = useWorkspaceStore((state) => state.pasteClipboard);
  const placeAssetOnCanvas = useWorkspaceStore((state) => state.placeAssetOnCanvas);
  const updateNode = useWorkspaceStore((state) => state.updateNode);
  const updateViewport = useWorkspaceStore((state) => state.updateViewport);
  const setSelection = useWorkspaceStore((state) => state.setSelection);

  const nodes = useMemo(
    () => toFlowNodes(activeDiagram.nodes, selectedNodeIds),
    [activeDiagram.nodes, selectedNodeIds],
  );
  const edges = useMemo(
    () => toFlowEdges(activeDiagram.edges, selectedEdgeIds),
    [activeDiagram.edges, selectedEdgeIds],
  );

  const onNodesChange = useCallback<OnNodesChange<OpsFlowNode>>(
    (changes) => {
      for (const change of changes) {
        if (shouldPersistPositionChange(change)) {
          updateNode(change.id as DomainId<'node'>, { position: change.position });
        }
      }
    },
    [updateNode],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        connectNodes(
          connection.source as DomainId<'node'>,
          connection.target as DomainId<'node'>,
        );
      }
    },
    [connectNodes],
  );

  const onSelectionChange = useCallback<OnSelectionChangeFunc<OpsFlowNode, Edge>>(
    ({ nodes: selectedNodes, edges: selectedEdges }) => {
      setSelection({
        nodeIds: selectedNodes.map((node) => node.id as DomainId<'node'>),
        edgeIds: selectedEdges.map((edge) => edge.id as DomainId<'edge'>),
      });
    },
    [setSelection],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    if (hasAssetDragPayload(event.dataTransfer)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      const assetId = readAssetDragPayload(event.dataTransfer);

      if (!assetId) {
        return;
      }

      event.preventDefault();
      placeAssetOnCanvas(
        assetId as DomainId<'asset'>,
        screenToFlowPosition({ x: event.clientX, y: event.clientY }),
      );
    },
    [placeAssetOnCanvas, screenToFlowPosition],
  );

  const onMoveEnd = useCallback(
    (_event: MouseEvent | TouchEvent | null, viewport: Viewport) => {
      updateViewport(viewport);
    },
    [updateViewport],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const isModifierPressed = event.ctrlKey || event.metaKey;

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        deleteSelection();
        return;
      }

      if (!isModifierPressed) {
        return;
      }

      if (event.key.toLowerCase() === 'c') {
        event.preventDefault();
        copySelection();
      }

      if (event.key.toLowerCase() === 'v') {
        event.preventDefault();
        pasteClipboard();
      }
    },
    [copySelection, deleteSelection, pasteClipboard],
  );

  return (
    <ReactFlow<OpsFlowNode, Edge>
      className="diagram-canvas"
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onConnect={onConnect}
      onSelectionChange={onSelectionChange}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMoveEnd={onMoveEnd}
      onKeyDown={onKeyDown}
      defaultViewport={activeDiagram.viewport}
    >
      {showGrid ? <Background /> : null}
      <MiniMap />
      <Controls />
    </ReactFlow>
  );
}
