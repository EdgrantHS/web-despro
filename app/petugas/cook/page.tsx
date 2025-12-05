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
import { v4 as uuidv4 } from 'uuid';

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
  }, [])

  useEffect(() => {
    if (userNode) {
      fetchRecipes();
    }
  }, [userNode]);

  const fetchCurrentUserNode = async () => {
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

    } catch (error) {
      console.error('Error getting user node data:', error);
    }
  }

  const fetchStockData = async () => {
    try {
      const stockRes = await fetch(`/api/item-instances?node_id=${userNode?.id}`);
      const stockData = await stockRes.json();
      
      if (stockData.success) {
        // Create stock lookup map
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
      // Fetch recipes with node_id parameter
      const recipesRes = await fetch(`/api/recipes?node_id=${userNode?.id}`);
      const recipesData = await recipesRes.json();

      if (recipesData.success) {
        const recipesWithStock = recipesData.data.recipes || [];
        
        // Fetch current stock for all ingredients
        const stockMap = await fetchStockData();
        
        // Add stock information to recipe ingredients
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
        console.log(cookedData);
        
        // Completely re-fetch recipes with updated stock data
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
        
        // Completely re-fetch recipes with updated stock data
        await fetchRecipes();
        
        alert('Error: ' + (result.message || 'Failed to cook recipe'));
      }
    } catch (error) {
      console.error('Error cooking recipe:', error);
      
      // Completely re-fetch recipes with updated stock data even after network errors
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
    return userNode ? `Node: ${userNode.name.slice(0, 8)}...` : 'Loading...';
  };

  if (isLoading) {
    return <div className="p-6">Loading recipes...</div>;
  }

  if (!userNode) {
    return <div className="p-6">Initializing node ID...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Cook Recipe</h1>
          <p className="text-gray-600">
            Cook recipes at: <span className="font-semibold text-blue-600">{getUserNodeName()}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Select a recipe and cook based on available ingredients
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} disabled={recipes.length === 0}>
          {showForm ? 'Cancel' : 'Cook New Recipe'}
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">Cook a Recipe</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!selectedRecipe ? (
              <div>
                <Label htmlFor="recipe_id">Select Recipe *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {recipes.length > 0 ? (
                    recipes.map((recipe) => (
                      <button
                        key={recipe.id}
                        type="button"
                        onClick={() => handleRecipeSelect(recipe)}
                        className="p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-400 transition text-left"
                      >
                        <div className="font-medium">{recipe.name}</div>
                        <div className="text-sm text-gray-600">
                          Result: {recipe.item_types?.item_name || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Ingredients: {recipe.recipe_ingredients?.length || 0}
                        </div>
                        {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 && (
                          <div className="text-xs mt-2">
                            {recipe.recipe_ingredients.some(ing => (ing.available_stock || 0) < ing.quantity) ? (
                              <div className="bg-red-100 text-red-800 inline-block px-2 py-0.5 rounded">
                                ⚠ Insufficient stock
                              </div>
                            ) : (
                              <div className="bg-green-100 text-green-800 inline-block px-2 py-0.5 rounded">
                                ✓ Stock available
                              </div>
                            )}
                          </div>
                        )}
                        {recipe.node_id && (
                          <div className="text-xs bg-blue-100 text-blue-800 inline-block px-2 py-0.5 rounded mt-1">
                            Local Recipe
                          </div>
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-500 col-span-2">No recipes available</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white p-4 rounded border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedRecipe.name}</h3>
                      <p className="text-gray-600">
                        Result: <span className="font-medium">{selectedRecipe.item_types?.item_name}</span>
                      </p>
                      {selectedRecipe.instructions && (
                        <p className="text-sm text-gray-600 mt-2">{selectedRecipe.instructions}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRecipe(null)}
                    >
                      Change Recipe
                    </Button>
                  </div>

                  {selectedRecipe.recipe_ingredients && selectedRecipe.recipe_ingredients.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium text-gray-700 mb-2">Required Ingredients:</p>
                      <div className="space-y-2">
                        {selectedRecipe.recipe_ingredients.map((ing, idx) => {
                          const availableStock = ing.available_stock || 0;
                          const requiredForRecipe = ing.quantity * parseInt(formData.quantity);
                          const isStockSufficient = availableStock >= requiredForRecipe;
                          
                          return (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="text-sm text-gray-700">
                                • {ing.item_types?.item_name} - {requiredForRecipe} unit needed
                                {ing.note && (
                                  <span className="text-gray-500"> ({ing.note})</span>
                                )}
                              </div>
                              <div className="text-xs flex items-center gap-2">
                                <span className="text-gray-600">
                                  Stock: {availableStock}
                                </span>
                                {isStockSufficient ? (
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                    ✓ OK
                                  </span>
                                ) : (
                                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                                    ⚠ Short {requiredForRecipe - availableStock}
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

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity (Portions) *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="expire_date">Expire Date (Optional)</Label>
                    <Input
                      id="expire_date"
                      type="date"
                      value={formData.expire_date}
                      onChange={(e) => setFormData({ ...formData, expire_date: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Label htmlFor="node_id" className="mb-2">Current Node</Label>
                    <Input
                      id="node_id"
                      value={getUserNodeName()}
                      disabled
                      className="bg-gray-100 cursor-not-allowed text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {(() => {
                    const hasInsufficientStock = selectedRecipe.recipe_ingredients?.some(ing => {
                      const availableStock = ing.available_stock || 0;
                      const requiredStock = ing.quantity * parseInt(formData.quantity);
                      return availableStock < requiredStock;
                    });

                    return (
                      <Button 
                        type="submit" 
                        disabled={isCooking}
                        className={hasInsufficientStock ? 'bg-orange-600 hover:bg-orange-700' : ''}
                      >
                        {isCooking ? 'Cooking...' : hasInsufficientStock ? 'Cook (Low Stock)' : 'Start Cooking'}
                      </Button>
                    );
                  })()}
                  <Button type="button" variant="outline" onClick={resetForm} disabled={isCooking}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {/* Cook History */}
      {cookHistory.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Recent Cooking History</h2>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipe</TableHead>
                  <TableHead>Result Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Expire Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cookHistory.map((history) => (
                  <TableRow key={history.id}>
                    <TableCell className="font-medium">{history.recipe_name}</TableCell>
                    <TableCell>{history.result_item_name || '-'}</TableCell>
                    <TableCell>{history.quantity}</TableCell>
                    <TableCell>
                      {history.expire_date
                        ? new Date(history.expire_date).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${history.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                        {history.status === 'success' ? 'Success' : 'Failed'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(history.created_at).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      {history.message ? (
                        <div className="text-xs text-red-600 truncate" title={history.message}>
                          {history.message}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600">
                          {history.ingredients_used.length} item{history.ingredients_used.length !== 1 ? 's' : ''} used
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {recipes.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-4">No recipes available for your node.</p>
          <p className="text-sm">Contact an administrator to create recipes.</p>
        </div>
      )}
    </div>
  );
}