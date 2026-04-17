import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type NodeMouseHandler,
} from "@xyflow/react";
import { usePathwayHandler } from "../../handlers/usePathwaysHandler";
import { useCallback, useMemo, useState } from "react";
import { nodeTypes } from "../../types/nodeTypes";
import "@xyflow/react/dist/style.css";
import { edgeTypes } from "../../types/edgeTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetCloseIcon,
  SheetContent,
  SheetHeader,
  SheetOverlay,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Plus, Save, Target, Trash2 } from "lucide-react";
import { NODE_TITLE_MAX_LENGTH, normalizeNodeTitle } from "@/lib/node-title";
import type { StudyNode, StudyNodeData, StudyTask, TaskSide } from "@/types/pathway";
import { TaskTreeEditor } from "@/components/TaskTreeEditor";
import { PathwayNodeActionsProvider } from "@/components/pathways/PathwayNodeActionsProvider";

const countTaskStats = (
  tasks: StudyTask[],
): { completed: number; total: number } =>
  tasks.reduce(
    (stats, task) => {
      const childStats = countTaskStats(task.children);

      return {
        completed: stats.completed + (task.done ? 1 : 0) + childStats.completed,
        total: stats.total + 1 + childStats.total,
      };
    },
    { completed: 0, total: 0 },
  );

const enrichNodeData = (data: StudyNodeData): StudyNodeData => {
  const { completed, total } = countTaskStats(data.tasks);
  const isTaskNode = data.kind === "task";
  const totalTasks = isTaskNode ? total + 1 : total;
  const completedTasks = isTaskNode
    ? completed + (data.done ? 1 : 0)
    : completed;

  return {
    ...data,
    progress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    completedTasks,
    totalTasks,
  };
};

const sourceHandleIsTaskSide = (
  handle?: string | null,
): handle is "task-left" | "task-right" | "task-bottom" =>
  handle === "task-left" || handle === "task-right" || handle === "task-bottom";

const createConnectedEdge = (
  source: string,
  target: string,
  sourceHandle?: string,
  targetHandle?: string,
) => ({
  id: `edge-${source}-${sourceHandle ?? "default"}-${target}-${targetHandle ?? "default"}`,
  source,
  target,
  sourceHandle,
  targetHandle,
  type: "custom" as const,
  markerEnd: {
    type: "arrowclosed" as const,
    width: 18,
    height: 18,
    color: "#365949",
  },
});

const createTaskEntry = (nodeId: string, side: TaskSide): StudyTask => ({
  id: crypto.randomUUID(),
  nodeId,
  side,
  title: normalizeNodeTitle("Nova tarefa"),
  done: false,
  children: [],
});

const addChildTask = (
  tasks: StudyTask[],
  parentTaskId: string,
  nextTask: StudyTask,
): StudyTask[] =>
  tasks.map((task) =>
    task.id === parentTaskId
      ? { ...task, children: [...task.children, nextTask] }
      : { ...task, children: addChildTask(task.children, parentTaskId, nextTask) },
  );

const updateTaskTree = (
  tasks: StudyTask[],
  taskId: string,
  updater: (task: StudyTask) => StudyTask,
): StudyTask[] =>
  tasks.map((task) =>
    task.id === taskId
      ? updater(task)
      : { ...task, children: updateTaskTree(task.children, taskId, updater) },
  );

const updateTaskTreeByNodeId = (
  tasks: StudyTask[],
  nodeId: string,
  updater: (task: StudyTask) => StudyTask,
): StudyTask[] =>
  tasks.map((task) =>
    task.nodeId === nodeId
      ? updater(task)
      : {
          ...task,
          children: updateTaskTreeByNodeId(task.children, nodeId, updater),
        },
  );

