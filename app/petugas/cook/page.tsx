'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { createClient } from '@/utils/supabase/client';
import { ChefHat, LogOut, ArrowLeft, CheckCircle, XCircle, AlertTriangle, Clock, Plus, X } from 'lucide-react';

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

interface RecipeIngredient {
  id?: string;
  item_id: string;
  quantity: number;
  note?: string;
  item_types?: {
    item_id: string;
    item_name: string;
  };
  available_stock?: number;
}

interface Node {
  id: string;
  name: string;
  type: string;
  location?: string;
}

interface CookFormData {
  recipe_id: string;
  quantity: string;
  expire_date: string;
}

interface CookHistory {
  id: string;
  recipe_id: string;
  recipe_name: string;
  result_item_name: string;
  quantity: number;
  expire_date?: string;
  ingredients_used: Array<{
    item_instance_id: string;
    item_name: string;
    quantity_used: number;
    remaining: number;
  }>;
  created_at: string;
  status: 'success' | 'error';
  message?: string;
}

export default function PetugasCookPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isCooking, setIsCooking] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [cookHistory, setCookHistory] = useState<CookHistory[]>([]);
  const [userNode, setUserNode] = useState<Node | null>(null);
  const [ingredientStock, setIngredientStock] = useState<Record<string, number>>({});

  const [formData, setFormData] = useState<CookFormData>({
    recipe_id: '',
    quantity: '1',
    expire_date: ''
  });

  useEffect(() => {
    fetchCurrentUserNode();
  }, []);

  useEffect(() => {
    if (userNode) {
      fetchRecipes();
    }
  }, [userNode]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const fetchCurrentUserNode = async () => {
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
      console.error('Error getting user node data:', error);
    }
  };

  const fetchStockData = async () => {
    try {
      const stockRes = await fetch(`/api/item-instances?node_id=${userNode?.id}`);
      const stockData = await stockRes.json();
      
      if (stockData.success) {
        const stockMap: Record<string, number> = {};
        stockData.data.item_instances.forEach((instance: any) => {
          const itemId = instance.item_type_id;
          stockMap[itemId] = (stockMap[itemId] || 0) + instance.item_count;
        });
        
        setIngredientStock(stockMap);
        return stockMap;
      }
      return {};
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return {};
    }
  };

  const updateRecipesWithStock = (recipesData: Recipe[], stockMap: Record<string, number>) => {
    return recipesData.map((recipe: Recipe) => ({
      ...recipe,
      recipe_ingredients: recipe.recipe_ingredients?.map(ingredient => ({
        ...ingredient,
        available_stock: stockMap[ingredient.item_id] || 0
      }))
    }));
  };

  const fetchRecipes = async () => {
    setIsLoading(true);
    try {
      const recipesRes = await fetch(`/api/recipes?node_id=${userNode?.id}`);
      const recipesData = await recipesRes.json();

      if (recipesData.success) {
        const recipesWithStock = recipesData.data.recipes || [];
        const stockMap = await fetchStockData();
        const recipesWithStockInfo = updateRecipesWithStock(recipesWithStock, stockMap);
        setRecipes(recipesWithStockInfo);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setFormData({
      recipe_id: recipe.id,
      quantity: '1',
      expire_date: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRecipe) {
      alert('Missing required information');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (quantity <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    // Check if there's sufficient stock for all ingredients
    if (selectedRecipe.recipe_ingredients) {
      const insufficientIngredients = selectedRecipe.recipe_ingredients.filter(ing => {
        const availableStock = ing.available_stock || 0;
        const requiredStock = ing.quantity * quantity;
        return availableStock < requiredStock;
      });

      if (insufficientIngredients.length > 0) {
        const insufficientList = insufficientIngredients
          .map(ing => `${ing.item_types?.item_name}: need ${ing.quantity * quantity}, have ${ing.available_stock || 0}`)
          .join('\n');
        
        if (!confirm(`Warning: Insufficient stock for some ingredients:\n\n${insufficientList}\n\nDo you want to continue anyway?`)) {
          return;
        }
      }
    }

    setIsCooking(true);

    const payload = {
      recipe_id: formData.recipe_id,
      node_id: userNode?.id,
      quantity: quantity,
      expire_date: formData.expire_date || undefined,
    };

    try {
      const response = await fetch('/api/item-instance/cook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const cookedData = result.data;
        const historyEntry: CookHistory = {
          id: Date.now().toString(),
          recipe_id: selectedRecipe.id,
          recipe_name: selectedRecipe.name,
          result_item_name: cookedData.cooked_item.name,
          quantity: cookedData.cooked_item.quantity,
          expire_date: cookedData.cooked_item.expire_date,
          ingredients_used: cookedData.ingredients_used,
          created_at: new Date().toISOString(),
          status: 'success'
        };

        setCookHistory([historyEntry, ...cookHistory]);
        await fetchRecipes();
        resetForm();
        alert(`Success! Created ${quantity}x ${cookedData.cooked_item.name}`);
      } else {
        const historyEntry: CookHistory = {
          id: Date.now().toString(),
          recipe_id: formData.recipe_id,
          recipe_name: selectedRecipe.name,
          result_item_name: '',
          quantity: 0,
          ingredients_used: [],
          created_at: new Date().toISOString(),
          status: 'error',
          message: result.message || 'Failed to cook recipe'
        };

        setCookHistory([historyEntry, ...cookHistory]);
        await fetchRecipes();
        alert('Error: ' + (result.message || 'Failed to cook recipe'));
      }
    } catch (error) {
      console.error('Error cooking recipe:', error);
      try {
        await fetchRecipes();
      } catch (stockError) {
        console.error('Error refreshing recipes after cooking error:', stockError);
      }
      alert('Error: Failed to process cooking request');
    } finally {
      setIsCooking(false);
    }
  };

  const resetForm = () => {
    setFormData({
      recipe_id: '',
      quantity: '1',
      expire_date: ''
    });
    setSelectedRecipe(null);
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

  if (!user) {
    return (
      <div className="min-h-screen flex justify-center bg-white font-sans">
        <div className="w-full max-w-md bg-white min-h-screen flex flex-col items-center justify-center sm:border-2 border-blue-600">
          <div className="text-center px-5">
            <p className="text-gray-600 mb-4">Please log in to access Cook Recipe</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center bg-white font-sans">
        <div className="w-full max-w-md bg-white min-h-screen flex flex-col items-center justify-center sm:border-2 border-blue-600">
          <div className="text-center px-5">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading recipes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userNode) {
    return (
      <div className="min-h-screen flex justify-center bg-white font-sans">
        <div className="w-full max-w-md bg-white min-h-screen flex flex-col items-center justify-center sm:border-2 border-blue-600">
          <div className="text-center px-5">
            <p className="text-gray-600">Initializing node ID...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center bg-white font-sans">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col sm:border-2 border-blue-600 pb-12">
        {/* Header */}
        <div className="bg-blue-600 text-white py-4 px-5 rounded-b-3xl flex items-center justify-between gap-2.5 shadow-md">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => router.back()}
              className="p-1 hover:bg-blue-700 rounded transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <ChefHat className="w-5 h-5" />
            <h1 className="text-xl font-semibold">Cook Recipe</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-5 mt-5">
          {/* Node Info */}
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-sm text-gray-600">Cooking at:</p>
            <p className="text-base font-semibold text-blue-700">{getUserNodeName()}</p>
          </div>

          {/* Cook New Recipe Button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              disabled={recipes.length === 0}
              className={`w-full py-3 rounded-xl font-medium text-white transition-colors mb-5 flex items-center justify-center gap-2 ${
                recipes.length === 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Plus className="w-5 h-5" />
              Cook New Recipe
            </button>
          )}

          {/* Cook Form */}
          {showForm && (
            <div className="mb-5 bg-white border-2 border-blue-400 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-blue-700">Cook a Recipe</h2>
                <button
                  onClick={resetForm}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!selectedRecipe ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Recipe *
                    </label>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {recipes.length > 0 ? (
                        recipes.map((recipe) => {
                          const hasInsufficientStock = recipe.recipe_ingredients?.some(ing => {
                            const availableStock = ing.available_stock || 0;
                            return availableStock < ing.quantity;
                          });

                          return (
                            <button
                              key={recipe.id}
                              type="button"
                              onClick={() => handleRecipeSelect(recipe)}
                              className="w-full p-4 border-2 border-blue-300 rounded-xl hover:bg-blue-50 hover:border-blue-400 transition text-left"
                            >
                              <div className="font-semibold text-base text-blue-700 mb-1">
                                {recipe.name}
                              </div>
                              <div className="text-sm text-gray-600 mb-2">
                                Result: <span className="font-medium">{recipe.item_types?.item_name || 'Unknown'}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  {recipe.recipe_ingredients?.length || 0} ingredients
                                </span>
                                {hasInsufficientStock ? (
                                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Low Stock
                                  </span>
                                ) : (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Stock OK
                                  </span>
                                )}
                                {recipe.node_id && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    Local
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          No recipes available
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Selected Recipe Info */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-800 mb-1">
                            {selectedRecipe.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Result: <span className="font-medium text-blue-700">{selectedRecipe.item_types?.item_name}</span>
                          </p>
                          {selectedRecipe.instructions && (
                            <p className="text-xs text-gray-600 mt-2">{selectedRecipe.instructions}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedRecipe(null)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Change
                        </button>
                      </div>

                      {/* Ingredients List */}
                      {selectedRecipe.recipe_ingredients && selectedRecipe.recipe_ingredients.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-300">
                          <p className="text-sm font-medium text-gray-700 mb-2">Required Ingredients:</p>
                          <div className="space-y-2">
                            {selectedRecipe.recipe_ingredients.map((ing, idx) => {
                              const availableStock = ing.available_stock || 0;
                              const requiredForRecipe = ing.quantity * parseInt(formData.quantity || '1');
                              const isStockSufficient = availableStock >= requiredForRecipe;
                              
                              return (
                                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-700 font-medium">
                                      {ing.item_types?.item_name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Need: {requiredForRecipe} {ing.note && `(${ing.note})`}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs text-gray-600">
                                      Stock: {availableStock}
                                    </span>
                                    {isStockSufficient ? (
                                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        OK
                                      </span>
                                    ) : (
                                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Short {requiredForRecipe - availableStock}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity (Portions) *
                        </label>
                        <input
                          id="quantity"
                          type="number"
                          min="1"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="expire_date" className="block text-sm font-medium text-gray-700 mb-2">
                          Expire Date (Optional)
                        </label>
                        <input
                          id="expire_date"
                          type="date"
                          value={formData.expire_date}
                          onChange={(e) => setFormData({ ...formData, expire_date: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Node
                        </label>
                        <input
                          value={getUserNodeName()}
                          disabled
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed text-sm"
                        />
                      </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-2">
                      {(() => {
                        const hasInsufficientStock = selectedRecipe.recipe_ingredients?.some(ing => {
                          const availableStock = ing.available_stock || 0;
                          const requiredStock = ing.quantity * parseInt(formData.quantity || '1');
                          return availableStock < requiredStock;
                        });

                        return (
                          <button
                            type="submit"
                            disabled={isCooking}
                            className={`flex-1 py-3 rounded-xl font-medium text-white transition-colors ${
                              isCooking
                                ? 'bg-gray-400 cursor-not-allowed'
                                : hasInsufficientStock
                                ? 'bg-orange-600 hover:bg-orange-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {isCooking ? 'Cooking...' : hasInsufficientStock ? 'Cook (Low Stock)' : 'Start Cooking'}
                          </button>
                        );
                      })()}
                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={isCooking}
                        className="px-6 py-3 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          )}

          {/* Cook History */}
          {cookHistory.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent History
                </h3>
                <button
                  onClick={() => setCookHistory([])}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-3">
                {cookHistory.map((history) => (
                  <div
                    key={history.id}
                    className={`border-2 rounded-xl p-4 ${
                      history.status === 'success'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-base text-gray-800 mb-1">
                          {history.recipe_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          Result: <span className="font-medium">{history.result_item_name || '-'}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(history.created_at).toLocaleString()}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        history.status === 'success'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-red-200 text-red-800'
                      }`}>
                        {history.status === 'success' ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 mt-2">
                      Quantity: <span className="font-medium">{history.quantity}</span>
                      {history.expire_date && (
                        <> • Expires: <span className="font-medium">{formatDate(history.expire_date)}</span></>
                      )}
                    </div>
                    {history.message && (
                      <div className="text-xs text-red-600 mt-2">{history.message}</div>
                    )}
                    {history.ingredients_used.length > 0 && (
                      <div className="text-xs text-gray-600 mt-2">
                        Used {history.ingredients_used.length} ingredient{history.ingredients_used.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {recipes.length === 0 && !showForm && (
            <div className="text-center py-12">
              <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No recipes available</p>
              <p className="text-sm text-gray-500">Contact an administrator to create recipes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
