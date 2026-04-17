import type { ReactNode } from "react";
import {
  PathwayNodeActionsContext,
  type PathwayNodeActionsContextValue,
} from "@/components/pathways/PathwayNodeActionsContext";

export function PathwayNodeActionsProvider({
  value,
  children,
}: {
  value: PathwayNodeActionsContextValue;
  children: ReactNode;
}) {
  return (
    <PathwayNodeActionsContext.Provider value={value}>
      {children}
    </PathwayNodeActionsContext.Provider>
  );
}
