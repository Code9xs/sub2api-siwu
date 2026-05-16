import { getTemplate } from '../domain/templates';
import type { DiagramEdge, DiagramNode, MetadataField } from '../domain/types';
import { useWorkspaceStore } from '../store/workspaceStore';

function metadataValueToString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return value ?? '';
}

function parseMetadataValue(field: MetadataField, value: string): string | string[] {
  if (field.kind === 'tags') {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return value;
}

function MetadataFieldControl({
  field,
  value,
  onChange,
}: {
  field: MetadataField;
  value: string | string[] | undefined;
  onChange: (value: string) => void;
}) {
  const stringValue = metadataValueToString(value);

  if (field.kind === 'textarea') {
    return (
      <label className="property-field">
        <span>{field.label}</span>
        <textarea value={stringValue} onChange={(event) => onChange(event.target.value)} />
      </label>
    );
  }

  if (field.kind === 'select') {
    return (
      <label className="property-field">
        <span>{field.label}</span>
        <select value={stringValue} onChange={(event) => onChange(event.target.value)}>
          <option value="">未设置</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="property-field">
      <span>{field.label}</span>
      <input value={stringValue} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NodeProperties({
  node,
  fields,
  nodeTypes,
  onUpdateNode,
}: {
  node: DiagramNode;
  fields: MetadataField[];
  nodeTypes: Array<{ id: string; label: string }>;
  onUpdateNode: (updates: Partial<Omit<DiagramNode, 'id'>>) => void;
}) {
  return (
    <form className="property-form" aria-label="节点属性">
      <label className="property-field">
        <span>名称</span>
        <input value={node.name} onChange={(event) => onUpdateNode({ name: event.target.value })} />
      </label>
      <label className="property-field">
        <span>类型</span>
        <select value={node.type} onChange={(event) => onUpdateNode({ type: event.target.value })}>
          {nodeTypes.map((nodeType) => (
            <option key={nodeType.id} value={nodeType.id}>
              {nodeType.label}
            </option>
          ))}
        </select>
      </label>
      {fields.map((field) => (
        <MetadataFieldControl
          key={field.key}
          field={field}
          value={node.metadata[field.key]}
          onChange={(value) =>
            onUpdateNode({
              metadata: {
                ...node.metadata,
                [field.key]: parseMetadataValue(field, value),
              },
            })
          }
        />
      ))}
    </form>
  );
}

function EdgeProperties({
  edge,
  fields,
  onUpdateEdge,
}: {
  edge: DiagramEdge;
  fields: MetadataField[];
  onUpdateEdge: (updates: Partial<Omit<DiagramEdge, 'id'>>) => void;
}) {
  return (
    <form className="property-form" aria-label="连线属性">
      <label className="property-field">
        <span>relationshipType</span>
        <input
          value={edge.relationshipType}
          onChange={(event) => onUpdateEdge({ relationshipType: event.target.value })}
        />
      </label>
      <label className="property-field">
        <span>direction</span>
        <select
          value={edge.direction}
          onChange={(event) =>
            onUpdateEdge({ direction: event.target.value as DiagramEdge['direction'] })
          }
        >
          <option value="none">none</option>
          <option value="one-way">one-way</option>
          <option value="two-way">two-way</option>
        </select>
      </label>
      <label className="property-field">
        <span>label</span>
        <input value={edge.label ?? ''} onChange={(event) => onUpdateEdge({ label: event.target.value })} />
      </label>
      {fields.map((field) => (
        <MetadataFieldControl
          key={field.key}
          field={field}
          value={edge.metadata[field.key]}
          onChange={(value) =>
            onUpdateEdge({
              metadata: {
                ...edge.metadata,
                [field.key]: parseMetadataValue(field, value),
              },
            })
          }
        />
      ))}
    </form>
  );
}

export function PropertiesPanel() {
  const activeDiagram = useWorkspaceStore((state) => state.activeDiagram());
  const selectedNodeIds = useWorkspaceStore((state) => state.selectedNodeIds);
  const selectedEdgeIds = useWorkspaceStore((state) => state.selectedEdgeIds);
  const updateNode = useWorkspaceStore((state) => state.updateNode);
  const updateEdge = useWorkspaceStore((state) => state.updateEdge);
  const selectedCount = selectedNodeIds.length + selectedEdgeIds.length;
  const selectedNode = activeDiagram.nodes.find((node) => node.id === selectedNodeIds[0]);
  const selectedEdge =
    selectedNodeIds.length === 0
      ? activeDiagram.edges.find((edge) => edge.id === selectedEdgeIds[0])
      : undefined;
  const template = getTemplate(activeDiagram.template);

  return (
    <aside className="properties-panel" role="region" aria-label="属性面板">
      <div className="panel-header">
        <h2>属性面板</h2>
        <span>{selectedCount}</span>
      </div>
      {!selectedNode && !selectedEdge ? (
        <p className="empty-state">请选择画布元素</p>
      ) : selectedNode ? (
        <NodeProperties
          node={selectedNode}
          fields={template.nodeMetadataFields}
          nodeTypes={template.nodeTypes}
          onUpdateNode={(updates) => updateNode(selectedNode.id, updates)}
        />
      ) : selectedEdge ? (
        <EdgeProperties
          edge={selectedEdge}
          fields={template.edgeMetadataFields}
          onUpdateEdge={(updates) => updateEdge(selectedEdge.id, updates)}
        />
      ) : null}
    </aside>
  );
}
