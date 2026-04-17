import * as React from "react";
import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.2em] text-[#7b8b82]",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
