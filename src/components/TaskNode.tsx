import { Handle, Position, useEdges } from "@xyflow/react"

export default function TaskNode({ data, id }) {                                                                                                                                                                                            
    const edges = useEdges()                                                                                                                                                                                                                  
                  
    const isParentConnected = edges.some(                                                                                                                                                                                                     
      (e) => (e.source === id && e.sourceHandle === 'parent') ||
              (e.target === id && e.targetHandle === 'parent')                                                                                                                                                                                
    )                                                                                                                                                                                                                                         
   
    return (                                                                                                                                                                                                                                  
      <div style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8, background: '#fff' }}>
        <Handle type="target" position={Position.Top} id="in" />
                                                                                                                                                                                                                                              
        <div>{data.label}</div>
                                                                                                                                                                                                                                              
        <Handle type="source" position={Position.Bottom} id="next" />
        <Handle type="source" position={Position.Right} id="child" />
        <Handle type="source" position={Position.Left} id="parent" />                                                                                                        
      </div>
    )                                                                                                                                                                                                                                         
  }         