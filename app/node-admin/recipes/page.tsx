// app/recipes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import RecipeModal from './RecipeModal';
import { Grid2x2, ArrowLeft, Plus, X, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import Image from 'next/image';
import adminNodeImage from '@/assets/public/admin_node.png';

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
    const { user } = useAuth();
    const router = useRouter();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [userNode, setUserNode] = useState<Node | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

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

    const fetchRecipes = async () => {
        setIsLoading(true);
        try {
            // Fetch recipes dengan node_id parameter - ambil global + recipes untuk node ini
            const recipesRes = await fetch(`/api/recipes?node_id=${userNode?.id}`);
            const recipesData = await recipesRes.json();

            if (recipesData.success) {
                setRecipes(recipesData.data.recipes || []);
            }
        } catch (error) {
            console.error('Error fetching recipes:', error);
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

    const getUserName = () => {
        if (user?.name) return user.name;
        if (user?.username) return user.username;
        return 'Admin';
    };

    const getUserNodeName = () => {
        return userNode ? `${userNode.name} (${userNode.type})` : 'Loading...';
    };

    if (isLoading && !userNode) {
        return <div className="p-6">Initializing node ID...</div>;
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
                    <Grid2x2 size={28} className="md:w-7 md:h-7 w-6 h-6" />
                    <h1 className="text-xl md:text-2xl font-semibold">Recipe Management</h1>
                </div>
            </div>

            {/* Greeting */}
            <div className="px-4 md:px-5 mt-4 flex justify-between items-center">
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl md:text-3xl font-bold truncate">
                        Hi <span className="text-blue-600">{getUserName()}!</span>
                    </h2>
                    <p className="text-gray-600 text-base md:text-lg">
                        Managing recipes for: <span className="font-semibold text-blue-600">{getUserNodeName()}</span>
                    </p>
                </div>
            </div>

            {/* Welcome Card */}
            <div className="px-4 md:px-5 mt-4">
                <div className="border border-gray-200 rounded-xl p-3 md:p-4 flex items-center justify-between shadow-sm">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base md:text-lg">Manage Recipes</h3>
                        <p className="text-gray-600 text-sm md:text-base">Create and manage cooking recipes and ingredients</p>
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

            {/* Add New Button */}
            <div className="px-4 md:px-5 mt-4">
                <Button 
                    onClick={handleAddNew}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md flex items-center gap-2 w-full md:w-auto"
                >
                    <Plus size={16} />
                    Add New Recipe
                </Button>
            </div>

            <div className="px-4 md:px-5 mt-6">
                <h3 className="text-base md:text-lg font-semibold mb-4">Recipes List</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
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
                                {recipes.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-1.5 md:px-3 py-3 md:py-4 text-center text-gray-500 text-[9px] md:text-sm bg-white">
                                            No recipes found. Click "Add New Recipe" to create one.
                                        </td>
                                    </tr>
                                ) : (
                                    recipes.map((recipe, index) => (
                                        <tr 
                                            key={recipe.id} 
                                            className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} border-b border-gray-100 hover:bg-gray-100 transition-colors`}
                                        >
                                            <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">
                                                {recipe.name}
                                            </td>
                                            <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                                                {recipe.item_types ? recipe.item_types.item_name : 'N/A'}
                                            </td>
                                            <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                                                {recipe.recipe_ingredients?.length || 0} ingredients
                                            </td>
                                            <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                                                <span className={`px-1 md:px-2 py-0.5 md:py-1 rounded text-[8px] md:text-xs ${recipe.node_id
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {recipe.node_id ? 'Local' : 'Global'}
                                                </span>
                                            </td>
                                            <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                                                {new Date(recipe.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-1.5 md:px-3 py-1 md:py-2">
                                                <div className="flex gap-0.5 md:gap-2">
                                                    <button
                                                        onClick={() => handleEdit(recipe)}
                                                        className="text-blue-600 hover:text-blue-800 text-[9px] md:text-sm font-medium hover:underline transition-all"
                                                    >
                                                        Edit
                                                    </button>
                                                    <span className="text-gray-300">|</span>
                                                    <button
                                                        onClick={() => handleDelete(recipe.id)}
                                                        className="text-red-600 hover:text-red-800 text-[9px] md:text-sm font-medium hover:underline transition-all"
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
                </div>
            </div>

            {showModal && (
                <RecipeModal
                    recipe={editingRecipe}
                    userNode={userNode}
                    onClose={handleModalClose}
                    onSuccess={handleSaveSuccess}
                />
            )}
        </div>
    );
}