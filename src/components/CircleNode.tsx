import { Handle, Position } from "@xyflow/react";

type CircleNodeProps = {
  data: {
    label: string;
  };
};

export default function CircleNode({ data }: CircleNodeProps) {
  return (
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: '#6366f1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
      }}
    >
      <Handle type="target" position={Position.Top} id="in" />
      {data.label}
      <Handle type="source" position={Position.Bottom} id="out" />
    </div>
  );
}
