'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function Page() {
  const [nodes, setNodes] = useState<any[]>([])
  const [nodeName, setNodeName] = useState('')
  const [nodeType, setNodeType] = useState('source node')
  const supabase = createClient()

  useEffect(() => {
    fetchNodes()
  }, [])

  const fetchNodes = async () => {
    const { data } = await supabase.from('node').select()
    setNodes(data || [])
  }

  const addNode = async () => {
    if (!nodeName) return
    await supabase.from('node').insert([{ node_name: nodeName, node_type: nodeType }])
    setNodeName('')
    fetchNodes()
  }

  const deleteNode = async (id: string) => {
    await supabase.from('node').delete().eq('nodeid', id)
    fetchNodes()
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Node Management</h1>
      <div className="flex gap-2 my-4">
        <input
          className="border p-2"
          type="text"
          placeholder="Node Name"
          value={nodeName}
          onChange={(e) => setNodeName(e.target.value)}
        />
        <select
          className="border p-2"
          value={nodeType}
          onChange={(e) => setNodeType(e.target.value)}
        >
          <option value="source node">Source Node</option>
          <option value="assembly node">Assembly Node</option>
          <option value="destination node">Destination Node</option>
        </select>
        <button className="bg-blue-500 text-white p-2" onClick={addNode}>Add Node</button>
      </div>
      <ul>
        {nodes.map((node) => (
          <li key={node.nodeid} className="flex justify-between border-b p-2">
            {node.node_name} ({node.node_type})
            <button className="bg-red-500 text-white p-1" onClick={() => deleteNode(node.nodeid)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}