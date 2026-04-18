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
    className="border-[#d4dfd7] bg-white text-[#173126] hover:bg-[#f4f8f5]"
  >
    <LayoutGrid />
    Organizar
  </Button>
);
