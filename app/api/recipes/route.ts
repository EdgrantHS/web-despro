import { NextRequest } from 'next/server';
import {
    createSuccessResponse,
    createErrorResponse,
    getSupabaseClient,
    handleApiError,
    getPaginationParams,
    createPaginationMeta
} from '@/lib/api-helpers';

// GET /api/recipes - List all recipes with pagination
export async function GET(request: NextRequest) {
    return handleApiError(async () => {

        const supabase = await getSupabaseClient();

        const { data, error, count } = await supabase
            .from('recipes')
            .select(
                `
        id,
        name,
        node_id,
        result_id,
        instructions,
        created_at,
        item_types:result_id (
          item_id,
          item_name
        ),
        recipe_ingredients (
          id,
          item_id,
          quantity,
          note,
          item_types:item_id (
            item_id,
            item_name
          )
        )
      `,
                { count: 'exact' }
            )
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Recipes fetch error:', error);
            return createErrorResponse('Failed to fetch recipes', 500);
        }

        return createSuccessResponse('Recipes retrieved successfully', {
            recipes: data || []
        });
    });
}

// POST /api/recipes - Create new recipe
export async function POST(request: NextRequest) {
    return handleApiError(async () => {
        const supabase = await getSupabaseClient();
        const body = await request.json();

        const {
            name,
            node_id,           // nullable - null untuk global, uuid untuk lokal
            result_id,         // item_type_id hasil masakan (optional jika result_name diberikan)
            result_name,       // nama hasil masakan baru (jika result_id tidak ada)
            instructions,      // instruksi memasak
            ingredients        // array: [{ item_id, quantity, note }]
        } = body;

        // Validasi
        if (!name || typeof name !== 'string') {
            return createErrorResponse('name (string) is required', 400);
        }
        if (!result_id && !result_name) {
            return createErrorResponse('Either result_id (uuid) or result_name (string) is required', 400);
        }
        if (!Array.isArray(ingredients) || ingredients.length === 0) {
            return createErrorResponse('ingredients (array) is required and cannot be empty', 400);
        }

        // Validasi setiap ingredient
        for (const ing of ingredients) {
            if (!ing.item_id || typeof ing.item_id !== 'string') {
                return createErrorResponse('Each ingredient must have item_id (uuid)', 400);
            }
            if (typeof ing.quantity !== 'number' || ing.quantity <= 0) {
                return createErrorResponse('Each ingredient quantity must be a positive number', 400);
            }
        }

        try {
            let finalResultId = result_id;
            let resultItem = null;

            // 1. Jika result_name diberikan, buat entry baru di item_types
            if (result_name && !result_id) {
                const { data: newItemType, error: itemTypeErr } = await supabase
                    .from('item_types')
                    .insert([
                        {
                            item_name: result_name
                        }
                    ])
                    .select('item_id, item_name')
                    .single();

                if (itemTypeErr || !newItemType) {
                    console.error('Failed to create item_type:', itemTypeErr);
                    return createErrorResponse('Failed to create result item type', 500);
                }

                finalResultId = newItemType.item_id;
                resultItem = newItemType;
            } else if (result_id) {
                // 2. Fetch existing result item_type info
                const { data: existingItem } = await supabase
                    .from('item_types')
                    .select('item_id, item_name')
                    .eq('item_id', result_id)
                    .single();

                resultItem = existingItem;
            }

            // 3. Insert recipe
            const { data: recipe, error: recipeErr } = await supabase
                .from('recipes')
                .insert([
                    {
                        name,
                        node_id,
                        result_id: finalResultId,
                        instructions: instructions || null
                    }
                ])
                .select('id, name, node_id, result_id, instructions, created_at')
                .single();

            if (recipeErr || !recipe) {
                console.error('Failed to insert recipe:', recipeErr);
                return createErrorResponse('Failed to create recipe', 500);
            }

            // 4. Insert recipe_ingredients
            const ingredientRows = ingredients.map((ing: any) => ({
                recipe_id: recipe.id,
                item_id: ing.item_id,
                quantity: ing.quantity,
                note: ing.note || null
            }));

            const { data: recipeIngredients, error: ingredientsErr } = await supabase
                .from('recipe_ingredients')
                .insert(ingredientRows)
                .select(`
          id,
          recipe_id,
          item_id,
          quantity,
          note,
          item_types:item_id (
            item_id,
            item_name
          )
        `);

            if (ingredientsErr) {
                console.error('Failed to insert recipe_ingredients:', ingredientsErr);
                // Rollback recipe
                await supabase.from('recipes').delete().eq('id', recipe.id);
                return createErrorResponse('Failed to add ingredients', 500);
            }

            return createSuccessResponse('Recipe created successfully', {
                id: recipe.id,
                name: recipe.name,
                node_id: recipe.node_id,
                result: resultItem || { item_id: finalResultId },
                instructions: recipe.instructions,
                created_at: recipe.created_at,
                ingredients: recipeIngredients || []
            });
        } catch (err) {
            console.error('Unexpected error creating recipe:', err);
            return createErrorResponse('Unexpected server error', 500);
        }
    });
}
