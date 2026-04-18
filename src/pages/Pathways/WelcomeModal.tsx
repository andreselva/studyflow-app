import { useState } from "react";
import { Button } from "@/components/ui/button";

const WELCOME_STORAGE_KEY = "studyflow:welcome-dismissed";

export const WelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(WELCOME_STORAGE_KEY) !== "true";
  });

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#173126]/30 px-4 backdrop-blur-[2px]">
      <div className="w-full max-w-xl rounded-[20px] border border-white/70 bg-white/95 p-4 shadow-[0_24px_80px_rgba(23,49,38,0.22)] sm:rounded-[28px] sm:p-6">
        <span className="inline-flex rounded-full border border-[#dce7df] bg-[#f5fbf7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#52675c]">
          Bem-vindo
        </span>
        <h2 className="mt-3 text-xl font-semibold text-[#173126] sm:mt-4 sm:text-2xl">
          O StudyFlow organiza sua trilha de estudos de forma visual.
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#56675f]">
          Crie tópicos para representar partes da trilha, adicione tarefas no canvas, conecte os
          elementos para montar a estrutura da trilha e acompanhe o progresso de cada
          etapa. Você também pode salvar no navegador, exportar a trilha em JSON e
          importar depois.
        </p>
        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            onClick={() => {
              window.localStorage.setItem(WELCOME_STORAGE_KEY, "true");
              setIsOpen(false);
            }}
            className="bg-[#365949] text-white hover:bg-[#28473a]"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
};
