# Ops Drawing Tool Design

## Summary

Build an independent, web-based, local-first drawing tool for operations engineers. The MVP focuses on manual diagram creation from an imported asset pool. Users import CSV/XLSX files to create devices or system components, drag those assets onto an infinite canvas, connect them manually, edit metadata, and export diagrams as image/PDF or editable project files.

This product is unrelated to the existing `sub2api` application. It should be treated as a standalone product and codebase.

## Product Direction

The MVP follows the "canvas-first" approach.

- Prioritize a reliable and efficient drawing experience.
- Use imports only to populate an asset pool.
- Do not automatically place imported assets on the canvas.
- Do not automatically generate topology relationships in the MVP.
- Keep the product single-user and local-first.

The core concept is a unified model of assets, diagram nodes, and relationship edges. Network topology diagrams and system architecture diagrams share the same underlying data model, with templates controlling default node types, icon sets, and visible metadata fields.

## Target User

The primary user is an operations engineer who needs to create and maintain network topology diagrams or system architecture diagrams from existing asset lists.

Typical jobs:

- Import a device or component list from CSV/XLSX.
- Search and filter assets by type, IP, zone, or tag.
- Drag selected assets onto a canvas.
- Connect nodes to describe network links, dependencies, or access relationships.
- Add operational metadata to nodes and edges.
- Save the work as an editable project file.
- Export diagrams for documentation, reports, tickets, or reviews.

## MVP Scope

### In Scope

- Web local-first personal workspace.
- New, open, save, and save-as for editable project files.
- CSV and XLSX import.
- Field mapping for imported files.
- Import preview with validation.
- Asset pool generated from imported rows.
- Manual asset drag from pool to canvas.
- Manual creation of basic nodes.
- Node drag, select, multi-select, delete, copy, and paste.
- Edge creation between nodes.
- Edge direction: none, one-way, two-way.
- Node and edge property editing.
- Grid display, snap-to-grid, zoom, pan, fit view.
- Search and locate nodes/assets.
- Export PNG and PDF.
- Browser local autosave.
- Editable project file export/import.

### Out of Scope

- Automatic topology generation.
- Network scanning or device discovery.
- CMDB/API integrations.
- User accounts.
- Team workspaces.
- Real-time collaboration.
- Permission management.
- Cloud sync.
- Alert or monitoring integrations.
- Complex version history.
- Advanced automatic layout.

## Application Layout

The application opens directly into the drawing workspace.

### Top Bar

Contains global project and file actions:

- Product name.
- Current project name.
- Save status.
- New project.
- Open project file.
- Save or save as.
- Import CSV/XLSX.
- Export PNG/PDF.

### Canvas Toolbar

Contains drawing and view controls:

- Select/move tool.
- Connect tool.
- Text or annotation tool.
- Group controls.
- Undo/redo.
- Zoom controls.
- Fit view.
- Align and distribute controls.
- Grid and snap toggles.

### Left Asset Pool

Displays assets imported from files or created manually.

Capabilities:

- Search by name, IP, tag, vendor, or description.
- Filter by type.
- Filter by zone/environment.
- Filter by placed/unplaced status.
- Drag asset to canvas.
- Show whether an asset has been placed in the current diagram.

Dragging an asset to the canvas creates a `DiagramNode`. It does not remove the asset from the pool.

### Center Canvas

The canvas is an infinite node-edge workspace.

Capabilities:

- Pan and zoom.
- Grid display.
- Snap to grid.
- Select and multi-select.
- Box select.
- Drag nodes.
- Create edges between nodes.
- Delete selected objects.
- Copy/paste selected nodes and edges.
- Fit diagram to viewport.

### Right Properties Panel

The panel changes based on selection.

Node fields:

- Name.
- Type.
- IP/address.
- Zone/environment.
- Tags.
- Vendor/technology.
- Icon.
- Color.
- Description.

Edge fields:

- Relationship type.
- Direction.
- Label.
- Description.
- Advanced network fields when the diagram template is `network`.

Advanced network fields:

- Source port.
- Target port.
- Protocol.
- VLAN.
- Bandwidth.
- Link type.

### Bottom Status Bar

Shows workspace state:

- Zoom ratio.
- Node count.
- Edge count.
- Selected object count.
- Autosave status.

## Templates

MVP includes two templates:

### Network Topology

Default node types:

- Switch.
- Router.
- Firewall.
- Server.
- Load balancer.
- Storage.
- Wireless controller.
- Unknown device.

Edge metadata emphasizes network link details such as port, protocol, VLAN, bandwidth, and link type.

### System Architecture

Default node types:

- Application.
- Service.
- Database.
- Cache.
- Message queue.
- Object storage.
- API gateway.
- External system.

Edge metadata emphasizes dependency, access, call direction, and relationship labels.

Templates only affect defaults and visible fields. They do not change the underlying project schema.

## Import Flow

The import flow has three steps.

### Step 1: Select File

Supported formats:

- `.csv`
- `.xlsx`

### Step 2: Field Mapping

The application guesses mappings from common column names, but the user can adjust them before import.

Recommended fields:

- `name`: required asset name.
- `type`: device or component type.
- `ip`: IP address or access address.
- `zone`: region, room, environment, or deployment area.
- `tags`: comma-separated tags.
- `vendor`: vendor or technology stack.
- `description`: free-text notes.

Only `name` is required for import.

### Step 3: Import Preview

The preview shows:

- Number of rows detected.
- Number of valid assets.
- Rows missing required names.
- Unknown asset types.
- Duplicate asset names or IPs.