const removeTaskTreeEntry = (
  tasks: StudyTask[],
  taskId: string,
): { nextTasks: StudyTask[]; removedTask: StudyTask | null } => {
  for (const task of tasks) {
    if (task.id === taskId) {
      return {
        nextTasks: tasks.filter((item) => item.id !== taskId),
        removedTask: task,
      };
    }

    const childResult = removeTaskTreeEntry(task.children, taskId);
    if (childResult.removedTask) {
      return {
        nextTasks: tasks.map((item) =>
          item.id === task.id
            ? { ...item, children: childResult.nextTasks }
            : item,
        ),
        removedTask: childResult.removedTask,
      };
    }
  }

  return { nextTasks: tasks, removedTask: null };
};

const collectTaskNodeIds = (task: StudyTask): string[] => [
  ...(task.nodeId ? [task.nodeId] : []),
  ...task.children.flatMap(collectTaskNodeIds),
];

const findTaskById = (tasks: StudyTask[], taskId: string): StudyTask | null => {
  for (const task of tasks) {
    if (task.id === taskId) return task;
    const nested = findTaskById(task.children, taskId);
    if (nested) return nested;
  }

  return null;
};

const findTaskByNodeId = (
  tasks: StudyTask[],
  nodeId: string,
): StudyTask | null => {
  for (const task of tasks) {
    if (task.nodeId === nodeId) return task;
    const nested = findTaskByNodeId(task.children, nodeId);
    if (nested) return nested;
  }

  return null;
};

const buildTaskNode = (
  parentNode: StudyNode,
  offsetIndex: number,
  side: TaskSide,
  rootNodeId: string,
): StudyNode => {
  const id = crypto.randomUUID();
  const direction = side === "left" ? -1 : 1;
  const horizontalOffset = parentNode.type === "task" ? 260 : 220;

  return {
    id,
    type: "task",
    position: {
      x: parentNode.position.x + direction * (horizontalOffset + (offsetIndex % 2) * 18),
      y: parentNode.position.y + 90 + offsetIndex * 86,
    },
    data: enrichNodeData({
      kind: "task",
      rootNodeId,
      parentNodeId: parentNode.id,
      side,
      title: normalizeNodeTitle("Nova tarefa"),
      description: "",
      done: false,
      tasks: [],
    }),
  };
};

const buildStandaloneTopicNode = (position: { x: number; y: number }): StudyNode => ({
  id: crypto.randomUUID(),
  type: "circle",
  position,
  data: enrichNodeData({
    kind: "topic",
    title: normalizeNodeTitle("Novo nó"),
    description: "",
    tasks: [],
  }),
});

const buildStandaloneTaskNode = (position: { x: number; y: number }): StudyNode => ({
  id: crypto.randomUUID(),
  type: "task",
  position,
  data: enrichNodeData({
    kind: "task",
    side: "right",
    title: normalizeNodeTitle("Nova tarefa"),
    description: "",
    done: false,
    tasks: [],
  }),
});

