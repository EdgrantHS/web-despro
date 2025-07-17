'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

interface Recipe {
  menu_id: number
  menu_name: string
  menu_description: string
  status: string
  node_id: string | null
  portions: number
  ingredients: string
  preparation_steps: string
}

export default function PetugasCookPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [currentNodeId, setCurrentNodeId] = useState<string>('')
  const [cookingModal, setCookingModal] = useState({
    isOpen: false,
    recipe: null as Recipe | null,
    portions: 1
  })
  const [newMenuModal, setNewMenuModal] = useState({
    isOpen: false,
    formData: {
      menu_name: '',
      menu_description: '',
      ingredients: '',
      preparation_steps: '',
      portions: 1
    }
  })
  const supabase = createClient()

  useEffect(() => {
    getCurrentUserNode()
  }, [])

  useEffect(() => {
    if (currentNodeId) {
      fetchAvailableMenus(currentNodeId)
    }
  }, [currentNodeId])

  const getCurrentUserNode = async () => {
    // suggested implementation: get current user's node for filtering recipes
    // try {
    //   const { data: { user } } = await supabase.auth.getUser()
    //   if (user) {
    //     const { data, error } = await supabase
    //       .from('user')
    //       .select('node_id')
    //       .eq('user_id', user.id)
    //       .single()
    //     
    //     if (error) throw error
    //     setCurrentNodeId(data.node_id)
    //   }
    // } catch (error) {
    //   console.error('Error getting user node:', error)
    // }
  }

  const fetchAvailableMenus = async (nodeId: string) => {
    // suggested implementation: get available recipes for cooking at this node
    // setLoading(true)
    // try {
    //   const { data, error } = await supabase
    //     .from('recipe')
    //     .select('*')
    //     .or(`status.eq.confirmed,node_id.is.null,node_id.eq.${nodeId}`)
    //     .order('menu_name')
    //   
    //   if (error) throw error
    //   setRecipes(data || [])
    // } catch (error) {
    //   console.error('Error fetching menus:', error)
    // } finally {
    //   setLoading(false)
    // }
  }

  const cookRecipe = async (recipeId: number, portions: number, nodeId: string) => {
    // suggested implementation: cook a recipe and consume ingredients
    // try {
    //   const { data, error } = await supabase.rpc('cook_recipe', {
    //     recipe_id: recipeId,
    //     portion_count: portions,
    //     node_id: nodeId
    //   })
    //   
    //   if (error) throw error
    //   
    //   alert(`Successfully cooked ${portions} portions!`)
    //   setCookingModal({ isOpen: false, recipe: null, portions: 1 })
    // } catch (error) {
    //   console.error('Error cooking recipe:', error)
    //   alert('Error cooking recipe. Please check ingredient availability.')
    // }
  }

  const createTemporaryMenu = async (menuData: any, nodeId: string) => {
    // suggested implementation: create a temporary menu awaiting admin confirmation
    // try {
    //   const { data, error } = await supabase
    //     .from('recipe')
    //     .insert([{
    //       ...menuData,
    //       node_id: nodeId,
    //       status: 'temporary'
    //     }])
    //     .select()
    //   
    //   if (error) throw error
    //   
    //   alert('Temporary menu created successfully! Awaiting admin confirmation.')
    //   setNewMenuModal({
    //     isOpen: false,
    //     formData: {
    //       menu_name: '',
    //       menu_description: '',
    //       ingredients: '',
    //       preparation_steps: '',
    //       portions: 1
    //     }
    //   })
    //   fetchAvailableMenus(nodeId)
    // } catch (error) {
    //   console.error('Error creating temporary menu:', error)
    //   alert('Error creating menu.')
    // }
  }

  const handleCook = () => {
    if (cookingModal.recipe && currentNodeId) {
      cookRecipe(cookingModal.recipe.menu_id, cookingModal.portions, currentNodeId)
    }
  }

  const handleCreateMenu = () => {
    if (currentNodeId) {
      createTemporaryMenu(newMenuModal.formData, currentNodeId)
    }
  }

  if (loading) {
    return <div className="p-6">Loading menus...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Cooking Page</h1>
        <button
          onClick={() => setNewMenuModal({ ...newMenuModal, isOpen: true })}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Create New Menu
        </button>
      </div>

      {/* Available Menus */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <div key={recipe.menu_id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-semibold">{recipe.menu_name}</h3>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                recipe.status === 'confirmed' || !recipe.node_id
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {recipe.status === 'confirmed' || !recipe.node_id ? 'Confirmed' : 'Temporary'}
              </span>
            </div>
            
            <p className="text-gray-600 mb-4">{recipe.menu_description}</p>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Ingredients:</h4>
              <p className="text-sm text-gray-600">{recipe.ingredients}</p>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Preparation:</h4>
              <p className="text-sm text-gray-600">{recipe.preparation_steps}</p>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Serves: {recipe.portions}</span>
              <button
                onClick={() => setCookingModal({ isOpen: true, recipe, portions: 1 })}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                disabled={recipe.status === 'temporary'}
              >
                Cook This Recipe
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cooking Modal */}
      {cookingModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Cook: {cookingModal.recipe?.menu_name}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Portions:
              </label>
              <input
                type="number"
                min="1"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={cookingModal.portions}
                onChange={(e) => setCookingModal({
                  ...cookingModal,
                  portions: parseInt(e.target.value) || 1
                })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setCookingModal({ isOpen: false, recipe: null, portions: 1 })}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCook}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Start Cooking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Menu Modal */}
      {newMenuModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-10 mx-auto p-5 border w-3/4 max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Temporary Menu</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Menu Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={newMenuModal.formData.menu_name}
                  onChange={(e) => setNewMenuModal({
                    ...newMenuModal,
                    formData: { ...newMenuModal.formData, menu_name: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  value={newMenuModal.formData.menu_description}
                  onChange={(e) => setNewMenuModal({
                    ...newMenuModal,
                    formData: { ...newMenuModal.formData, menu_description: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  value={newMenuModal.formData.ingredients}
                  onChange={(e) => setNewMenuModal({
                    ...newMenuModal,
                    formData: { ...newMenuModal.formData, ingredients: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Steps</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={4}
                  value={newMenuModal.formData.preparation_steps}
                  onChange={(e) => setNewMenuModal({
                    ...newMenuModal,
                    formData: { ...newMenuModal.formData, preparation_steps: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portions</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={newMenuModal.formData.portions}
                  onChange={(e) => setNewMenuModal({
                    ...newMenuModal,
                    formData: { ...newMenuModal.formData, portions: parseInt(e.target.value) || 1 }
                  })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setNewMenuModal({ ...newMenuModal, isOpen: false })}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMenu}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Create Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
