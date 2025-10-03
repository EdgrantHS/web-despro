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
  node_id: string;
  item_count: string;
  expire_date: string;
}

export default function SuperAdminItemInstancesPage() {
  const [itemInstances, setItemInstances] = useState<ItemInstance[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemInstance | null>(null);
  const [formData, setFormData] = useState<ItemInstanceFormData>({
    item_type_id: '',
    node_id: '',
    item_count: '',
    expire_date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [instancesRes, itemTypesRes, nodesRes] = await Promise.all([
        fetch('/api/item-instances'),
        fetch('/api/item-types'),
        fetch('/api/nodes')
      ]);
      
      const [instancesData, itemTypesData, nodesData] = await Promise.all([
        instancesRes.json(),
        itemTypesRes.json(),
        nodesRes.json()
      ]);
      
      if (instancesData.success) {
        setItemInstances(instancesData.data.item_instances);
      }
      if (itemTypesData.success) {
        setItemTypes(itemTypesData.data.item_types);
      }
      if (nodesData.success) {
        setNodes(nodesData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      item_type_id: formData.item_type_id,
      node_id: formData.node_id || undefined,
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
      node_id: item.node_id || '',
      item_count: item.item_count.toString(),
      expire_date: item.expire_date ? item.expire_date.split('T')[0] : ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      item_type_id: '',
      node_id: '',
      item_count: '',
      expire_date: ''
    });
    setEditingItem(null);
    setShowForm(false);
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Super Admin - Item Instances Management</h1>
          <p className="text-gray-600">Manage all item instances across all nodes</p>
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
                {itemTypes.map((type) => (
                  <option key={type.item_id} value={type.item_id}>
                    {type.item_name} ({type.item_type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="node_id">Current Node</Label>
              <select
                id="node_id"
                value={formData.node_id}
                onChange={(e) => setFormData({...formData, node_id: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Node (Optional)</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name} ({node.type})
                  </option>
                ))}
              </select>
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

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Type</TableHead>
              <TableHead>Current Node</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Expire Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemInstances.map((item) => (
              <TableRow key={item.item_instance_id}>
                <TableCell className="font-medium">
                  {item.item_type ? `${item.item_type.item_name} (${item.item_type.item_type})` : 'N/A'}
                </TableCell>
                <TableCell>
                  {item.current_node ? `${item.current_node.node_name} (${item.current_node.node_type})` : 'In Transit'}
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
      </div>

      {itemInstances.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No item instances found. Click "Add New Item Instance" to create one.
        </div>
      )}
    </div>
  );
}