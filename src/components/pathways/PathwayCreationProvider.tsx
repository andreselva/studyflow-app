import type { ReactNode } from "react";
import {
  PathwayCreationContext,
  type PathwayCreationContextValue,
} from "@/components/pathways/PathwayCreationContext";

export function PathwayCreationProvider({
  value,
  children,
}: {
  value: PathwayCreationContextValue;
  children: ReactNode;
}) {
  return (
    <PathwayCreationContext.Provider value={value}>
      {children}
    </PathwayCreationContext.Provider>
  );
}
