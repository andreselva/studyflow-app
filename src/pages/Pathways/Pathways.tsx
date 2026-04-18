import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type NodeMouseHandler,
} from "@xyflow/react";
import { usePathwayHandler } from "../../handlers/usePathwaysHandler";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { nodeTypes } from "../../types/nodeTypes";
import "@xyflow/react/dist/style.css";
import { edgeTypes } from "../../types/edgeTypes";
import { normalizeNodeTitle } from "@/lib/node-title";
import type { StudyNode, StudyNodeData, StudyTask, TaskSide } from "@/types/pathway";
import { PathwayNodeActionsProvider } from "@/components/pathways/PathwayNodeActionsProvider";
import { WelcomeModal } from "./WelcomeModal";
import { FlowAlerts } from "./FlowAlerts";
import { FlowToolbar } from "./FlowToolbar";
import { ClearAllPanel } from "./ClearAllPanel";
import { NodeSidebar } from "./NodeSidebar";
import { HelpButton, HelpPanel } from "./HelpPanel";
import { Button } from "@/components/ui/button";
import {
  addChildTask,
  buildStandaloneTaskNode,
  buildStandaloneTopicNode,
  buildTaskNode,
  collectTaskNodeIds,
  createConnectedEdge,
  createTaskEntry,
  enrichNodeData,
  findTaskById,
  findTaskByNodeId,
  removeTaskTreeEntry,
  sourceHandleIsTaskSide,
  updateTaskTree,
  updateTaskTreeByNodeId,
} from "./pathwayUtils";
import { autoLayout } from "./autoLayout";

