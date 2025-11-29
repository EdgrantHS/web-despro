// app/recipes/RecipeModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

interface ItemType {
  item_id: string;
  item_name: string;
  item_type: string;
}

interface RecipeFormData {
  name: string;
  node_id: string;
  result_id: string;
  result_name: string;
  instructions: string;
  recipe_ingredients: RecipeIngredient[];
}

interface RecipeModalProps {
  recipe: Recipe | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecipeModal({ recipe, onClose, onSuccess }: RecipeModalProps) {
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useNewResult, setUseNewResult] = useState(false);
  const [formData, setFormData] = useState<RecipeFormData>({
    name: '',
    node_id: '',
    result_id: '',
    result_name: '',
    instructions: '',
    recipe_ingredients: []
  });

  const [newIngredient, setNewIngredient] = useState({
    item_id: '',
    quantity: '',
    note: ''
  });

  useEffect(() => {
    fetchItemTypes();
    if (recipe) {
      setFormData({
        name: recipe.name,
        node_id: recipe.node_id || '',
        result_id: recipe.result_id,
        result_name: recipe.item_types?.item_name || '',
        instructions: recipe.instructions || '',
        recipe_ingredients: recipe.recipe_ingredients || []
      });
      setUseNewResult(false);
    }
  }, [recipe]);

  const fetchItemTypes = async () => {
    try {
      const response = await fetch(`/api/item-types?item_type=Makanan Jadi`);
      const data = await response.json();
      
      if (data.success) {
        setItemTypes(data.data.item_types || []);
      }
    } catch (error) {
      console.error('Error fetching item types:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      alert('Please fill in recipe name');
      return;
    }

    if (!formData.result_id && !formData.result_name) {
      alert('Please select an existing result item or enter a new result item name');
      return;
    }

    if (formData.recipe_ingredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }

    setIsLoading(true);

    const payload: any = {
      name: formData.name,
      node_id: formData.node_id || null,
      instructions: formData.instructions || null,
      ingredients: formData.recipe_ingredients.map(ing => ({
        item_id: ing.item_id,
        quantity: ing.quantity,
        note: ing.note || null
      }))
    };

    // Gunakan result_id jika ada, otherwise gunakan result_name
    if (formData.result_id) {
      payload.result_id = formData.result_id;
    } else {
      payload.result_name = formData.result_name;
    }

    try {
      const url = recipe ? `/api/recipes/${recipe.id}` : '/api/recipes';
      const method = recipe ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        alert(recipe ? 'Recipe updated successfully!' : 'Recipe created successfully!');
        onSuccess();
      } else {
        alert(result.message || 'Failed to save recipe');
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Error saving recipe');
    } finally {
      setIsLoading(false);
    }
  };

  const addIngredient = () => {
    if (!newIngredient.item_id || !newIngredient.quantity) {
      alert('Please select an item and enter quantity');
      return;
    }

    const quantity = parseFloat(newIngredient.quantity);
    if (quantity <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    const itemType = itemTypes.find(it => it.item_id === newIngredient.item_id);
    
    setFormData({
      ...formData,
      recipe_ingredients: [
        ...formData.recipe_ingredients,
        {
          item_id: newIngredient.item_id,
          quantity: quantity,
          note: newIngredient.note || undefined,
          item_types: itemType ? {
            item_id: itemType.item_id,
            item_name: itemType.item_name
          } : undefined
        }
      ]
    });

    setNewIngredient({
      item_id: '',
      quantity: '',
      note: ''
    });
  };

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      recipe_ingredients: formData.recipe_ingredients.filter((_, i) => i !== index)
    });
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: any) => {
    const updated = [...formData.recipe_ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({
      ...formData,
      recipe_ingredients: updated
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {recipe ? 'Edit Recipe' : 'Add New Recipe'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Recipe Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label>Result Item (Product) *</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="existing_result"
                    checked={!useNewResult}
                    onChange={() => {
                      setUseNewResult(false);
                      setFormData({...formData, result_name: ''});
                    }}
                  />
                  <label htmlFor="existing_result" className="text-sm cursor-pointer">
                    Select Existing
                  </label>
                </div>

                {!useNewResult ? (
                  <select
                    value={formData.result_id}
                    onChange={(e) => setFormData({...formData, result_id: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select Result Item</option>
                    {itemTypes.map((type) => (
                      <option key={type.item_id} value={type.item_id}>
                        {type.item_name} ({type.item_type})
                      </option>
                    ))}
                  </select>
                ) : null}

                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="new_result"
                    checked={useNewResult}
                    onChange={() => {
                      setUseNewResult(true);
                      setFormData({...formData, result_id: ''});
                    }}
                  />
                  <label htmlFor="new_result" className="text-sm cursor-pointer">
                    Create New
                  </label>
                </div>

                {useNewResult ? (
                  <Input
                    placeholder="Enter new result item name"
                    value={formData.result_name}
                    onChange={(e) => setFormData({...formData, result_name: e.target.value})}
                    required
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({...formData, instructions: e.target.value})}
              rows={3}
              placeholder="Enter cooking instructions..."
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <Label htmlFor="node_id">Node (Optional - Leave empty for global recipe)</Label>
            <Input
              id="node_id"
              value={formData.node_id}
              onChange={(e) => setFormData({...formData, node_id: e.target.value})}
              placeholder="Leave empty for global recipe"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Ingredients</h3>
            
            {formData.recipe_ingredients.length > 0 && (
              <div className="mb-4 border rounded overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Note
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.recipe_ingredients.map((ing, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {ing.item_types?.item_name || 'Unknown Item'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Input
                            type="number"
                            step="0.01"
                            value={ing.quantity}
                            onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value))}
                            className="w-24"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={ing.note || ''}
                            onChange={(e) => updateIngredient(index, 'note', e.target.value)}
                            placeholder="Optional note"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => removeIngredient(index)}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="bg-gray-50 p-3 border rounded">
              <p className="text-sm font-medium mb-2">Add Ingredient</p>
              <div className="grid grid-cols-4 gap-2">
                <select
                  value={newIngredient.item_id}
                  onChange={(e) => setNewIngredient({...newIngredient, item_id: e.target.value})}
                  className="p-2 border rounded-md"
                >
                  <option value="">Select Item</option>
                  {itemTypes.map((type) => (
                    <option key={type.item_id} value={type.item_id}>
                      {type.item_name}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Quantity"
                  value={newIngredient.quantity}
                  onChange={(e) => setNewIngredient({...newIngredient, quantity: e.target.value})}
                />
                <Input
                  placeholder="Note (optional)"
                  value={newIngredient.note}
                  onChange={(e) => setNewIngredient({...newIngredient, note: e.target.value})}
                />
                <Button type="button" onClick={addIngredient}>
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : (recipe ? 'Update Recipe' : 'Create Recipe')}
          </Button>
        </div>
      </div>
    </div>
  );
}