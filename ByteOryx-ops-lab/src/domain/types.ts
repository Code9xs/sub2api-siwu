import type { DomainId } from './ids';

export type DiagramTemplateId = 'network' | 'system';

export type EdgeDirection = 'none' | 'forward' | 'backward' | 'bidirectional';

export type MetadataFieldType = 'text' | 'number' | 'select' | 'boolean';

export interface MetadataField {
  id: string;
  label: string;
  type: MetadataFieldType;
  options?: readonly string[];
}

export interface NodeTypeDefinition {
  id: string;
  label: string;
  description?: string;
  defaultStyle?: NodeStyle;
}

export interface DiagramTemplate {
  id: DiagramTemplateId;
  label: string;
  nodeTypes: readonly NodeTypeDefinition[];
  edgeMetadataFields: readonly MetadataField[];
}

export interface Asset {
  id: DomainId<'asset'>;
  name: string;
  mimeType: string;
  dataUrl: string;
  createdAt: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface NodeStyle {
  fill?: string;
  stroke?: string;
  textColor?: string;
  icon?: string;
}

export interface DiagramNode {
  id: DomainId<'node'>;
  type: string;
  label: string;
  position: Point;
  metadata: Record<string, string | number | boolean>;
  style?: NodeStyle;
}

export interface DiagramEdge {
  id: DomainId<'edge'>;
  sourceNodeId: DomainId<'node'>;
  targetNodeId: DomainId<'node'>;
  label?: string;
  direction: EdgeDirection;
  metadata: Record<string, string | number | boolean>;
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
  id: DomainId<'project'>;
  version: 1;
  name: string;
  assets: Asset[];
  diagrams: Diagram[];
  activeDiagramId: DomainId<'diagram'>;
  snapToGrid: boolean;
  showGrid: boolean;
  createdAt: string;
  updatedAt: string;
}
