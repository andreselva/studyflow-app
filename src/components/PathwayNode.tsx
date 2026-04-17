import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { StudyNode } from "@/types/pathway";
import { normalizeNodeTitle } from "@/lib/node-title";

export default function PathwayNode({
  data,
  selected,
}: NodeProps<StudyNode>) {
  const progress = Math.round(data.progress ?? 0);
  const title = normalizeNodeTitle(data.title);
  const handleClassName =
    "!h-3 !w-3 !border-2 !border-[#f6efe4] opacity-0 transition-opacity duration-150 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto";

  return (
    <div className="group relative flex min-h-40 min-w-40 items-center justify-center">
      <Handle
        type="target"
        position={Position.Top}
        id="flow-in"
        className={`${handleClassName} !bg-[#365949]`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="flow-out"
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
        className={`flex min-h-34 min-w-34 max-w-56 flex-col items-center justify-center rounded-[999px] border bg-[#fffaf1] px-6 py-5 text-center shadow-[0_18px_50px_rgba(24,45,37,0.12)] transition-all ${
          selected
            ? "border-[#365949] ring-4 ring-[#a6c3b1]/50"
            : "border-[#7d8f85]/45"
        }`}
      >
        <span className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#6f7f76]">
          trilha
        </span>
        <strong className="break-words text-sm font-semibold text-[#173126]">
          {title}
        </strong>
        <span className="mt-3 rounded-full border border-[#d7e4db] bg-[#f5fbf7] px-3 py-1 text-[11px] font-medium text-[#365949]">
          {progress}% concluido
        </span>
      </div>
    </div>
  );
}
