import type { NodeStyle } from './types';

export interface AssetTypeDefinition {
  id: string;
  label: string;
  icon: string;
  style: Required<Pick<NodeStyle, 'stroke' | 'fill' | 'textColor'>>;
}

export const assetTypes: AssetTypeDefinition[] = [
  {
    id: 'application-server',
    label: '应用服务器',
    icon: 'server',
    style: { fill: '#eff6ff', stroke: '#2563eb', textColor: '#172554' },
  },
  {
    id: 'database-server',
    label: '数据库服务器',
    icon: 'database',
    style: { fill: '#fffbeb', stroke: '#ca8a04', textColor: '#422006' },
  },
  {
    id: 'elasticsearch-server',
    label: 'Elasticsearch服务器',
    icon: 'search',
    style: { fill: '#ecfeff', stroke: '#0891b2', textColor: '#164e63' },
  },
  {
    id: 'redis-server',
    label: 'Redis服务器',
    icon: 'zap',
    style: { fill: '#fef2f2', stroke: '#dc2626', textColor: '#450a0a' },
  },
  {
    id: 'nacos-server',
    label: 'Nacos服务器',
    icon: 'cloud',
    style: { fill: '#f0f9ff', stroke: '#0284c7', textColor: '#0c4a6e' },
  },
  {
    id: 'nginx-server',
    label: 'Nginx服务器',
    icon: 'route',
    style: { fill: '#f0fdf4', stroke: '#16a34a', textColor: '#052e16' },
  },
  {
    id: 'kubernetes-server',
    label: 'Kubernetes服务器',
    icon: 'boxes',
    style: { fill: '#eef2ff', stroke: '#4f46e5', textColor: '#1e1b4b' },
  },
];

export const fallbackAssetType: AssetTypeDefinition = {
  id: 'unknown-device',
  label: '未知设备',
  icon: 'server',
  style: { fill: '#ffffff', stroke: '#2563eb', textColor: '#111827' },
};

export function getAssetTypeDefinition(type: string): AssetTypeDefinition {
  const normalizedType = normalizeAssetType(type);

  return (
    assetTypes.find(
      (assetType) =>
        normalizeAssetType(assetType.id) === normalizedType ||
        normalizeAssetType(assetType.label) === normalizedType,
    ) ?? fallbackAssetType
  );
}

function normalizeAssetType(type: string): string {
  return type.trim().toLowerCase().replace(/\s+/g, '');
}
