type FlowAlertsProps = {
  hasConnectionErrors: boolean;
  invalidNodeCount: number;
  storageError: string | null;
  autoSaveError: string | null;
  isAutoSaved: boolean;
};

export const FlowAlerts = ({
  hasConnectionErrors,
  invalidNodeCount,
  storageError,
  autoSaveError,
  isAutoSaved,
}: FlowAlertsProps) => (
  <div className="pointer-events-auto hidden max-w-sm space-y-3 md:block">
    {isAutoSaved && !autoSaveError && (
      <div className="rounded-3xl border border-[#b6d9c2] bg-[#f0fbf4] px-4 py-3 text-right shadow-[0_20px_60px_rgba(33,120,70,0.08)] backdrop-blur">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2a7a50]">
          salvo automaticamente
        </div>
        <div className="mt-1 text-sm font-medium text-[#1f5e3c]">
          Todas as alterações foram salvas.
        </div>
      </div>
    )}
    {hasConnectionErrors && (
      <div className="rounded-3xl border border-[#e4b6b6] bg-[#fff4f4] px-4 py-3 text-right shadow-[0_20px_60px_rgba(163,63,63,0.10)] backdrop-blur">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a63d3d]">
          erro de conexão
        </div>
        <div className="mt-1 text-sm font-medium text-[#7d2f2f]">
          {invalidNodeCount > 0 && invalidNodeCount > 1 ?
            `Existem ${invalidNodeCount} elementos sem conexão` : 
            'Existe 1 elemento sem conexão.'}
        </div>
      </div>
    )}
    {storageError && (
      <div className="rounded-3xl border border-[#e6c9a8] bg-[#fff8ef] px-4 py-3 text-right shadow-[0_20px_60px_rgba(151,104,33,0.10)] backdrop-blur">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9a6a1f]">
          erro de salvamento
        </div>
        <div className="mt-1 text-sm font-medium text-[#7f5a1d]">{storageError}</div>
      </div>
    )}
    {autoSaveError && (
      <div className="rounded-3xl border border-[#e6c9a8] bg-[#fff8ef] px-4 py-3 text-right shadow-[0_20px_60px_rgba(151,104,33,0.10)] backdrop-blur">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9a6a1f]">
          erro de auto-salvamento
        </div>
        <div className="mt-1 text-sm font-medium text-[#7f5a1d]">{autoSaveError}</div>
      </div>
    )}
  </div>
);
