import { CircleHelp, Link2, MousePointer2, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetCloseIcon,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetOverlay,
  SheetTitle,
} from "@/components/ui/sheet";

type HelpPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const FlowExample = () => (
  <div className="mt-4 rounded-3xl border border-[#e4ece6] bg-[#f8fbf8] p-4">
    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7d8f85]">
      Exemplo: nó para nó
    </div>
    <div className="mt-3 flex items-center justify-between gap-3">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#d7e4db] bg-[#fffaf1] text-center text-xs font-semibold text-[#173126] shadow-[0_10px_20px_rgba(24,45,37,0.06)]">
        Assunto A
      </div>
      <div className="flex flex-1 items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#365949]" />
        <div className="h-[2px] flex-1 bg-[#365949]" />
        <span className="h-2 w-2 rounded-full bg-[#365949]" />
      </div>
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#d7e4db] bg-[#fffaf1] text-center text-xs font-semibold text-[#173126] shadow-[0_10px_20px_rgba(24,45,37,0.06)]">
        Assunto B
      </div>
    </div>
    <p className="mt-3 text-xs leading-5 text-[#617269]">
      Saia do conector inferior do primeiro nó e entre no conector superior do próximo.
    </p>
  </div>
);

const TaskExample = () => (
  <div className="mt-4 rounded-3xl border border-[#e9e1d3] bg-[#fffaf1] p-4">
    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6b37]">
      Exemplo: tarefa para subtarefa
    </div>
    <div className="mt-3 flex flex-col items-center gap-3">
      <div className="w-full max-w-[220px] rounded-2xl border border-[#d8e2db] bg-white px-4 py-3 text-sm font-semibold text-[#173126] shadow-[0_10px_20px_rgba(24,45,37,0.05)]">
        Tarefa principal
      </div>
      <div className="flex w-full max-w-[220px] items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#8a6b37]" />
        <div className="h-[2px] flex-1 bg-[#8a6b37]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a6b37]">
          lateral
        </span>
      </div>
      <div className="w-full max-w-[220px] rounded-2xl border border-[#d8e2db] bg-white px-4 py-3 text-sm font-semibold text-[#173126] shadow-[0_10px_20px_rgba(24,45,37,0.05)]">
        Subtarefa
      </div>
    </div>
    <p className="mt-3 text-xs leading-5 text-[#617269]">
      Use os conectores laterais do nó ou da tarefa de origem e conecte no topo da
      tarefa de destino.
    </p>
  </div>
);

export const HelpPanel = ({ open, onOpenChange }: HelpPanelProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetOverlay />
      <SheetContent className="max-w-lg">
        <SheetHeader>
          <div>
            <span className="inline-flex rounded-full border border-[#dce7df] bg-[#f5fbf7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#52675c]">
              Ajuda
            </span>
            <SheetTitle>Como usar o StudyFlow</SheetTitle>
            <SheetDescription>
              Este painel explica como criar nós, conectar elementos e organizar as
              tarefas da trilha.
            </SheetDescription>
          </div>
          <SheetClose aria-label="Fechar ajuda">
            <SheetCloseIcon />
          </SheetClose>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <section className="rounded-3xl border border-[#dde8e0] bg-white/85 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#eef5f0] p-2 text-[#365949]">
                <Sparkles className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#173126]">1. Crie os elementos</h3>
                <p className="mt-1 text-sm leading-6 text-[#56675f]">
                  Use o menu <strong>Criar</strong> para adicionar um <strong>Nó</strong>
                  {" "}principal ou uma <strong>Tarefa</strong>. O nó representa um tópico
                  da trilha. A tarefa representa uma etapa executável.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#dde8e0] bg-white/85 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#f5efe4] p-2 text-[#8a6b37]">
                <Link2 className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#173126]">2. Conecte corretamente</h3>
                <p className="mt-1 text-sm leading-6 text-[#56675f]">
                  Para ligar <strong>um nó ao outro</strong>, arraste do conector inferior
                  do nó de origem para o conector superior do nó de destino.
                </p>
                <p className="mt-2 text-sm leading-6 text-[#56675f]">
                  Para ligar <strong>tarefas</strong>, arraste a partir das laterais de um
                  nó ou tarefa para o conector superior da tarefa de destino. Isso cria uma
                  relação hierárquica entre elas.
                </p>
                <FlowExample />
                <TaskExample />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#dde8e0] bg-white/85 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#eef3f8] p-2 text-[#46677e]">
                <MousePointer2 className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#173126]">3. Edite pelo painel lateral</h3>
                <p className="mt-1 text-sm leading-6 text-[#56675f]">
                  Clique em qualquer elemento para abrir o painel lateral. Nele você pode
                  renomear, descrever, marcar progresso e adicionar ou remover subtarefas.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#dde8e0] bg-white/85 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#eef5f0] p-2 text-[#365949]">
                <Save className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#173126]">4. Salve sem perder alterações</h3>
                <p className="mt-1 text-sm leading-6 text-[#56675f]">
                  Use <strong>Salvar</strong> para gravar a trilha no navegador.
                  {" "}Também é possível <strong>Exportar</strong> em JSON e
                  {" "} <strong>Importar</strong> depois.
                </p>
                <p className="mt-2 text-sm leading-6 text-[#56675f]">
                  Se um elemento aparecer como inválido, ele está sem conexão. Conecte-o
                  antes de salvar a trilha.
                </p>
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const HelpButton = ({ onClick }: { onClick: () => void }) => (
  <Button
    type="button"
    variant="outline"
    size="icon-sm"
    onClick={onClick}
    className="border-white/70 bg-white/80 text-[#173126] shadow-sm backdrop-blur hover:bg-[#f4f8f5]"
    aria-label="Abrir ajuda de uso"
    title="Como usar o StudyFlow"
  >
    <CircleHelp />
  </Button>
);
