'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import GlobalRecipeModal from './GlobalRecipeModal';

interface Recipe {
    id: string;
    name: string;
    node_id?: string | null;
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

interface Pagination {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export default function SuperAdminRecipesPage() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isApprovingRecipeId, setIsApprovingRecipeId] = useState<string | null>(null);

    useEffect(() => {
        fetchRecipes();
    }, [currentPage]);

    const fetchRecipes = async () => {
        setIsLoading(true);
        try {
            // Fetch all recipes (global + all local recipes) as super admin
            const response = await fetch(`/api/recipes?page=${currentPage}&page_size=50`);
            const data = await response.json();

            if (data.success) {
                setRecipes(data.data.recipes || []);
                setPagination(data.data.pagination);
            }
        } catch (error) {
            console.error('Error fetching recipes:', error);
            alert('Error fetching recipes');
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
                    fetchRecipes();
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

    const handleApprove = async (recipeId: string) => {
        const recipe = recipes.find(r => r.id === recipeId);
        
        if (recipe?.node_id === null) {
            alert('This recipe is already global');
            return;
        }

        if (confirm('Are you sure you want to promote this recipe to global? It will be available for all nodes.')) {
            setIsApprovingRecipeId(recipeId);
            try {
                const response = await fetch(`/api/recipes/${recipeId}/approve`, {
                    method: 'PUT'
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    alert('Recipe promoted to global successfully!');
                    fetchRecipes();
                } else {
                    alert(result.message || 'Failed to promote recipe');
                }
            } catch (error) {
                console.error('Error approving recipe:', error);
                alert('Error promoting recipe');
            } finally {
                setIsApprovingRecipeId(null);
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
        fetchRecipes();
        handleModalClose();
    };

    if (isLoading) {
        return <div className="p-6">Loading recipes...</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Global Recipes Management</h1>
                    <p className="text-gray-600">
                        Manage all recipes across the system and approve local recipes to global
                    </p>
                </div>
                <Button onClick={handleAddNew}>Add New Global Recipe</Button>
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
                                Status
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
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        recipe.node_id === null 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {recipe.node_id === null ? 'Global' : 'Local'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                                        {recipe.node_id !== null && (
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() => handleApprove(recipe.id)}
                                                disabled={isApprovingRecipeId === recipe.id}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                {isApprovingRecipeId === recipe.id ? 'Approving...' : 'Approve'}
                                            </Button>
                                        )}
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
                        No recipes found.
                    </div>
                )}
            </div>

            {pagination && (
                <div className="mt-4 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                        Showing page {pagination.page} of {pagination.total_pages} ({pagination.total} total recipes)
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={currentPage >= pagination.total_pages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {showModal && (
                <GlobalRecipeModal
                    recipe={editingRecipe}
                    onClose={handleModalClose}
                    onSuccess={handleSaveSuccess}
                />
            )}
        </div>
    );
}
