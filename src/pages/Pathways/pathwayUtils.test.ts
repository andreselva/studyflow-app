import { describe, expect, it } from "vitest";
import {
  buildStandaloneTopicNode,
  buildTaskNode,
  collectTaskNodeIds,
  createConnectedEdge,
  createTaskEntry,
  enrichNodeData,
  removeTaskTreeEntry,
} from "./pathwayUtils";
import type { StudyTask } from "@/types/pathway";

describe("pathwayUtils", () => {
  it("calcula progresso de topico e tarefa corretamente", () => {
    const tasks: StudyTask[] = [
      {
        id: "task-1",
        nodeId: "node-1",
        side: "left",
        title: "Revisar",
        done: true,
        children: [
          {
            id: "task-1-1",
            nodeId: "node-1-1",
            side: "right",
            title: "Exercicios",
            done: false,
            children: [],
          },
        ],
      },
    ];

    const topicData = enrichNodeData({
      kind: "topic",
      title: "Matematica",
      description: "",
      tasks,
    });
    const taskData = enrichNodeData({
      kind: "task",
      title: "Revisar",
      description: "",
      done: true,
      tasks: tasks[0].children,
    });

    expect(topicData.completedTasks).toBe(1);
    expect(topicData.totalTasks).toBe(2);
    expect(topicData.progress).toBe(50);
    expect(taskData.completedTasks).toBe(1);
    expect(taskData.totalTasks).toBe(2);
    expect(taskData.progress).toBe(50);
  });

  it("cria tópico standalone e tarefa conectada ao pai", () => {
    const rootNode = buildStandaloneTopicNode({ x: 120, y: 80 });
    const childNode = buildTaskNode(rootNode, 1, "left", rootNode.id);
    const childTask = createTaskEntry(childNode.id, "left");

    expect(rootNode.type).toBe("circle");
    expect(rootNode.data.kind).toBe("topic");
    expect(childNode.type).toBe("task");
    expect(childNode.data.rootNodeId).toBe(rootNode.id);
    expect(childNode.data.parentNodeId).toBe(rootNode.id);
    expect(childNode.position.x).toBeLessThan(rootNode.position.x);
    expect(childTask.nodeId).toBe(childNode.id);
    expect(childTask.side).toBe("left");
  });

  it("remove subtarefas em cascata e coleta ids do ramo", () => {
    const taskTree: StudyTask[] = [
      {
        id: "parent",
        nodeId: "node-parent",
        side: "left",
        title: "Pai",
        done: false,
        children: [
          {
            id: "child",
            nodeId: "node-child",
            side: "right",
            title: "Filho",
            done: false,
            children: [
              {
                id: "grandchild",
                nodeId: "node-grandchild",
                side: "left",
                title: "Neto",
                done: true,
                children: [],
              },
            ],
          },
        ],
      },
    ];

    const removedIds = collectTaskNodeIds(taskTree[0].children[0]);
    const { nextTasks, removedTask } = removeTaskTreeEntry(taskTree, "child");

    expect(removedIds).toEqual(["node-child", "node-grandchild"]);
    expect(removedTask?.id).toBe("child");
    expect(nextTasks[0].children).toHaveLength(0);
  });

  it("cria aresta customizada com handles corretos", () => {
    const edge = createConnectedEdge("source-1", "target-1", "task-left", "task-in");

    expect(edge.id).toBe("edge-source-1-task-left-target-1-task-in");
    expect(edge.type).toBe("custom");
    expect(edge.sourceHandle).toBe("task-left");
    expect(edge.targetHandle).toBe("task-in");
    expect(edge.markerEnd.color).toBe("#365949");
  });
});
