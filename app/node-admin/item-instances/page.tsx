'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Grid2x2, ArrowLeft, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import Image from 'next/image';
import adminNodeImage from '@/assets/public/admin_node.png';

interface ItemInstance {
  item_instance_id: string;
  item_type_id: string;
  node_id?: string;
  item_count: number;
  expire_date?: string;
  status: string;
  created_at: string;
  item_type?: {
    item_id: string;
    item_name: string;
    item_type: string;
  };
  current_node?: {
    node_id: string;
    node_name: string;
    node_type: string;
  };
}

interface ItemType {
  item_id: string;
  item_name: string;
  item_type: string;
}

interface Node {
  id: string;
  name: string;
  type: string;
  location?: string;
}

interface ItemInstanceFormData {
  item_type_id: string;
  item_count: string;
  expire_date: string;
}

export default function NodeAdminItemInstancesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [itemInstances, setItemInstances] = useState<ItemInstance[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [userNode, setUserNode] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemInstance | null>(null);
  const [formData, setFormData] = useState<ItemInstanceFormData>({
    item_type_id: '',
    item_count: '',
    expire_date: ''
  });

  // Check if there's an item to edit from sessionStorage (from dashboard)
  useEffect(() => {
    const editItemData = sessionStorage.getItem('editItemInstance');
    if (editItemData) {
      try {
        const item = JSON.parse(editItemData);
        setEditingItem(item);
        setFormData({
          item_type_id: item.item_type_id,
          item_count: item.item_count.toString(),
          expire_date: item.expire_date ? item.expire_date.split('T')[0] : ''
        });
        setShowForm(true);
        sessionStorage.removeItem('editItemInstance');
      } catch (error) {
        console.error('Error parsing edit item data:', error);
      }
    }
  }, []);

  useEffect(() => {
    fetchUserNodeAndData();
  }, []);

  const fetchUserNodeAndData = async () => {
    setIsLoading(true);
    try {
      // First, get the user's assigned node
      const nodeResponse = await fetch('/api/user/node');
      const nodeData = await nodeResponse.json();
      
      if (!nodeData.success) {
        console.error('Error fetching user node:', nodeData.message);
        return;
      }
      
      const userNodeInfo = nodeData.data.node;
      setUserNode(userNodeInfo);
      
      // Now fetch item instances for this specific node and item types
      const [instancesRes, itemTypesRes] = await Promise.all([
        fetch(`/api/item-instances?node_id=${userNodeInfo.id}`),
        fetch('/api/item-types')
      ]);
      
      const [instancesData, itemTypesData] = await Promise.all([
        instancesRes.json(),
        itemTypesRes.json()
      ]);
      
      if (instancesData.success) {
        setItemInstances(instancesData.data.item_instances || []);
      }
      if (itemTypesData.success) {
        setItemTypes(itemTypesData.data.item_types || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userNode) {
      alert('User node information not available');
      return;
    }
    
    const payload = {
      item_type_id: formData.item_type_id,
      node_id: userNode.id, // Auto-select current user's node
      item_count: parseInt(formData.item_count),
      expire_date: formData.expire_date || undefined,
    };

    try {
      const url = editingItem ? `/api/item-instance/${editingItem.item_instance_id}` : '/api/item-instance';
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        fetchUserNodeAndData();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving item instance:', error);
    }
  };

  const handleDelete = async (instanceId: string) => {
    if (confirm('Are you sure you want to delete this item instance?')) {
      try {
        const response = await fetch(`/api/item-instance/${instanceId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          fetchUserNodeAndData();
        }
      } catch (error) {
        console.error('Error deleting item instance:', error);
      }
    }
  };

  const handleEdit = (item: ItemInstance) => {
    setEditingItem(item);
    setFormData({
      item_type_id: item.item_type_id,
      item_count: item.item_count.toString(),
      expire_date: item.expire_date ? item.expire_date.split('T')[0] : ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      item_type_id: '',
      item_count: '',
      expire_date: ''
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const getUserNodeName = () => {
    return userNode ? `${userNode.name} (${userNode.type})` : 'Loading...';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.username) return user.username;
    return 'Admin';
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-white text-black font-sans pb-24">
        <div className="text-center py-8 text-sm md:text-base">Loading your node information and item instances...</div>
      </div>
    );
  }

  if (!userNode) {
    return (
      <div className="w-full min-h-screen bg-white text-black font-sans pb-24">
        <div className="px-4 md:px-5 py-6">
          <div className="max-w-md mx-auto mt-10">
            <div className="text-center mb-6">
              <h1 className="text-xl md:text-2xl font-bold mb-2">Node Admin - Item Instances</h1>
              <p className="text-red-600 text-sm md:text-base">
                Unable to load your assigned node. Please contact an administrator.
              </p>
            </div>
            
            <div className="bg-red-50 p-4 md:p-6 rounded-lg border border-red-200 shadow-sm">
              <p className="text-red-700 text-xs md:text-sm">
                Your user account does not have a node assigned or the node information could not be retrieved.
                Please contact your system administrator to resolve this issue.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white text-black font-sans pb-24">
      {/* Header */}
      <div 
        className="bg-blue-600 text-white px-4 pt-10 pb-6 rounded-b-3xl shadow-md"
        style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex-shrink-0">
            <ArrowLeft size={24} className="md:w-6 md:h-6 w-5 h-5" />
          </button>
          <Grid2x2 size={28} className="md:w-7 md:h-7 w-6 h-6" />
          <h1 className="text-xl md:text-2xl font-semibold">Item Instances</h1>
        </div>
      </div>

      {/* Greeting */}
      <div className="px-4 md:px-5 mt-4 flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-3xl font-bold truncate">
            Hi <span className="text-blue-600">{getUserName()}!</span>
          </h2>
          <p className="text-gray-600 text-base md:text-lg">
            Managing items for: <span className="font-semibold text-blue-600">{getUserNodeName()}</span>
          </p>
        </div>
      </div>

      {/* Welcome Card */}
      <div className="px-4 md:px-5 mt-4">
        <div className="border border-gray-200 rounded-xl p-3 md:p-4 flex items-center justify-between shadow-sm">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base md:text-lg">Add New Item</h3>
            <p className="text-gray-600 text-sm md:text-base">Create and manage item instances for your node</p>
          </div>
          <Image
            src={adminNodeImage}
            alt="Admin Node"
            width={80}
            height={80}
            className="w-16 md:w-20 flex-shrink-0 ml-2 object-contain"
          />
        </div>
      </div>

      {/* Add New Button */}
      <div className="px-4 md:px-5 mt-4">
        {!showForm ? (
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md flex items-center gap-2 w-full md:w-auto"
          >
            <Plus size={16} />
            Add New Item Instance
          </Button>
        ) : null}
      </div>

      {/* Form */}
      {showForm && (
        <div className="px-4 md:px-5 mt-4">
          <div className="border border-gray-200 rounded-xl p-4 md:p-6 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-semibold">
                {editingItem ? 'Edit Item Instance' : 'Add New Item Instance'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item_type_id" className="text-sm font-medium mb-2 block">
                    Item Type <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="item_type_id"
                    value={formData.item_type_id}
                    onChange={(e) => setFormData({...formData, item_type_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white"
                    required
                  >
                    <option value="">Select Item Type</option>
                    {Array.isArray(itemTypes) && itemTypes.map((type) => (
                      <option key={type.item_id} value={type.item_id}>
                        {type.item_name} ({type.item_type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="current_node" className="text-sm font-medium mb-2 block">
                    Current Node
                  </Label>
                  <Input
                    id="current_node"
                    value={getUserNodeName()}
                    disabled
                    className="bg-gray-100 cursor-not-allowed text-sm"
                    title="Node is automatically selected based on your user account"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Automatically assigned based on your user account
                  </p>
                </div>
                <div>
                  <Label htmlFor="item_count" className="text-sm font-medium mb-2 block">
                    Item Count <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="item_count"
                    type="number"
                    min="1"
                    value={formData.item_count}
                    onChange={(e) => setFormData({...formData, item_count: e.target.value})}
                    className="text-sm"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expire_date" className="text-sm font-medium mb-2 block">
                    Expire Date
                  </Label>
                  <Input
                    id="expire_date"
                    type="date"
                    value={formData.expire_date}
                    onChange={(e) => setFormData({...formData, expire_date: e.target.value})}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button 
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md flex-1 sm:flex-none"
                >
                  {editingItem ? 'Update' : 'Create'} Item Instance
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="px-4 md:px-5 mt-6">
        <h3 className="text-base md:text-lg font-semibold mb-4">Inventory Items</h3>
        {isLoading ? (
          <div className="text-center py-8 text-sm md:text-base">Loading item instances...</div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
              <table className="w-full text-left text-[9px] md:text-sm min-w-[550px]">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Item Type</th>
                    <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Count</th>
                    <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Expire Date</th>
                    <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Status</th>
                    <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Created</th>
                    <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(!Array.isArray(itemInstances) || itemInstances.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="px-1.5 md:px-3 py-3 md:py-4 text-center text-gray-500 text-[9px] md:text-sm bg-white">
                        No item instances found for this node. Click "Add New Item Instance" to create one.
                      </td>
                    </tr>
                  ) : (
                    itemInstances.map((item, index) => (
                      <tr 
                        key={item.item_instance_id || `item-${index}`} 
                        className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} border-b border-gray-100 hover:bg-gray-100 transition-colors`}
                      >
                        <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                          {item.item_type ? `${item.item_type.item_name} (${item.item_type.item_type})` : 'N/A'}
                        </td>
                        <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">{item.item_count}</td>
                        <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">{formatDate(item.expire_date)}</td>
                        <td className="px-1.5 md:px-3 py-1 md:py-2">
                          <span className={`px-1 md:px-2 py-0.5 md:py-1 rounded text-[8px] md:text-xs ${
                            item.status === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">{formatDate(item.created_at)}</td>
                        <td className="px-1.5 md:px-3 py-1 md:py-2">
                          <div className="flex gap-0.5 md:gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-800 text-[9px] md:text-sm font-medium hover:underline transition-all"
                            >
                              Edit
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => handleDelete(item.item_instance_id)}
                              className="text-red-600 hover:text-red-800 text-[9px] md:text-sm font-medium hover:underline transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}