export const Pathways = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const {
    nodes,
    edges,
    viewport,
    setNodes,
    setEdges,
    setViewport,
    saveFlow,
    loadFlow,
  } =
    usePathwayHandler();

  const invalidNodeIds = useMemo(() => {
    const connectedNodeIds = new Set<string>();

    edges.forEach((edge) => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    return new Set(
      nodes.filter((node) => !connectedNodeIds.has(node.id)).map((node) => node.id),
    );
  }, [edges, nodes]);

  const nodesForCanvas = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          invalid: invalidNodeIds.has(node.id),
        },
      })),
    [invalidNodeIds, nodes],
  );

  const hasConnectionErrors = invalidNodeIds.size > 0;

  const selectedNode = useMemo(
    () => nodesForCanvas.find((node) => node.id === selectedNodeId) ?? null,
    [nodesForCanvas, selectedNodeId],
  );

  const selectedRootNode = useMemo(() => {
    if (!selectedNode) return null;
    if (selectedNode.data.kind !== "task") return selectedNode;

    return (
      nodes.find((node) => node.id === selectedNode.data.rootNodeId) ?? selectedNode
    );
  }, [nodes, selectedNode]);

  const selectedTaskEntry = useMemo(() => {
    if (!selectedNode || !selectedRootNode || selectedNode.data.kind !== "task") {
      return null;
    }

    return findTaskByNodeId(selectedRootNode.data.tasks, selectedNode.id);
  }, [selectedNode, selectedRootNode]);

  const visibleTasks = useMemo(() => {
    if (!selectedNode) return [];
    if (selectedNode.data.kind === "task") {
      return selectedTaskEntry?.children ?? selectedNode.data.tasks;
    }
    return selectedNode.data.tasks;
  }, [selectedNode, selectedTaskEntry]);

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
          return {
            ...node,
            data: enrichNodeData({
              ...node.data,
              tasks: nextTasks,
            }),
          };
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
        extraEdges?: typeof edges;
        removedNodeIds?: string[];
      },
    ) => {
      const removedNodeIds = options?.removedNodeIds ?? [];

      setNodes((nodesSnapshot) => {
        const filteredNodes = nodesSnapshot.filter(
          (node) => !removedNodeIds.includes(node.id),
        );
        const mergedNodes = [...filteredNodes, ...(options?.extraNodes ?? [])];
        return syncNodeSubtree(rootNodeId, nextTasks, mergedNodes);
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
            ? {
                ...node,
                data: enrichNodeData(updater(node.data)),
              }
            : node,
        ),
      );
    },
    [setNodes],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<StudyNode>[]) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [setNodes],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [setEdges],
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
    setIsCreateMenuOpen(false);
    setIsDeleteConfirmOpen(false);
    setSelectedNodeId(node.id);
  }, []);

  const completionLabel = selectedNode
    ? `${selectedNode.data.completedTasks ?? 0}/${selectedNode.data.totalTasks ?? 0} tarefas`
    : "Selecione um nó";

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
      const siblingTasks = effectiveParentTaskId
        ? parentTask?.children ?? []
        : rootTasks;
      const siblingCount = siblingTasks.filter((task) => task.side === side).length;
      const childNode = buildTaskNode(
        parentNode,
        siblingCount,
        side,
        selectedRootNode.id,
      );
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

  const getViewportCenterPosition = useCallback(() => {
    const paneWidth = window.innerWidth;
    const paneHeight = window.innerHeight;

    return {
      x: -viewport.x / viewport.zoom + paneWidth / (2 * viewport.zoom),
      y: -viewport.y / viewport.zoom + paneHeight / (2 * viewport.zoom),
    };
  }, [viewport]);

  const handleCreateStandaloneTopicNode = useCallback(() => {
    const nextNode = buildStandaloneTopicNode(getViewportCenterPosition());

    setNodes((nodesSnapshot) => [...nodesSnapshot, nextNode]);
    setSelectedNodeId(nextNode.id);
  }, [getViewportCenterPosition, setNodes]);

  const handleCreateStandaloneTaskNode = useCallback(() => {
    const nextNode = buildStandaloneTaskNode(getViewportCenterPosition());

    setNodes((nodesSnapshot) => [...nodesSnapshot, nextNode]);
    setSelectedNodeId(nextNode.id);
    setIsCreateMenuOpen(false);
  }, [getViewportCenterPosition, setNodes]);

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
    [commitTaskTree, selectedNodeId, selectedRootNode],
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
          !removedNodeIds.includes(edge.source) &&
          !removedNodeIds.includes(edge.target),
      ),
    );
    setSelectedNodeId(null);
  }, [handleTaskRemove, selectedNode, selectedRootNode, setEdges, setNodes]);

  const handleToggleTaskNodeDone = useCallback(
    (nodeId: string, done: boolean) => {
      const taskNode = nodes.find((node) => node.id === nodeId);
      if (!taskNode || taskNode.data.kind !== "task") return;

      updateNodeData(nodeId, (data) => ({ ...data, done }));

      const rootNode =
        nodes.find((node) => node.id === taskNode.data.rootNodeId) ?? null;
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

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top,#f7f1e4_0%,#f0eadf_38%,#ece8de_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between px-5 py-5 md:px-8">
        <div className="pointer-events-auto max-w-xl">
          <span className="inline-flex rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#52675c] backdrop-blur">
            StudyFlow
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#173126] md:text-4xl">
            Trilha visual de estudos com progresso por assunto.
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[#56675f] md:text-base">
            Mapeie a jornada inteira, conecte tópicos, acompanhe tarefas e
            expanda a trilha sem perder contexto.
          </p>
        </div>
        <div className="pointer-events-auto hidden max-w-sm space-y-3 md:block">
          {hasConnectionErrors && (
            <div className="rounded-3xl border border-[#e4b6b6] bg-[#fff4f4] px-4 py-3 text-right shadow-[0_20px_60px_rgba(163,63,63,0.10)] backdrop-blur">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a63d3d]">
                erro de conexão
              </div>
              <div className="mt-1 text-sm font-medium text-[#7d2f2f]">
                Existem {invalidNodeIds.size} elementos sem conexão com outro nó.
              </div>
            </div>
          )}
          <div className="rounded-3xl border border-white/70 bg-white/65 px-4 py-3 text-right shadow-[0_20px_60px_rgba(23,49,38,0.08)] backdrop-blur">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8b82]">
              foco atual
            </div>
            <div className="mt-1 text-lg font-semibold text-[#173126]">
              {selectedNode ? selectedNode.data.title : "Mapa completo"}
            </div>
            <div className="mt-1 text-sm text-[#62736a]">{completionLabel}</div>
          </div>
        </div>
      </div>

      <PathwayNodeActionsProvider value={{ toggleTaskNodeDone: handleToggleTaskNodeDone }}>
        <ReactFlow
          nodes={nodesForCanvas}
          edges={edges}
          viewport={viewport}
          onViewportChange={setViewport}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={() => {
            setIsCreateMenuOpen(false);
            setIsDeleteConfirmOpen(false);
            setSelectedNodeId(null);
          }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{
            type: "custom",
            markerEnd: {
              type: "arrowclosed",
              width: 18,
              height: 18,
              color: "#365949",
            },
          }}
          minZoom={0.45}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.2}
            color="#9fb5a8"
          />
          <Controls />
          <MiniMap
            pannable
            zoomable
            nodeColor={() => "#365949"}
            className="!bg-white/90 !backdrop-blur"
          />
          <Panel position="top-center" className="!z-20">
            <div className="rounded-3xl border border-white/70 bg-white/70 p-2 shadow-[0_20px_60px_rgba(23,49,38,0.08)] backdrop-blur">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (hasConnectionErrors) return;
                    void saveFlow();
                  }}
                  disabled={hasConnectionErrors}
                  className="border-[#d4dfd7] bg-white text-[#173126] hover:bg-[#f4f8f5] disabled:border-[#e7c2c2] disabled:bg-[#fbf1f1] disabled:text-[#aa6a6a]"
                >
                  <Save />
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadFlow}
                  className="border-[#d4dfd7] bg-white text-[#173126] hover:bg-[#f4f8f5]"
                >
                  <Target />
                  Recarregar
                </Button>
                <div className="relative">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsCreateMenuOpen((open) => !open)}
                    className="bg-[#365949] text-white hover:bg-[#28473a]"
                    aria-label="Abrir menu de criacao"
                  >
                    <Plus />
                    Criar
                    <ChevronDown />
                  </Button>
                  {isCreateMenuOpen && (
                    <div className="absolute right-0 top-[calc(100%+0.5rem)] min-w-40 rounded-2xl border border-[#d4dfd7] bg-white p-1 shadow-[0_20px_50px_rgba(23,49,38,0.12)]">
                      <button
                        type="button"
                        className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-[#173126] transition-colors hover:bg-[#f4f8f5]"
                        onClick={() => {
                          handleCreateStandaloneTopicNode();
                          setIsCreateMenuOpen(false);
                        }}
                      >
                        Nó
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-[#173126] transition-colors hover:bg-[#f4f8f5] disabled:cursor-not-allowed disabled:text-[#9da8a2] disabled:hover:bg-transparent"
                        onClick={handleCreateStandaloneTaskNode}
                      >
                        Tarefa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </PathwayNodeActionsProvider>

      <Sheet
        open={Boolean(selectedNode)}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteConfirmOpen(false);
            setSelectedNodeId(null);
          }
        }}
      >
        <SheetOverlay />
        {selectedNode && (
          <SheetContent>
            <SheetHeader>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7b8b82]">
                  assunto selecionado
                </span>
                <SheetTitle>{selectedNode.data.title}</SheetTitle>
              </div>
              <SheetClose aria-label="Fechar painel lateral">
                <SheetCloseIcon />
              </SheetClose>
            </SheetHeader>

            <div className="mt-6 rounded-3xl border border-[#dde8e0] bg-white/85 p-5">
              <div className="grid gap-5">
                <label className="grid gap-2">
                  <Label htmlFor="node-title">Nome</Label>
                  <Input
                    id="node-title"
                    value={selectedNode.data.title}
                    maxLength={NODE_TITLE_MAX_LENGTH}
                    onChange={(event) =>
                      handleSelectedNodeTitleChange(
                        normalizeNodeTitle(event.target.value),
                      )
                    }
                  />
                </label>

                <label className="grid gap-2">
                  <Label htmlFor="node-description">Descricao</Label>
                  <Textarea
                    id="node-description"
                    value={selectedNode.data.description}
                    onChange={(event) =>
                      updateNodeData(selectedNode.id, (data) => ({
                        ...data,
                        description: event.target.value,
                      }))
                    }
                    rows={4}
                    className="resize-none"
                  />
                </label>

                <div className="rounded-2xl border border-[#e3ece5] bg-[#f6fbf7] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b8b82]">
                        Progresso
                      </div>
                      <div className="mt-1 text-2xl font-semibold text-[#173126]">
                        {Math.round(selectedNode.data.progress ?? 0)}%
                      </div>
                    </div>
                    <div className="text-right text-sm text-[#617269]">
                      {selectedNode.data.completedTasks ?? 0} concluidas
                      <br />
                      {selectedNode.data.totalTasks ?? 0} no total
                    </div>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#dfeae2]">
                    <div
                      className="h-full rounded-full bg-[#365949] transition-[width] duration-300"
                      style={{ width: `${selectedNode.data.progress ?? 0}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  {!isDeleteConfirmOpen ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      className="bg-[#fdf0f0] text-[#a63d3d] hover:bg-[#f9dddd]"
                    >
                      <Trash2 />
                      Excluir nó
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 rounded-2xl border border-[#e7c2c2] bg-[#fff4f4] px-3 py-2">
                      <span className="text-xs font-medium text-[#8f3c3c]">
                        Confirmar exclusão?
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setIsDeleteConfirmOpen(false)}
                        className="border-[#dfd7d7] bg-white text-[#6a5a5a] hover:bg-[#f7f3f3]"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setIsDeleteConfirmOpen(false);
                          handleDeleteSelectedNode();
                        }}
                        className="bg-[#c94f4f] text-white hover:bg-[#b64141]"
                      >
                        Confirmar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <TaskTreeEditor
                tasks={visibleTasks}
                onAddTask={handleAddTaskNode}
                onAddChild={(taskId, side) => handleAddTaskNode(side, taskId)}
                onTitleChange={handleTaskTitleChange}
                onToggleDone={handleTaskToggle}
                onRemoveTask={handleTaskRemove}
              />
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
};
