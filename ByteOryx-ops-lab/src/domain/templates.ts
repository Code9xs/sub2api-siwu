import type { DiagramTemplate, DiagramTemplateId } from './types';

export const templates = {
  network: {
    id: 'network',
    label: 'Network',
    nodeTypes: [
      { id: 'router', label: 'Router' },
      { id: 'switch', label: 'Switch' },
      { id: 'firewall', label: 'Firewall' },
      { id: 'server', label: 'Server' },
      { id: 'client', label: 'Client' },
    ],
    edgeMetadataFields: [
      { id: 'vlan', label: 'VLAN', type: 'text' },
      { id: 'bandwidth', label: 'Bandwidth', type: 'text' },
      {
        id: 'linkType',
        label: 'Link Type',
        type: 'select',
        options: ['ethernet', 'fiber', 'wireless', 'vpn'],
      },
    ],
  },
  system: {
    id: 'system',
    label: 'System',
    nodeTypes: [
      { id: 'service', label: 'Service' },
      { id: 'database', label: 'Database' },
      { id: 'cache', label: 'Cache' },
      { id: 'queue', label: 'Queue' },
      { id: 'external', label: 'External System' },
    ],
    edgeMetadataFields: [
      {
        id: 'callDirection',
        label: 'Call Direction',
        type: 'select',
        options: ['sync', 'async', 'event'],
      },
      { id: 'protocol', label: 'Protocol', type: 'text' },
      { id: 'latencyBudgetMs', label: 'Latency Budget (ms)', type: 'number' },
    ],
  },
} as const satisfies Record<DiagramTemplateId, DiagramTemplate>;

export function getTemplate(templateId: DiagramTemplateId): DiagramTemplate {
  return templates[templateId];
}
