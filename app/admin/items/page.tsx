'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

interface ItemType {
  item_type_id: string
  item_name: string
  item_type: string
  item_description: string
  created_at: string
}

export default function AdminItemsPage() {
  const [itemTypes, setItemTypes] = useState<ItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ItemType | null>(null)
  const [formData, setFormData] = useState({
    item_name: '',
    item_type: 'raw_material',
    item_description: ''
  })
  const supabase = createClient()

  useEffect(() => {
    fetchAllItemTypes()
  }, [])

  const fetchAllItemTypes = async () => {
    // suggested implementation: get all item types from database
    // setLoading(true)
    // try {
    //   const { data, error } = await supabase
    //     .from('item_type')
    //     .select('*')
    //     .order('item_name')
    //   
    //   if (error) throw error
    //   setItemTypes(data || [])
    // } catch (error) {
    //   console.error('Error fetching item types:', error)
    // } finally {
    //   setLoading(false)
    // }
  }

  const createItemType = async (itemTypeData: Omit<ItemType, 'item_type_id' | 'created_at'>) => {
    // suggested implementation: create new item type
    // try {
    //   const { data, error } = await supabase
    //     .from('item_type')
    //     .insert([itemTypeData])
    //     .select()
    //   
    //   if (error) throw error
    //   fetchAllItemTypes()
    //   return data[0]
    // } catch (error) {
    //   console.error('Error creating item type:', error)
    //   throw error
    // }
  }

  const updateItemType = async (itemTypeId: string, updatedData: Partial<ItemType>) => {
    // suggested implementation: update existing item type
    // try {
    //   const { data, error } = await supabase
    //     .from('item_type')
    //     .update(updatedData)
    //     .eq('item_type_id', itemTypeId)
    //     .select()
    //   
    //   if (error) throw error
    //   fetchAllItemTypes()
    //   return data[0]
    // } catch (error) {
    //   console.error('Error updating item type:', error)
    //   throw error
    // }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingItem) {
        await updateItemType(editingItem.item_type_id, formData)
      } else {
        await createItemType(formData)
      }
      setIsModalOpen(false)
      setEditingItem(null)
      setFormData({ item_name: '', item_type: 'raw_material', item_description: '' })
    } catch (error) {
      console.error('Error saving item type:', error)
    }
  }

  const openEditModal = (itemType: ItemType) => {
    setEditingItem(itemType)
    setFormData({
      item_name: itemType.item_name,
      item_type: itemType.item_type,
      item_description: itemType.item_description
    })
    setIsModalOpen(true)
  }

  if (loading) {
    return <div className="p-6">Loading item types...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Item Type Management</h1>
        <button
          onClick={() => {
            setEditingItem(null)
            setFormData({ item_name: '', item_type: 'raw_material', item_description: '' })
            setIsModalOpen(true)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Item Type
        </button>
      </div>

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
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {itemTypes.map((itemType) => (
              <tr key={itemType.item_type_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {itemType.item_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    itemType.item_type === 'raw_material' 
                      ? 'bg-blue-100 text-blue-800'
                      : itemType.item_type === 'finished_product'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {itemType.item_type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {itemType.item_description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(itemType.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => openEditModal(itemType)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </button>
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
              {editingItem ? 'Edit Item Type' : 'Add New Item Type'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Item Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Item Type</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.item_type}
                  onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                >
                  <option value="raw_material">Raw Material</option>
                  <option value="finished_product">Finished Product</option>
                  <option value="intermediate">Intermediate</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  value={formData.item_description}
                  onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
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
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
