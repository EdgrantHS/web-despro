'use client';

import React, { useState, useEffect } from "react";
import { Search, User, Grid2x2, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
}

interface Node {
  id: string;
  name: string;
  type: string;
  location?: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [itemInstances, setItemInstances] = useState<ItemInstance[]>([]);
  const [userNode, setUserNode] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      
      // Now fetch item instances for this specific node
      const instancesRes = await fetch(`/api/item-instances?node_id=${userNodeInfo.id}`);
      const instancesData = await instancesRes.json();
      
      if (instancesData.success) {
        setItemInstances(instancesData.data.item_instances || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const filteredData = itemInstances.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const itemName = item.item_type?.item_name?.toLowerCase() || '';
    const itemType = item.item_type?.item_type?.toLowerCase() || '';
    return itemName.includes(query) || itemType.includes(query);
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

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
    // Store item to edit in sessionStorage so item-instances page can pick it up
    sessionStorage.setItem('editItemInstance', JSON.stringify(item));
    router.push('/node-admin/item-instances');
  };

  return (
    <div className="w-full min-h-screen bg-white text-black font-sans pb-24">
      <div 
        className="bg-blue-600 text-white px-4 pt-10 pb-6 rounded-b-3xl shadow-md"
        style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}
      >
        <div className="flex items-center gap-3">
          <Grid2x2 size={28} className="md:w-7 md:h-7 w-6 h-6" />
          <h1 className="text-xl md:text-2xl font-semibold">Dashboard</h1>
        </div>
      </div>

      <div className="px-4 md:px-5 mt-4 flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-3xl font-bold truncate">
            Hi <span className="text-blue-600">{getUserName()}!</span>
          </h2>
          <p className="text-gray-600 text-base md:text-lg">{getGreeting()}, Admin</p>
        </div>
        <User size={28} className="md:w-8 md:h-8 w-7 h-7 flex-shrink-0 ml-2" />
      </div>

      <div className="px-4 md:px-5 mt-4">
        <div className="border border-gray-200 rounded-xl p-3 md:p-4 flex items-center justify-between shadow-sm">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base md:text-lg">Welcome!</h3>
            <p className="text-gray-600 text-sm md:text-base">Let's get started with your tasks</p>
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

      <div className="px-4 md:px-5 mt-4 overflow-x-auto">
        <div className="flex gap-1.5 md:gap-3 min-w-max">
          <button className="bg-blue-600 text-white px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-medium shadow-md whitespace-nowrap">
            Inventory ({itemInstances.length})
          </button>
          <button className="border border-blue-600 text-blue-600 px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-medium whitespace-nowrap">
            Menu (20)
          </button>
          <button className="border border-blue-600 text-blue-600 px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-medium whitespace-nowrap">
            Report (13)
          </button>
          <button className="border border-blue-600 text-blue-600 px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-medium whitespace-nowrap">
            User (15)
          </button>
        </div>
      </div>

      <div className="px-4 md:px-5 mt-5">
        <div className="flex items-center gap-2 bg-gray-100 px-3 md:px-4 py-2.5 md:py-3 rounded-2xl">
          <Search size={18} className="text-gray-400 md:w-5 md:h-5 w-4 h-4 flex-shrink-0" />
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full bg-transparent outline-none text-sm md:text-base" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <div className="px-4 md:px-5 mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h3 className="text-base md:text-lg font-semibold">Inventory Items</h3>
          <Button 
            onClick={() => router.push('/node-admin/item-instances')}
            className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium shadow-md flex items-center gap-2 w-full sm:w-auto"
          >
            <Plus size={14} className="md:w-4 md:h-4 w-3.5 h-3.5" />
            <span>Add New</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-sm md:text-base">Loading...</div>
        ) : (
          <>
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
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-1.5 md:px-3 py-3 md:py-4 text-center text-gray-500 text-[9px] md:text-sm">
                        No items found
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item, index) => (
                      <tr key={item.item_instance_id || `item-${index}`} className={index % 2 === 0 ? "bg-gray-100" : "bg-gray-200"}>
                        <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                          {item.item_type 
                            ? `${item.item_type.item_name} (${item.item_type.item_type})` 
                            : 'N/A'}
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
                              className="text-blue-600 hover:text-blue-800 text-[9px] md:text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.item_instance_id)}
                              className="text-red-600 hover:text-red-800 text-[9px] md:text-sm font-medium"
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

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 md:gap-6 mt-6 md:mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                >
                  <ChevronLeft size={24} className="md:w-7 md:h-7 w-6 h-6" />
                </button>
                <span className="text-xl md:text-2xl font-semibold">{currentPage}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                >
                  <ChevronRight size={24} className="md:w-7 md:h-7 w-6 h-6" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="text-center mt-8 md:mt-10 px-4">
        <p className="font-semibold text-base md:text-lg">Having trouble or found a bug?</p>
        <p className="text-gray-700 text-sm md:text-base mt-1">
          Tap <span className="text-blue-600 font-medium">Admin</span> to get quick help — we're here to support you.
        </p>
      </div>
    </div>
  );
}