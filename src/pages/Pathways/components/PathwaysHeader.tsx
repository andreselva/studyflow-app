import { FlowAlerts } from "../FlowAlerts";
import { HelpButton } from "../HelpPanel";

type PathwaysHeaderProps = {
  autoSaveError: string | null;
  hasConnectionErrors: boolean;
  invalidNodeCount: number;
  isAutoSaved: boolean;
  onOpenHelp: () => void;
  storageError: string | null;
};

export function PathwaysHeader({
  autoSaveError,
  hasConnectionErrors,
  invalidNodeCount,
  isAutoSaved,
  onOpenHelp,
  storageError,
}: PathwaysHeaderProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between px-5 py-4 md:bottom-auto md:top-0 md:items-start md:px-8 md:py-5">
      <div className="pointer-events-auto flex items-center gap-3">
        <span className="inline-flex rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#52675c] backdrop-blur">
          StudyFlow
        </span>
        <HelpButton onClick={onOpenHelp} />
      </div>
      <div className="pointer-events-auto flex items-start gap-3">
        <FlowAlerts
          hasConnectionErrors={hasConnectionErrors}
          invalidNodeCount={invalidNodeCount}
          storageError={storageError}
          autoSaveError={autoSaveError}
          isAutoSaved={isAutoSaved}
        />
      </div>
    </div>
  );
}
