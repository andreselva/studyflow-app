import { addEdge, applyEdgeChanges, applyNodeChanges, Background, BackgroundVariant, Controls, Panel, ReactFlow } from "@xyflow/react"
import { usePathwayHandler } from "../../handlers/usePathwaysHandler"
import { useCallback, useState } from "react";
import { nodeTypes } from "../../types/nodeTypes";
import '@xyflow/react/dist/style.css';
import { edgeTypes } from "../../types/edgeTypes";

export const Pathways = () => {
    const [open, setOpen] = useState(false);
    const { addNode, addTaskNode, addCircleNode, nodes, edges, setNodes, setEdges, saveFlow, loadFlow } = usePathwayHandler();

    const onNodesChange = useCallback(
     (changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
     []
    )
    
    const onEdgesChange = useCallback(
     (changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
     []
    )
    
    const onConnect = useCallback(
     (params) => setEdges((edgesSnapshot) => addEdge({...params, type: 'custom' }, edgesSnapshot)),
     []
    )

    return (
      <div style={{ width: '100%', height: '100vh', overflowY: 'auto' }}>
       <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
       >
        <Background variant={BackgroundVariant.Dots} gap={15} size={1} /> 
        <Controls />
        <Panel position="top-center">                                                                                                                                                                                                              
            <button onClick={saveFlow}>Salvar</button>
            <button onClick={loadFlow}>Carregar</button>      
            <button onClick={() => setOpen((prev) => !prev)}>+ Elementos</button>                                                                                                                                                                     
            {open && (                                                                                                                                                                                                                                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    <button onClick={addNode}>+ Nó</button>      
                    <button onClick={addTaskNode}>Tarefa</button>                                                                                                                                                                                         
                    <button onClick={addCircleNode}>Círculo</button>                                                                                                                                                                                      
                </div>                                                                                                                                                                                                                                  
            )}  
        </Panel>      
       </ReactFlow>
      </div>
    )
    
}