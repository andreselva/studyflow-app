import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NODE_TITLE_MAX_LENGTH } from "@/lib/node-title";
import type { StudyTask, TaskSide } from "@/types/pathway";

type TaskTreeEditorProps = {
  tasks: StudyTask[];
  onAddTask: (side: TaskSide) => void;
  onAddChild: (taskId: string, side: TaskSide) => void;
  onTitleChange: (taskId: string, title: string) => void;
  onToggleDone: (taskId: string, done: boolean) => void;
  onRemoveTask: (taskId: string) => void;
};

function TaskItem({
  task,
  depth = 0,
  onAddChild,
  onTitleChange,
  onToggleDone,
  onRemoveTask,
}: {
  task: StudyTask;
  depth?: number;
  onAddChild: (taskId: string, side: TaskSide) => void;
  onTitleChange: (taskId: string, title: string) => void;
  onToggleDone: (taskId: string, done: boolean) => void;
  onRemoveTask: (taskId: string) => void;
}) {
  const branchSide = task.side ?? "right";
  const sideLabel = branchSide === "left" ? "Esq." : "Dir.";

  return (
    <div
      className="space-y-3 rounded-2xl border border-[#d9e5dc] bg-white/80 p-4"
      style={{ marginLeft: depth > 0 ? 16 : 0 }}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={task.done}
          onCheckedChange={(checked) => onToggleDone(task.id, checked)}
        />
        <Input
          value={task.title}
          onChange={(event) => onTitleChange(task.id, event.target.value)}
          maxLength={NODE_TITLE_MAX_LENGTH}
          placeholder="Descreva a tarefa"
          className="min-w-0 flex-1 border-none bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          onClick={() => onRemoveTask(task.id)}
          className="text-[#6c7b72] hover:bg-[#eef5f0] hover:text-[#173126]"
          aria-label="Remover tarefa"
        >
          <Trash2 />
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.18em] text-[#8b9a91]">
          subtarefas
        </span>
        <Button
          type="button"
          size="xs"
          variant="outline"
          onClick={() => onAddChild(task.id, branchSide)}
          className="border-[#d9e5dc] bg-white text-[#365949] hover:bg-[#f5fbf7]"
        >
          <Plus />
          {`Sub ${sideLabel}`}
        </Button>
      </div>

      {task.children.length > 0 ? (
        <div className="space-y-3">
          {task.children.map((child) => (
            <TaskItem
              key={child.id}
              task={child}
              depth={depth + 1}
              onAddChild={onAddChild}
              onTitleChange={onTitleChange}
              onToggleDone={onToggleDone}
              onRemoveTask={onRemoveTask}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#8b9a91]">
          Nenhuma subtarefa. Adicione conforme a trilha evolui.
        </p>
      )}
    </div>
  );
}

export function TaskTreeEditor({
  tasks,
  onAddTask,
  onAddChild,
  onTitleChange,
  onToggleDone,
  onRemoveTask,
}: TaskTreeEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#173126]">Tarefas</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => onAddTask("left")}
            className="bg-[#365949] text-white hover:bg-[#28473a]"
          >
            <Plus />
            Tarefa Esq.
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onAddTask("right")}
            className="bg-[#365949] text-white hover:bg-[#28473a]"
          >
            <Plus />
            Tarefa Dir.
          </Button>
        </div>
      </div>

      {tasks.length > 0 ? (
        tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onAddChild={onAddChild}
            onTitleChange={onTitleChange}
            onToggleDone={onToggleDone}
            onRemoveTask={onRemoveTask}
          />
        ))
      ) : (
        <div className="rounded-2xl border border-dashed border-[#c8d9cd] bg-[#f8fbf8] p-5 text-sm text-[#7b8b82]">
          Nenhuma tarefa associada. Crie a primeira para acompanhar o progresso.
        </div>
      )}
    </div>
  );
}
