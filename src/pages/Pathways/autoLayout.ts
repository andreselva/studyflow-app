import type { Edge } from "@xyflow/react";
import type { StudyNode, StudyTask } from "@/types/pathway";

const TASK_H_OFFSET = 250;
const TASK_V_GAP = 100;
const BRANCH_EXTRA_GAP = 40;
const CHILD_H_INDENT = 35;
const TOPIC_V_MARGIN = 80;
const CHAIN_H_MARGIN = 100;
const MIN_HALF_HEIGHT = 50;

function taskSubtreeHeight(task: StudyTask): number {
  if (task.children.length === 0) return TASK_V_GAP;
  const childrenHeight = task.children.reduce((sum, child) => sum + taskSubtreeHeight(child), 0);
  return TASK_V_GAP + childrenHeight + BRANCH_EXTRA_GAP;
}

function taskSideHeight(tasks: StudyTask[], side: string): number {
  return tasks
    .filter((t) => t.side === side)
    .reduce((sum, t) => sum + taskSubtreeHeight(t), 0);
}

function topicHalfHeight(topicNode: StudyNode): number {
  const lh = taskSideHeight(topicNode.data.tasks, "left") / 2;
  const rh = taskSideHeight(topicNode.data.tasks, "right") / 2;
  return Math.max(lh, rh, MIN_HALF_HEIGHT);
}

function layoutTask(
  task: StudyTask,
  x: number,
  y: number,
  direction: 1 | -1,
  positions: Map<string, { x: number; y: number }>,
): number {
  if (task.nodeId) {
    positions.set(task.nodeId, { x, y });
  }
  if (task.children.length === 0) return TASK_V_GAP;
  const childX = x + direction * CHILD_H_INDENT;
  let childY = y + TASK_V_GAP;
  for (const child of task.children) {
    childY += layoutTask(child, childX, childY, direction, positions);
  }
  return childY - y + BRANCH_EXTRA_GAP;
}

function layoutTopicTasks(
  topicNode: StudyNode,
  topicX: number,
  topicY: number,
  positions: Map<string, { x: number; y: number }>,
) {
  const { tasks } = topicNode.data;

  const leftHeight = taskSideHeight(tasks, "left");
  let leftY = topicY - leftHeight / 2;
  for (const task of tasks.filter((t) => t.side === "left")) {
    leftY += layoutTask(task, topicX - TASK_H_OFFSET, leftY, -1, positions);
  }

  const rightHeight = taskSideHeight(tasks, "right");
  let rightY = topicY - rightHeight / 2;
  for (const task of tasks.filter((t) => t.side === "right")) {
    rightY += layoutTask(task, topicX + TASK_H_OFFSET, rightY, 1, positions);
  }
}

export function autoLayout(nodes: StudyNode[], edges: Edge[]): StudyNode[] {
  const topicNodes = nodes.filter((n) => n.data.kind === "topic");
  if (topicNodes.length === 0) return nodes;

  const topicIdSet = new Set(topicNodes.map((n) => n.id));

  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  topicNodes.forEach((n) => {
    adj.set(n.id, []);
    inDegree.set(n.id, 0);
  });
  edges.forEach((e) => {
    if (topicIdSet.has(e.source) && topicIdSet.has(e.target)) {
      adj.get(e.source)!.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
    }
  });

  const visited = new Set<string>();
  const chains: string[][] = [];

  for (const node of topicNodes) {
    if (visited.has(node.id) || (inDegree.get(node.id) ?? 0) > 0) continue;
    const chain: string[] = [];
    const queue: string[] = [node.id];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      chain.push(id);
      (adj.get(id) ?? []).forEach((next) => queue.push(next));
    }
    chains.push(chain);
  }

  topicNodes.forEach((n) => {
    if (!visited.has(n.id)) {
      visited.add(n.id);
      chains.push([n.id]);
    }
  });

  const positions = new Map<string, { x: number; y: number }>();
  let chainX = 0;

  for (const chain of chains) {
    const hasLeftTasks = chain.some((id) => {
      const tn = topicNodes.find((n) => n.id === id)!;
      return tn.data.tasks.some((t) => t.side === "left");
    });

    const topicX = chainX + (hasLeftTasks ? TASK_H_OFFSET : 0);

    const firstTn = topicNodes.find((n) => n.id === chain[0])!;
    let topicY = topicHalfHeight(firstTn);

    for (let i = 0; i < chain.length; i++) {
      const tn = topicNodes.find((n) => n.id === chain[i])!;
      positions.set(chain[i], { x: topicX, y: topicY });
      layoutTopicTasks(tn, topicX, topicY, positions);

      if (i < chain.length - 1) {
        const nextTn = topicNodes.find((n) => n.id === chain[i + 1])!;
        topicY += topicHalfHeight(tn) + TOPIC_V_MARGIN + topicHalfHeight(nextTn);
      }
    }

    chainX = topicX + TASK_H_OFFSET + CHAIN_H_MARGIN;
  }

  return nodes.map((node) => {
    const pos = positions.get(node.id);
    return pos ? { ...node, position: pos } : node;
  });
}
