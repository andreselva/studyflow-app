# StudyFlow

StudyFlow is a personal MVP created to solve a very practical problem: organizing study paths in one place without losing sight of the bigger picture.

The idea is simple. Instead of scattering notes, tasks, and topics across different tools, StudyFlow lets you model a study path visually through nodes, connections, tasks, and subtasks.

## Why this project exists

This project was created from a personal need.

At the time, I wanted a simple way to:
- centralize what I needed to study
- keep a visual overview of the path as a whole
- break each topic into smaller actionable tasks
- track progress without losing context

## Current status

This repository is an MVP built in a short amount of time, with the main goal of validating the idea and solving a real personal pain point.

It is public on purpose, as a way to share the concept, the first implementation, and the product thinking behind it.

There are currently no plans for active long-term evolution.

## Main features

- Visual study paths using nodes and connections
- Support for tasks and nested subtasks
- Sidebar for editing selected nodes
- Progress tracking per node
- Import and export of flow data
- Local persistence and autosave behavior
- Automatic layout organization

## Tech stack

- React
- TypeScript
- Vite
- React Flow (`@xyflow/react`)
- Tailwind CSS

## Running locally

```bash
npm install
npm run dev
```

## Architecture

### Data model

The core types live in `src/types/pathway.ts`:

- **`StudyTask`** — a recursive tree node representing a task or subtask. Each task can optionally be linked to a canvas node via `nodeId`.
- **`StudyNodeData`** — the data payload attached to each React Flow node. Holds the title, description, task tree, and computed progress stats (`progress`, `completedTasks`, `totalTasks`).
- **`StudyNode` / `StudyEdge`** — thin aliases over React Flow's `Node` and `Edge` types.

There are two node types on the canvas: `circle` (a topic) and `task`. Topic nodes are the primary units of a study path; task nodes are children that can branch left or right from a topic.

### Dual representation of tasks

Tasks are stored in two places simultaneously:

1. **As a recursive tree** inside `StudyNodeData.tasks` on the parent topic node.
2. **As individual `task` nodes** on the React Flow canvas, connected by edges.

`commitTaskTree` (in `Pathways.tsx`) is the central function that keeps both representations in sync after any mutation. It calls `syncNodeSubtree` internally, which walks the task tree and updates each linked canvas node's data accordingly.

### State and persistence

`usePathwaysHook` (`src/hooks/usePathwaysHook.tsx`) owns nodes, edges, and viewport state, and handles all persistence:

- **Manual save** — written to `localStorage` under the key `studyflow:flow`.
- **Autosave** — written every 15 seconds to `studyflow:flow-autosave`.
- **On load** — whichever slot has the more recent timestamp wins. This means an autosaved draft is preferred over an older manual save.
- **Size limit** — payloads are capped at 2 MB before writing to localStorage.

`enrichNodeData` is called every time node data changes; it recomputes `progress`, `completedTasks`, and `totalTasks` by walking the task tree recursively.

### Handler and action layer

`usePathwaysHandler` (`src/handlers/usePathwaysHandler.tsx`) wraps `usePathwaysHook` and re-exports its interface. It is a thin adapter — most of the interaction logic (connecting nodes, editing tasks, deleting nodes) lives directly in `Pathways.tsx`.

### Auto-layout

`autoLayout` (`src/pages/Pathways/autoLayout.ts`) reorganizes node positions without changing the graph structure:

1. Runs a topological sort on topic nodes using their edges to identify linear chains.
2. Places each chain vertically, spacing topics based on how tall their task branches are.
3. Task nodes are placed left or right of their topic node at a fixed horizontal offset, centered vertically around the topic.

## Notes

This project should be seen as an initial usable version, not as a finished product.

If the idea is useful to you, feel free to explore, adapt, or use it as inspiration.

## Author

Created by André Selva.
