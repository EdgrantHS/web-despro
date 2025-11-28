// app/recipes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import RecipeModal from './RecipeModal';

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
}

interface Node {
  id: string;
  name: string;
  type: string;
}

export default function RecipeManagementPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [userNode, setUserNode] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const nodeResponse = await fetch('/api/user/node');
      const nodeData = await nodeResponse.json();
      
      if (nodeData.success) {
        setUserNode(nodeData.data.node);
      }

      const recipesRes = await fetch('/api/recipes');
      const recipesData = await recipesRes.json();
      
      if (recipesData.success) {
        setRecipes(recipesData.data.recipes || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (recipeId: string) => {
    if (confirm('Are you sure you want to delete this recipe? This will also delete all ingredients.')) {
      try {
        const response = await fetch(`/api/recipes/${recipeId}`, {
          method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          fetchData();
          alert('Recipe deleted successfully!');
        } else {
          alert(result.message || 'Failed to delete recipe');
        }
      } catch (error) {
        console.error('Error deleting recipe:', error);
        alert('Error deleting recipe');
      }
    }
  };

  const handleEdit = async (recipe: Recipe) => {
    try {
      const response = await fetch(`/api/recipes/${recipe.id}`);
      const result = await response.json();
      
      if (result.success) {
        setEditingRecipe(result.data);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      alert('Error loading recipe details');
    }
  };

  const handleAddNew = () => {
    setEditingRecipe(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingRecipe(null);
  };

  const handleSaveSuccess = () => {
    fetchData();
    handleModalClose();
  };

  if (isLoading) {
    return <div className="p-6">Loading recipes...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Recipe Management</h1>
          <p className="text-gray-600">
            Manage your cooking recipes and ingredients
          </p>
          {userNode && (
            <p className="text-sm text-gray-500 mt-1">
              Current Node: <span className="font-semibold text-blue-600">{userNode.name}</span>
            </p>
          )}
        </div>
        <Button onClick={handleAddNew}>Add New Recipe</Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Recipe Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Result Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Ingredients Count
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Node
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recipes.map((recipe) => (
              <tr key={recipe.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {recipe.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {recipe.item_types ? recipe.item_types.item_name : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {recipe.recipe_ingredients?.length || 0} ingredients
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs ${
                    recipe.node_id 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {recipe.node_id ? 'Local' : 'Global'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(recipe.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(recipe)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(recipe.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {recipes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No recipes found. Click "Add New Recipe" to create one.
          </div>
        )}
      </div>

      {showModal && (
        <RecipeModal
          recipe={editingRecipe}
          onClose={handleModalClose}
          onSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
}