export const Pathways = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isOrganizeConfirmOpen, setIsOrganizeConfirmOpen] = useState(false);
  const [organizeUndoSecondsLeft, setOrganizeUndoSecondsLeft] = useState(0);
  const [organizeSnapshot, setOrganizeSnapshot] = useState<Map<string, StudyNode["position"]> | null>(
    null,
  );
  const {
    nodes,
    edges,
    viewport,
    setNodes,
    setEdges,
    setViewport,
    saveFlow,
    loadFlow,
    importFlow,
    hasUnsavedChanges,
    autoSaveError,
    isAutoSaved,
  } = usePathwayHandler();
  const organizeUndoTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const organizeUndoIntervalRef = useRef<ReturnType<typeof window.setInterval> | null>(null);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    return () => {
      if (organizeUndoTimeoutRef.current) {
        window.clearTimeout(organizeUndoTimeoutRef.current);
      }
      if (organizeUndoIntervalRef.current) {
        window.clearInterval(organizeUndoIntervalRef.current);
      }
    };
  }, []);

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
        data: { ...node.data, invalid: invalidNodeIds.has(node.id) },
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
    return nodes.find((node) => node.id === selectedNode.data.rootNodeId) ?? selectedNode;
  }, [nodes, selectedNode]);

  const selectedTaskEntry = useMemo(() => {
    if (!selectedNode || !selectedRootNode || selectedNode.data.kind !== "task") return null;
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
        extraEdges?: typeof edges;
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
  }, []);

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
  }, [getViewportCenterPosition, setNodes]);

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
          !removedNodeIds.includes(edge.source) && !removedNodeIds.includes(edge.target),
      ),
    );
    setSelectedNodeId(null);
  }, [handleTaskRemove, selectedNode, selectedRootNode, setEdges, setNodes]);

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

  const clearOrganizeUndo = useCallback(() => {
    if (organizeUndoTimeoutRef.current) {
      window.clearTimeout(organizeUndoTimeoutRef.current);
      organizeUndoTimeoutRef.current = null;
    }
    if (organizeUndoIntervalRef.current) {
      window.clearInterval(organizeUndoIntervalRef.current);
      organizeUndoIntervalRef.current = null;
    }
    setOrganizeSnapshot(null);
    setOrganizeUndoSecondsLeft(0);
  }, []);

  const startOrganizeUndoWindow = useCallback(() => {
    if (organizeUndoTimeoutRef.current) {
      window.clearTimeout(organizeUndoTimeoutRef.current);
    }
    if (organizeUndoIntervalRef.current) {
      window.clearInterval(organizeUndoIntervalRef.current);
    }

    const expiresAt = Date.now() + 15000;
    setOrganizeUndoSecondsLeft(15);

    organizeUndoIntervalRef.current = window.setInterval(() => {
      const nextSeconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setOrganizeUndoSecondsLeft(nextSeconds);
    }, 250);

    organizeUndoTimeoutRef.current = window.setTimeout(() => {
      clearOrganizeUndo();
    }, 15000);
  }, [clearOrganizeUndo]);

  const handleOrganize = useCallback(() => {
    setOrganizeSnapshot(new Map(nodes.map((node) => [node.id, node.position])));
    setNodes((nodesSnapshot) => autoLayout(nodesSnapshot, edges));
    setIsOrganizeConfirmOpen(false);
    startOrganizeUndoWindow();
  }, [edges, nodes, setNodes, startOrganizeUndoWindow]);

  const handleRevertOrganize = useCallback(() => {
    if (!organizeSnapshot) return;
    setNodes((nodesSnapshot) =>
      nodesSnapshot.map((node) => {
        const previousPosition = organizeSnapshot.get(node.id);
        return previousPosition ? { ...node, position: previousPosition } : node;
      }),
    );
    clearOrganizeUndo();
  }, [clearOrganizeUndo, organizeSnapshot, setNodes]);

  const handleClearAll = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
  }, [setEdges, setNodes]);

  const handleExportFlow = useCallback(() => {
    const payload = JSON.stringify({ nodes, edges, viewport }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "studyflow-trilha.json";
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }, [edges, nodes, viewport]);

  const handleSave = useCallback(async () => {
    try {
      await saveFlow();
      setStorageError(null);
    } catch (error) {
      setStorageError(
        error instanceof Error ? error.message : "Nao foi possivel salvar o fluxo.",
      );
    }
  }, [saveFlow]);

  const handleLoad = useCallback(async () => {
    try {
      await loadFlow();
      setStorageError(null);
    } catch (error) {
      setStorageError(
        error instanceof Error
          ? error.message
          : "Nao foi possivel recarregar o fluxo.",
      );
    }
  }, [loadFlow]);

  const handleImportFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      try {
        const raw = await file.text();
        await importFlow(raw);
        setStorageError(null);
      } catch (error) {
        setStorageError(
          error instanceof Error
            ? error.message
            : "Nao foi possivel importar a trilha selecionada.",
        );
      }
    },
    [importFlow],
  );

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top,#f7f1e4_0%,#f0eadf_38%,#ece8de_100%)]">
      <WelcomeModal />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between px-5 py-4 md:bottom-auto md:top-0 md:items-start md:py-5 md:px-8">
        <div className="pointer-events-auto flex items-center gap-3">
          <span className="inline-flex rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#52675c] backdrop-blur">
            StudyFlow
          </span>
          <HelpButton onClick={() => setIsHelpOpen(true)} />
        </div>
        <div className="pointer-events-auto flex items-start gap-3">
          <FlowAlerts
            hasConnectionErrors={hasConnectionErrors}
            invalidNodeCount={invalidNodeIds.size}
            storageError={storageError}
            autoSaveError={autoSaveError}
            isAutoSaved={isAutoSaved}
          />
        </div>
      </div>

      {nodes.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-20">
          <div className="absolute bottom-24 left-3 pointer-events-auto sm:bottom-44">
            <ClearAllPanel onClearAll={handleClearAll} />
          </div>
        </div>
      )}

      {isOrganizeConfirmOpen && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-start justify-center px-4 pt-22 sm:pt-24">
          <div className="pointer-events-auto max-w-xl rounded-[28px] border border-[#e4d9c4] bg-[#fffaf1]/96 p-4 shadow-[0_24px_60px_rgba(23,49,38,0.14)] backdrop-blur sm:p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6b37]">
              Confirmar organização
            </div>
            <p className="mt-2 text-sm leading-6 text-[#5d4c2f]">
              A estrutura atual será remodelada para reorganizar os tópicos e tarefas no
              canvas. Você poderá reverter para a estrutura anterior por 15 segundos.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOrganizeConfirmOpen(false)}
                className="border-[#d9d5cc] bg-white text-[#5f6863] hover:bg-[#f7f4ef]"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleOrganize}
                className="bg-[#8a6b37] text-white hover:bg-[#765a2d]"
              >
                Organizar agora
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center px-4 py-3">
        <div className="px-3 py-1 text-[10px] font-medium tracking-[0.14em] text-[#5e7066]/58 sm:text-[11px]">
          © 2026 StudyFlow. Todos os direitos reservados.
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
            className="!hidden !bg-white/90 !backdrop-blur sm:!flex"
          />
          <FlowToolbar
            canCreateTask={nodes.length > 0}
            onSave={() => void handleSave()}
            onLoad={() => void handleLoad()}
            onExport={handleExportFlow}
            onImport={handleImportFile}
            onOrganize={() => setIsOrganizeConfirmOpen(true)}
            canRevertOrganize={Boolean(organizeSnapshot)}
            onRevertOrganize={handleRevertOrganize}
            organizeUndoSecondsLeft={organizeUndoSecondsLeft}
            onCreateTopicNode={handleCreateStandaloneTopicNode}
            onCreateTaskNode={handleCreateStandaloneTaskNode}
          />
        </ReactFlow>
      </PathwayNodeActionsProvider>

      <NodeSidebar
        selectedNode={selectedNode}
        visibleTasks={visibleTasks}
        onClose={() => setSelectedNodeId(null)}
        onTitleChange={handleSelectedNodeTitleChange}
        onDescriptionChange={handleDescriptionChange}
        onDelete={handleDeleteSelectedNode}
        onAddTask={handleAddTaskNode}
        onAddChild={(taskId, side) => handleAddTaskNode(side, taskId)}
        onTaskTitleChange={handleTaskTitleChange}
        onTaskToggle={handleTaskToggle}
        onRemoveTask={handleTaskRemove}
      />

      <HelpPanel open={isHelpOpen} onOpenChange={setIsHelpOpen} />
    </div>
  );
};
