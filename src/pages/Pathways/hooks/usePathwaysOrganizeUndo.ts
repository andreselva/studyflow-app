import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { Edge } from "@xyflow/react";
import type { StudyNode } from "@/types/pathway";
import { autoLayout } from "../autoLayout";

type UsePathwaysOrganizeUndoParams = {
  nodes: StudyNode[];
  edges: Edge[];
  setNodes: Dispatch<SetStateAction<StudyNode[]>>;
};

export function usePathwaysOrganizeUndo({
  nodes,
  edges,
  setNodes,
}: UsePathwaysOrganizeUndoParams) {
  const [isOrganizeConfirmOpen, setIsOrganizeConfirmOpen] = useState(false);
  const [organizeUndoSecondsLeft, setOrganizeUndoSecondsLeft] = useState(0);
  const [organizeSnapshot, setOrganizeSnapshot] = useState<Map<string, StudyNode["position"]> | null>(
    null,
  );
  const organizeUndoTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const organizeUndoIntervalRef = useRef<ReturnType<typeof window.setInterval> | null>(null);

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

  const handleConfirmOrganize = useCallback(() => {
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

  return {
    canRevertOrganize: Boolean(organizeSnapshot),
    handleConfirmOrganize,
    handleRevertOrganize,
    isOrganizeConfirmOpen,
    openOrganizeConfirm: () => setIsOrganizeConfirmOpen(true),
    organizeUndoSecondsLeft,
    closeOrganizeConfirm: () => setIsOrganizeConfirmOpen(false),
  };
}
