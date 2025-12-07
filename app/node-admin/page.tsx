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

interface ItemInstanceFormData {
  item_type_id: string;
  item_count: string;
  expire_date: string;
}

type ActiveTab = 'inventory' | 'recipes' | 'dev';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [itemInstances, setItemInstances] = useState<ItemInstance[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [devItemInstances, setDevItemInstances] = useState<ItemInstance[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [userNode, setUserNode] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('inventory');
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDevForm, setShowDevForm] = useState(false);
  const [devFormData, setDevFormData] = useState<ItemInstanceFormData>({
    item_type_id: '',
    item_count: '',
    expire_date: ''
  });
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUserNode();
    fetchNodes();
    fetchItemTypes();
  }, []);

  useEffect(() => {
    if (userNode) {
      fetchDataForActiveTab();
    }
  }, [userNode, activeTab, selectedNodeId]);

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
    }
  };

  const fetchItemTypes = async () => {
    try {
      const response = await fetch('/api/item-types');
      const data = await response.json();
      if (data.success && data.data.item_types) {
        setItemTypes(data.data.item_types);
      } else {
        setItemTypes([]);
      }
    } catch (error) {
      console.error('Error fetching item types:', error);
      setItemTypes([]);
    }
  };

  const fetchDataForActiveTab = async () => {
    if (!userNode) return;
    
    setIsLoading(true);
    try {
      if (activeTab === 'inventory') {
        const instancesRes = await fetch(`/api/item-instances?node_id=${userNode.id}`);
        const instancesData = await instancesRes.json();
        if (instancesData.success) {
          setItemInstances(instancesData.data.item_instances || []);
        }
      } else if (activeTab === 'recipes') {
        const recipesRes = await fetch(`/api/recipes?node_id=${userNode.id}`);
        const recipesData = await recipesRes.json();
        if (recipesData.success) {
          setRecipes(recipesData.data.recipes || []);
        }
      } else if (activeTab === 'dev') {
        // Fetch item instances for selected node in dev tab
        if (selectedNodeId) {
          const instancesRes = await fetch(`/api/item-instances?node_id=${selectedNodeId}`);
          const instancesData = await instancesRes.json();
          if (instancesData.success) {
            setDevItemInstances(instancesData.data.item_instances || []);
          }
        } else {
          setDevItemInstances([]);
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
    
    if (activeTab === 'inventory') {
      data = itemInstances;
    } else if (activeTab === 'recipes') {
      data = recipes;
    } else if (activeTab === 'dev') {
      data = devItemInstances;
    }

    if (!searchQuery) return data;
    
    const query = searchQuery.toLowerCase();
    
    if (activeTab === 'recipes') {
      return data.filter((item: Recipe) => {
        const name = item.name?.toLowerCase() || '';
        const resultName = item.item_types?.item_name?.toLowerCase() || '';
        return name.includes(query) || resultName.includes(query);
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

  const handleDevFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedNodeId) {
      alert('Please select a node first');
      return;
    }
    
    const payload = {
      item_type_id: devFormData.item_type_id,
      node_id: selectedNodeId,
      item_count: parseInt(devFormData.item_count),
      expire_date: devFormData.expire_date || undefined,
    };

    try {
      const response = await fetch('/api/item-instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        fetchDataForActiveTab();
        setDevFormData({
          item_type_id: '',
          item_count: '',
          expire_date: ''
        });
        setShowDevForm(false);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to create item instance');
      }
    } catch (error) {
      console.error('Error creating item instance:', error);
      alert('Failed to create item instance');
    }
  };

  const resetDevForm = () => {
    setDevFormData({
      item_type_id: '',
      item_count: '',
      expire_date: ''
    });
    setShowDevForm(false);
  };

  const getSelectedNodeName = () => {
    const node = nodes.find(n => n.id === selectedNodeId);
    return node ? `${node.name} ${node.type.charAt(0).toUpperCase()} (${node.type})` : 'None';
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
              setActiveTab('inventory');
              setCurrentPage(1);
              setSelectedNodeId('');
            }}
            className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-medium whitespace-nowrap flex-shrink-0 ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-md'
                : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
            }`}
          >
            Item Instances
          </button>
          <button
            onClick={() => {
              setActiveTab('recipes');
              setCurrentPage(1);
              setSelectedNodeId('');
            }}
            className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-medium whitespace-nowrap flex-shrink-0 ${
              activeTab === 'recipes'
                ? 'bg-blue-600 text-white shadow-md'
                : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
            }`}
          >
            Recipes
          </button>
          <button
            onClick={() => {
              setActiveTab('dev');
              setCurrentPage(1);
              // Don't reset selectedNodeId for dev tab, keep it if already selected
            }}
            className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-medium whitespace-nowrap flex-shrink-0 ${
              activeTab === 'dev'
                ? 'bg-blue-600 text-white shadow-md'
                : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
            }`}
          >
            Dev Item Instances
          </button>
        </div>
      </div>

      <div className="px-4 md:px-5 mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h3 className="text-base md:text-lg font-semibold">
            {activeTab === 'inventory' && 'Inventory Items'}
            {activeTab === 'recipes' && 'Recipes'}
            {activeTab === 'dev' && selectedNodeId && (
              <span>
                Dev Item Instances - {nodes.find(n => n.id === selectedNodeId)?.name || 'Selected Node'}
              </span>
            )}
            {activeTab === 'dev' && !selectedNodeId && 'Dev Item Instances'}
          </h3>
          {activeTab === 'inventory' && (
            <Button 
              onClick={() => router.push('/node-admin/item-instances')}
              className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium shadow-md flex items-center gap-2 w-full sm:w-auto"
            >
              <Plus size={14} className="md:w-4 md:h-4 w-3.5 h-3.5" />
              <span>Add New</span>
            </Button>
          )}
          {activeTab === 'recipes' && (
            <Button 
              onClick={() => router.push('/node-admin/recipes')}
              className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium shadow-md flex items-center gap-2 w-full sm:w-auto"
            >
              <Plus size={14} className="md:w-4 md:h-4 w-3.5 h-3.5" />
              <span>Add New Recipe</span>
            </Button>
          )}
          {activeTab === 'dev' && selectedNodeId && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedNodeId('');
                  setCurrentPage(1);
                  setShowDevForm(false);
                }}
                className="text-xs md:text-sm"
              >
                Change Node
              </Button>
              <Button 
                onClick={() => setShowDevForm(true)}
                className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium shadow-md flex items-center gap-2"
              >
                <Plus size={14} className="md:w-4 md:h-4 w-3.5 h-3.5" />
                <span>Add New</span>
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-sm md:text-base">Loading...</div>
        ) : (
          <>
            {activeTab === 'dev' && showDevForm && selectedNodeId ? (
              <div className="px-4 md:px-5 mt-4">
                <div className="border border-gray-200 rounded-xl p-4 md:p-5 bg-gray-50 shadow-sm">
                  <h2 className="text-lg md:text-xl font-semibold mb-4">Add New Item Instance</h2>
                  <form onSubmit={handleDevFormSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="dev_item_type_id" className="block text-sm md:text-base font-medium mb-2">
                        Item Type *
                      </label>
                      <select
                        id="dev_item_type_id"
                        value={devFormData.item_type_id}
                        onChange={(e) => setDevFormData({...devFormData, item_type_id: e.target.value})}
                        className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg md:rounded-xl text-sm md:text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <label htmlFor="dev_current_node" className="block text-sm md:text-base font-medium mb-2">
                        Current Node
                      </label>
                      <input
                        id="dev_current_node"
                        type="text"
                        value={getSelectedNodeName()}
                        disabled
                        className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg md:rounded-xl text-sm md:text-base bg-gray-100 cursor-not-allowed"
                      />
                      <p className="text-xs md:text-sm text-gray-500 mt-1">
                        Auto-selected based on your node access
                      </p>
                    </div>
                    <div>
                      <label htmlFor="dev_item_count" className="block text-sm md:text-base font-medium mb-2">
                        Item Count *
                      </label>
                      <input
                        id="dev_item_count"
                        type="number"
                        min="1"
                        value={devFormData.item_count}
                        onChange={(e) => setDevFormData({...devFormData, item_count: e.target.value})}
                        className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg md:rounded-xl text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="dev_expire_date" className="block text-sm md:text-base font-medium mb-2">
                        Expire Date
                      </label>
                      <input
                        id="dev_expire_date"
                        type="date"
                        value={devFormData.expire_date}
                        onChange={(e) => setDevFormData({...devFormData, expire_date: e.target.value})}
                        placeholder="dd/mm/yyyy"
                        className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg md:rounded-xl text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-2 md:gap-3 pt-2">
                      <Button 
                        type="submit"
                        className="bg-blue-600 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-sm md:text-base font-medium shadow-md"
                      >
                        Create Item Instance
                      </Button>
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={resetDevForm}
                        className="px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-sm md:text-base font-medium"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            ) : activeTab === 'dev' && !selectedNodeId ? (
              <div className="px-4 md:px-5">
                <div className="text-center mb-4 md:mb-6">
                  <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">Node Admin - Item Instances</h3>
                  <p className="text-gray-600 text-sm md:text-base">Select a node to manage its item instances</p>
                </div>
                
                <div className="border border-gray-200 rounded-xl p-3 md:p-4 shadow-sm bg-white">
                  <label htmlFor="node_select" className="text-sm md:text-base font-medium block mb-2">
                    Select Your Node
                  </label>
                  <select
                    id="node_select"
                    value={selectedNodeId}
                    onChange={(e) => {
                      setSelectedNodeId(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg md:rounded-xl text-sm md:text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a node...</option>
                    {Array.isArray(nodes) && nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.name} ({node.type}) - {node.location || 'No location'}
                      </option>
                    ))}
                  </select>
                  
                  <p className="text-xs md:text-sm text-gray-500 mt-2 md:mt-3">
                    Note: In the future, this will be automatically selected based on your login.
                  </p>
                </div>
              </div>
            ) : activeTab === 'recipes' ? (
              <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                <table className="w-full text-left text-[9px] md:text-sm min-w-[550px]">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Recipe Name</th>
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Result Item</th>
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Ingredients Count</th>
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Node</th>
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Created</th>
                      <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-1.5 md:px-3 py-3 md:py-4 text-center text-gray-500 text-[9px] md:text-sm">
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
                          <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">{formatDate(recipe.created_at)}</td>
                          <td className="px-1.5 md:px-3 py-1 md:py-2">
                            <div className="flex gap-0.5 md:gap-2">
                              <button
                                onClick={() => handleEditRecipe(recipe)}
                                className="text-blue-600 hover:text-blue-800 text-[9px] md:text-sm font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteRecipe(recipe.id)}
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
            ) : (
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
                      paginatedData.map((item: ItemInstance, index) => (
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
                                onClick={() => {
                                  if (activeTab === 'inventory') {
                                    handleEdit(item);
                                  } else {
                                    // For dev tab, navigate to item-instances-dev page
                                    sessionStorage.setItem('editItemInstance', JSON.stringify(item));
                                    sessionStorage.setItem('selectedNodeId', selectedNodeId);
                                    router.push('/node-admin/item-instances-dev');
                                  }
                                }}
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