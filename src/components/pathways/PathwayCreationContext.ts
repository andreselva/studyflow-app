import { createContext, useContext } from "react";
import type { TaskSide } from "@/types/pathway";

export type TaskPlacement = TaskSide | "bottom";

export type PathwayCreationContextValue = {
  createTopicFromNode: (nodeId: string) => void;
  createTaskFromNode: (nodeId: string, placement: TaskPlacement) => void;
};

export const PathwayCreationContext =
  createContext<PathwayCreationContextValue | null>(null);

export function usePathwayCreation() {
  const context = useContext(PathwayCreationContext);

  if (!context) {
    throw new Error("usePathwayCreation must be used within PathwayCreationProvider");
  }

  return context;
}
