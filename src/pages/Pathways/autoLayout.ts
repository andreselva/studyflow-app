import type { Edge } from "@xyflow/react";
import type { StudyNode, StudyTask } from "@/types/pathway";

const TASK_H_OFFSET = 250;
const TASK_V_GAP = 90;
const TOPIC_V_MARGIN = 80;
const CHAIN_H_MARGIN = 100;
const MIN_HALF_HEIGHT = 50;

function taskSubtreeHeight(task: StudyTask): number {
  return TASK_V_GAP + task.children.reduce((sum, child) => sum + taskSubtreeHeight(child), 0);
}

function taskSideHeight(tasks: StudyTask[], side: string): number {
  return tasks
    .filter((t) => t.side === side)
    .reduce((sum, t) => sum + taskSubtreeHeight(t), 0);
}

// Half the vertical span a topic node occupies (tasks are centered on topicY)
function topicHalfHeight(topicNode: StudyNode): number {
  const lh = taskSideHeight(topicNode.data.tasks, "left") / 2;
  const rh = taskSideHeight(topicNode.data.tasks, "right") / 2;
  return Math.max(lh, rh, MIN_HALF_HEIGHT);
}

// Place task at (x, y); children go below at the same x.
// Returns total vertical space consumed.
function layoutTask(
  task: StudyTask,
  x: number,
  y: number,
  positions: Map<string, { x: number; y: number }>,
): number {
  if (task.nodeId) {
    positions.set(task.nodeId, { x, y });
  }
  let childY = y + TASK_V_GAP;
  for (const child of task.children) {
    childY += layoutTask(child, x, childY, positions);
  }
  return childY - y;
}

// Tasks are vertically centered around topicY so branches feel balanced
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
    leftY += layoutTask(task, topicX - TASK_H_OFFSET, leftY, positions);
  }

  const rightHeight = taskSideHeight(tasks, "right");
  let rightY = topicY - rightHeight / 2;
  for (const task of tasks.filter((t) => t.side === "right")) {
    rightY += layoutTask(task, topicX + TASK_H_OFFSET, rightY, positions);
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

    // First topic starts at its own half-height so tasks don't go into negative Y
    const firstTn = topicNodes.find((n) => n.id === chain[0])!;
    let topicY = topicHalfHeight(firstTn);

    for (let i = 0; i < chain.length; i++) {
      const tn = topicNodes.find((n) => n.id === chain[i])!;
      positions.set(chain[i], { x: topicX, y: topicY });
      layoutTopicTasks(tn, topicX, topicY, positions);

      if (i < chain.length - 1) {
        const nextTn = topicNodes.find((n) => n.id === chain[i + 1])!;
        // Gap = bottom half of current + margin + top half of next
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
