import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import type { Viewport } from "@xyflow/react";
import { normalizeNodeTitle } from "@/lib/node-title";
import type { StudyEdge, StudyNode, StudyNodeData, StudyTask } from "@/types/pathway";

const defaultViewport: Viewport = { x: 0, y: 0, zoom: 1 };

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

export const usePathwaysHook = () => {
  const [nodes, setNodes] = useState<StudyNode[]>([]);
  const [edges, setEdges] = useState<StudyEdge[]>([]);
  const [viewport, setViewport] = useState<Viewport>(defaultViewport);

  const loadFlow = useCallback(async () => {
    try {
      const { data } = await axios.get("http://localhost:3001/flow");
      const nextNodes = Array.isArray(data?.nodes) ? normalizeNodes(data.nodes) : [];
      const nextEdges = Array.isArray(data?.edges) ? data.edges : [];
      const nextViewport =
        typeof data?.viewport?.x === "number" &&
        typeof data?.viewport?.y === "number" &&
        typeof data?.viewport?.zoom === "number"
          ? data.viewport
          : defaultViewport;

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
    await axios.post("http://localhost:3001/flow", { nodes, edges, viewport });
  }, [edges, nodes, viewport]);

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
    loadFlow
  };
};
