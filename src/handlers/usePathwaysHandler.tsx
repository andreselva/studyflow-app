import { useCallback } from "react";
import { usePathwaysHook } from "../hooks/usePathwaysHook";

export const usePathwayHandler = () => {
  const { nodes, edges, setNodes, setEdges, saveFlow, loadFlow } = usePathwaysHook();

  const addNode = useCallback(() => {                                                                                                                                                                                                         
    const label = prompt('Nome do nó:')                                                                                                                                                                                                       
    if (!label) return                                                                                                                                                                                                                        
    const newNode = {
      id: crypto.randomUUID(),                                                                                                                                                                                                                
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label },                                                                                                                                                                                                                        
    }
    setNodes((prev) => [...prev, newNode])                                                                                                                                                                                                    
  }, []);

  const addTaskNode = useCallback(() => {                                                                                                                                                                                                     
    const label = prompt('Nome da tarefa:')                                                                                                                                                                                                   
    if (!label) return                                                                                                                                                                                                                        
    const newNode = {
      id: crypto.randomUUID(),
      type: 'task',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label },                                                                                                                                                                                                                        
    }
    setNodes((prev) => [...prev, newNode])                                                                                                                                                                                                    
  }, []);

  const addCircleNode = useCallback(() => {
    const label = prompt('Insira um nome:');
    if (!label) return
    const newNode = {
      id: crypto.randomUUID(),
      type: 'circle',
      position: { x: Math.random() * 240, y: Math.random() * 350 },
      data: { label }
    }
    setNodes((prev) => [...prev, newNode]);
  }, []);

  return {
    addNode,
    addTaskNode,
    addCircleNode,
    nodes,
    edges,
    setNodes,
    setEdges,
    saveFlow,
    loadFlow
  }
}