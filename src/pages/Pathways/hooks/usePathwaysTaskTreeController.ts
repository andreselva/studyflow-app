import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { Edge } from "@xyflow/react";
import { normalizeNodeTitle } from "@/lib/node-title";
import type { StudyEdge, StudyNode, StudyNodeData, StudyTask, TaskSide } from "@/types/pathway";
import {
  addChildTask,
  buildTaskNode,
  collectTaskNodeIds,
  createConnectedEdge,
  createTaskEntry,
  enrichNodeData,
  findTaskById,
  findTaskByNodeId,
  removeTaskTreeEntry,
  updateTaskTree,
  updateTaskTreeByNodeId,
} from "../pathwayUtils";

type UsePathwaysTaskTreeControllerParams = {
  nodes: StudyNode[];
  selectedNode: StudyNode | null;
  selectedNodeId: string | null;
  selectedRootNode: StudyNode | null;
  setEdges: Dispatch<SetStateAction<StudyEdge[]>>;
  setNodes: Dispatch<SetStateAction<StudyNode[]>>;
  setSelectedNodeId: Dispatch<SetStateAction<string | null>>;
};

export function usePathwaysTaskTreeController({
  nodes,
  selectedNode,
  selectedNodeId,
  selectedRootNode,
  setEdges,
  setNodes,
  setSelectedNodeId,
}: UsePathwaysTaskTreeControllerParams) {
  const syncNodeSubtree = useCallback(
    (rootNodeId: string, nextTasks: StudyTask[], nodesSnapshot: StudyNode[]) => {
      const taskMap = new Map<string, { task: StudyTask; parentNodeId: string }>();
      const visit = (entries: StudyTask[], parentNodeId: string) => {
        entries.forEach((task) => {
          if (task.nodeId) {
            taskMap.set(task.nodeId, { task, parentNodeId });
            visit(task.children, task.nodeId);
          }
        });
      };
      visit(nextTasks, rootNodeId);

      return nodesSnapshot.map((node) => {
        if (node.id === rootNodeId) {
          return { ...node, data: enrichNodeData({ ...node.data, tasks: nextTasks }) };
        }
        const linked = taskMap.get(node.id);
        if (!linked) return node;
        return {
          ...node,
          data: enrichNodeData({
            ...node.data,
            kind: "task",
            rootNodeId,
            parentNodeId: linked.parentNodeId,
            side: linked.task.side ?? node.data.side,
            title: linked.task.title,
            done: linked.task.done,
            tasks: linked.task.children,
          }),
        };
      });
    },
    [],
  );

  const commitTaskTree = useCallback(
    (
      rootNodeId: string,
      nextTasks: StudyTask[],
      options?: {
        extraNodes?: StudyNode[];
        extraEdges?: Edge[];
        removedNodeIds?: string[];
      },
    ) => {
      const removedNodeIds = options?.removedNodeIds ?? [];
      setNodes((nodesSnapshot) => {
        const filteredNodes = nodesSnapshot.filter(
          (node) => !removedNodeIds.includes(node.id),
        );
        return syncNodeSubtree(rootNodeId, nextTasks, [
          ...filteredNodes,
          ...(options?.extraNodes ?? []),
        ]);
      });
      if ((options?.extraEdges?.length ?? 0) > 0 || removedNodeIds.length > 0) {
        setEdges((edgesSnapshot) => {
          const filteredEdges = edgesSnapshot.filter(
            (edge) =>
              !removedNodeIds.includes(edge.source) &&
              !removedNodeIds.includes(edge.target),
          );
          return [...filteredEdges, ...(options?.extraEdges ?? [])];
        });
      }
    },
    [setEdges, setNodes, syncNodeSubtree],
  );

  const updateNodeData = useCallback(
    (nodeId: string, updater: (data: StudyNodeData) => StudyNodeData) => {
      setNodes((nodesSnapshot) =>
        nodesSnapshot.map((node) =>
          node.id === nodeId
            ? { ...node, data: enrichNodeData(updater(node.data)) }
            : node,
        ),
      );
    },
    [setNodes],
  );

  const handleAddTaskNode = useCallback(
    (side: TaskSide, parentTaskId?: string) => {
      if (!selectedNode || !selectedRootNode) return;

      const rootTasks = selectedRootNode.data.tasks;
      const selectedTaskId =
        selectedNode.data.kind === "task"
          ? findTaskByNodeId(rootTasks, selectedNode.id)?.id
          : undefined;
      const effectiveParentTaskId = parentTaskId ?? selectedTaskId;
      const parentTask = effectiveParentTaskId
        ? findTaskById(rootTasks, effectiveParentTaskId)
        : null;
      const parentNodeId = effectiveParentTaskId
        ? parentTask?.nodeId ?? selectedRootNode.id
        : selectedRootNode.id;
      const parentNode =
        nodes.find((node) => node.id === parentNodeId) ?? selectedRootNode;
      const siblingTasks = effectiveParentTaskId ? parentTask?.children ?? [] : rootTasks;
      const siblingCount = siblingTasks.filter((task) => task.side === side).length;
      const childNode = buildTaskNode(parentNode, siblingCount, side, selectedRootNode.id);
      const childTask = createTaskEntry(childNode.id, side);
      const nextTasks = effectiveParentTaskId
        ? addChildTask(rootTasks, effectiveParentTaskId, childTask)
        : [...rootTasks, childTask];

      commitTaskTree(selectedRootNode.id, nextTasks, {
        extraNodes: [childNode],
        extraEdges: [
          createConnectedEdge(
            parentNode.id,
            childNode.id,
            side === "left" ? "task-left" : "task-right",
            "task-in",
          ),
        ],
      });
    },
    [commitTaskTree, nodes, selectedNode, selectedRootNode],
  );

  const handleTaskTitleChange = useCallback(
    (taskId: string, title: string) => {
      if (!selectedRootNode) return;
      const nextTasks = updateTaskTree(selectedRootNode.data.tasks, taskId, (task) => ({
        ...task,
        title: normalizeNodeTitle(title),
      }));
      commitTaskTree(selectedRootNode.id, nextTasks);
    },
    [commitTaskTree, selectedRootNode],
  );

  const handleTaskToggle = useCallback(
    (taskId: string, done: boolean) => {
      if (!selectedRootNode) return;
      const nextTasks = updateTaskTree(selectedRootNode.data.tasks, taskId, (task) => ({
        ...task,
        done,
      }));
      commitTaskTree(selectedRootNode.id, nextTasks);
    },
    [commitTaskTree, selectedRootNode],
  );

  const handleTaskRemove = useCallback(
    (taskId: string) => {
      if (!selectedRootNode) return;
      const { nextTasks, removedTask } = removeTaskTreeEntry(
        selectedRootNode.data.tasks,
        taskId,
      );
      if (!removedTask) return;
      const removedNodeIds = collectTaskNodeIds(removedTask);
      commitTaskTree(selectedRootNode.id, nextTasks, { removedNodeIds });
      if (selectedNodeId && removedNodeIds.includes(selectedNodeId)) {
        setSelectedNodeId(null);
      }
    },
    [commitTaskTree, selectedNodeId, selectedRootNode, setSelectedNodeId],
  );

  const handleDeleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;

    if (selectedNode.data.kind === "task" && selectedRootNode) {
      const taskEntry = findTaskByNodeId(selectedRootNode.data.tasks, selectedNode.id);
      if (taskEntry) {
        handleTaskRemove(taskEntry.id);
        return;
      }
    }

    const removedNodeIds = [
      selectedNode.id,
      ...selectedNode.data.tasks.flatMap(collectTaskNodeIds),
    ];
    setNodes((nodesSnapshot) =>
      nodesSnapshot.filter((node) => !removedNodeIds.includes(node.id)),
    );
    setEdges((edgesSnapshot) =>
      edgesSnapshot.filter(
        (edge) =>
          !removedNodeIds.includes(edge.source) && !removedNodeIds.includes(edge.target),
      ),
    );
    setSelectedNodeId(null);
  }, [handleTaskRemove, selectedNode, selectedRootNode, setEdges, setNodes, setSelectedNodeId]);

  const handleToggleTaskNodeDone = useCallback(
    (nodeId: string, done: boolean) => {
      const taskNode = nodes.find((node) => node.id === nodeId);
      if (!taskNode || taskNode.data.kind !== "task") return;
      updateNodeData(nodeId, (data) => ({ ...data, done }));
      const rootNode = nodes.find((node) => node.id === taskNode.data.rootNodeId) ?? null;
      if (!rootNode) return;
      const nextTasks = updateTaskTreeByNodeId(rootNode.data.tasks, nodeId, (task) => ({
        ...task,
        done,
      }));
      commitTaskTree(rootNode.id, nextTasks);
    },
    [commitTaskTree, nodes, updateNodeData],
  );

  const handleSelectedNodeTitleChange = useCallback(
    (title: string) => {
      if (!selectedNode) return;
      updateNodeData(selectedNode.id, (data) => ({ ...data, title }));
      if (selectedNode.data.kind === "task" && selectedRootNode) {
        const nextTasks = updateTaskTreeByNodeId(
          selectedRootNode.data.tasks,
          selectedNode.id,
          (task) => ({ ...task, title }),
        );
        commitTaskTree(selectedRootNode.id, nextTasks);
      }
    },
    [commitTaskTree, selectedNode, selectedRootNode, updateNodeData],
  );

  const handleDescriptionChange = useCallback(
    (description: string) => {
      if (!selectedNode) return;
      updateNodeData(selectedNode.id, (data) => ({ ...data, description }));
    },
    [selectedNode, updateNodeData],
  );

  return {
    commitTaskTree,
    handleAddTaskNode,
    handleDeleteSelectedNode,
    handleDescriptionChange,
    handleSelectedNodeTitleChange,
    handleTaskRemove,
    handleTaskTitleChange,
    handleTaskToggle,
    handleToggleTaskNodeDone,
    syncNodeSubtree,
    updateNodeData,
  };
}
