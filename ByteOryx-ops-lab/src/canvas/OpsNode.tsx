import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Boxes, Cloud, Database, Route, Search, Server, Zap, type LucideIcon } from 'lucide-react';

import { getAssetTypeDefinition } from '../domain/assetTypes';
import type { OpsFlowNode } from './edgeUtils';

const iconMap: Record<string, LucideIcon> = {
  boxes: Boxes,
  cloud: Cloud,
  database: Database,
  route: Route,
  search: Search,
  server: Server,
  zap: Zap,
};

function metadataValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return value;
}

export function OpsNode({ data, selected }: NodeProps<OpsFlowNode>) {
  const { node } = data;
  const ip = metadataValue(node.metadata.ip);
  const assetType = getAssetTypeDefinition(node.type);
  const Icon = iconMap[assetType.icon] ?? Server;

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
        <div className="ops-node__title">
          <Icon size={18} aria-label={`${assetType.label}图标`} />
          <strong>{node.name}</strong>
        </div>
        <span>{node.type}</span>
        {ip ? <span>{ip}</span> : null}
      </div>
      <Handle type="source" position={Position.Right} className="ops-node__handle" />
    </article>
  );
}
