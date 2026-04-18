import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePathwaysHook } from "./usePathwaysHook";
import type { StudyEdge, StudyNode } from "@/types/pathway";

const FLOW_STORAGE_KEY = "studyflow:flow";
const FLOW_STORAGE_UPDATED_AT_KEY = "studyflow:flow-updated-at";
const FLOW_AUTOSAVE_STORAGE_KEY = "studyflow:flow-autosave";
const FLOW_AUTOSAVE_UPDATED_AT_KEY = "studyflow:flow-autosave-updated-at";

const buildNode = (id: string): StudyNode => ({
  id,
  type: "circle",
  position: { x: 100, y: 80 },
  data: {
    kind: "topic",
    title: `Node ${id}`,
    description: "",
    tasks: [],
    progress: 0,
    completedTasks: 0,
    totalTasks: 0,
  },
});

const buildEdge = (source: string, target: string): StudyEdge => ({
  id: `edge-${source}-${target}`,
  source,
  target,
});

describe("usePathwaysHook", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useRealTimers();
  });

  it("salva o fluxo no localStorage e limpa alteracoes pendentes", async () => {
    const { result } = renderHook(() => usePathwaysHook());
    const nodes = [buildNode("n-1")];
    const edges = [buildEdge("n-1", "n-2")];
    const viewport = { x: 40, y: 10, zoom: 1.2 };

    await waitFor(() => {
      expect(result.current.nodes).toEqual([]);
    });

    act(() => {
      result.current.setNodes(nodes);
      result.current.setEdges(edges);
      result.current.setViewport(viewport);
    });

    await waitFor(() => {
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    await act(async () => {
      await result.current.saveFlow();
    });

    const payload = JSON.parse(window.localStorage.getItem(FLOW_STORAGE_KEY) ?? "{}");

    expect(payload.nodes).toEqual(nodes);
    expect(payload.edges).toEqual(edges);
    expect(payload.viewport).toEqual(viewport);
    expect(window.localStorage.getItem(FLOW_STORAGE_UPDATED_AT_KEY)).toBeTruthy();
    expect(window.localStorage.getItem(FLOW_AUTOSAVE_STORAGE_KEY)).toBeTruthy();
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.autoSaveError).toBeNull();
  });

  it("importa fluxo valido e rejeita payload invalido", async () => {
    const { result } = renderHook(() => usePathwaysHook());

    await waitFor(() => {
      expect(result.current.nodes).toEqual([]);
    });

    const rawPayload = JSON.stringify({
      nodes: [
        {
          id: "topic-1",
          type: "circle",
          position: { x: 0, y: 0 },
          data: {
            kind: "topic",
            title: "Topico",
            description: "",
            tasks: [],
          },
        },
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    });

    await act(async () => {
      await result.current.importFlow(rawPayload);
    });

    expect(result.current.nodes).toHaveLength(1);
    expect(result.current.nodes[0].data.title).toBe("Topico");
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(window.localStorage.getItem(FLOW_STORAGE_KEY)).toContain("Topico");

    await expect(
      result.current.importFlow(
        JSON.stringify({
          nodes: [{ id: "", type: "triangle", position: {}, data: {} }],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
        }),
      ),
    ).rejects.toThrow();
  });

  it("prefere o autosave mais recente ao recarregar", async () => {
    const manualPayload = JSON.stringify({
      nodes: [buildNode("manual")],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    });
    const autosavePayload = JSON.stringify({
      nodes: [buildNode("autosave")],
      edges: [],
      viewport: { x: 20, y: 30, zoom: 1.4 },
    });

    window.localStorage.setItem(FLOW_STORAGE_KEY, manualPayload);
    window.localStorage.setItem(FLOW_STORAGE_UPDATED_AT_KEY, "100");
    window.localStorage.setItem(FLOW_AUTOSAVE_STORAGE_KEY, autosavePayload);
    window.localStorage.setItem(FLOW_AUTOSAVE_UPDATED_AT_KEY, "200");

    const { result } = renderHook(() => usePathwaysHook());

    await waitFor(() => {
      expect(result.current.nodes[0]?.id).toBe("autosave");
    });

    expect(result.current.viewport).toEqual({ x: 20, y: 30, zoom: 1.4 });
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it("executa autosave periodico quando ha alteracoes", async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => usePathwaysHook());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    act(() => {
      result.current.setNodes([buildNode("draft")]);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.hasUnsavedChanges).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000);
    });

    const payload = JSON.parse(window.localStorage.getItem(FLOW_AUTOSAVE_STORAGE_KEY) ?? "{}");

    expect(payload.nodes[0].id).toBe("draft");
    expect(window.localStorage.getItem(FLOW_AUTOSAVE_UPDATED_AT_KEY)).toBeTruthy();
    expect(result.current.autoSaveError).toBeNull();
  });
});
