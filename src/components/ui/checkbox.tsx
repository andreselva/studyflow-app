import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<React.ComponentProps<"button">, "onChange"> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

function Checkbox({
  checked = false,
  onCheckedChange,
  className,
  ...props
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-[#a0b5a7] bg-white text-white shadow-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#d9e8df] data-[state=checked]:border-[#365949] data-[state=checked]:bg-[#365949]",
        className,
      )}
      {...props}
    >
      <Check className={cn("size-3", checked ? "opacity-100" : "opacity-0")} />
    </button>
  );
}

export { Checkbox };
