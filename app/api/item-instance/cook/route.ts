/*
    API DOCUMENTATION:
    API ini akan "memasak resep", jadi cara kerjanya:
        1. Mengurangi jumlah item-item pada table item_instance berdasarkan item-item yang dibutuhkan untuk memasak.
        2. Menambah instance di table item_instance, jadi hasil masakan ini juga berupa sebuah item_instance
        3. Insert ke table item_instance juga sama aja seperti add item_instance pada umumnya
        4. Tujuan API ini dipisah dengan API insert item_instance biasa adalah karena ada proses tambahan nomor 1.
*/

import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  getSupabaseClient,
  handleApiError,
  transformDbToApi
} from '@/lib/api-helpers';
import { log } from 'console';

type Ingredient = {
  item_instance_id: string;
  item_count: number; // amount required PER PORTION
};

export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const supabase = await getSupabaseClient();

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return createErrorResponse('Content-Type must be application/json', 400);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse('Invalid JSON body', 400);
    }

    const {
      node_id,
      item_count: servings, // number of portions to create
      ingredients, // array of { item_instance_id, item_count } where item_count is amount per portion
      item_type_id,
      expire_date
    } = body;

    // Basic validation
    if (!node_id || typeof node_id !== 'string') {
      return createErrorResponse('node_id (uuid) is required', 400);
    }
    if (!item_type_id || typeof item_type_id !== 'string') {
      return createErrorResponse('item_type_id (uuid) is required', 400);
    }
    if (typeof servings !== 'number' || servings <= 0) {
      return createErrorResponse('item_count (servings) must be a positive number', 400);
    }
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return createErrorResponse('ingredients (array) is required and cannot be empty', 400);
    }
    // validate ingredients entries
    for (const ing of ingredients) {
      if (!ing?.item_instance_id || typeof ing.item_instance_id !== 'string') {
        return createErrorResponse('Each ingredient must contain item_instance_id (uuid)', 400);
      }
      if (typeof ing.item_count !== 'number' || ing.item_count < 0) {
        return createErrorResponse('Each ingredient.item_count must be a non-negative number', 400);
      }
    }

    // Build map of total needed per ingredient (assume ingredient.item_count is per portion)
    const ingredientIds = ingredients.map((i: Ingredient) => i.item_instance_id);
    const neededMap: Record<string, number> = {};
    for (const ing of ingredients) {
      neededMap[ing.item_instance_id] = (neededMap[ing.item_instance_id] || 0) + (ing.item_count * servings);
    }

    // Fetch current item_instances for all ingredient ids
    const { data: currentItems, error: fetchErr } = await supabase
      .from('item_instances')
      .select('item_instance_id, item_count')
      .in('item_instance_id', ingredientIds);

    if (fetchErr) {
      console.error('Failed to fetch item_instances for ingredients:', fetchErr);
      return createErrorResponse('Database error while checking ingredients', 500);
    }

    // Ensure all ingredient rows exist
    const foundIds = new Set(currentItems.map((r: any) => r.item_instance_id));
    for (const id of ingredientIds) {
      if (!foundIds.has(id)) {
        return createErrorResponse(`Ingredient item_instance not found: ${id}`, 400);
      }
    }

    // Check availability
    const insufficient: string[] = [];
    const currentMap: Record<string, number> = {};
    for (const row of currentItems) {
      const cid = row.item_instance_id;
      const current = Number(row.item_count ?? 0);
      currentMap[cid] = current;
      const need = Number(neededMap[cid] ?? 0);
      if (current < need) {
        insufficient.push(`${cid} (need ${need}, have ${current})`);
      }
    }

    if (insufficient.length > 0) {
      return createErrorResponse(`Insufficient stock for ingredients: ${insufficient.join('; ')}`, 400);
    }

    // All checks passed - proceed to decrement ingredients and create cooked item_instance
    try {
      // Decrement each ingredient
      for (const id of Object.keys(neededMap)) {
        const need = neededMap[id];
        const newCount = currentMap[id] - need;
        const { error: updateErr } = await supabase
          .from('item_instances')
          .update({ item_count: newCount })
          .eq('item_instance_id', id);

        if (updateErr) {
          console.error('Failed to update ingredient item_instance:', id, updateErr);
          return createErrorResponse('Failed to update ingredient stock', 500);
        }
      }

      // Insert cooked item_instance (the finished dish)
      const insertPayload: any = {
        item_type_id,
        node_id,
        item_count: servings,
      };
      if (expire_date) {
        // accept either string or Date; store as ISO string
        insertPayload.expire_date = typeof expire_date === 'string' ? expire_date : new Date(expire_date).toISOString();
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('item_instances')
        .insert([insertPayload])
        .select(`
          item_instance_id,
          item_count,
          expire_date,
          item_types (
            item_type,
            item_name
          )
        `)
        .single();

      if (insertErr || !inserted) {
        console.error('Failed to insert cooked item_instance:', insertErr);
        // Attempt to rollback ingredient changes would be ideal here (not implemented)
        return createErrorResponse('Failed to create cooked item instance', 500);
      }

      // Return success with created item_instance and updated ingredient summary
      const updatedIngredients: any[] = [];
      for (const id of Object.keys(neededMap)) {
        updatedIngredients.push({
          item_instance_id: id,
          deducted: neededMap[id],
          remaining: currentMap[id] - neededMap[id]
        });
      }

      console.log("Response: ", inserted);

      return createSuccessResponse('Cooked item instance created and ingredients deducted', {
        cooked_item: {
          id: inserted.item_instance_id,
          item_count: inserted.item_count,
          expire_date: inserted.expire_date,
          item_type: inserted.item_types && Array.isArray(inserted.item_types) && inserted.item_types.length > 0 ? {
            id: inserted.item_types[0]?.item_type,
            name: inserted.item_types[0]?.item_name
          } : null
        },
        updated_ingredients: updatedIngredients
      });
    } catch (err) {
      console.error('Unexpected error during cook operation:', err);
      return createErrorResponse('Unexpected server error', 500);
    }
  });
}