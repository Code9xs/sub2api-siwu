import { createId } from './ids';
import type { Diagram, DiagramTemplateId, OpsProject } from './types';

interface CreateProjectInput {
  name: string;
  template: DiagramTemplateId;
}

export function createProject({ name, template }: CreateProjectInput): OpsProject {
  const now = new Date().toISOString();
  const diagram = createDiagram(name, template);

  return {
    id: createId('project'),
    version: 1,
    name,
    assets: [],
    diagrams: [diagram],
    activeDiagramId: diagram.id,
    snapToGrid: true,
    showGrid: true,
    createdAt: now,
    updatedAt: now,
  };
}

function createDiagram(projectName: string, template: DiagramTemplateId): Diagram {
  return {
    id: createId('diagram'),
    name: `${projectName} Diagram`,
    template,
    nodes: [],
    edges: [],
    viewport: {
      x: 0,
      y: 0,
      zoom: 1,
    },
  };
}
