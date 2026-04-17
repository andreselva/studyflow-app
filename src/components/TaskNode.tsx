import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { StudyNode } from "@/types/pathway";
import { normalizeNodeTitle } from "@/lib/node-title";

export default function TaskNode({ data, selected }: NodeProps<StudyNode>) {
  const title = normalizeNodeTitle(data.title);
  const handleClassName =
    "!h-3 !w-3 !border-2 !border-[#f6efe4] opacity-0 transition-opacity duration-150 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto";

  return (
    <div className="group relative min-w-52 max-w-72">
      <Handle
        type="target"
        position={Position.Top}
        id="task-in"
        className={`${handleClassName} !bg-[#365949]`}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="task-left"
        className={`${handleClassName} !bg-[#8a6b37]`}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="task-right"
        className={`${handleClassName} !bg-[#8a6b37]`}
      />

      <div
        className={`rounded-3xl border px-4 py-3 shadow-[0_18px_40px_rgba(24,45,37,0.10)] transition-all ${
          selected
            ? "border-[#365949] bg-[#fffaf1] ring-4 ring-[#a6c3b1]/50"
            : "border-[#d8e2db] bg-white/95"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7a8b82]">
            tarefa
          </span>
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
              data.done
                ? "bg-[#e4f3e8] text-[#2f6a43]"
                : "bg-[#f5efe4] text-[#8a6b37]"
            }`}
          >
            {data.done ? "feita" : "pendente"}
          </span>
        </div>
        <div className="mt-2 text-sm font-semibold text-[#173126]">
          {title}
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e3ebe5]">
          <div
            className="h-full rounded-full bg-[#365949] transition-[width] duration-300"
            style={{ width: `${data.progress ?? 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}
