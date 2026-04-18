import { useCallback, useEffect, useRef, useState } from "react";
import type { Viewport } from "@xyflow/react";
import { normalizeNodeTitle } from "@/lib/node-title";
import type { StudyEdge, StudyNode, StudyNodeData, StudyTask } from "@/types/pathway";

const defaultViewport: Viewport = { x: 0, y: 0, zoom: 1 };
const FLOW_STORAGE_KEY = "studyflow:flow";
const FLOW_STORAGE_UPDATED_AT_KEY = "studyflow:flow-updated-at";
const FLOW_AUTOSAVE_STORAGE_KEY = "studyflow:flow-autosave";
const FLOW_AUTOSAVE_UPDATED_AT_KEY = "studyflow:flow-autosave-updated-at";
const FLOW_STORAGE_MAX_BYTES = 2 * 1024 * 1024;
const FLOW_AUTOSAVE_INTERVAL_MS = 15000;

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
    rootNodeId: data?.rootNodeId,
    parentNodeId: data?.parentNodeId,
    side: data?.side,
    title: normalizeNodeTitle(data?.title ?? data?.description ?? "Novo tópico"),
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const validateTaskTree = (tasks: unknown, path: string) => {
  if (!Array.isArray(tasks)) {
    throw new Error(`${path} deve ser uma lista de tarefas.`);
  }

  tasks.forEach((task, index) => {
    if (!isRecord(task)) {
      throw new Error(`${path}[${index}] deve ser um objeto.`);
    }

    if (typeof task.id !== "string" || task.id.trim() === "") {
      throw new Error(`${path}[${index}].id deve ser uma string valida.`);
    }

    if (task.nodeId !== undefined && typeof task.nodeId !== "string") {
      throw new Error(`${path}[${index}].nodeId deve ser uma string.`);
    }

    if (
      task.side !== undefined &&
      task.side !== "left" &&
      task.side !== "right"
    ) {
      throw new Error(`${path}[${index}].side deve ser 'left' ou 'right'.`);
    }

    if (typeof task.title !== "string") {
      throw new Error(`${path}[${index}].title deve ser uma string.`);
    }

    if (typeof task.done !== "boolean") {
      throw new Error(`${path}[${index}].done deve ser boolean.`);
    }

    validateTaskTree(task.children, `${path}[${index}].children`);
  });
};

const validateFlowPayload = (data: unknown) => {
  if (!isRecord(data)) {
    throw new Error("O arquivo importado deve conter um objeto JSON.");
  }

  if (!Array.isArray(data.nodes)) {
    throw new Error("O arquivo importado deve conter 'nodes' como lista.");
  }

  if (!Array.isArray(data.edges)) {
    throw new Error("O arquivo importado deve conter 'edges' como lista.");
  }

  if (!isRecord(data.viewport)) {
    throw new Error("O arquivo importado deve conter 'viewport' como objeto.");
  }

  if (
    typeof data.viewport.x !== "number" ||
    typeof data.viewport.y !== "number" ||
    typeof data.viewport.zoom !== "number"
  ) {
    throw new Error("viewport deve conter x, y e zoom numericos.");
  }

  const nodeIds = new Set<string>();

  data.nodes.forEach((node, index) => {
    if (!isRecord(node)) {
      throw new Error(`nodes[${index}] deve ser um objeto.`);
    }

    if (typeof node.id !== "string" || node.id.trim() === "") {
      throw new Error(`nodes[${index}].id deve ser uma string valida.`);
    }

    if (nodeIds.has(node.id)) {
      throw new Error(`ID de tópico duplicado encontrado: ${node.id}.`);
    }
    nodeIds.add(node.id);

    if (node.type !== "circle" && node.type !== "task") {
      throw new Error(`nodes[${index}].type deve ser 'circle' ou 'task'.`);
    }

    if (!isRecord(node.position)) {
      throw new Error(`nodes[${index}].position deve ser um objeto.`);
    }

    if (
      typeof node.position.x !== "number" ||
      typeof node.position.y !== "number"
    ) {
      throw new Error(`nodes[${index}].position deve conter x e y numericos.`);
    }

    if (!isRecord(node.data)) {
      throw new Error(`nodes[${index}].data deve ser um objeto.`);
    }

    if (typeof node.data.title !== "string") {
      throw new Error(`nodes[${index}].data.title deve ser uma string.`);
    }

    if (typeof node.data.description !== "string") {
      throw new Error(`nodes[${index}].data.description deve ser uma string.`);
    }

    if (
      node.data.kind !== undefined &&
      node.data.kind !== "topic" &&
      node.data.kind !== "task"
    ) {
      throw new Error(`nodes[${index}].data.kind invalido.`);
    }

    if (
      node.data.rootNodeId !== undefined &&
      typeof node.data.rootNodeId !== "string"
    ) {
      throw new Error(`nodes[${index}].data.rootNodeId deve ser string.`);
    }

    if (
      node.data.parentNodeId !== undefined &&
      typeof node.data.parentNodeId !== "string"
    ) {
      throw new Error(`nodes[${index}].data.parentNodeId deve ser string.`);
    }

    if (
      node.data.side !== undefined &&
      node.data.side !== "left" &&
      node.data.side !== "right"
    ) {
      throw new Error(`nodes[${index}].data.side deve ser 'left' ou 'right'.`);
    }

    if (node.data.done !== undefined && typeof node.data.done !== "boolean") {
      throw new Error(`nodes[${index}].data.done deve ser boolean.`);
    }

    validateTaskTree(node.data.tasks, `nodes[${index}].data.tasks`);
  });

  data.edges.forEach((edge, index) => {
    if (!isRecord(edge)) {
      throw new Error(`edges[${index}] deve ser um objeto.`);
    }

    if (typeof edge.id !== "string" || edge.id.trim() === "") {
      throw new Error(`edges[${index}].id deve ser uma string valida.`);
    }

    if (typeof edge.source !== "string" || !nodeIds.has(edge.source)) {
      throw new Error(`edges[${index}].source referencia um tópico inválido.`);
    }

    if (typeof edge.target !== "string" || !nodeIds.has(edge.target)) {
      throw new Error(`edges[${index}].target referencia um tópico inválido.`);
    }
  });
};

