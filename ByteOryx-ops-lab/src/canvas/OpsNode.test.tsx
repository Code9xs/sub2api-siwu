import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { describe, expect, it } from 'vitest';

import type { DiagramNode } from '../domain/types';
import type { DomainId } from '../domain/ids';
import { OpsNode } from './OpsNode';

describe('OpsNode', () => {
  it('renders a type-specific icon and label for imported middleware assets', () => {
    render(
      <ReactFlowProvider>
      <OpsNode
        id={'node-redis' as DomainId<'node'>}
        type="opsNode"
        draggable
        selectable
        deletable
        dragging={false}
        zIndex={0}
        isConnectable
        positionAbsoluteX={0}
        positionAbsoluteY={0}
        selected={false}
        data={{ node: redisNode }}
      />
      </ReactFlowProvider>,
    );

    expect(screen.getByLabelText('Redis服务器图标')).toBeInTheDocument();
    expect(screen.getByText('Redis服务器')).toBeInTheDocument();
  });
});

const redisNode: DiagramNode = {
  id: 'node-redis' as DomainId<'node'>,
  name: 'redis-01',
  type: 'Redis服务器',
  position: { x: 0, y: 0 },
  style: { fill: '#fef2f2', stroke: '#dc2626', textColor: '#450a0a' },
  metadata: { ip: '10.0.2.20' },
};
