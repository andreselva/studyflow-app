import { useCallback, useEffect, useState } from "react";
import type { Viewport } from "@xyflow/react";
import { normalizeNodeTitle } from "@/lib/node-title";
import type { StudyEdge, StudyNode, StudyNodeData, StudyTask } from "@/types/pathway";

const defaultViewport: Viewport = { x: 0, y: 0, zoom: 1 };
const FLOW_STORAGE_KEY = "studyflow:flow";
const FLOW_STORAGE_MAX_BYTES = 2 * 1024 * 1024;

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

const enrichNodeData = (data?: Partial<StudyNodeData>): StudyNodeData => {
  const tasks = data?.tasks ?? [];
  const { completed, total } = countTaskStats(tasks);
  const isTaskNode = data?.kind === "task";
  const totalTasks = isTaskNode ? total + 1 : total;
  const completedTasks = isTaskNode
    ? completed + (data?.done ? 1 : 0)
    : completed;

  return {
    kind: data?.kind ?? "topic",
    title: normalizeNodeTitle(data?.title ?? data?.description ?? "Novo assunto"),
    description: data?.description ?? "",
    tasks,
    done: data?.done ?? false,
    progress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    completedTasks,
    totalTasks,
  };
};

const defaultFlow = (): { nodes: StudyNode[]; edges: StudyEdge[]; viewport: Viewport } => ({
  nodes: [],
  edges: [],
  viewport: defaultViewport,
});

const measureBytes = (value: string) => new TextEncoder().encode(value).length;

const persistFlowPayload = (payload: string) => {
  const payloadSize = measureBytes(payload);

  if (payloadSize > FLOW_STORAGE_MAX_BYTES) {
    throw new Error(
      `Fluxo excede o limite de armazenamento local (${Math.round(
        FLOW_STORAGE_MAX_BYTES / 1024,
      )} KB).`,
    );
  }

  window.localStorage.setItem(FLOW_STORAGE_KEY, payload);
};

const normalizeNodes = (rawNodes: unknown[]): StudyNode[] =>
  rawNodes.map((rawNode, index) => {
    const node = rawNode as Partial<StudyNode> & {
      data?: { label?: string } & Partial<StudyNodeData>;
    };
    const title = node.data?.title ?? node.data?.label ?? `Assunto ${index + 1}`;

    return {
      id: node.id ?? crypto.randomUUID(),
      type: node.type === "task" ? "task" : "circle",
      position: node.position ?? { x: index * 220, y: index * 140 },
      data: enrichNodeData({
        kind: node.type === "task" ? "task" : "topic",
        rootNodeId: node.data?.rootNodeId,
        parentNodeId: node.data?.parentNodeId,
        side: node.data?.side,
        title,
        description: node.data?.description ?? "",
        tasks: node.data?.tasks ?? [],
        done: node.data?.done ?? false,
      }),
    };
  });

const normalizeFlowPayload = (data: unknown): {
  nodes: StudyNode[];
  edges: StudyEdge[];
  viewport: Viewport;
} => {
  const typedData = (data ?? {}) as {
    nodes?: unknown[];
    edges?: StudyEdge[];
    viewport?: Partial<Viewport>;
  };

  return {
    nodes: Array.isArray(typedData.nodes) ? normalizeNodes(typedData.nodes) : [],
    edges: Array.isArray(typedData.edges) ? typedData.edges : [],
    viewport:
      typeof typedData.viewport?.x === "number" &&
      typeof typedData.viewport?.y === "number" &&
      typeof typedData.viewport?.zoom === "number"
        ? (typedData.viewport as Viewport)
        : defaultViewport,
  };
};

export const usePathwaysHook = () => {
  const [nodes, setNodes] = useState<StudyNode[]>([]);
  const [edges, setEdges] = useState<StudyEdge[]>([]);
  const [viewport, setViewport] = useState<Viewport>(defaultViewport);

  const loadFlow = useCallback(async () => {
    try {
      const raw = window.localStorage.getItem(FLOW_STORAGE_KEY);
      if (!raw) {
        const fallback = defaultFlow();
        setNodes(fallback.nodes);
        setEdges(fallback.edges);
        setViewport(fallback.viewport);
        return;
      }

      const data = JSON.parse(raw);
      const {
        nodes: nextNodes,
        edges: nextEdges,
        viewport: nextViewport,
      } = normalizeFlowPayload(data);

      if (nextNodes.length === 0) {
        const fallback = defaultFlow();
        setNodes(fallback.nodes);
        setEdges(fallback.edges);
        setViewport(fallback.viewport);
        return;
      }

      setNodes(nextNodes);
      setEdges(nextEdges);
      setViewport(nextViewport);
    } catch {
      const fallback = defaultFlow();
      setNodes(fallback.nodes);
      setEdges(fallback.edges);
      setViewport(fallback.viewport);
    }
  }, []);

  const saveFlow = useCallback(async () => {
    const payload = JSON.stringify({ nodes, edges, viewport });
    persistFlowPayload(payload);
  }, [edges, nodes, viewport]);

  const importFlow = useCallback(async (raw: string) => {
    const data = JSON.parse(raw);
    const normalized = normalizeFlowPayload(data);
    const payload = JSON.stringify(normalized);

    persistFlowPayload(payload);

    setNodes(normalized.nodes);
    setEdges(normalized.edges);
    setViewport(normalized.viewport);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadFlow();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadFlow]);

  return {
    nodes,
    edges,
    viewport,
    setNodes,
    setEdges,
    setViewport,
    saveFlow,
    loadFlow,
    importFlow,
  };
};
