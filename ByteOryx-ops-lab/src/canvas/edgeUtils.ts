import { MarkerType, type Edge, type Node } from '@xyflow/react';

import type { DiagramEdge, DiagramNode } from '../domain/types';

export interface OpsNodeData extends Record<string, unknown> {
  node: DiagramNode;
}

export type OpsFlowNode = Node<OpsNodeData, 'opsNode'>;

export function toFlowNodes(nodes: DiagramNode[]): OpsFlowNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: 'opsNode',
    position: node.position,
    data: { node },
  }));
}

export function toFlowEdges(edges: DiagramEdge[]): Edge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.sourceNodeId,
    target: edge.targetNodeId,
    label: edge.label,
    ...(edge.direction === 'one-way' || edge.direction === 'two-way'
      ? { markerEnd: { type: MarkerType.ArrowClosed } }
      : {}),
    ...(edge.direction === 'two-way' ? { markerStart: { type: MarkerType.ArrowClosed } } : {}),
  }));
}
