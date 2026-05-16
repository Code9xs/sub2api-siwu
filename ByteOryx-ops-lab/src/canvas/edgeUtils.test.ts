import { MarkerType, type NodeChange } from '@xyflow/react';
import { describe, expect, it } from 'vitest';

import type { DomainId } from '../domain/ids';
import type { DiagramEdge, DiagramNode } from '../domain/types';
import { shouldPersistPositionChange, toFlowEdges, toFlowNodes, type OpsFlowNode } from './edgeUtils';

const nodeId = (id: string) => id as DomainId<'node'>;
const edgeId = (id: string) => id as DomainId<'edge'>;

describe('edgeUtils', () => {
  it('converts diagram nodes to React Flow ops nodes', () => {
    const nodes: DiagramNode[] = [
      {
        id: nodeId('node-web'),
        name: 'Web Server',
        type: 'server',
        position: { x: 120, y: 240 },
        style: { fill: '#ffffff', stroke: '#2563eb', textColor: '#111827' },
        metadata: { ip: '10.0.0.10' },
      },
    ];

    expect(toFlowNodes(nodes)).toEqual([
      {
        id: 'node-web',
        type: 'opsNode',
        position: { x: 120, y: 240 },
        data: { node: nodes[0] },
      },
    ]);
  });

  it('marks selected diagram nodes as selected React Flow nodes', () => {
    const nodes: DiagramNode[] = [
      {
        id: nodeId('node-web'),
        name: 'Web Server',
        type: 'server',
        position: { x: 120, y: 240 },
        style: {},
        metadata: {},
      },
      {
        id: nodeId('node-db'),
        name: 'Database',
        type: 'database',
        position: { x: 320, y: 240 },
        style: {},
        metadata: {},
      },
    ];

    expect(toFlowNodes(nodes, [nodeId('node-db')])).toEqual([
      {
        id: 'node-web',
        type: 'opsNode',
        position: { x: 120, y: 240 },
        data: { node: nodes[0] },
      },
      {
        id: 'node-db',
        type: 'opsNode',
        position: { x: 320, y: 240 },
        data: { node: nodes[1] },
        selected: true,
      },
    ]);
  });

  it('converts diagram edges to React Flow edges with direction markers', () => {
    const edges: DiagramEdge[] = [
      {
        id: edgeId('edge-a'),
        sourceNodeId: nodeId('node-a'),
        targetNodeId: nodeId('node-b'),
        direction: 'one-way',
        relationshipType: 'http',
        label: 'HTTP',
        style: { stroke: '#64748b' },
        metadata: {},
      },
      {
        id: edgeId('edge-b'),
        sourceNodeId: nodeId('node-b'),
        targetNodeId: nodeId('node-c'),
        direction: 'two-way',
        relationshipType: 'sync',
        label: 'Sync',
        style: { stroke: '#64748b' },
        metadata: {},
      },
    ];

    expect(toFlowEdges(edges)).toEqual([
      {
        id: 'edge-a',
        source: 'node-a',
        target: 'node-b',
        label: 'HTTP',
        markerEnd: { type: MarkerType.ArrowClosed },
      },
      {
        id: 'edge-b',
        source: 'node-b',
        target: 'node-c',
        label: 'Sync',
        markerEnd: { type: MarkerType.ArrowClosed },
        markerStart: { type: MarkerType.ArrowClosed },
      },
    ]);
  });

  it('marks selected diagram edges as selected React Flow edges', () => {
    const edges: DiagramEdge[] = [
      {
        id: edgeId('edge-a'),
        sourceNodeId: nodeId('node-a'),
        targetNodeId: nodeId('node-b'),
        direction: 'none',
        relationshipType: 'http',
        style: {},
        metadata: {},
      },
      {
        id: edgeId('edge-b'),
        sourceNodeId: nodeId('node-b'),
        targetNodeId: nodeId('node-c'),
        direction: 'none',
        relationshipType: 'sync',
        style: {},
        metadata: {},
      },
    ];

    expect(toFlowEdges(edges, [edgeId('edge-b')])).toEqual([
      {
        id: 'edge-a',
        source: 'node-a',
        target: 'node-b',
        label: undefined,
      },
      {
        id: 'edge-b',
        source: 'node-b',
        target: 'node-c',
        label: undefined,
        selected: true,
      },
    ]);
  });

  it('persists position changes only after dragging ends', () => {
    const draggingChange: NodeChange<OpsFlowNode> = {
      id: 'node-a',
      type: 'position',
      position: { x: 10, y: 20 },
      dragging: true,
    };
    const dragEndChange: NodeChange<OpsFlowNode> = {
      id: 'node-a',
      type: 'position',
      position: { x: 30, y: 40 },
      dragging: false,
    };

    expect(shouldPersistPositionChange(draggingChange)).toBe(false);
    expect(shouldPersistPositionChange(dragEndChange)).toBe(true);
  });
});
