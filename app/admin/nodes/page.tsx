'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

interface Node {
  node_id: string
  node_name: string
  node_type: string
  node_address: string
  status: string
}

export default function AdminNodesPage() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<Node | null>(null)
  const [formData, setFormData] = useState({
    node_name: '',
    node_type: 'source node',
    node_address: '',
    status: 'active'
  })
  const supabase = createClient()

  useEffect(() => {
    fetchAllNodes()
  }, [])

  const fetchAllNodes = async () => {
    // suggested implementation: get all nodes in the system
    // setLoading(true)
    // try {
    //   const { data, error } = await supabase
    //     .from('node')
    //     .select('*')
    //     .order('node_name')
      
    //   if (error) throw error
    //   setNodes(data || [])
    // } catch (error) {
    //   console.error('Error fetching nodes:', error)
    // } finally {
    //   setLoading(false)
    // }
  }

  const createNode = async (nodeData: Omit<Node, 'node_id'>) => {
    // suggested implementation: add new node to database
    // try {
    //   const { data, error } = await supabase
    //     .from('node')
    //     .insert([nodeData])
    //     .select()
      
    //   if (error) throw error
    //   fetchAllNodes()
    //   return data[0]
    // } catch (error) {
    //   console.error('Error creating node:', error)
    //   throw error
    // }
  }

  const updateNode = async (nodeId: string, updatedData: Partial<Node>) => {
    // suggested implementation: update node details
    // try {
    //   const { data, error } = await supabase
    //     .from('node')
    //     .update(updatedData)
    //     .eq('node_id', nodeId)
    //     .select()
      
    //   if (error) throw error
    //   fetchAllNodes()
    //   return data[0]
    // } catch (error) {
    //   console.error('Error updating node:', error)
    //   throw error
    // }
  }

  const flagNodeAsInactive = async (nodeId: string) => {
    // suggested implementation: flag node as inactive instead of deleting
    // try {
    //   const { error } = await supabase
    //     .from('node')
    //     .update({ status: 'inactive' })
    //     .eq('node_id', nodeId)
      
    //   if (error) throw error
    //   fetchAllNodes()
    // } catch (error) {
    //   console.error('Error flagging node as inactive:', error)
    // }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingNode) {
        await updateNode(editingNode.node_id, formData)
      } else {
        await createNode(formData)
      }
      setIsModalOpen(false)
      setEditingNode(null)
      setFormData({ node_name: '', node_type: 'source node', node_address: '', status: 'active' })
    } catch (error) {
      console.error('Error saving node:', error)
    }
  }

  const openEditModal = (node: Node) => {
    setEditingNode(node)
    setFormData({
      node_name: node.node_name,
      node_type: node.node_type,
      node_address: node.node_address,
      status: node.status
    })
    setIsModalOpen(true)
  }

  if (loading) {
    return <div className="p-6">Loading nodes...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Node Management</h1>
        <button
          onClick={() => {
            setEditingNode(null)
            setFormData({ node_name: '', node_type: 'source node', node_address: '', status: 'active' })
            setIsModalOpen(true)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Node
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {nodes.map((node) => (
              <tr key={node.node_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {node.node_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {node.node_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {node.node_address}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    node.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {node.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => openEditModal(node)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </button>
                  {node.status === 'active' && (
                    <button
                      onClick={() => flagNodeAsInactive(node.node_id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingNode ? 'Edit Node' : 'Add New Node'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Node Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.node_name}
                  onChange={(e) => setFormData({ ...formData, node_name: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Node Type</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.node_type}
                  onChange={(e) => setFormData({ ...formData, node_type: e.target.value })}
                >
                  <option value="source node">Source Node</option>
                  <option value="assembly node">Assembly Node</option>
                  <option value="destination node">Destination Node</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.node_address}
                  onChange={(e) => setFormData({ ...formData, node_address: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingNode ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