const persistFlowPayload = (
  key: string,
  updatedAtKey: string,
  payload: string,
) => {
  const payloadSize = measureBytes(payload);

  if (payloadSize > FLOW_STORAGE_MAX_BYTES) {
    throw new Error(
      `Fluxo excede o limite de armazenamento local (${Math.round(
        FLOW_STORAGE_MAX_BYTES / 1024,
      )} KB).`,
    );
  }

  window.localStorage.setItem(key, payload);
  window.localStorage.setItem(updatedAtKey, String(Date.now()));
};

const readStoredFlowPayload = (key: string, updatedAtKey: string) => {
  const payload = window.localStorage.getItem(key);
  if (!payload) return null;

  const updatedAtRaw = window.localStorage.getItem(updatedAtKey);
  const updatedAt = updatedAtRaw ? Number(updatedAtRaw) : 0;

  return {
    payload,
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0,
    hasTimestamp: Boolean(updatedAtRaw),
  };
};

const normalizeNodes = (rawNodes: unknown[]): StudyNode[] =>
  rawNodes.map((rawNode, index) => {
    const node = rawNode as Partial<StudyNode> & {
      data?: { label?: string } & Partial<StudyNodeData>;
    };
    const title = node.data?.title ?? node.data?.label ?? `Tópico ${index + 1}`;

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);
  const [isAutoSaved, setIsAutoSaved] = useState(false);
  const manualSavedPayloadRef = useRef(JSON.stringify(defaultFlow()));
  const lastAutoSavedPayloadRef = useRef(JSON.stringify(defaultFlow()));
  const latestPayloadRef = useRef(JSON.stringify(defaultFlow()));
  const autoSavedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildPayload = useCallback(
    () => JSON.stringify({ nodes, edges, viewport }),
    [edges, nodes, viewport],
  );

  const loadFlow = useCallback(async () => {
    try {
      const savedPayload = readStoredFlowPayload(
        FLOW_STORAGE_KEY,
        FLOW_STORAGE_UPDATED_AT_KEY,
      );
      const autoSavedPayload = readStoredFlowPayload(
        FLOW_AUTOSAVE_STORAGE_KEY,
        FLOW_AUTOSAVE_UPDATED_AT_KEY,
      );
      const shouldUseAutoSavedPayload =
        Boolean(autoSavedPayload) &&
        (!savedPayload ||
          (savedPayload.hasTimestamp &&
            autoSavedPayload!.updatedAt >= savedPayload.updatedAt));
      const chosenPayload = shouldUseAutoSavedPayload
        ? autoSavedPayload?.payload
        : savedPayload?.payload;

      if (!chosenPayload) {
        const fallback = defaultFlow();
        setNodes(fallback.nodes);
        setEdges(fallback.edges);
        setViewport(fallback.viewport);
        manualSavedPayloadRef.current = JSON.stringify(fallback);
        lastAutoSavedPayloadRef.current = JSON.stringify(fallback);
        latestPayloadRef.current = JSON.stringify(fallback);
        setHasUnsavedChanges(false);
        setAutoSaveError(null);
        return;
      }

      const data = JSON.parse(chosenPayload);
      const {
        nodes: nextNodes,
        edges: nextEdges,
        viewport: nextViewport,
      } = normalizeFlowPayload(data);
      const normalizedPayload = JSON.stringify({
        nodes: nextNodes,
        edges: nextEdges,
        viewport: nextViewport,
      });

      if (nextNodes.length === 0) {
        const fallback = defaultFlow();
        setNodes(fallback.nodes);
        setEdges(fallback.edges);
        setViewport(fallback.viewport);
        manualSavedPayloadRef.current = JSON.stringify(fallback);
        lastAutoSavedPayloadRef.current = JSON.stringify(fallback);
        latestPayloadRef.current = JSON.stringify(fallback);
        setHasUnsavedChanges(false);
        setAutoSaveError(null);
        return;
      }

      setNodes(nextNodes);
      setEdges(nextEdges);
      setViewport(nextViewport);
      manualSavedPayloadRef.current = normalizedPayload;
      lastAutoSavedPayloadRef.current = normalizedPayload;
      latestPayloadRef.current = normalizedPayload;
      setHasUnsavedChanges(false);
      setAutoSaveError(null);
    } catch {
      const fallback = defaultFlow();
      setNodes(fallback.nodes);
      setEdges(fallback.edges);
      setViewport(fallback.viewport);
      manualSavedPayloadRef.current = JSON.stringify(fallback);
      lastAutoSavedPayloadRef.current = JSON.stringify(fallback);
      latestPayloadRef.current = JSON.stringify(fallback);
      setHasUnsavedChanges(false);
      setAutoSaveError(null);
    }
  }, []);

  const saveFlow = useCallback(async () => {
    const payload = buildPayload();
    persistFlowPayload(FLOW_STORAGE_KEY, FLOW_STORAGE_UPDATED_AT_KEY, payload);
    persistFlowPayload(
      FLOW_AUTOSAVE_STORAGE_KEY,
      FLOW_AUTOSAVE_UPDATED_AT_KEY,
      payload,
    );
    manualSavedPayloadRef.current = payload;
    lastAutoSavedPayloadRef.current = payload;
    latestPayloadRef.current = payload;
    setHasUnsavedChanges(false);
    setAutoSaveError(null);
  }, [buildPayload]);

  const importFlow = useCallback(async (raw: string) => {
    const data = JSON.parse(raw);
    validateFlowPayload(data);
    const normalized = normalizeFlowPayload(data);
    const payload = JSON.stringify(normalized);

    persistFlowPayload(FLOW_STORAGE_KEY, FLOW_STORAGE_UPDATED_AT_KEY, payload);
    persistFlowPayload(
      FLOW_AUTOSAVE_STORAGE_KEY,
      FLOW_AUTOSAVE_UPDATED_AT_KEY,
      payload,
    );

    setNodes(normalized.nodes);
    setEdges(normalized.edges);
    setViewport(normalized.viewport);
    manualSavedPayloadRef.current = payload;
    lastAutoSavedPayloadRef.current = payload;
    latestPayloadRef.current = payload;
    setHasUnsavedChanges(false);
    setAutoSaveError(null);
  }, []);

  useEffect(() => {
    const payload = buildPayload();
    latestPayloadRef.current = payload;
    setHasUnsavedChanges(payload !== manualSavedPayloadRef.current);
  }, [buildPayload]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const payload = latestPayloadRef.current;
      if (payload === lastAutoSavedPayloadRef.current) return;

      try {
        persistFlowPayload(
          FLOW_AUTOSAVE_STORAGE_KEY,
          FLOW_AUTOSAVE_UPDATED_AT_KEY,
          payload,
        );
        lastAutoSavedPayloadRef.current = payload;
        setAutoSaveError(null);
        setIsAutoSaved(true);
        if (autoSavedTimerRef.current) clearTimeout(autoSavedTimerRef.current);
        autoSavedTimerRef.current = setTimeout(() => setIsAutoSaved(false), 3000);
      } catch (error) {
        setAutoSaveError(
          error instanceof Error
            ? error.message
            : "Nao foi possivel salvar automaticamente a trilha.",
        );
      }
    }, FLOW_AUTOSAVE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
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
    hasUnsavedChanges,
    autoSaveError,
    isAutoSaved,
  };
};
