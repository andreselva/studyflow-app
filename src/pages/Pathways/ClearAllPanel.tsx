import { useState } from "react";
import { Trash2 } from "lucide-react";

type ClearAllPanelProps = {
  onClearAll: () => void;
};

export const ClearAllPanel = ({ onClearAll }: ClearAllPanelProps) => {
  const [step, setStep] = useState<0 | 1 | 2>(0);

  return (
    <>
      {step === 0 && (
        <button
          type="button"
          onClick={() => setStep(1)}
          className="flex items-center gap-1.5 rounded-xl border border-[#e7c2c2] bg-white/90 px-3 py-1.5 text-xs font-medium text-[#a63d3d] shadow-sm backdrop-blur transition-colors hover:bg-[#fdf0f0]"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Limpar trilha
        </button>
      )}

      {step === 1 && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#e7c2c2] bg-white/95 px-3 py-2 shadow-md backdrop-blur">
          <span className="text-xs font-medium text-[#8f3c3c]">
            Tem certeza? Isso removerá todos os nós.
          </span>
          <button
            type="button"
            onClick={() => setStep(0)}
            className="rounded-lg border border-[#dfd7d7] bg-white px-2 py-1 text-xs font-medium text-[#6a5a5a] hover:bg-[#f7f3f3]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="rounded-lg bg-[#c94f4f] px-2 py-1 text-xs font-medium text-white hover:bg-[#b64141]"
          >
            Confirmar
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#c94f4f] bg-[#fff4f4]/95 px-3 py-2 shadow-md backdrop-blur">
          <span className="text-xs font-semibold text-[#7a2020]">
            Ação irreversível. Confirmar exclusão total?
          </span>
          <button
            type="button"
            onClick={() => setStep(0)}
            className="rounded-lg border border-[#dfd7d7] bg-white px-2 py-1 text-xs font-medium text-[#6a5a5a] hover:bg-[#f7f3f3]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onClearAll();
              setStep(0);
            }}
            className="rounded-lg bg-[#8f1e1e] px-2 py-1 text-xs font-semibold text-white hover:bg-[#7a1818]"
          >
            Excluir tudo
          </button>
        </div>
      )}
    </>
  );
};
