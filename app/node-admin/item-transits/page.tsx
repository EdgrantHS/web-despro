'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import Image from 'next/image';
import adminNodeImage from '@/assets/public/admin_node.png';

interface ItemInstance {
  item_instance_id: string;
  item_count: number;
  item_type?: {
    item_name: string;
    item_type: string;
  };
}

interface ItemTransit {
  item_transit_id: string;
  item_instance_id: string;
  source_node_id: string;
  dest_node_id?: string;
  time_departure: string;
  time_arrival?: string;
  courier_name?: string;
  courier_phone?: string;
  status: 'Active' | 'Completed' | 'Inactive';
  created_at?: string;
  updated_at?: string;
  item_instance?: ItemInstance;
  source_node?: {
    node_id: string;
    node_name: string;
  };
  dest_node?: {
    node_id: string;
    node_name: string;
  };
}

interface Node {
  id: string;
  name: string;
  type: string;
  location?: string;
}

export default function NodeAdminItemTransitsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [itemTransits, setItemTransits] = useState<ItemTransit[]>([]);
  const [userNode, setUserNode] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransit, setSelectedTransit] = useState<ItemTransit | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterSource, setFilterSource] = useState<string>('');
  const [filterDest, setFilterDest] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

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
      
      // Fetch item transits where this node is source or destination
      const transitsResponse = await fetch('/api/item-transits');
      const transitsData = await transitsResponse.json();
      
      if (transitsData.success) {
        // Filter transits where this node is source or destination
        const filteredTransits = (transitsData.data.transits || []).filter((transit: ItemTransit) => 
          transit.source_node_id === userNodeInfo.id || transit.dest_node_id === userNodeInfo.id
        );
        setItemTransits(filteredTransits);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTransitStatus = (transit: ItemTransit): { label: string; received: boolean } => {
    if (!userNode) return { label: 'Unknown', received: false };

    // Normalize status to lowercase for comparison
    const normalizedStatus = transit.status.toLowerCase();

    // If this node is the destination
    if (transit.dest_node_id === userNode.id) {
      const received = normalizedStatus === 'inactive';
      return {
        label: received ? 'Sudah Diterima' : 'Belum Diterima',
        received
      };
    }

    // If this node is the source
    if (transit.source_node_id === userNode.id) {
      const sent = normalizedStatus === 'active';
      return {
        label: sent ? 'Sudah Dikirim' : 'Belum Dikirim',
        received: sent
      };
    }

    return { label: 'Unknown', received: false };
  };

  const getTransitRole = (transit: ItemTransit): 'sender' | 'receiver' => {
    if (!userNode) return 'receiver';
    return transit.source_node_id === userNode.id ? 'sender' : 'receiver';
  };

  const isTransitCompleted = (transit: ItemTransit): boolean => {
    if (!userNode) return false;
    const transitStatus = getTransitStatus(transit);
    return transitStatus.received;
  };

  const getFilteredTransits = () => {
    return itemTransits.filter(transit => {
      const sourceMatch = !filterSource || transit.source_node?.node_id === filterSource;
      const destMatch = !filterDest || transit.dest_node?.node_id === filterDest;
      const roleMatch = !filterRole || getTransitRole(transit) === filterRole;
      const statusMatch = !filterStatus || (filterStatus === 'completed' ? isTransitCompleted(transit) : !isTransitCompleted(transit));
      return sourceMatch && destMatch && roleMatch && statusMatch;
    });
  };

  const getUniqueSourceNodes = () => {
    const unique = new Map();
    itemTransits.forEach(t => {
      if (t.source_node && !unique.has(t.source_node.node_id)) {
        unique.set(t.source_node.node_id, t.source_node);
      }
    });
    return Array.from(unique.values()).sort((a, b) => a.node_name.localeCompare(b.node_name));
  };

  const getUniqueDestNodes = () => {
    const unique = new Map();
    itemTransits.forEach(t => {
      if (t.dest_node && !unique.has(t.dest_node.node_id)) {
        unique.set(t.dest_node.node_id, t.dest_node);
      }
    });
    return Array.from(unique.values()).sort((a, b) => a.node_name.localeCompare(b.node_name));
  };

  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.username) return user.username;
    return 'Admin';
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
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-white text-black font-sans pb-24">
        <div className="text-center py-8 text-sm md:text-base">Loading your node information and item transits...</div>
      </div>
    );
  }

  if (!userNode) {
    return (
      <div className="w-full min-h-screen bg-white text-black font-sans pb-24">
        <div className="px-4 md:px-5 py-6">
          <div className="max-w-md mx-auto mt-10">
            <div className="text-center mb-6">
              <h1 className="text-xl md:text-2xl font-bold mb-2">Node Admin - Item Transits</h1>
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
          <Package size={28} className="md:w-7 md:h-7 w-6 h-6" />
          <h1 className="text-xl md:text-2xl font-semibold">Item Transits</h1>
        </div>
      </div>

      {/* Greeting */}
      <div className="px-4 md:px-5 mt-4 flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-3xl font-bold truncate">
            Hi <span className="text-blue-600">{getUserName()}!</span>
          </h2>
          <p className="text-gray-600 text-base md:text-lg">
            Managing transits for: <span className="font-semibold text-blue-600">{getUserNodeName()}</span>
          </p>
        </div>
      </div>

      {/* Welcome Card */}
      <div className="px-4 md:px-5 mt-4">
        <div className="border border-gray-200 rounded-xl p-3 md:p-4 flex items-center justify-between shadow-sm">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base md:text-lg">Item Transit Progress</h3>
            <p className="text-gray-600 text-sm md:text-base">Track items being sent from or received at your node</p>
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

      {/* Summary Stats */}
      <div className="px-4 md:px-5 mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-gray-600 font-medium">Total Transits</p>
          <p className="text-2xl md:text-3xl font-bold text-blue-600 mt-2">{getFilteredTransits().length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-gray-600 font-medium">Completed</p>
          <p className="text-2xl md:text-3xl font-bold text-green-600 mt-2">
            {getFilteredTransits().filter(t => isTransitCompleted(t)).length}
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-gray-600 font-medium">In Progress</p>
          <p className="text-2xl md:text-3xl font-bold text-yellow-600 mt-2">
            {getFilteredTransits().filter(t => !isTransitCompleted(t)).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 md:px-5 mt-6">
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
          <h3 className="text-base font-semibold mb-4">Filter Transits</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-2">From Node</label>
              <select 
                value={filterSource} 
                onChange={(e) => setFilterSource(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sources</option>
                {getUniqueSourceNodes().map(node => (
                  <option key={node.node_id} value={node.node_id}>{node.node_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-2">To Node</label>
              <select 
                value={filterDest} 
                onChange={(e) => setFilterDest(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Destinations</option>
                {getUniqueDestNodes().map(node => (
                  <option key={node.node_id} value={node.node_id}>{node.node_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-2">Your Role</label>
              <select 
                value={filterRole} 
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value="sender">Pengirim (Sender)</option>
                <option value="receiver">Penerima (Receiver)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-2">Status</label>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="completed">Completed (Sudah)</option>
                <option value="inprogress">In Progress (Belum)</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterSource('');
                  setFilterDest('');
                  setFilterRole('');
                  setFilterStatus('');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-4 md:px-5 mt-6">
        <h3 className="text-base md:text-lg font-semibold mb-4">Transit Records</h3>
        {isLoading ? (
          <div className="text-center py-8 text-sm md:text-base">Loading item transits...</div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
              <table className="w-full text-left text-[9px] md:text-sm min-w-[650px]">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Item</th>
                    <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">From</th>
                    <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">To</th>
                    <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Role</th>
                    <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Status</th>
                    <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Departure</th>
                    <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredTransits().length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-1.5 md:px-3 py-3 md:py-4 text-center text-gray-500 text-[9px] md:text-sm bg-white">
                        {itemTransits.length === 0 ? 'No item transits found for this node.' : 'No transits match your filters.'}
                      </td>
                    </tr>
                  ) : (
                    getFilteredTransits().map((transit, index) => {
                      const transitStatus = getTransitStatus(transit);
                      const role = getTransitRole(transit);
                      return (
                        <tr 
                          key={transit.item_transit_id || `transit-${index}`} 
                          className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} border-b border-gray-100 hover:bg-gray-100 transition-colors`}
                        >
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                            <div>
                              <p className="font-medium">{transit.item_instance?.item_type?.item_name || 'Unknown'}</p>
                              <p className="text-gray-500 text-[8px] md:text-xs">Qty: {transit.item_instance?.item_count || 0}</p>
                            </div>
                          </td>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                            {transit.source_node?.node_name || 'Unknown'}
                          </td>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                            {transit.dest_node?.node_name || 'N/A'}
                          </td>
                          <td className="px-1.5 md:px-3 py-1 md:py-2">
                            <span className={`px-1 md:px-2 py-0.5 md:py-1 rounded text-[8px] md:text-xs font-medium ${
                              role === 'sender'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {role === 'sender' ? 'Pengirim' : 'Penerima'}
                            </span>
                          </td>
                          <td className="px-1.5 md:px-3 py-1 md:py-2">
                            <span className={`px-1 md:px-2 py-0.5 md:py-1 rounded text-[8px] md:text-xs font-medium ${
                              transitStatus.received
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {transitStatus.label}
                            </span>
                          </td>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                            {formatDate(transit.time_departure)}
                          </td>
                          <td className="px-1.5 md:px-3 py-1 md:py-2">
                            <button
                              onClick={() => {
                                setSelectedTransit(transit);
                                setShowDetailModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-[9px] md:text-sm font-medium hover:underline transition-all"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedTransit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Transit Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Transit Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Transit ID</label>
                  <p className="font-mono text-sm mt-1">{selectedTransit.item_transit_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedTransit.status.toLowerCase() === 'active' ? 'bg-yellow-100 text-yellow-800' :
                      selectedTransit.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedTransit.status.charAt(0).toUpperCase() + selectedTransit.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Item Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-3">Item Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Item Name</label>
                    <p className="text-sm mt-1">{selectedTransit.item_instance?.item_type?.item_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Item Type</label>
                    <p className="text-sm mt-1">{selectedTransit.item_instance?.item_type?.item_type || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Quantity</label>
                    <p className="text-sm mt-1">{selectedTransit.item_instance?.item_count || 0} unit</p>
                  </div>
                </div>
              </div>

              {/* Route Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-3">Transit Route</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-600 block">From (Source)</label>
                      <p className="text-sm mt-1 font-semibold">{selectedTransit.source_node?.node_name || 'Unknown'}</p>
                    </div>
                    <Send size={20} className="text-gray-400 mt-4" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 block">To (Destination)</label>
                    <p className="text-sm mt-1 font-semibold">{selectedTransit.dest_node?.node_name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-3">Timeline</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Departure Time</label>
                    <p className="text-sm mt-1">{formatDate(selectedTransit.time_departure)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Arrival Time</label>
                    <p className="text-sm mt-1">{formatDate(selectedTransit.time_arrival) || 'Belum tiba'}</p>
                  </div>
                </div>
              </div>

              {/* Courier Info */}
              {(selectedTransit.courier_name || selectedTransit.courier_phone) && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-3">Courier Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-sm mt-1">{selectedTransit.courier_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-sm mt-1">{selectedTransit.courier_phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Your Progress */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-3">Your Progress</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Your Role</label>
                      <p className="text-sm mt-1 font-semibold">
                        {getTransitRole(selectedTransit) === 'sender' ? '📤 Pengirim' : '📥 Penerima'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Progress</label>
                      <p className="text-sm mt-1 font-semibold text-green-600">
                        {getTransitStatus(selectedTransit).label}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t px-6 py-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDetailModal(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
