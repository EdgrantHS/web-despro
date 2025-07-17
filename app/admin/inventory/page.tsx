'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

interface ItemInstance {
  item_instance_id: string
  item_count: number
  expire_date: string
  node_id: string
  item_type_id: string
  item_type?: {
    item_name: string
    item_type: string
    item_description: string
  }
  node?: {
    node_name: string
    node_type: string
  }
}

export default function AdminInventoryPage() {
  const [itemInstances, setItemInstances] = useState<ItemInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [filterNode, setFilterNode] = useState('')
  const [filterType, setFilterType] = useState('')
  const [nodes, setNodes] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchAllItemInstances()
    fetchNodes()
  }, [])

  const fetchAllItemInstances = async () => {
    // suggested implementation: get all item instances across all nodes
    // setLoading(true)
    // try {
    //   const { data, error } = await supabase
    //     .from('item_instance')
    //     .select(`
    //       *,
    //       item_type:item_type_id (
    //         item_name,
    //         item_type,
    //         item_description
    //       ),
    //       node:node_id (
    //         node_name,
    //         node_type
    //       )
    //     `)
    //     .order('expire_date', { ascending: true })
    //   
    //   if (error) throw error
    //   setItemInstances(data || [])
    // } catch (error) {
    //   console.error('Error fetching item instances:', error)
    // } finally {
    //   setLoading(false)
    // }
  }

  const fetchNodes = async () => {
    // suggested implementation: get all active nodes for filtering
    // try {
    //   const { data, error } = await supabase
    //     .from('node')
    //     .select('node_id, node_name, node_type')
    //     .eq('status', 'active')
    //     .order('node_name')
    //   
    //   if (error) throw error
    //   setNodes(data || [])
    // } catch (error) {
    //   console.error('Error fetching nodes:', error)
    // }
  }

  const filteredItems = itemInstances.filter(item => {
    if (filterNode && item.node_id !== filterNode) return false
    if (filterType && item.item_type?.item_type !== filterType) return false
    return true
  })

  const getExpiryStatus = (expireDate: string) => {
    const today = new Date()
    const expiry = new Date(expireDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { status: 'expired', class: 'bg-red-100 text-red-800' }
    if (diffDays <= 7) return { status: 'expiring', class: 'bg-yellow-100 text-yellow-800' }
    return { status: 'fresh', class: 'bg-green-100 text-green-800' }
  }

  const uniqueItemTypes = Array.from(new Set(itemInstances.map(item => item.item_type?.item_type).filter(Boolean)))

  if (loading) {
    return <div className="p-6">Loading inventory...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Node</label>
          <select
            className="border border-gray-300 rounded-md px-3 py-2"
            value={filterNode}
            onChange={(e) => setFilterNode(e.target.value)}
          >
            <option value="">All Nodes</option>
            {nodes.map((node) => (
              <option key={node.node_id} value={node.node_id}>
                {node.node_name} ({node.node_type})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
          <select
            className="border border-gray-300 rounded-md px-3 py-2"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            {uniqueItemTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Items</h3>
          <p className="text-2xl font-bold text-gray-900">
            {filteredItems.reduce((sum, item) => sum + item.item_count, 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Unique Items</h3>
          <p className="text-2xl font-bold text-blue-600">{filteredItems.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Expiring Soon</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {filteredItems.filter(item => getExpiryStatus(item.expire_date).status === 'expiring').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Expired</h3>
          <p className="text-2xl font-bold text-red-600">
            {filteredItems.filter(item => getExpiryStatus(item.expire_date).status === 'expired').length}
          </p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Count
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Node
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expiry Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredItems.map((item) => {
              const expiryStatus = getExpiryStatus(item.expire_date)
              return (
                <tr key={item.item_instance_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.item_type?.item_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.item_type?.item_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.item_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.node?.node_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.expire_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${expiryStatus.class}`}>
                      {expiryStatus.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
