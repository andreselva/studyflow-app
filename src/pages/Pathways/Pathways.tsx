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
  SheetDescription,
  SheetHeader,
  SheetOverlay,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Save, Sidebar, Target } from "lucide-react";
import { NODE_TITLE_MAX_LENGTH, normalizeNodeTitle } from "@/lib/node-title";
import type { StudyNode, StudyNodeData, StudyTask, TaskSide } from "@/types/pathway";
import { TaskTreeEditor } from "@/components/TaskTreeEditor";

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

const sourceHandleIsTaskSide = (handle?: string | null): handle is "task-left" | "task-right" =>
  handle === "task-left" || handle === "task-right";

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

const flattenTaskTree = (tasks: StudyTask[]): Map<string, StudyTask> => {
  const taskMap = new Map<string, StudyTask>();

  const visit = (entries: StudyTask[]) => {
    entries.forEach((task) => {
      if (task.nodeId) taskMap.set(task.nodeId, task);
      visit(task.children);
    });
  };

  visit(tasks);
  return taskMap;
};

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

export const Pathways = () => {
  const [open, setOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const {
    addNode,
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

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
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
      const taskMap = flattenTaskTree(nextTasks);

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

        const linkedTask = taskMap.get(node.id);
        if (!linkedTask) return node;

        return {
          ...node,
          data: enrichNodeData({
            ...node.data,
            kind: "task",
            rootNodeId: node.data.rootNodeId,
            parentNodeId: node.data.parentNodeId,
            side: linkedTask.side ?? node.data.side,
            title: linkedTask.title,
            done: linkedTask.done,
            tasks: linkedTask.children,
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
    [nodes, setEdges],
  );

  const onNodeClick: NodeMouseHandler<StudyNode> = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onNodeDoubleClick: NodeMouseHandler<StudyNode> = useCallback(
    (_, node) => {
      const title = normalizeNodeTitle(
        prompt("Editar nome do assunto:", node.data.title) ?? "",
      );
      if (!title) return;

      updateNodeData(node.id, (data) => ({ ...data, title }));
      if (node.data.kind === "task") {
        const rootNode =
          nodes.find((candidate) => candidate.id === node.data.rootNodeId) ?? null;
        if (rootNode) {
          const nextTasks = updateTaskTreeByNodeId(rootNode.data.tasks, node.id, (task) => ({
            ...task,
            title,
          }));
          commitTaskTree(rootNode.id, nextTasks);
        }
      }
      setSelectedNodeId(node.id);
    },
    [commitTaskTree, nodes, updateNodeData],
  );

  const completionLabel = selectedNode
    ? `${selectedNode.data.completedTasks ?? 0}/${selectedNode.data.totalTasks ?? 0} tarefas`
    : "Selecione um no";

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
            Mapeie a jornada inteira, conecte topicos, acompanhe tarefas e
            expanda a trilha sem perder contexto.
          </p>
        </div>
        <div className="pointer-events-auto hidden rounded-3xl border border-white/70 bg-white/65 px-4 py-3 text-right shadow-[0_20px_60px_rgba(23,49,38,0.08)] backdrop-blur md:block">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8b82]">
            foco atual
          </div>
          <div className="mt-1 text-lg font-semibold text-[#173126]">
            {selectedNode ? selectedNode.data.title : "Mapa completo"}
          </div>
          <div className="mt-1 text-sm text-[#62736a]">{completionLabel}</div>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        viewport={viewport}
        onViewportChange={setViewport}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={() => setSelectedNodeId(null)}
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
                onClick={saveFlow}
                className="border-[#d4dfd7] bg-white text-[#173126] hover:bg-[#f4f8f5]"
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
              <div className="h-6 w-px bg-[#d8e2db]" />
              <Button
                size="sm"
                onClick={() => setOpen((prev) => !prev)}
                className="bg-[#365949] text-white hover:bg-[#28473a]"
              >
                <Sidebar />
                {open ? "Fechar" : "Acoes"}
              </Button>
            </div>
            {open && (
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-[#dce6df] bg-[#fbfdfb] p-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={addNode}
                  className="bg-[#ebe4d8] text-[#173126] hover:bg-[#e3dac9]"
                >
                  <Plus />
                  Criar no
                </Button>
                <p className="text-xs text-[#6f8077]">
                  Fluxo principal em cima/baixo. Tarefas apenas pelos conectores laterais.
                </p>
              </div>
            )}
          </div>
        </Panel>
      </ReactFlow>

      <Sheet open={Boolean(selectedNode)} onOpenChange={(open) => !open && setSelectedNodeId(null)}>
        <SheetOverlay />
        {selectedNode && (
          <SheetContent>
            <SheetHeader>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7b8b82]">
                  assunto selecionado
                </span>
                <SheetTitle>{selectedNode.data.title}</SheetTitle>
                <SheetDescription>
                  Clique duplo no no para renomear direto no canvas ou edite os
                  detalhes aqui.
                </SheetDescription>
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
