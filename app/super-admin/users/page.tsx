'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface User {
  user_id: string;
  email: string;
  user_node_id: string;
  node: {
    id: string;
    name: string;
    type: string;
    location: string;
  } | null;
  role: string | null;
  created_at: string;
  is_valid: boolean;
  status: string;
}

interface Node {
  id: string;
  name: string;
  type: string;
  location: string;
}

interface CreateUserForm {
  email: string;
  password: string;
  node_id: string;
  role: string;
}

interface UpdateUserForm {
  email?: string;
  password?: string;
  node_id?: string;
  role?: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedNode, setSelectedNode] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    email: '',
    password: '',
    node_id: '',
    role: ''
  });
  const [updateForm, setUpdateForm] = useState<UpdateUserForm>({});

  const roles = ['petugas', 'admin_node', 'admin_pusat'];

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedRole) queryParams.append('role', selectedRole);
      if (selectedNode) queryParams.append('node_id', selectedNode);
      
      const response = await fetch(`/api/user?${queryParams.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data.users || []);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch nodes
  const fetchNodes = async () => {
    try {
      const response = await fetch('/api/nodes');
      const data = await response.json();
      
      if (data.success && data.data && Array.isArray(data.data.nodes)) {
        setNodes(data.data.nodes);
      } else {
        console.error('Failed to fetch nodes or nodes is not an array:', data);
        setNodes([]); // Ensure nodes is always an array
      }
    } catch (err) {
      console.error('Error fetching nodes:', err);
      setNodes([]); // Ensure nodes is always an array on error
    }
  };

  // Create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowCreateForm(false);
        setCreateForm({ email: '', password: '', node_id: '', role: '' });
        fetchUsers();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to create user');
      console.error('Error creating user:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update user
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/user/${editingUser.user_node_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateForm),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowEditForm(false);
        setEditingUser(null);
        setUpdateForm({});
        fetchUsers();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to update user');
      console.error('Error updating user:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string, userNodeId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/user/${userNodeId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchUsers();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to delete user');
      console.error('Error deleting user:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.node?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchUsers();
    fetchNodes();
  }, [selectedRole, selectedNode]);

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'admin_pusat': return 'bg-red-100 text-red-800';
      case 'admin_node': return 'bg-blue-100 text-blue-800';
      case 'petugas': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string, isValid: boolean) => {
    if (isValid) return { text: 'Active', color: 'text-green-600' };
    if (status === 'missing_role') return { text: 'Missing Role', color: 'text-yellow-600' };
    return { text: 'Invalid', color: 'text-red-600' };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage system users, roles, and permissions</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          + Add New User
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
          <button 
            onClick={() => setError(null)}
            className="float-right text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search">Search Users</Label>
            <Input
              id="search"
              placeholder="🔍 Search by email, node, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="role-filter">Filter by Role</Label>
            <select
              id="role-filter"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          
          <div>
            <Label htmlFor="node-filter">Filter by Node</Label>
            <select
              id="node-filter"
              value={selectedNode}
              onChange={(e) => setSelectedNode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Nodes</option>
              {Array.isArray(nodes) && nodes.map(node => (
                <option key={node.id} value={node.id}>
                  {node.name} ({node.type})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedRole('');
                setSelectedNode('');
                setSearchQuery('');
              }}
              className="w-full"
            >
              🗑️ Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Node Assignment
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
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading users...</span>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No users found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.user_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${getStatusText(user.status, user.is_valid).color}`}>
                        {getStatusText(user.status, user.is_valid).text}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.email || 'No email'}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {user.user_id.substring(0, 8)}...
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role ? (
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">
                        No Role
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.node ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.node.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.node.type} - {user.node.location}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No node assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingUser(user);
                          setUpdateForm({
                            email: user.email || '',
                            node_id: user.node?.id || '',
                            role: user.role || ''
                          });
                          setShowEditForm(true);
                        }}
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.user_id, user.user_node_id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        🗑️ Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Create User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New User</h2>
            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="create-email">Email</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="create-password">Password</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                    minLength={6}
                  />
                </div>
                
                <div>
                  <Label htmlFor="create-node">Node Assignment</Label>
                  <select
                    id="create-node"
                    value={createForm.node_id}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, node_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a node</option>
                    {Array.isArray(nodes) && nodes.map(node => (
                      <option key={node.id} value={node.id}>
                        {node.name} ({node.type})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="create-role">Role</Label>
                  <select
                    id="create-role"
                    value={createForm.role}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a role</option>
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating...' : 'Create User'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateForm({ email: '', password: '', node_id: '', role: '' });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditForm && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <form onSubmit={handleUpdateUser}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={updateForm.email || ''}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Leave empty to keep current email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-password">New Password</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={updateForm.password || ''}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Leave empty to keep current password"
                    minLength={6}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-node">Node Assignment</Label>
                  <select
                    id="edit-node"
                    value={updateForm.node_id || ''}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, node_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a node</option>
                    {Array.isArray(nodes) && nodes.map(node => (
                      <option key={node.id} value={node.id}>
                        {node.name} ({node.type})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="edit-role">Role</Label>
                  <select
                    id="edit-role"
                    value={updateForm.role || ''}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a role</option>
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Updating...' : 'Update User'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingUser(null);
                    setUpdateForm({});
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}