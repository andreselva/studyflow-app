import { createContext, useContext } from "react";

export type PathwayNodeActionsContextValue = {
  toggleTaskNodeDone: (nodeId: string, done: boolean) => void;
};

export const PathwayNodeActionsContext =
  createContext<PathwayNodeActionsContextValue | null>(null);

export function usePathwayNodeActions() {
  const context = useContext(PathwayNodeActionsContext);

  if (!context) {
    throw new Error("usePathwayNodeActions must be used within PathwayNodeActionsProvider");
  }

  return context;
}
