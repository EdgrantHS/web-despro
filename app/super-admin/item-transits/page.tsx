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

interface ItemTransit {
  item_transit_id: string;
  item_instance_id: string;
  source_node_id: string;
  dest_node_id: string;
  time_departure: string;
  time_arrival?: string;
  courier_name?: string;
  courier_phone?: string;
  qr_url?: string;
  created_at: string;
  item_instance?: {
    item_instance_id: string;
    item_count: number;
    item_type?: {
      item_name: string;
      item_type: string;
    };
  };
  source_node?: {
    node_id: string;
    node_name: string;
  };
  dest_node?: {
    node_id: string;
    node_name: string;
  };
}

interface ItemInstance {
  id?: string; // Support new field mapping
  item_instance_id?: string; // Support old field mapping for compatibility
  item_count: number;
  item_type?: {
    item_name: string;
  };
}

interface Node {
  id: string;
  name: string;
  type: string;
  location?: string;
}

interface ItemTransitFormData {
  item_instance_id: string;
  source_node_id: string;
  dest_node_id: string;
  time_departure: string;
  courier_name: string;
  courier_phone: string;
  qr_url: string;
}

export default function SuperAdminItemTransitsPage() {
  const [itemTransits, setItemTransits] = useState<ItemTransit[]>([]);
  const [itemInstances, setItemInstances] = useState<ItemInstance[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemTransit | null>(null);
  const [formData, setFormData] = useState<ItemTransitFormData>({
    item_instance_id: '',
    source_node_id: '',
    dest_node_id: '',
    time_departure: '',
    courier_name: '',
    courier_phone: '',
    qr_url: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transitsRes, instancesRes, nodesRes] = await Promise.all([
        fetch('/api/item-transits'),
        fetch('/api/item-instances'),
        fetch('/api/nodes')
      ]);
      
      const [transitsData, instancesData, nodesData] = await Promise.all([
        transitsRes.json(),
        instancesRes.json(),
        nodesRes.json()
      ]);
      
      if (transitsData.success && transitsData.data.transits) {
        setItemTransits(transitsData.data.transits);
      }
      if (instancesData.success && instancesData.data.item_instances) {
        setItemInstances(instancesData.data.item_instances);
      }
      if (nodesData.success && nodesData.data.nodes) {
        setNodes(nodesData.data.nodes);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setItemTransits([]);
      setItemInstances([]);
      setNodes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      item_instance_id: formData.item_instance_id,
      source_node_id: formData.source_node_id,
      dest_node_id: formData.dest_node_id || undefined,
      time_departure: formData.time_departure,
      courier_name: formData.courier_name || undefined,
      courier_phone: formData.courier_phone || undefined,
      qr_url: formData.qr_url || undefined,
    };

    try {
      const url = editingItem ? `/api/item-transit/${editingItem.item_transit_id}` : '/api/item-transit';
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
      console.error('Error saving item transit:', error);
    }
  };

  const handleComplete = async (transitId: string) => {
    const arrivalTime = new Date().toISOString();
    
    try {
      const response = await fetch(`/api/item-transit/${transitId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_arrival: arrivalTime })
      });
      
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error completing transit:', error);
    }
  };

  const handleEdit = (item: ItemTransit) => {
    setEditingItem(item);
    setFormData({
      item_instance_id: item.item_instance_id,
      source_node_id: item.source_node_id,
      dest_node_id: item.dest_node_id,
      time_departure: item.time_departure.split('T')[0] + 'T' + item.time_departure.split('T')[1]?.split('.')[0],
      courier_name: item.courier_name || '',
      courier_phone: item.courier_phone || '',
      qr_url: item.qr_url || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      item_instance_id: '',
      source_node_id: '',
      dest_node_id: '',
      time_departure: '',
      courier_name: '',
      courier_phone: '',
      qr_url: ''
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
          <h1 className="text-2xl font-bold">Super Admin - Item Transits Management</h1>
          <p className="text-gray-600">Manage all transits across all nodes</p>
        </div>
        <Button onClick={() => setShowForm(true)}>Add New Transit</Button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? 'Edit Transit' : 'Add New Transit'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="item_instance_id">Item Instance *</Label>
              <select
                id="item_instance_id"
                value={formData.item_instance_id}
                onChange={(e) => setFormData({...formData, item_instance_id: e.target.value})}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Item Instance</option>
                {Array.isArray(itemInstances) && itemInstances.map((instance) => (
                  <option key={instance.id || instance.item_instance_id} value={instance.id || instance.item_instance_id}>
                    {instance.item_type?.item_name || 'Unknown'} (Count: {instance.item_count})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="source_node_id">Source Node *</Label>
              <select
                id="source_node_id"
                value={formData.source_node_id}
                onChange={(e) => setFormData({...formData, source_node_id: e.target.value})}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Source Node</option>
                {Array.isArray(nodes) && nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name} ({node.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="dest_node_id">Destination Node</Label>
              <select
                id="dest_node_id"
                value={formData.dest_node_id}
                onChange={(e) => setFormData({...formData, dest_node_id: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Destination Node (Optional)</option>
                {Array.isArray(nodes) && nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name} ({node.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="time_departure">Departure Time *</Label>
              <Input
                id="time_departure"
                type="datetime-local"
                value={formData.time_departure}
                onChange={(e) => setFormData({...formData, time_departure: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="courier_name">Courier Name</Label>
              <Input
                id="courier_name"
                value={formData.courier_name}
                onChange={(e) => setFormData({...formData, courier_name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="courier_phone">Courier Phone</Label>
              <Input
                id="courier_phone"
                value={formData.courier_phone}
                onChange={(e) => setFormData({...formData, courier_phone: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="qr_url">QR URL</Label>
              <Input
                id="qr_url"
                value={formData.qr_url}
                onChange={(e) => setFormData({...formData, qr_url: e.target.value})}
              />
            </div>
            <div className="col-span-2 flex gap-2">
              <Button type="submit">
                {editingItem ? 'Update' : 'Create'} Transit
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
              <TableHead>Item</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Departure</TableHead>
              <TableHead>Arrival</TableHead>
              <TableHead>Courier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(itemTransits) && itemTransits.map((transit) => (
              <TableRow key={transit.item_transit_id}>
                <TableCell className="font-medium">
                  {transit.item_instance?.item_type?.item_name || 'Unknown'}
                  <div className="text-xs text-gray-500">
                    Count: {transit.item_instance?.item_count || 'N/A'}
                  </div>
                </TableCell>
                <TableCell>{transit.source_node?.node_name || 'N/A'}</TableCell>
                <TableCell>{transit.dest_node?.node_name || 'N/A'}</TableCell>
                <TableCell>{new Date(transit.time_departure).toLocaleString()}</TableCell>
                <TableCell>
                  {transit.time_arrival ? new Date(transit.time_arrival).toLocaleString() : 'In Transit'}
                </TableCell>
                <TableCell>
                  {transit.courier_name || 'N/A'}
                  {transit.courier_phone && (
                    <div className="text-xs text-gray-500">{transit.courier_phone}</div>
                  )}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${
                    transit.time_arrival 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transit.time_arrival ? 'Completed' : 'In Transit'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(transit)}
                    >
                      Edit
                    </Button>
                    {!transit.time_arrival && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleComplete(transit.item_transit_id)}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {(!Array.isArray(itemTransits) || itemTransits.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          No transits found. Click "Add New Transit" to create one.
        </div>
      )}
    </div>
  );
}