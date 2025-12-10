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

interface ItemType {
  item_id: string;
  item_name: string;
  item_type: string;
  item_description?: string;
  item_image?: string;
  status: string;
  created_at: string;
}

interface ItemTypeFormData {
  item_name: string;
  item_type: string;
  item_description: string;
  item_image: string;
}

export default function SuperAdminItemTypesPage() {
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemType | null>(null);
  const [formData, setFormData] = useState<ItemTypeFormData>({
    item_name: '',
    item_type: '',
    item_description: '',
    item_image: ''
  });

  useEffect(() => {
    fetchItemTypes();
  }, []);

  const fetchItemTypes = async () => {
    try {
      const response = await fetch('/api/item-types');
      const data = await response.json();
      if (data.success) {
        setItemTypes(data.data.item_types);
      }
    } catch (error) {
      console.error('Error fetching item types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      item_name: formData.item_name,
      item_type: formData.item_type,
      item_description: formData.item_description || undefined,
      item_image: formData.item_image || undefined,
    };

    try {
      const url = editingItem ? `/api/item-type/${editingItem.item_id}` : '/api/item-type';
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        fetchItemTypes();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving item type:', error);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this item type?')) {
      try {
        const response = await fetch(`/api/item-type/${itemId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          fetchItemTypes();
        }
      } catch (error) {
        console.error('Error deleting item type:', error);
      }
    }
  };

  const handleEdit = (item: ItemType) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      item_type: item.item_type,
      item_description: item.item_description || '',
      item_image: item.item_image || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      item_name: '',
      item_type: '',
      item_description: '',
      item_image: ''
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
          <h1 className="text-2xl font-bold">Super Admin - Item Types Management</h1>
          <p className="text-gray-600">Manage all item types in the system</p>
        </div>
        <Button onClick={() => setShowForm(true)}>Add New Item Type</Button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? 'Edit Item Type' : 'Add New Item Type'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="item_name">Item Name *</Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="item_type">Item Type *</Label>
              <select
                id="item_type"
                value={formData.item_type}
                onChange={(e) => setFormData({...formData, item_type: e.target.value})}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="" disabled>Select Item Type</option>
                <option value="Bahan Mentah">Bahan Mentah</option>
                <option value="Makanan Jadi">Makanan Jadi</option>
              </select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="item_description">Description</Label>
              <Input
                id="item_description"
                value={formData.item_description}
                onChange={(e) => setFormData({...formData, item_description: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="item_image">Image URL</Label>
              <Input
                id="item_image"
                value={formData.item_image}
                onChange={(e) => setFormData({...formData, item_image: e.target.value})}
              />
            </div>
            <div className="col-span-2 flex gap-2">
              <Button type="submit">
                {editingItem ? 'Update' : 'Create'} Item Type
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
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemTypes.map((item) => (
              <TableRow key={item.item_id}>
                <TableCell className="font-medium">{item.item_name}</TableCell>
                <TableCell>{item.item_type}</TableCell>
                <TableCell>{item.item_description || 'N/A'}</TableCell>
                <TableCell>
                  {item.item_image ? (
                    <img 
                      src={item.item_image} 
                      alt={item.item_name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : 'N/A'}
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
                      onClick={() => handleDelete(item.item_id)}
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

      {itemTypes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No item types found. Click "Add New Item Type" to create one.
        </div>
      )}
    </div>
  );
}