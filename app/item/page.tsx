'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function Page() {
  const [items, setItems] = useState<any[]>([])
  const [itemName, setItemName] = useState('')
  const [itemCount, setItemCount] = useState(1)
  const [nodeId, setNodeId] = useState('')
  const [nodes, setNodes] = useState<any[]>([])
  const [transferId, setTransferId] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchItems()
    fetchNodes()
  }, [])

  const fetchItems = async () => {
    const { data } = await supabase.from('item').select()
    setItems(data || [])
  }

  const fetchNodes = async () => {
    const { data } = await supabase.from('node').select()
    setNodes(data || [])
  }

  const addItem = async () => {
    if (!itemName || !nodeId || itemCount < 1) return
    await supabase.from('item').insert([{ item_name: itemName, item_count: itemCount, nodeid: nodeId }])
    setItemName('')
    setItemCount(1)
    fetchItems()
  }

  const deleteItem = async (id: string) => {
    await supabase.from('item').delete().eq('itemid', id)
    fetchItems()
  }

  const handleTransfer = async () => {
    if (!transferId) return
    
    // Check if item exists in item table
    const { data: itemData } = await supabase.from('item').select().eq('itemid', transferId).single()
    
    if (itemData) {
      // Move to transit table, 
      await supabase.from('item_flow').insert([{ itemid: itemData.itemid, source_node_id: itemData.nodeid, dest_node_id: '0ca03b12-97aa-4d85-a8ca-70b91068b5de', url: transferId }])
      await supabase.from('item').delete().eq('itemid', transferId)
    } else {
      // Check if item exists in item_flow table
      const { data: transitData } = await supabase.from('item_flow').select().eq('url', transferId).single()
      
      if (transitData) {
        // Move back to item table with new nodeid set to '0ca03b12-97aa-4d85-a8ca-70b91068b5de'
        await supabase.from('item').insert([{ item_name: 'Restored Item', item_count: 1, nodeid: '0ca03b12-97aa-4d85-a8ca-70b91068b5de' }])
        await supabase.from('item_flow').delete().eq('url', transferId)
      }
    }
    
    setTransferId('')
    fetchItems()
  }

  //Get node name by node id
  const getNodeName = (nodeId: string) => {
    const node = nodes.find(node => node.nodeid === nodeId)
    return node ? node.node_name : ''
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Item Management</h1>
      <div className="flex gap-2 my-4">
        <input
          className="border p-2"
          type="text"
          placeholder="Item Name"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
        />
        <input
          className="border p-2"
          type="number"
          min="1"
          placeholder="Item Count"
          value={itemCount}
          onChange={(e) => setItemCount(parseInt(e.target.value))}
        />
        <select
          className="border p-2"
          value={nodeId}
          onChange={(e) => setNodeId(e.target.value)}
        >
          <option value="">Select Node</option>
          {nodes.map((node) => (
            <option key={node.nodeid} value={node.nodeid}>
              {node.node_name}
            </option>
          ))}
        </select>
        <button className="bg-blue-500 text-white p-2" onClick={addItem}>Add Item</button>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.itemid} className="flex justify-between border-b p-2">
            ID: {item.itemid} | {item.item_name} - {item.item_count} (Node: {getNodeName(item.nodeid)})
            <button className="bg-red-500 text-white p-1" onClick={() => deleteItem(item.itemid)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
      <div className="my-4">
        <h2 className="text-lg font-bold">Transfer Item</h2>
        <input
          className="border p-2 w-full"
          type="text"
          placeholder="Enter Item ID or QR URL"
          value={transferId}
          onChange={(e) => setTransferId(e.target.value)}
        />
        <button className="bg-green-500 text-white p-2 mt-2 w-full" onClick={handleTransfer}>Transfer</button>
      </div>
    </div>
  )
}