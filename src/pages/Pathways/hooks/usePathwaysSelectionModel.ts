import { useMemo } from "react";
import type { StudyNode } from "@/types/pathway";
import { findTaskByNodeId } from "../pathwayUtils";

type UsePathwaysSelectionModelParams = {
  nodes: StudyNode[];
  edges: { source: string; target: string }[];
  selectedNodeId: string | null;
};

export function usePathwaysSelectionModel({
  nodes,
  edges,
  selectedNodeId,
}: UsePathwaysSelectionModelParams) {
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

  return {
    hasConnectionErrors,
    invalidNodeIds,
    nodesForCanvas,
    selectedNode,
    selectedRootNode,
    selectedTaskEntry,
    visibleTasks,
  };
}
