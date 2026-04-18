import { useCallback } from "react";
import { usePathwaysHook } from "../hooks/usePathwaysHook";
import { normalizeNodeTitle } from "@/lib/node-title";
import type { StudyNodeData, StudyTask } from "@/types/pathway";

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

const buildNodeData = (
  title: string,
  description = "",
  tasks: StudyTask[] = [],
): StudyNodeData => {
  const { completed, total } = countTaskStats(tasks);

  return {
    title,
    description,
    tasks,
    progress: total > 0 ? (completed / total) * 100 : 0,
    completedTasks: completed,
    totalTasks: total,
  };
};

export const usePathwayHandler = () => {
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
  } =
    usePathwaysHook();

  const addNode = useCallback(() => {
    const title = normalizeNodeTitle(prompt("Nome do assunto:") ?? "");
    if (!title) return;

    const newNode = {
      id: crypto.randomUUID(),
      type: "circle",
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: buildNodeData(title),
    };

    setNodes((prev) => [...prev, newNode]);
  }, [setNodes]);

  return {
    addNode,
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
