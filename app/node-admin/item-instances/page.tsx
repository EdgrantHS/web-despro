'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  const [itemInstances, setItemInstances] = useState<ItemInstance[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemInstance | null>(null);
  const [formData, setFormData] = useState<ItemInstanceFormData>({
    item_type_id: '',
    item_count: '',
    expire_date: ''
  });

  useEffect(() => {
    fetchNodes();
  }, []);

  useEffect(() => {
    if (selectedNodeId) {
      fetchData();
    }
  }, [selectedNodeId]);

  const fetchNodes = async () => {
    try {
      const response = await fetch('/api/nodes');
      const data = await response.json();
      if (data.success && data.data.nodes) {
        setNodes(data.data.nodes);
      } else {
        setNodes([]);
      }
    } catch (error) {
      console.error('Error fetching nodes:', error);
      setNodes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    if (!selectedNodeId) return;
    
    setIsLoading(true);
    try {
      const [instancesRes, itemTypesRes] = await Promise.all([
        fetch(`/api/item-instances?node_id=${selectedNodeId}`),
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
    
    if (!selectedNodeId) {
      alert('Please select a node first');
      return;
    }
    
    const payload = {
      item_type_id: formData.item_type_id,
      node_id: selectedNodeId, // Auto-select current node
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
        fetchData();
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
          fetchData();
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

  const getSelectedNodeName = () => {
    const node = nodes.find(n => n.id === selectedNodeId);
    return node ? `${node.name} (${node.type})` : 'None';
  };

  if (isLoading && (!Array.isArray(nodes) || nodes.length === 0)) {
    return <div className="p-6">Loading...</div>;
  }

  if (!selectedNodeId) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto mt-10">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">Node Admin - Item Instances</h1>
            <p className="text-gray-600">Select a node to manage its item instances</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <Label htmlFor="node_select" className="text-base font-medium">Select Your Node</Label>
            <select
              id="node_select"
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
              className="w-full p-3 border rounded-lg mt-2"
            >
              <option value="">Choose a node...</option>
              {Array.isArray(nodes) && nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name} ({node.type}) - {node.location || 'No location'}
                </option>
              ))}
            </select>
            
            <p className="text-sm text-gray-500 mt-2">
              Note: In the future, this will be automatically selected based on your login.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Node Admin - Item Instances</h1>
          <p className="text-gray-600">
            Managing items for: <span className="font-semibold text-blue-600">{getSelectedNodeName()}</span>
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSelectedNodeId('')}
            className="mt-2"
          >
            Change Node
          </Button>
        </div>
        <Button onClick={() => setShowForm(true)}>Add New Item Instance</Button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? 'Edit Item Instance' : 'Add New Item Instance'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="item_type_id">Item Type *</Label>
              <select
                id="item_type_id"
                value={formData.item_type_id}
                onChange={(e) => setFormData({...formData, item_type_id: e.target.value})}
                className="w-full p-2 border rounded"
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
              <Label htmlFor="current_node">Current Node</Label>
              <Input
                id="current_node"
                value={getSelectedNodeName()}
                disabled
                className="bg-gray-100 cursor-not-allowed"
                title="Node is automatically selected based on your admin access"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-selected based on your node access
              </p>
            </div>
            <div>
              <Label htmlFor="item_count">Item Count *</Label>
              <Input
                id="item_count"
                type="number"
                min="1"
                value={formData.item_count}
                onChange={(e) => setFormData({...formData, item_count: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="expire_date">Expire Date</Label>
              <Input
                id="expire_date"
                type="date"
                value={formData.expire_date}
                onChange={(e) => setFormData({...formData, expire_date: e.target.value})}
              />
            </div>
            <div className="col-span-2 flex gap-2">
              <Button type="submit">
                {editingItem ? 'Update' : 'Create'} Item Instance
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">Loading item instances...</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Type</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Expire Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(itemInstances) && itemInstances.map((item, index) => (
                <TableRow key={item.id || item.item_instance_id || `item-${index}`}>
                  <TableCell className="font-medium">
                    {item.item_type ? `${item.item_type.item_name} (${item.item_type.item_type})` : 'N/A'}
                  </TableCell>
                  <TableCell>{item.item_count}</TableCell>
                  <TableCell>
                    {item.expire_date ? new Date(item.expire_date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.item_instance_id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {(!Array.isArray(itemInstances) || itemInstances.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              No item instances found for this node. Click "Add New Item Instance" to create one.
            </div>
          )}
        </div>
      )}
    </div>
  );
}