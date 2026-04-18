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
  <div className="pointer-events-auto max-w-[160px] space-y-2 sm:max-w-xs sm:space-y-3">
    {isAutoSaved && !autoSaveError && (
      <div className="rounded-2xl border border-[#b6d9c2] bg-[#f0fbf4] px-3 py-2 text-right shadow-[0_20px_60px_rgba(33,120,70,0.08)] backdrop-blur sm:rounded-3xl sm:px-4 sm:py-3">
        <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#2a7a50] sm:text-[11px] sm:tracking-[0.22em]">
          salvo automaticamente
        </div>
        <div className="mt-0.5 text-[11px] font-medium text-[#1f5e3c] sm:mt-1 sm:text-sm">
          Alterações salvas.
        </div>
      </div>
    )}
    {hasConnectionErrors && (
      <div className="rounded-2xl border border-[#e4b6b6] bg-[#fff4f4] px-3 py-2 text-right shadow-[0_20px_60px_rgba(163,63,63,0.10)] backdrop-blur sm:rounded-3xl sm:px-4 sm:py-3">
        <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#a63d3d] sm:text-[11px] sm:tracking-[0.22em]">
          conexões pendentes
        </div>
        <div className="mt-0.5 text-[11px] font-medium text-[#7d2f2f] sm:mt-1 sm:text-sm">
          {invalidNodeCount > 1
            ? `${invalidNodeCount} elementos ainda sem conexão`
            : "1 elemento ainda sem conexão."}
        </div>
      </div>
    )}
    {storageError && (
      <div className="rounded-2xl border border-[#e6c9a8] bg-[#fff8ef] px-3 py-2 text-right shadow-[0_20px_60px_rgba(151,104,33,0.10)] backdrop-blur sm:rounded-3xl sm:px-4 sm:py-3">
        <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9a6a1f] sm:text-[11px] sm:tracking-[0.22em]">
          erro de salvamento
        </div>
        <div className="mt-0.5 text-[11px] font-medium text-[#7f5a1d] sm:mt-1 sm:text-sm">{storageError}</div>
      </div>
    )}
    {autoSaveError && (
      <div className="rounded-2xl border border-[#e6c9a8] bg-[#fff8ef] px-3 py-2 text-right shadow-[0_20px_60px_rgba(151,104,33,0.10)] backdrop-blur sm:rounded-3xl sm:px-4 sm:py-3">
        <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9a6a1f] sm:text-[11px] sm:tracking-[0.22em]">
          erro de auto-salvamento
        </div>
        <div className="mt-0.5 text-[11px] font-medium text-[#7f5a1d] sm:mt-1 sm:text-sm">{autoSaveError}</div>
      </div>
    )}
  </div>
);
