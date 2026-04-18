import { CircleHelp, Link2, MousePointer2, Save, Sparkles, X } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

type HelpPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const FlowExample = () => (
  <div className="rounded-3xl border border-[#e4ece6] bg-[#f8fbf8] p-4">
    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7d8f85]">
      Exemplo: tópico para tópico
    </div>
    <div className="mt-3 flex flex-col items-center gap-3">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#d7e4db] bg-[#fffaf1] text-center text-xs font-semibold text-[#173126] shadow-[0_10px_20px_rgba(24,45,37,0.06)]">
        Tópico A
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#365949]" />
        <div className="h-10 w-[2px] bg-[#365949]" />
        <span className="h-2 w-2 rounded-full bg-[#365949]" />
      </div>
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#d7e4db] bg-[#fffaf1] text-center text-xs font-semibold text-[#173126] shadow-[0_10px_20px_rgba(24,45,37,0.06)]">
        Tópico B
      </div>
    </div>
    <p className="mt-3 text-xs leading-5 text-[#617269]">
      Saia do conector inferior do primeiro tópico e entre no conector superior do próximo.
    </p>
  </div>
);

const TaskExample = () => (
  <div className="rounded-3xl border border-[#e9e1d3] bg-[#fffaf1] p-4">
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
      Use os conectores laterais do tópico ou da tarefa de origem e conecte no topo da
      tarefa de destino.
    </p>
  </div>
);

export const HelpPanel = ({ open, onOpenChange }: HelpPanelProps) => {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(34,52,44,0.22)] p-4 backdrop-blur-[5px] sm:p-6">
      <button
        type="button"
        aria-label="Fechar ajuda"
        className="absolute inset-0"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/70 bg-[#f9f5ec]/96 shadow-[0_24px_80px_rgba(23,49,38,0.22)] backdrop-blur">
        <div className="help-modal-scroll max-h-[92vh] overflow-y-auto p-5 sm:p-7 lg:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-[#dce7df] bg-[#f5fbf7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#52675c]">
                Ajuda
              </span>
              <h2 className="mt-3 text-2xl font-semibold text-[#173126] sm:text-3xl">
                Como usar o StudyFlow
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#56675f] sm:text-base">
                O StudyFlow foi pensado para organizar trilhas de estudo visuais, ligando
                tópicos, tarefas e subtarefas em um único fluxo.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
              className="text-[#617269] hover:bg-white/70 hover:text-[#173126]"
              aria-label="Fechar ajuda"
            >
              <X />
            </Button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
            <section className="rounded-3xl border border-[#dde8e0] bg-white/88 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#eef5f0] p-2 text-[#365949]">
                  <Sparkles className="size-4" />
                </div>
                <h3 className="text-base font-semibold text-[#173126]">
                  Finalidade do StudyFlow
                </h3>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[#56675f]">
                <p>
                  Use o StudyFlow para mapear uma jornada de estudos em formato visual,
                  conectando tópicos principais e acompanhando o progresso de cada etapa.
                </p>
                <p>
                  Cada <strong>tópico</strong> representa uma parte principal da trilha. Cada
                  <strong> tarefa</strong> representa uma ação executável, como revisar,
                  praticar, resolver exercícios ou concluir uma entrega.
                </p>
                <p>
                  O objetivo é deixar clara a sequência dos tópicos e a hierarquia das
                  tarefas, sem perder contexto enquanto a trilha cresce.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-[#dde8e0] bg-white/88 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#eef3f8] p-2 text-[#46677e]">
                  <MousePointer2 className="size-4" />
                </div>
                <h3 className="text-base font-semibold text-[#173126]">Como usar</h3>
              </div>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-[#e7eee8] bg-[#fbfdfb] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#173126]">
                    <Sparkles className="size-4 text-[#365949]" />
                    1. Crie os elementos
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#56675f]">
                    Use o menu <strong>Criar</strong> para adicionar um <strong>Tópico</strong>
                    principal ou uma <strong>Tarefa</strong>.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#e7eee8] bg-[#fbfdfb] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#173126]">
                    <Link2 className="size-4 text-[#8a6b37]" />
                    2. Conecte corretamente
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#56675f]">
                    Para ligar <strong>um tópico ao outro</strong>, arraste do conector inferior
                    do tópico de origem para o conector superior do tópico de destino.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#56675f]">
                    Para ligar <strong>tarefas</strong>, arraste das laterais de um tópico ou
                    tarefa para o conector superior da tarefa de destino.
                  </p>
                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    <FlowExample />
                    <TaskExample />
                  </div>
                </div>

                <div className="rounded-2xl border border-[#e7eee8] bg-[#fbfdfb] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#173126]">
                    <Save className="size-4 text-[#365949]" />
                    3. Salve e acompanhe o progresso
                  </div>
                <p className="mt-2 text-sm leading-6 text-[#56675f]">
                  Clique em um elemento para editar nome, descrição e tarefas. Use
                  <strong> Salvar</strong> para gravar no navegador e
                  <strong> Exportar</strong> para baixar em JSON.
                </p>
                <p className="mt-2 text-sm leading-6 text-[#56675f]">
                  Elementos sem conexão ainda podem ser salvos, mas conectar a trilha
                  ajuda a manter a estrutura visual mais clara e organizada.
                </p>
              </div>
            </div>
            </section>
          </div>
        </div>
      </div>
    </div>,
    document.body,
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
