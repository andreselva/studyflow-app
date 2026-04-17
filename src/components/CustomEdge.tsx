import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
} from '@xyflow/react';
 
export default function CustomEdge({ id, sourceX, sourceY, targetX, targetY }) {
  const { deleteElements } = useReactFlow();
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });
 
  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <button
         style={{                                                                                                                                                                                                                                
         position: 'absolute',
         transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px, ${(sourceY + targetY) / 2}px)`,
         pointerEvents: 'all',                                                                                                                                                                                                                 
        }}
        onClick={() => deleteElements({ edges: [{ id }] })}>X</button>
      </EdgeLabelRenderer>
    </>
  );
}