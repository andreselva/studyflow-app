import { useCallback, useState, type ChangeEvent } from "react";
import type { Edge, Viewport } from "@xyflow/react";
import type { StudyNode } from "@/types/pathway";

type UsePathwaysFileActionsParams = {
  nodes: StudyNode[];
  edges: Edge[];
  viewport: Viewport;
  saveFlow: () => Promise<void>;
  loadFlow: () => Promise<void>;
  importFlow: (raw: string) => Promise<void>;
};

export function usePathwaysFileActions({
  nodes,
  edges,
  viewport,
  saveFlow,
  loadFlow,
  importFlow,
}: UsePathwaysFileActionsParams) {
  const [storageError, setStorageError] = useState<string | null>(null);

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

  return {
    storageError,
    handleExportFlow,
    handleImportFile,
    handleLoad,
    handleSave,
  };
}
