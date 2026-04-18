import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Panel } from "@xyflow/react";
import { ChevronDown, Download, Plus, Save, Target, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrganizePanel } from "./OrganizePanel";

type FlowToolbarProps = {
  hasConnectionErrors: boolean;
  canCreateTask: boolean;
  onSave: () => void;
  onLoad: () => void;
  onExport: () => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onOrganize: () => void;
  onCreateTopicNode: () => void;
  onCreateTaskNode: () => void;
};

export const FlowToolbar = ({
  hasConnectionErrors,
  canCreateTask,
  onSave,
  onLoad,
  onExport,
  onImport,
  onOrganize,
  onCreateTopicNode,
  onCreateTaskNode,
}: FlowToolbarProps) => {
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCreateMenuOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsCreateMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isCreateMenuOpen]);

  return (
    <Panel position="top-center" className="!z-20">
      <div className="rounded-3xl border border-white/70 bg-white/70 p-2 shadow-[0_20px_60px_rgba(23,49,38,0.08)] backdrop-blur">
        <div className="flex items-center gap-1 md:gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              void onImport(event);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={hasConnectionErrors}
            title="Salvar"
            className="border-[#d4dfd7] bg-white text-[#173126] hover:bg-[#f4f8f5] disabled:border-[#e7c2c2] disabled:bg-[#fbf1f1] disabled:text-[#aa6a6a]"
          >
            <Save />
            <span className="hidden md:inline">Salvar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onLoad}
            title="Recarregar"
            className="border-[#d4dfd7] bg-white text-[#173126] hover:bg-[#f4f8f5]"
          >
            <Target />
            <span className="hidden md:inline">Recarregar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            title="Exportar"
            className="border-[#d4dfd7] bg-white text-[#173126] hover:bg-[#f4f8f5]"
          >
            <Download />
            <span className="hidden md:inline">Exportar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => importInputRef.current?.click()}
            title="Importar"
            className="border-[#d4dfd7] bg-white text-[#173126] hover:bg-[#f4f8f5]"
          >
            <Upload />
            <span className="hidden md:inline">Importar</span>
          </Button>
          <OrganizePanel onOrganize={onOrganize} />
          <div ref={menuRef} className="relative">
            <Button
              type="button"
              size="sm"
              onClick={() => setIsCreateMenuOpen((open) => !open)}
              className="bg-[#365949] text-white hover:bg-[#28473a]"
              aria-label="Abrir menu de criacao"
              title="Criar"
            >
              <Plus />
              <span className="hidden md:inline">Criar</span>
              <ChevronDown />
            </Button>
            {isCreateMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] min-w-40 rounded-2xl border border-[#d4dfd7] bg-white p-1 shadow-[0_20px_50px_rgba(23,49,38,0.12)]">
                <button
                  type="button"
                  className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-[#173126] transition-colors hover:bg-[#f4f8f5]"
                  onClick={() => {
                    onCreateTopicNode();
                    setIsCreateMenuOpen(false);
                  }}
                >
                  Nó
                </button>
                <button
                  type="button"
                  disabled={!canCreateTask}
                  title={
                    !canCreateTask
                      ? "Crie ao menos um nó antes de adicionar tarefas"
                      : undefined
                  }
                  className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-[#173126] transition-colors hover:bg-[#f4f8f5] disabled:cursor-not-allowed disabled:text-[#9da8a2] disabled:hover:bg-transparent"
                  onClick={() => {
                    onCreateTaskNode();
                    setIsCreateMenuOpen(false);
                  }}
                >
                  Tarefa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
};
