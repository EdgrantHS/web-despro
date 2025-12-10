'use client';

import React, { useState, useEffect } from "react";
import { Search, User, Grid2x2, ChevronLeft, ChevronRight, Eye } from "lucide-react";
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

interface RecipeIngredient {
  id?: string;
  item_id: string;
  quantity: number;
  note?: string;
  item_types?: {
    item_id: string;
    item_name: string;
  };
}

interface Recipe {
  id: string;
  name: string;
  node_id?: string;
  result_id: string;
  instructions?: string;
  created_at: string;
  item_types?: {
    item_id: string;
    item_name: string;
  };
  recipe_ingredients?: RecipeIngredient[];
}

interface Node {
  id: string;
  name: string;
  type: string;
  location?: string;
}

interface ItemType {
  item_id: string;
  item_name: string;
  item_type: string;
}

interface InventoryItem {
  item_id: string;
  item_name: string;
  item_type: string;
  units: string | null;
  total_count: number;
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

interface ReportDetail {
  id: string;
  type: 'STOCK_DISCREPANCY' | 'EXPIRED_ITEM' | 'OTHER_ISSUE';
  status: 'IN_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  description?: string;
  evidence?: string;
  quantities: {
    received: number | null;
    expired: number | null;
  };
  created_at: string;
  user?: {
    id: string;
    node_id: string;
  };
  item_transit?: {
    id: string;
    item_id: string;
    source_node_id: string;
    destination_node_id: string;
    status: string;
    item_instance?: {
      item_name: string | null;
      item_type: string | null;
    };
  };
}

interface ItemInstanceFormData {
  item_type_id: string;
  item_count: string;
  expire_date: string;
}

type ActiveTab = 'item-instances' | 'inventory-summary' | 'recipes' | 'item-transit' | 'reports';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [itemInstances, setItemInstances] = useState<ItemInstance[]>([]);
  const [inventorySummary, setInventorySummary] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [itemTransits, setItemTransits] = useState<ItemTransit[]>([]);
  const [reports, setReports] = useState<ReportDetail[]>([]);
  const [userNode, setUserNode] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('reports');
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUserNode();
  }, []);

  useEffect(() => {
    if (userNode) {
      fetchDataForActiveTab();
    }
  }, [userNode, activeTab]);

  const fetchUserNode = async () => {
    try {
      const nodeResponse = await fetch('/api/user/node');
      const nodeData = await nodeResponse.json();
      
      if (!nodeData.success) {
        console.error('Error fetching user node:', nodeData.message);
        return;
      }
      
      const userNodeInfo = nodeData.data.node;
      setUserNode(userNodeInfo);
    } catch (error) {
      console.error('Error fetching user node:', error);
    }
  };

  const fetchDataForActiveTab = async () => {
    if (!userNode) return;
    
    setIsLoading(true);
    try {
      if (activeTab === 'item-instances') {
        const instancesRes = await fetch(`/api/item-instances?node_id=${userNode.id}`);
        const instancesData = await instancesRes.json();
        if (instancesData.success) {
          setItemInstances(instancesData.data.item_instances || []);
        }
      } else if (activeTab === 'inventory-summary') {
        const inventoryRes = await fetch(`/api/inventory?node_id=${userNode.id}`);
        const inventoryData = await inventoryRes.json();
        if (inventoryData.success) {
          setInventorySummary(inventoryData.data.inventory || []);
        }
      } else if (activeTab === 'recipes') {
        const recipesRes = await fetch(`/api/recipes?node_id=${userNode.id}`);
        const recipesData = await recipesRes.json();
        if (recipesData.success) {
          setRecipes(recipesData.data.recipes || []);
        }
      } else if (activeTab === 'item-transit') {
        const transitsResponse = await fetch('/api/item-transits');
        const transitsData = await transitsResponse.json();
        if (transitsData.success) {
          const filteredTransits = (transitsData.data.transits || []).filter((transit: ItemTransit) => 
            (transit.source_node_id === userNode.id || transit.dest_node_id === userNode.id) &&
            transit.status === 'active'
          );
          setItemTransits(filteredTransits);
        }
      } else if (activeTab === 'reports') {
        const reportsResponse = await fetch(`/api/reports?node_id=${userNode.id}`);
        const reportsData = await reportsResponse.json();
        if (reportsData.success) {
          const filteredReports = (reportsData.data.reports || []).filter((report: ReportDetail) => 
            report.status !== 'RESOLVED' && report.status !== 'REJECTED'
          );
          setReports(filteredReports);
        }
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

  const getFilteredData = () => {
    let data: any[] = [];
    
    if (activeTab === 'item-instances') {
      data = itemInstances;
    } else if (activeTab === 'inventory-summary') {
      data = inventorySummary;
    } else if (activeTab === 'recipes') {
      data = recipes;
    } else if (activeTab === 'item-transit') {
      data = itemTransits;
    } else if (activeTab === 'reports') {
      data = reports;
    }

    if (!searchQuery) return data;
    
    const query = searchQuery.toLowerCase();
    
    if (activeTab === 'recipes') {
      return data.filter((item: Recipe) => {
        const name = item.name?.toLowerCase() || '';
        const resultName = item.item_types?.item_name?.toLowerCase() || '';
        return name.includes(query) || resultName.includes(query);
      });
    } else if (activeTab === 'inventory-summary') {
      return data.filter((item: InventoryItem) => {
        const name = item.item_name?.toLowerCase() || '';
        const type = item.item_type?.toLowerCase() || '';
        return name.includes(query) || type.includes(query);
      });
    } else if (activeTab === 'item-transit') {
      return data.filter((item: ItemTransit) => {
        const itemName = item.item_instance?.item_type?.item_name?.toLowerCase() || '';
        const source = item.source_node?.node_name?.toLowerCase() || '';
        const dest = item.dest_node?.node_name?.toLowerCase() || '';
        return itemName.includes(query) || source.includes(query) || dest.includes(query);
      });
    } else if (activeTab === 'reports') {
      return data.filter((item: ReportDetail) => {
        const type = item.type?.toLowerCase() || '';
        const status = item.status?.toLowerCase() || '';
        const description = item.description?.toLowerCase() || '';
        return type.includes(query) || status.includes(query) || description.includes(query);
      });
    } else {
      return data.filter((item: ItemInstance) => {
        const itemName = item.item_type?.item_name?.toLowerCase() || '';
        const itemType = item.item_type?.item_type?.toLowerCase() || '';
        return itemName.includes(query) || itemType.includes(query);
      });
    }
  };

  const filteredData = getFilteredData();
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
          fetchDataForActiveTab();
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

  const handleEditRecipe = (recipe: Recipe) => {
    // Store recipe to edit in sessionStorage so recipes page can pick it up
    sessionStorage.setItem('editRecipe', JSON.stringify(recipe));
    router.push('/node-admin/recipes');
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (confirm('Are you sure you want to delete this recipe? This will also delete all ingredients.')) {
      try {
        const response = await fetch(`/api/recipes/${recipeId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          fetchDataForActiveTab();
        }
      } catch (error) {
        console.error('Error deleting recipe:', error);
      }
    }
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

      {/* <div className="px-4 md:px-5 mt-4 overflow-x-auto">
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
      </div> */}

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

      <div className="px-4 md:px-5 mt-3">
        <div className="flex gap-1.5 md:gap-3 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('item-instances');
              setCurrentPage(1);
            }}
            className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-medium whitespace-nowrap flex-shrink-0 ${
              activeTab === 'item-instances'
                ? 'bg-blue-600 text-white shadow-md'
                : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
            }`}
          >
            Item Instances
          </button>
          <button
            onClick={() => {
              setActiveTab('inventory-summary');
              setCurrentPage(1);
            }}
            className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-medium whitespace-nowrap flex-shrink-0 ${
              activeTab === 'inventory-summary'
                ? 'bg-blue-600 text-white shadow-md'
                : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => {
              setActiveTab('item-transit');
              setCurrentPage(1);
            }}
            className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-medium whitespace-nowrap flex-shrink-0 ${
              activeTab === 'item-transit'
                ? 'bg-blue-600 text-white shadow-md'
                : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
            }`}
          >
            Item Transit
          </button>
          <button
            onClick={() => {
              setActiveTab('reports');
              setCurrentPage(1);
            }}
            className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-medium whitespace-nowrap flex-shrink-0 ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white shadow-md'
                : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => {
              setActiveTab('recipes');
              setCurrentPage(1);
            }}
            className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-medium whitespace-nowrap flex-shrink-0 ${
              activeTab === 'recipes'
                ? 'bg-blue-600 text-white shadow-md'
                : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
            }`}
          >
            Resep
          </button>
        </div>
      </div>

      <div className="px-4 md:px-5 mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h3 className="text-base md:text-lg font-semibold">
            {activeTab === 'item-instances' && 'Inventory Items'}
            {activeTab === 'inventory-summary' && 'Inventory Summary'}
            {activeTab === 'item-transit' && 'Item Transit'}
            {activeTab === 'reports' && 'Reports'}
            {activeTab === 'recipes' && 'Resep'}
          </h3>
          {activeTab === 'item-instances' && (
            <Button 
              onClick={() => router.push('/node-admin/item-instances')}
              className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium shadow-md flex items-center gap-2 w-full sm:w-auto"
            >
              <Eye size={14} className="md:w-4 md:h-4 w-3.5 h-3.5" />
              <span>View Page</span>
            </Button>
          )}
          {activeTab === 'inventory-summary' && (
            <Button 
              onClick={() => router.push('/node-admin/inventory')}
              className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium shadow-md flex items-center gap-2 w-full sm:w-auto"
            >
              <Eye size={14} className="md:w-4 md:h-4 w-3.5 h-3.5" />
              <span>View Page</span>
            </Button>
          )}
          {activeTab === 'item-transit' && (
            <Button 
              onClick={() => router.push('/node-admin/item-transits')}
              className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium shadow-md flex items-center gap-2 w-full sm:w-auto"
            >
              <Eye size={14} className="md:w-4 md:h-4 w-3.5 h-3.5" />
              <span>View Page</span>
            </Button>
          )}
          {activeTab === 'reports' && (
            <Button 
              onClick={() => router.push('/node-admin/reports')}
              className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium shadow-md flex items-center gap-2 w-full sm:w-auto"
            >
              <Eye size={14} className="md:w-4 md:h-4 w-3.5 h-3.5" />
              <span>View Page</span>
            </Button>
          )}
          {activeTab === 'recipes' && (
            <Button 
              onClick={() => router.push('/node-admin/recipes')}
              className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium shadow-md flex items-center gap-2 w-full sm:w-auto"
            >
              <Eye size={14} className="md:w-4 md:h-4 w-3.5 h-3.5" />
              <span>View Page</span>
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-sm md:text-base">Loading...</div>
        ) : (
          <>
            {activeTab === 'recipes' ? (
              <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                <table className="w-full text-left text-[9px] md:text-sm min-w-[550px]">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Recipe Name</th>
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Result Item</th>
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Ingredients Count</th>
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Node</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-1.5 md:px-3 py-3 md:py-4 text-center text-gray-500 text-[9px] md:text-sm">
                          No recipes found
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((recipe: Recipe, index) => (
                        <tr key={recipe.id || `recipe-${index}`} className={index % 2 === 0 ? "bg-gray-100" : "bg-gray-200"}>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">{recipe.name || 'N/A'}</td>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                            {recipe.item_types?.item_name || 'N/A'}
                          </td>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                            {recipe.recipe_ingredients?.length || 0} ingredients
                          </td>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                            <span className={`px-1 md:px-2 py-0.5 md:py-1 rounded text-[8px] md:text-xs ${
                              recipe.node_id
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {recipe.node_id ? 'Local' : 'Global'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : activeTab === 'inventory-summary' ? (
              <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                <table className="w-full text-left text-[9px] md:text-sm min-w-[550px]">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Item Name</th>
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Type</th>
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Total Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-1.5 md:px-3 py-3 md:py-4 text-center text-gray-500 text-[9px] md:text-sm">
                          No inventory found
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((item: InventoryItem, index) => (
                        <tr key={item.item_id || `inv-${index}`} className={index % 2 === 0 ? "bg-gray-100" : "bg-gray-200"}>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">{item.item_name}</td>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">{item.item_type}</td>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-bold">
                            {item.total_count} {item.units || ''}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : activeTab === 'item-transit' ? (
              <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                <table className="w-full text-left text-[9px] md:text-sm min-w-[550px]">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Item</th>
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Source</th>
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Destination</th>
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Departure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-1.5 md:px-3 py-3 md:py-4 text-center text-gray-500 text-[9px] md:text-sm">
                          No item transits found
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((transit: ItemTransit, index) => (
                        <tr key={transit.item_transit_id || `transit-${index}`} className={index % 2 === 0 ? "bg-gray-100" : "bg-gray-200"}>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                            {transit.item_instance?.item_type?.item_name || 'N/A'}
                          </td>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                            {transit.source_node?.node_name || 'N/A'}
                          </td>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                            {transit.dest_node?.node_name || 'N/A'}
                          </td>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">{formatDate(transit.time_departure)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : activeTab === 'reports' ? (
              <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                <table className="w-full text-left text-[9px] md:text-sm min-w-[550px]">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Type</th>
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Status</th>
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Description</th>
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-1.5 md:px-3 py-3 md:py-4 text-center text-gray-500 text-[9px] md:text-sm">
                          No reports found
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((report: ReportDetail, index) => (
                        <tr key={report.id || `report-${index}`} className={index % 2 === 0 ? "bg-gray-100" : "bg-gray-200"}>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                            {report.type.replace('_', ' ')}
                          </td>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                            <span className={`px-1 md:px-2 py-0.5 md:py-1 rounded text-[8px] md:text-xs ${
                              report.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                              report.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm truncate max-w-[150px]">
                            {report.description || 'N/A'}
                          </td>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">{formatDate(report.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                <table className="w-full text-left text-[9px] md:text-sm min-w-[550px]">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Item Name</th>
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Item Type</th>
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Count</th>
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Expire Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-1.5 md:px-3 py-3 md:py-4 text-center text-gray-500 text-[9px] md:text-sm">
                          No items found
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((item: ItemInstance, index) => (
                        <tr key={item.item_instance_id || `item-${index}`} className={index % 2 === 0 ? "bg-gray-100" : "bg-gray-200"}>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                            {item.item_type?.item_name || 'N/A'}
                          </td>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                            {item.item_type?.item_type || 'N/A'}
                          </td>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">{item.item_count}</td>
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">{formatDate(item.expire_date)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

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