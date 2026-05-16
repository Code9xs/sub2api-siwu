import { Handle, Position, type NodeProps } from '@xyflow/react';

import type { OpsFlowNode } from './edgeUtils';

function metadataValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return value;
}

export function OpsNode({ data, selected }: NodeProps<OpsFlowNode>) {
  const { node } = data;
  const ip = metadataValue(node.metadata.ip);

  return (
    <article
      className={`ops-node${selected ? ' ops-node--selected' : ''}`}
      style={{
        backgroundColor: node.style.fill,
        borderColor: node.style.stroke,
        color: node.style.textColor,
      }}
    >
      <Handle type="target" position={Position.Left} className="ops-node__handle" />
      <div className="ops-node__body">
        <strong>{node.name}</strong>
        <span>{node.type}</span>
        {ip ? <span>{ip}</span> : null}
      </div>
      <Handle type="source" position={Position.Right} className="ops-node__handle" />
    </article>
  );
}
