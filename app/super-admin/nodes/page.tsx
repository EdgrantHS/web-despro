'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Node {
  id: string;
  name: string;
  type: string;
  location?: string;
}

interface NodeFormData {
  node_name: string;
  node_type: string;
  node_address: string;
  node_latitude: string;
  node_longitude: string;
}

export default function SuperAdminNodesPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [formData, setFormData] = useState<NodeFormData>({
    node_name: '',
    node_type: 'Source',
    node_address: '',
    node_latitude: '',
    node_longitude: ''
  });

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    try {
      const response = await fetch('/api/nodes');
      const data = await response.json();
      if (data.success) {
        setNodes(data.data);
      }
    } catch (error) {
      console.error('Error fetching nodes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      node_name: formData.node_name,
      node_type: formData.node_type,
      node_address: formData.node_address || undefined,
      node_latitude: formData.node_latitude ? parseFloat(formData.node_latitude) : undefined,
      node_longitude: formData.node_longitude ? parseFloat(formData.node_longitude) : undefined,
    };

    try {
      const url = editingNode ? `/api/node/${editingNode.id}` : '/api/node';
      const method = editingNode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        fetchNodes();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving node:', error);
    }
  };

  const handleDelete = async (nodeId: string) => {
    if (confirm('Are you sure you want to delete this node?')) {
      try {
        const response = await fetch(`/api/node/${nodeId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          fetchNodes();
        }
      } catch (error) {
        console.error('Error deleting node:', error);
      }
    }
  };

  const handleEdit = (node: Node) => {
    setEditingNode(node);
    setFormData({
      node_name: node.name,
      node_type: node.type,
      node_address: node.location || '',
      node_latitude: '',
      node_longitude: ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      node_name: '',
      node_type: 'Source',
      node_address: '',
      node_latitude: '',
      node_longitude: ''
    });
    setEditingNode(null);
    setShowForm(false);
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Super Admin - Nodes Management</h1>
          <p className="text-gray-600">Manage all nodes in the system</p>
        </div>
        <Button onClick={() => setShowForm(true)}>Add New Node</Button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">
            {editingNode ? 'Edit Node' : 'Add New Node'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="node_name">Node Name *</Label>
              <Input
                id="node_name"
                value={formData.node_name}
                onChange={(e) => setFormData({...formData, node_name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="node_type">Node Type *</Label>
              <select
                id="node_type"
                value={formData.node_type}
                onChange={(e) => setFormData({...formData, node_type: e.target.value})}
                className="w-full p-2 border rounded"
                required
              >
                <option value="Source">Source</option>
                <option value="Assembly">Assembly</option>
                <option value="Distribution">Distribution</option>
              </select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="node_address">Address</Label>
              <Input
                id="node_address"
                value={formData.node_address}
                onChange={(e) => setFormData({...formData, node_address: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="node_latitude">Latitude</Label>
              <Input
                id="node_latitude"
                type="number"
                step="any"
                value={formData.node_latitude}
                onChange={(e) => setFormData({...formData, node_latitude: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="node_longitude">Longitude</Label>
              <Input
                id="node_longitude"
                type="number"
                step="any"
                value={formData.node_longitude}
                onChange={(e) => setFormData({...formData, node_longitude: e.target.value})}
              />
            </div>
            <div className="col-span-2 flex gap-2">
              <Button type="submit">
                {editingNode ? 'Update' : 'Create'} Node
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
              <TableHead>Address</TableHead>
              <TableHead>Coordinates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nodes.map((node) => (
              <TableRow key={node.id}>
                <TableCell className="font-medium">{node.name}</TableCell>
                <TableCell>{node.type}</TableCell>
                <TableCell>{node.location || 'N/A'}</TableCell>
                <TableCell>
                  N/A
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                    Active
                  </span>
                </TableCell>
                <TableCell>-</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(node)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(node.id)}
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

      {nodes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No nodes found. Click "Add New Node" to create one.
        </div>
      )}
    </div>
  );
}