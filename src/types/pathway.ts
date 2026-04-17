import type { Edge, Node } from "@xyflow/react";

export type TaskSide = "left" | "right";

export type StudyTask = {
  id: string;
  nodeId?: string;
  side?: TaskSide;
  title: string;
  done: boolean;
  children: StudyTask[];
};

export type StudyNodeData = {
  kind?: "topic" | "task";
  rootNodeId?: string;
  parentNodeId?: string;
  side?: TaskSide;
  title: string;
  description: string;
  tasks: StudyTask[];
  done?: boolean;
  progress?: number;
  completedTasks?: number;
  totalTasks?: number;
};

export type StudyNode = Node<StudyNodeData>;
export type StudyEdge = Edge;
