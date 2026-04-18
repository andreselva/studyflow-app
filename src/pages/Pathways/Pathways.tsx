import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
} from "@xyflow/react";
import { useCallback, useEffect, useState } from "react";
import "@xyflow/react/dist/style.css";
import { usePathwayHandler } from "../../handlers/usePathwaysHandler";
import { nodeTypes } from "../../types/nodeTypes";
import { edgeTypes } from "../../types/edgeTypes";
import { PathwayNodeActionsProvider } from "@/components/pathways/PathwayNodeActionsProvider";
import { WelcomeModal } from "./WelcomeModal";
import { ClearAllPanel } from "./ClearAllPanel";
import { NodeSidebar } from "./NodeSidebar";
import { HelpPanel } from "./HelpPanel";
import { buildStandaloneTaskNode, buildStandaloneTopicNode } from "./pathwayUtils";
import { usePathwaysSelectionModel } from "./hooks/usePathwaysSelectionModel";
import { usePathwaysTaskTreeController } from "./hooks/usePathwaysTaskTreeController";
import { usePathwaysGraphInteractions } from "./hooks/usePathwaysGraphInteractions";
import { usePathwaysOrganizeUndo } from "./hooks/usePathwaysOrganizeUndo";
import { usePathwaysFileActions } from "./hooks/usePathwaysFileActions";
import { PathwaysHeader } from "./components/PathwaysHeader";
import { OrganizeConfirmAlert } from "./components/OrganizeConfirmAlert";
import { FlowToolbar } from "./FlowToolbar";

export const Pathways = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
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

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const {
    hasConnectionErrors,
    invalidNodeIds,
    nodesForCanvas,
    selectedNode,
    selectedRootNode,
    visibleTasks,
  } = usePathwaysSelectionModel({
    nodes,
    edges,
    selectedNodeId,
  });

  const {
    handleExportFlow,
    handleImportFile,
    handleLoad,
    handleSave,
    storageError,
  } = usePathwaysFileActions({
    nodes,
    edges,
    viewport,
    saveFlow,
    loadFlow,
    importFlow,
  });

  const {
    canRevertOrganize,
    closeOrganizeConfirm,
    handleConfirmOrganize,
    handleRevertOrganize,
    isOrganizeConfirmOpen,
    openOrganizeConfirm,
    organizeUndoSecondsLeft,
  } = usePathwaysOrganizeUndo({
    nodes,
    edges,
    setNodes,
  });

  const {
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
  } = usePathwaysTaskTreeController({
    nodes,
    selectedNode,
    selectedNodeId,
    selectedRootNode,
    setEdges,
    setNodes,
    setSelectedNodeId,
  });

  const { onConnect, onEdgesChange, onNodeClick, onNodesChange } =
    usePathwaysGraphInteractions({
      edges,
      nodes,
      setEdges,
      setNodes,
      setSelectedNodeId,
      commitTaskTree,
      syncNodeSubtree,
    });

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

  const handleClearAll = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
  }, [setEdges, setNodes]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top,#f7f1e4_0%,#f0eadf_38%,#ece8de_100%)]">
      <WelcomeModal />

      <PathwaysHeader
        autoSaveError={autoSaveError}
        hasConnectionErrors={hasConnectionErrors}
        invalidNodeCount={invalidNodeIds.size}
        isAutoSaved={isAutoSaved}
        onOpenHelp={() => setIsHelpOpen(true)}
        storageError={storageError}
      />

      {nodes.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-20">
          <div className="absolute bottom-24 left-3 pointer-events-auto sm:bottom-44">
            <ClearAllPanel onClearAll={handleClearAll} />
          </div>
        </div>
      )}

      <OrganizeConfirmAlert
        open={isOrganizeConfirmOpen}
        onCancel={closeOrganizeConfirm}
        onConfirm={handleConfirmOrganize}
      />

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
            onOrganize={openOrganizeConfirm}
            canRevertOrganize={canRevertOrganize}
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
