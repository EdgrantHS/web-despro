'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

interface User {
  user_id: string
  email: string
  node_id: string
  privilege_id: number
  created_at: string
  node?: {
    node_name: string
    node_type: string
  }
  privilege?: {
    privilege_name: string
  }
}

interface Node {
  node_id: string
  node_name: string
}

interface Privilege {
  privilege_id: number
  privilege_name: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [nodes, setNodes] = useState<Node[]>([])
  const [privileges, setPrivileges] = useState<Privilege[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    node_id: '',
    privilege_id: 1
  })
  const supabase = createClient()

  useEffect(() => {
    fetchAllUsers()
    fetchNodes()
    fetchPrivileges()
  }, [])

  const fetchAllUsers = async () => {
    // suggested implementation: get all users with their node and privilege details
    // setLoading(true)
    // try {
    //   const { data, error } = await supabase
    //     .from('user')
    //     .select(`
    //       *,
    //       node:node_id (node_name, node_type),
    //       privilege:privilege_id (privilege_name)
    //     `)
    //     .order('created_at', { ascending: false })
      
    //   if (error) throw error
    //   setUsers(data || [])
    // } catch (error) {
    //   console.error('Error fetching users:', error)
    // } finally {
    //   setLoading(false)
    // }
  }

  const fetchNodes = async () => {
    // suggested implementation: get all active nodes for user assignment
    // try {
    //   const { data, error } = await supabase
    //     .from('node')
    //     .select('node_id, node_name')
    //     .eq('status', 'active')
    //     .order('node_name')
    //   
    //   if (error) throw error
    //   setNodes(data || [])
    // } catch (error) {
    //   console.error('Error fetching nodes:', error)
    // }
  }

  const fetchPrivileges = async () => {
    // suggested implementation: get all privilege levels for assignment
    // try {
    //   const { data, error } = await supabase
    //     .from('privilege')
    //     .select('*')
    //     .order('privilege_id')
    //   
    //   if (error) throw error
    //   setPrivileges(data || [])
    // } catch (error) {
    //   console.error('Error fetching privileges:', error)
    // }
  }

  const createUser = async (userData: typeof formData) => {
    // suggested implementation: create new user with auth and profile
    // try {
    //   // First create auth user
    //   const { data: authData, error: authError } = await supabase.auth.signUp({
    //     email: userData.email,
    //     password: userData.password,
    //   })
    //   
    //   if (authError) throw authError

    //   // Then create user profile
    //   const { data, error } = await supabase
    //     .from('user')
    //     .insert([{
    //       user_id: authData.user?.id,
    //       email: userData.email,
    //       node_id: userData.node_id,
    //       privilege_id: userData.privilege_id
    //     }])
    //     .select()
    //   
    //   if (error) throw error
    //   fetchAllUsers()
    //   return data[0]
    // } catch (error) {
    //   console.error('Error creating user:', error)
    //   throw error
    // }
  }

  const updateUserPrivilege = async (userId: string, newPrivilegeId: number) => {
    // suggested implementation: update user privilege level
    // try {
    //   const { error } = await supabase
    //     .from('user')
    //     .update({ privilege_id: newPrivilegeId })
    //     .eq('user_id', userId)
    //   
    //   if (error) throw error
    //   fetchAllUsers()
    // } catch (error) {
    //   console.error('Error updating user privilege:', error)
    // }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createUser(formData)
      setIsModalOpen(false)
      setFormData({ email: '', password: '', node_id: '', privilege_id: 1 })
    } catch (error) {
      console.error('Error saving user:', error)
    }
  }

  if (loading) {
    return <div className="p-6">Loading users...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <button
          onClick={() => {
            setFormData({ email: '', password: '', node_id: '', privilege_id: 1 })
            setIsModalOpen(true)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Node
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Privilege
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
            {users.map((user) => (
              <tr key={user.user_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.node?.node_name} ({user.node?.node_type})
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.privilege?.privilege_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <select
                    value={user.privilege_id}
                    onChange={(e) => updateUserPrivilege(user.user_id, parseInt(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    {privileges.map((privilege) => (
                      <option key={privilege.privilege_id} value={privilege.privilege_id}>
                        {privilege.privilege_name}
                      </option>
                    ))}
                  </select>
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
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New User</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Node</label>
                <select
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.node_id}
                  onChange={(e) => setFormData({ ...formData, node_id: e.target.value })}
                >
                  <option value="">Select a node</option>
                  {nodes.map((node) => (
                    <option key={node.node_id} value={node.node_id}>
                      {node.node_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Privilege</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.privilege_id}
                  onChange={(e) => setFormData({ ...formData, privilege_id: parseInt(e.target.value) })}
                >
                  {privileges.map((privilege) => (
                    <option key={privilege.privilege_id} value={privilege.privilege_id}>
                      {privilege.privilege_name}
                    </option>
                  ))}
                </select>
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
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
