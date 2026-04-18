import { Button } from "@/components/ui/button";

type OrganizeConfirmAlertProps = {
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
};

export function OrganizeConfirmAlert({
  onCancel,
  onConfirm,
  open,
}: OrganizeConfirmAlertProps) {
  if (!open) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-start justify-center px-4 pt-22 sm:pt-24">
      <div className="pointer-events-auto max-w-xl rounded-[28px] border border-[#e4d9c4] bg-[#fffaf1]/96 p-4 shadow-[0_24px_60px_rgba(23,49,38,0.14)] backdrop-blur sm:p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6b37]">
          Confirmar organização
        </div>
        <p className="mt-2 text-sm leading-6 text-[#5d4c2f]">
          A estrutura atual será remodelada para reorganizar os tópicos e tarefas no
          canvas. Você poderá reverter para a estrutura anterior por 15 segundos.
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="border-[#d9d5cc] bg-white text-[#5f6863] hover:bg-[#f7f4ef]"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            className="bg-[#8a6b37] text-white hover:bg-[#765a2d]"
          >
            Organizar agora
          </Button>
        </div>
      </div>
    </div>
  );
}
