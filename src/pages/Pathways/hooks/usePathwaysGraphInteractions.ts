import { useCallback } from "react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type NodeMouseHandler,
} from "@xyflow/react";
import type { StudyEdge, StudyNode, StudyTask } from "@/types/pathway";
import {
  addChildTask,
  collectTaskNodeIds,
  createConnectedEdge,
  enrichNodeData,
  findTaskByNodeId,
  removeTaskTreeEntry,
  sourceHandleIsTaskSide,
} from "../pathwayUtils";

type UsePathwaysGraphInteractionsParams = {
  edges: StudyEdge[];
  nodes: StudyNode[];
  setEdges: import("react").Dispatch<import("react").SetStateAction<StudyEdge[]>>;
  setNodes: import("react").Dispatch<import("react").SetStateAction<StudyNode[]>>;
  setSelectedNodeId: import("react").Dispatch<import("react").SetStateAction<string | null>>;
  commitTaskTree: (
    rootNodeId: string,
    nextTasks: StudyTask[],
    options?: {
      extraNodes?: StudyNode[];
      extraEdges?: Edge[];
      removedNodeIds?: string[];
    },
  ) => void;
  syncNodeSubtree: (rootNodeId: string, nextTasks: StudyTask[], nodesSnapshot: StudyNode[]) => StudyNode[];
};

export function usePathwaysGraphInteractions({
  edges,
  nodes,
  setEdges,
  setNodes,
  setSelectedNodeId,
  commitTaskTree,
  syncNodeSubtree,
}: UsePathwaysGraphInteractionsParams) {
  const onNodesChange = useCallback(
    (changes: NodeChange<StudyNode>[]) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [setNodes],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const change of changes) {
        if (change.type !== "remove") continue;

        const edge = edges.find((e) => e.id === change.id);
        if (!edge || edge.targetHandle !== "task-in") continue;

        const taskNode = nodes.find((n) => n.id === edge.target);
        if (!taskNode?.data.rootNodeId) continue;

        const rootNode = nodes.find((n) => n.id === taskNode.data.rootNodeId);
        if (!rootNode) continue;

        const taskEntry = findTaskByNodeId(rootNode.data.tasks, taskNode.id);
        if (!taskEntry) continue;

        const { nextTasks } = removeTaskTreeEntry(rootNode.data.tasks, taskEntry.id);
        const orphanedIds = new Set(collectTaskNodeIds(taskEntry));

        setNodes((nodesSnapshot) => {
          const synced = syncNodeSubtree(rootNode.id, nextTasks, nodesSnapshot);
          return synced.map((node) =>
            orphanedIds.has(node.id)
              ? {
                  ...node,
                  data: enrichNodeData({
                    ...node.data,
                    rootNodeId: undefined,
                    parentNodeId: undefined,
                  }),
                }
              : node,
          );
        });
      }

      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot));
    },
    [edges, nodes, setEdges, setNodes, syncNodeSubtree],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      const sourceNode = nodes.find((node) => node.id === params.source);
      const targetNode = nodes.find((node) => node.id === params.target);
      if (!sourceNode || !targetNode) return;

      const sourceKind = sourceNode.data.kind ?? "topic";
      const targetKind = targetNode.data.kind ?? "topic";
      const isMainFlowConnection =
        sourceKind === "topic" &&
        targetKind === "topic" &&
        params.sourceHandle === "flow-out" &&
        params.targetHandle === "flow-in";
      const isTaskConnection =
        sourceHandleIsTaskSide(params.sourceHandle) &&
        targetKind === "task" &&
        params.targetHandle === "task-in";

      if (!isMainFlowConnection && !isTaskConnection) return;

      if (isTaskConnection) {
        const sourceRootNode =
          sourceNode.data.kind === "task"
            ? nodes.find((node) => node.id === sourceNode.data.rootNodeId) ?? null
            : sourceNode;
        if (!sourceRootNode) return;

        const rootTasks = sourceRootNode.data.tasks;
        const parentTask =
          sourceNode.data.kind === "task"
            ? findTaskByNodeId(rootTasks, sourceNode.id)
            : null;

        if (sourceNode.data.kind === "task" && !parentTask) return;
        if (targetNode.data.rootNodeId) return;

        const side =
          params.sourceHandle === "task-left"
            ? "left"
            : params.sourceHandle === "task-right"
              ? "right"
              : sourceNode.data.side ?? "right";
        const targetTask: StudyTask = {
          id: crypto.randomUUID(),
          nodeId: targetNode.id,
          side,
          title: targetNode.data.title,
          done: Boolean(targetNode.data.done),
          children: targetNode.data.tasks,
        };
        const nextTasks = parentTask
          ? addChildTask(rootTasks, parentTask.id, targetTask)
          : [...rootTasks, targetTask];

        commitTaskTree(sourceRootNode.id, nextTasks, {
          extraEdges: [
            createConnectedEdge(
              params.source,
              params.target,
              params.sourceHandle ?? undefined,
              params.targetHandle ?? undefined,
            ),
          ],
        });
        return;
      }

      setEdges((edgesSnapshot) => [
        ...edgesSnapshot,
        createConnectedEdge(
          params.source,
          params.target,
          params.sourceHandle ?? undefined,
          params.targetHandle ?? undefined,
        ),
      ]);
    },
    [commitTaskTree, nodes, setEdges],
  );

  const onNodeClick: NodeMouseHandler<StudyNode> = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  return {
    onConnect,
    onEdgesChange,
    onNodeClick,
    onNodesChange,
  };
}
