import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';
import { useState } from 'react';

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
}: EdgeProps) {
  const { deleteElements } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: "#365949", strokeWidth: 1.6, strokeLinecap: "round" }}
      />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      <EdgeLabelRenderer>
        <button
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px, ${(sourceY + targetY) / 2}px)`,
            pointerEvents: isHovered ? 'all' : 'none',
          }}
          className={`flex h-6 w-6 items-center justify-center rounded-full border border-[#d7e4db] bg-white text-[11px] text-[#365949] shadow-sm transition-all hover:bg-[#edf6ef] ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => deleteElements({ edges: [{ id }] })}
        >
          x
        </button>
      </EdgeLabelRenderer>
    </>
  );
}
