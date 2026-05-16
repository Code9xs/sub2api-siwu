import '@xyflow/react/dist/style.css';

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type Edge,
  type NodeChange,
  type NodeTypes,
  type OnNodesChange,
  type OnSelectionChangeFunc,
} from '@xyflow/react';
import { useCallback, useMemo } from 'react';

import type { DomainId } from '../domain/ids';
import { useWorkspaceStore } from '../store/workspaceStore';
import { toFlowEdges, toFlowNodes, type OpsFlowNode } from './edgeUtils';
import { OpsNode } from './OpsNode';

const nodeTypes: NodeTypes = {
  opsNode: OpsNode,
};

function isPositionChange(
  change: NodeChange<OpsFlowNode>,
): change is Extract<NodeChange<OpsFlowNode>, { type: 'position' }> & {
  position: NonNullable<Extract<NodeChange<OpsFlowNode>, { type: 'position' }>['position']>;
} {
  return change.type === 'position' && Boolean(change.position);
}

export function DiagramCanvas() {
  const activeDiagram = useWorkspaceStore((state) => state.activeDiagram());
  const connectNodes = useWorkspaceStore((state) => state.connectNodes);
  const updateNode = useWorkspaceStore((state) => state.updateNode);
  const setSelection = useWorkspaceStore((state) => state.setSelection);

  const nodes = useMemo(() => toFlowNodes(activeDiagram.nodes), [activeDiagram.nodes]);
  const edges = useMemo(() => toFlowEdges(activeDiagram.edges), [activeDiagram.edges]);

  const onNodesChange = useCallback<OnNodesChange<OpsFlowNode>>(
    (changes) => {
      for (const change of changes) {
        if (isPositionChange(change)) {
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

  return (
    <ReactFlow<OpsFlowNode, Edge>
      className="diagram-canvas"
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onConnect={onConnect}
      onSelectionChange={onSelectionChange}
      fitView
    >
      <Background />
      <MiniMap />
      <Controls />
    </ReactFlow>
  );
}
