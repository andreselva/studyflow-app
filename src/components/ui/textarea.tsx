import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-2xl border border-[#d5e1d8] bg-[#fbfdfb] px-4 py-3 text-sm text-[#173126] shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-[#8b9a91] focus-visible:border-[#365949] focus-visible:ring-3 focus-visible:ring-[#d9e8df] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
