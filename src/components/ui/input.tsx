import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-2xl border border-[#d5e1d8] bg-[#fbfdfb] px-4 py-3 text-sm text-[#173126] shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-[#8b9a91] focus-visible:border-[#365949] focus-visible:ring-3 focus-visible:ring-[#d9e8df]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
