import axios from "axios";
import { useEffect, useState } from "react";

export const usePathwaysHook = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const loadFlow = async () => {
    const { data } = await axios.get('http://localhost:3001/flow');
    setNodes(data.nodes);
    setEdges(data.edges);
  }

  const saveFlow = async () => {
    await axios.post('http://localhost:3001/flow', { nodes, edges });
  }

  useEffect(() => {
    loadFlow()
  }, []);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    saveFlow,
    loadFlow
  }
}