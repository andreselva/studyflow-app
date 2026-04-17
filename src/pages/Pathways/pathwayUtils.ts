import type { StudyNode, StudyNodeData, StudyTask, TaskSide } from "@/types/pathway";
import { normalizeNodeTitle } from "@/lib/node-title";

export const countTaskStats = (
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

export const enrichNodeData = (data: StudyNodeData): StudyNodeData => {
  const { completed, total } = countTaskStats(data.tasks);
  const isTaskNode = data.kind === "task";
  const totalTasks = isTaskNode ? total + 1 : total;
  const completedTasks = isTaskNode ? completed + (data.done ? 1 : 0) : completed;
  return {
    ...data,
    progress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    completedTasks,
    totalTasks,
  };
};

export const sourceHandleIsTaskSide = (
  handle?: string | null,
): handle is "task-left" | "task-right" | "task-bottom" =>
  handle === "task-left" || handle === "task-right" || handle === "task-bottom";

export const createConnectedEdge = (
  source: string,
  target: string,
  sourceHandle?: string,
  targetHandle?: string,
) => ({
  id: `edge-${source}-${sourceHandle ?? "default"}-${target}-${targetHandle ?? "default"}`,
  source,
  target,
  sourceHandle,
  targetHandle,
  type: "custom" as const,
  markerEnd: {
    type: "arrowclosed" as const,
    width: 18,
    height: 18,
    color: "#365949",
  },
});

export const createTaskEntry = (nodeId: string, side: TaskSide): StudyTask => ({
  id: crypto.randomUUID(),
  nodeId,
  side,
  title: normalizeNodeTitle("Nova tarefa"),
  done: false,
  children: [],
});

export const addChildTask = (
  tasks: StudyTask[],
  parentTaskId: string,
  nextTask: StudyTask,
): StudyTask[] =>
  tasks.map((task) =>
    task.id === parentTaskId
      ? { ...task, children: [...task.children, nextTask] }
      : { ...task, children: addChildTask(task.children, parentTaskId, nextTask) },
  );

export const updateTaskTree = (
  tasks: StudyTask[],
  taskId: string,
  updater: (task: StudyTask) => StudyTask,
): StudyTask[] =>
  tasks.map((task) =>
    task.id === taskId
      ? updater(task)
      : { ...task, children: updateTaskTree(task.children, taskId, updater) },
  );

export const updateTaskTreeByNodeId = (
  tasks: StudyTask[],
  nodeId: string,
  updater: (task: StudyTask) => StudyTask,
): StudyTask[] =>
  tasks.map((task) =>
    task.nodeId === nodeId
      ? updater(task)
      : { ...task, children: updateTaskTreeByNodeId(task.children, nodeId, updater) },
  );

export const removeTaskTreeEntry = (
  tasks: StudyTask[],
  taskId: string,
): { nextTasks: StudyTask[]; removedTask: StudyTask | null } => {
  for (const task of tasks) {
    if (task.id === taskId) {
      return {
        nextTasks: tasks.filter((item) => item.id !== taskId),
        removedTask: task,
      };
    }
    const childResult = removeTaskTreeEntry(task.children, taskId);
    if (childResult.removedTask) {
      return {
        nextTasks: tasks.map((item) =>
          item.id === task.id ? { ...item, children: childResult.nextTasks } : item,
        ),
        removedTask: childResult.removedTask,
      };
    }
  }
  return { nextTasks: tasks, removedTask: null };
};

export const collectTaskNodeIds = (task: StudyTask): string[] => [
  ...(task.nodeId ? [task.nodeId] : []),
  ...task.children.flatMap(collectTaskNodeIds),
];

export const findTaskById = (tasks: StudyTask[], taskId: string): StudyTask | null => {
  for (const task of tasks) {
    if (task.id === taskId) return task;
    const nested = findTaskById(task.children, taskId);
    if (nested) return nested;
  }
  return null;
};

export const findTaskByNodeId = (tasks: StudyTask[], nodeId: string): StudyTask | null => {
  for (const task of tasks) {
    if (task.nodeId === nodeId) return task;
    const nested = findTaskByNodeId(task.children, nodeId);
    if (nested) return nested;
  }
  return null;
};

export const buildTaskNode = (
  parentNode: StudyNode,
  offsetIndex: number,
  side: TaskSide,
  rootNodeId: string,
): StudyNode => {
  const id = crypto.randomUUID();
  const direction = side === "left" ? -1 : 1;
  const horizontalOffset = parentNode.type === "task" ? 260 : 220;
  return {
    id,
    type: "task",
    position: {
      x: parentNode.position.x + direction * (horizontalOffset + (offsetIndex % 2) * 18),
      y: parentNode.position.y + 90 + offsetIndex * 86,
    },
    data: enrichNodeData({
      kind: "task",
      rootNodeId,
      parentNodeId: parentNode.id,
      side,
      title: normalizeNodeTitle("Nova tarefa"),
      description: "",
      done: false,
      tasks: [],
    }),
  };
};

export const buildStandaloneTopicNode = (position: {
  x: number;
  y: number;
}): StudyNode => ({
  id: crypto.randomUUID(),
  type: "circle",
  position,
  data: enrichNodeData({
    kind: "topic",
    title: normalizeNodeTitle("Novo nó"),
    description: "",
    tasks: [],
  }),
});

export const buildStandaloneTaskNode = (position: {
  x: number;
  y: number;
}): StudyNode => ({
  id: crypto.randomUUID(),
  type: "task",
  position,
  data: enrichNodeData({
    kind: "task",
    side: "right",
    title: normalizeNodeTitle("Nova tarefa"),
    description: "",
    done: false,
    tasks: [],
  }),
});
