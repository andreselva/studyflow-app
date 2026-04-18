import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetCloseIcon,
  SheetContent,
  SheetHeader,
  SheetOverlay,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { NODE_TITLE_MAX_LENGTH } from "@/lib/node-title";
import type { StudyNode, StudyTask, TaskSide } from "@/types/pathway";
import { TaskTreeEditor } from "@/components/TaskTreeEditor";

type NodeSidebarProps = {
  selectedNode: StudyNode | null;
  visibleTasks: StudyTask[];
  onClose: () => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onDelete: () => void;
  onAddTask: (side: TaskSide) => void;
  onAddChild: (taskId: string, side: TaskSide) => void;
  onTaskTitleChange: (taskId: string, title: string) => void;
  onTaskToggle: (taskId: string, done: boolean) => void;
  onRemoveTask: (taskId: string) => void;
};

export const NodeSidebar = ({
  selectedNode,
  visibleTasks,
  onClose,
  onTitleChange,
  onDescriptionChange,
  onDelete,
  onAddTask,
  onAddChild,
  onTaskTitleChange,
  onTaskToggle,
  onRemoveTask,
}: NodeSidebarProps) => {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const handleClose = (open: boolean) => {
    if (!open) {
      setIsDeleteConfirmOpen(false);
      onClose();
    }
  };

  return (
    <Sheet open={Boolean(selectedNode)} onOpenChange={handleClose}>
      <SheetOverlay />
      {selectedNode && (
        <SheetContent>
          <SheetHeader>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7b8b82]">
                tópico selecionado
              </span>
              <SheetTitle>{selectedNode.data.title}</SheetTitle>
            </div>
            <SheetClose aria-label="Fechar painel lateral">
              <SheetCloseIcon />
            </SheetClose>
          </SheetHeader>

          <div className="mt-3 rounded-2xl border border-[#dde8e0] bg-white/85 p-3 sm:mt-6 sm:rounded-3xl sm:p-5">
            <div className="grid gap-3 sm:gap-5">
              <label className="grid gap-2">
                <Label htmlFor="node-title">Nome</Label>
                <Input
                  id="node-title"
                  value={selectedNode.data.title}
                  maxLength={NODE_TITLE_MAX_LENGTH}
                  onChange={(event) => onTitleChange(event.target.value)}
                />
              </label>

              <label className="grid gap-2">
                <Label htmlFor="node-description">Descrição</Label>
                <Textarea
                  id="node-description"
                  value={selectedNode.data.description}
                  onChange={(event) => onDescriptionChange(event.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </label>

              <div className="rounded-xl border border-[#e3ece5] bg-[#f6fbf7] p-3 sm:rounded-2xl sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7b8b82] sm:text-xs">
                      Progresso
                    </div>
                    <div className="mt-0.5 text-xl font-semibold text-[#173126] sm:mt-1 sm:text-2xl">
                      {Math.round(selectedNode.data.progress ?? 0)}%
                    </div>
                  </div>
                  <div className="text-right text-xs text-[#617269] sm:text-sm">
                    {selectedNode.data.completedTasks ?? 0} concluídas
                    <br />
                    {selectedNode.data.totalTasks ?? 0} no total
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dfeae2] sm:mt-4 sm:h-3">
                  <div
                    className="h-full rounded-full bg-[#365949] transition-[width] duration-300"
                    style={{ width: `${selectedNode.data.progress ?? 0}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                {!isDeleteConfirmOpen ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="bg-[#fdf0f0] text-[#a63d3d] hover:bg-[#f9dddd]"
                  >
                    <Trash2 />
                    Excluir
                  </Button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#e7c2c2] bg-[#fff4f4] px-3 py-2">
                    <span className="text-xs font-medium text-[#8f3c3c]">
                      Confirmar exclusão?
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setIsDeleteConfirmOpen(false)}
                      className="border-[#dfd7d7] bg-white text-[#6a5a5a] hover:bg-[#f7f3f3]"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setIsDeleteConfirmOpen(false);
                        onDelete();
                      }}
                      className="bg-[#c94f4f] text-white hover:bg-[#b64141]"
                    >
                      Confirmar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 sm:mt-6">
            <TaskTreeEditor
              tasks={visibleTasks}
              onAddTask={onAddTask}
              onAddChild={onAddChild}
              onTitleChange={onTaskTitleChange}
              onToggleDone={onTaskToggle}
              onRemoveTask={onRemoveTask}
            />
          </div>
        </SheetContent>
      )}
    </Sheet>
  );
};
