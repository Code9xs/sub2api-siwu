import type { DiagramTemplate, DiagramTemplateId } from './types';

export const templates = {
  network: {
    id: 'network',
    label: 'Network',
    nodeTypes: [
      { id: 'router', label: 'Router', icon: 'route', color: '#2563EB' },
      { id: 'switch', label: 'Switch', icon: 'network', color: '#0891B2' },
      { id: 'firewall', label: 'Firewall', icon: 'shield', color: '#DC2626' },
      { id: 'server', label: 'Server', icon: 'server', color: '#4B5563' },
      { id: 'client', label: 'Client', icon: 'monitor', color: '#16A34A' },
    ],
    nodeMetadataFields: [
      { key: 'ip', label: 'IP Address', kind: 'text' },
      { key: 'zone', label: 'Zone', kind: 'text' },
      { key: 'tags', label: 'Tags', kind: 'tags' },
      { key: 'description', label: 'Description', kind: 'textarea' },
    ],
    edgeMetadataFields: [
      { key: 'vlan', label: 'VLAN', kind: 'text' },
      { key: 'bandwidth', label: 'Bandwidth', kind: 'text' },
      {
        key: 'linkType',
        label: 'Link Type',
        kind: 'select',
        options: ['ethernet', 'fiber', 'wireless', 'vpn'],
      },
    ],
  },
  system: {
    id: 'system',
    label: 'System',
    nodeTypes: [
      { id: 'service', label: 'Service', icon: 'box', color: '#7C3AED' },
      { id: 'database', label: 'Database', icon: 'database', color: '#CA8A04' },
      { id: 'cache', label: 'Cache', icon: 'hard-drive', color: '#EA580C' },
      { id: 'queue', label: 'Queue', icon: 'list', color: '#0D9488' },
      { id: 'external', label: 'External System', icon: 'cloud', color: '#64748B' },
    ],
    nodeMetadataFields: [
      { key: 'owner', label: 'Owner', kind: 'text' },
      { key: 'runtime', label: 'Runtime', kind: 'text' },
      { key: 'tags', label: 'Tags', kind: 'tags' },
      { key: 'description', label: 'Description', kind: 'textarea' },
    ],
    edgeMetadataFields: [
      {
        key: 'callDirection',
        label: 'Call Direction',
        kind: 'select',
        options: ['sync', 'async', 'event'],
      },
      { key: 'protocol', label: 'Protocol', kind: 'text' },
      { key: 'contract', label: 'Contract', kind: 'textarea' },
    ],
  },
} satisfies Record<DiagramTemplateId, DiagramTemplate>;

export function getTemplate(templateId: DiagramTemplateId): DiagramTemplate {
  return templates[templateId];
}
