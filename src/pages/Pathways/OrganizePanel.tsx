import { LayoutGrid, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type OrganizePanelProps = {
  canRevert: boolean;
  onOrganize: () => void;
  onRevert: () => void;
  secondsLeft: number;
};

export const OrganizePanel = ({
  canRevert,
  onOrganize,
  onRevert,
  secondsLeft,
}: OrganizePanelProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onOrganize}
        title="Organizar"
        className="border-[#d4dfd7] bg-white text-[#173126] hover:bg-[#f4f8f5]"
      >
        <LayoutGrid />
        <span className="hidden md:inline">Organizar</span>
      </Button>

      {canRevert && (
        <div className="rounded-2xl border border-[#e4d9c4] bg-[#fffaf1] p-1 shadow-[0_12px_30px_rgba(23,49,38,0.06)]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRevert}
            title="Reverter organização"
            className="border-[#e4d9c4] bg-[#fffaf1] text-[#6b5328] hover:bg-[#f9f1e2]"
          >
            <RotateCcw />
            <span className="hidden md:inline">Reverter</span>
            <span className="rounded-full bg-[#f2e6d1] px-1.5 py-0.5 text-[10px] font-semibold text-[#7b6031]">
              {secondsLeft}s
            </span>
          </Button>
        </div>
      )}
    </div>
  );
};
