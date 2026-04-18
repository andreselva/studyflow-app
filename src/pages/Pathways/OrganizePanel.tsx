import { LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

type OrganizePanelProps = {
  onOrganize: () => void;
};

export const OrganizePanel = ({ onOrganize }: OrganizePanelProps) => (
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
);
