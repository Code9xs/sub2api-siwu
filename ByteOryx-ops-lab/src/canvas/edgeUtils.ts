import { MarkerType, type Edge, type Node, type NodeChange } from '@xyflow/react';

import type { DomainId } from '../domain/ids';
import type { DiagramEdge, DiagramNode } from '../domain/types';

export interface OpsNodeData extends Record<string, unknown> {
  node: DiagramNode;
}

export type OpsFlowNode = Node<OpsNodeData, 'opsNode'>;

type PositionChange = Extract<NodeChange<OpsFlowNode>, { type: 'position' }> & {
  position: NonNullable<Extract<NodeChange<OpsFlowNode>, { type: 'position' }>['position']>;
};

function hasId(ids: readonly string[], id: string): true | undefined {
  return ids.includes(id) ? true : undefined;
}

export function toFlowNodes(
  nodes: DiagramNode[],
  selectedNodeIds: DomainId<'node'>[] = [],
): OpsFlowNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: 'opsNode',
    position: node.position,
    data: { node },
    selected: hasId(selectedNodeIds, node.id),
  }));
}

export function toFlowEdges(
  edges: DiagramEdge[],
  selectedEdgeIds: DomainId<'edge'>[] = [],
): Edge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.sourceNodeId,
    target: edge.targetNodeId,
    label: edge.label,
    selected: hasId(selectedEdgeIds, edge.id),
    ...(edge.direction === 'one-way' || edge.direction === 'two-way'
      ? { markerEnd: { type: MarkerType.ArrowClosed } }
      : {}),
    ...(edge.direction === 'two-way' ? { markerStart: { type: MarkerType.ArrowClosed } } : {}),
  }));
}

export function shouldPersistPositionChange(
  change: NodeChange<OpsFlowNode>,
): change is PositionChange {
  return change.type === 'position' && Boolean(change.position) && change.dragging === false;
}