Invalid rows do not block all imports. The user can skip invalid rows and continue importing valid rows.

## Data Model

### Project

The project file stores the complete editable state.

Fields:

- `version`
- `project`
- `assets`
- `diagrams`
- `settings`

Example:

```json
{
  "version": 1,
  "project": {
    "name": "Production Network",
    "createdAt": "2026-05-16T00:00:00.000Z",
    "updatedAt": "2026-05-16T00:00:00.000Z"
  },
  "assets": [],
  "diagrams": [
    {
      "id": "diagram-1",
      "name": "Core Network",
      "template": "network",
      "nodes": [],
      "edges": [],
      "viewport": {}
    }
  ],
  "settings": {}
}
```

The recommended file extension is `.opsdraw.json`.

### Asset

An asset is the imported or manually defined source object.

Fields:

- `id`
- `name`
- `type`
- `ip`
- `zone`
- `tags`
- `vendor`
- `description`
- `source`
- `createdAt`
- `updatedAt`

Assets exist independently from the canvas.

### Diagram

A diagram is one editable drawing inside a project.

Fields:

- `id`
- `name`
- `template`
- `nodes`
- `edges`
- `viewport`
- `createdAt`
- `updatedAt`

### DiagramNode

A diagram node is a placed visual instance of an asset or a standalone manual node.

Fields:

- `id`
- `assetId`
- `name`
- `type`
- `position`
- `size`
- `style`
- `metadata`

`assetId` is optional for manual nodes.

### DiagramEdge

A diagram edge connects two `DiagramNode` objects.

Fields:

- `id`
- `sourceNodeId`
- `targetNodeId`
- `direction`
- `relationshipType`
- `label`
- `style`
- `metadata`

Edges do not connect assets directly. This allows the same asset to appear differently across diagrams.

## Technical Architecture

Recommended stack:

- React.
- TypeScript.
- Vite.
- React Flow for canvas and node-edge interactions.
- Zustand for application state.
- IndexedDB for local persistence.
- `idb` as a small IndexedDB wrapper.
- Papa Parse for CSV parsing.
- SheetJS/xlsx for XLSX parsing.
- html-to-image for PNG export.
- jsPDF for PDF export.

The MVP can be implemented as a pure frontend app with no backend.

## Module Boundaries

### project

Owns:

- Project file read/write.
- Project schema validation.
- Version migration.
- Autosave.
- Browser storage integration.

### assets

Owns:

- Imported asset records.
- Asset field mapping.
- Import preview validation.
- Asset search and filtering.
- Asset pool state.

### diagram

Owns:

- Diagrams.
- Diagram nodes.
- Diagram edges.
- Selection state.
- Viewport state.
- Undo/redo commands.

### canvas

Owns:

- React Flow integration.
- Custom node components.
- Custom edge components.
- Drag and drop from asset pool.
- Canvas keyboard shortcuts.

### properties

Owns:

- Node property form.
- Edge property form.
- Template-specific advanced fields.

### export

Owns:

- PNG export.
- PDF export.
- Project file download.

### templates

Owns:

- Network topology template configuration.
- System architecture template configuration.
- Node type definitions.
- Default icons and colors.
- Visible metadata fields.

## Persistence

The app uses two persistence paths:

- Browser autosave in IndexedDB for crash/refresh recovery.
- Explicit project file export/import for long-term storage and transfer.

File System Access API can be used when available for open/save/save-as. Browsers that do not support it should fall back to upload/download flows.

## Error Handling

Import errors:

- Show row-level validation.
- Let valid rows continue.
- Let users skip invalid rows.
- Provide an error report for skipped rows.

Project file errors:

- Validate `version` and required top-level fields.
- Show a clear incompatible-file message.
- Attempt migration when the version is older and supported.

Autosave errors:

- Show non-blocking save status.
- Keep the user on the canvas.
- Offer manual project file download.

Export errors:

- Show whether the failure came from image rendering or PDF packaging.
- Recommend PNG export if PDF generation fails.

## Performance Targets

MVP should work comfortably with:

- Hundreds of assets in the asset pool.
- A few hundred nodes on a diagram.
- A few hundred edges on a diagram.

Large-scale optimization is not part of the MVP, but the data model should not prevent future improvements such as virtualized asset lists, diagram layers, or partial rendering.

## Testing Strategy

### Unit Tests

- CSV parsing.
- XLSX parsing.
- Field mapping guesses.
- Import validation.
- Project schema validation.
- Project version migration.
- Asset search/filter logic.

### Component Tests

- Asset pool filtering.
- Import mapping screen.
- Import preview screen.
- Node property panel.
- Edge property panel.

### End-to-End Tests

- Create a new project.
- Import a CSV file.
- Map fields.
- Confirm import.
- Drag an asset to the canvas.
- Create an edge.
- Edit node and edge properties.
- Save the project file.
- Reopen the project file.
- Export PNG/PDF.

### Manual Verification

- Browser compatibility for file open/save.
- Behavior when File System Access API is unavailable.
- Diagram usability at larger node counts.
- Export quality for both current viewport and full diagram.

## Future Extensions

Potential post-MVP features:

- Automatic layout.
- Relationship import.
- CMDB adapters.
- Cloud asset import.
- Nmap or scan result import.
- Team accounts.
- Shared workspaces.
- Real-time collaboration.
- Commenting and review mode.
- Diagram version history.
- Monitoring status overlays.
- Alert and incident context overlays.

## Decision Status

All MVP design decisions from the brainstorming session are captured in this document. The next step is to create an implementation plan from this design.
