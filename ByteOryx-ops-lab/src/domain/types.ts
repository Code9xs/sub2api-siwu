import type { DomainId } from './ids';

export type DiagramTemplateId = 'network' | 'system';

export type EdgeDirection = 'none' | 'one-way' | 'two-way';

export type FieldKind = 'text' | 'textarea' | 'tags' | 'select';

export interface MetadataField {
  key: string;
  label: string;
  kind: FieldKind;
  options?: string[];
}

export interface NodeTypeDefinition {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface DiagramTemplate {
  id: DiagramTemplateId;
  label: string;
  nodeTypes: NodeTypeDefinition[];
  nodeMetadataFields: MetadataField[];
  edgeMetadataFields: MetadataField[];
}

export interface Asset {
  id: DomainId<'asset'>;
  name: string;
  type: string;
  ip?: string;
  zone?: string;
  tags: string[];
  vendor?: string;
  description?: string;
  source: 'import' | 'manual';
  createdAt: string;
  updatedAt: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface NodeStyle {
  fill?: string;
  stroke?: string;
  textColor?: string;
}

export interface Size {
  width: number;
  height: number;
}

export interface DiagramNode {
  id: DomainId<'node'>;
  assetId?: DomainId<'asset'>;
  name: string;
  type: string;
  position: Point;
  size?: Size;
  style: NodeStyle;
  metadata: Record<string, string | string[]>;
}

export interface DiagramEdge {
  id: DomainId<'edge'>;
  sourceNodeId: DomainId<'node'>;
  targetNodeId: DomainId<'node'>;
  direction: EdgeDirection;
  relationshipType: string;
  label?: string;
  style: NodeStyle;
  metadata: Record<string, string | string[]>;
}

export interface DiagramViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Diagram {
  id: DomainId<'diagram'>;
  name: string;
  template: DiagramTemplateId;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  viewport: DiagramViewport;
}

export interface OpsProject {
  version: 1;
  project: {
    name: string;
    createdAt: string;
    updatedAt: string;
  };
  assets: Asset[];
  diagrams: Diagram[];
  settings: {
    activeDiagramId: DomainId<'diagram'>;
    snapToGrid: boolean;
    showGrid: boolean;
  };
}
