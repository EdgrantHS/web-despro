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
} from '@/lib/api-helpers';

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
      recipe_id,    // UUID resep
      node_id,      // Node tempat memasak (dari parameter, bukan dari recipe)
      quantity,     // Jumlah porsi
      expire_date   // Tanggal kadaluarsa hasil masakan
    } = body;

    // Validasi input
    if (!recipe_id || typeof recipe_id !== 'string') {
      return createErrorResponse('recipe_id (uuid) is required', 400);
    }
    if (!node_id || typeof node_id !== 'string') {
      return createErrorResponse('node_id (uuid) is required', 400);
    }
    if (typeof quantity !== 'number' || quantity <= 0) {
      return createErrorResponse('servings must be a positive number', 400);
    }

    // 1. Fetch recipe & recipe_ingredients dengan item_types details
    const { data: recipe, error: recipeErr } = await supabase
      .from('recipes')
      .select(`
        id,
        name,
        node_id,
        result_id,
        recipe_ingredients (
          item_id,
          quantity,
          item_types:item_id (
            item_id,
            item_name
          )
        )
      `)
      .eq('id', recipe_id)
      .single();

    if (recipeErr || !recipe) {
      console.error('Recipe fetch error:', recipeErr);
      return createErrorResponse('Recipe not found', 404);
    }

    const ingredients = recipe.recipe_ingredients || [];
    if (ingredients.length === 0) {
      return createErrorResponse('Recipe has no ingredients defined', 400);
    }

    // 2. Hitung kebutuhan per item_type
    const neededMap: Record<string, { quantity: number; item_name: string }> = {};
    for (const ing of ingredients) {
      const itemTypeId = ing.item_id;
      const itemName = ing.item_types[0]?.item_name || 'Unknown Item';
      const totalNeeded = ing.quantity * quantity;
      
      if (neededMap[itemTypeId]) {
        neededMap[itemTypeId].quantity += totalNeeded;
      } else {
        neededMap[itemTypeId] = { quantity: totalNeeded, item_name: itemName };
      }
    }

    // 3. Fetch item_instances untuk semua item_types yang dibutuhkan
    const itemTypeIds = Object.keys(neededMap);
    const { data: itemInstances, error: itemErr } = await supabase
      .from('item_instances')
      .select(`
        item_instance_id,
        item_type_id,
        item_count,
        expire_date,
        item_types (
          item_id,
          item_name
        )
      `)
      .in('item_type_id', itemTypeIds)
      .eq('node_id', node_id)
      .order('expire_date', { ascending: true }); // FIFO priority

    if (itemErr) {
      console.error('Failed to fetch item_instances:', itemErr);
      return createErrorResponse('Database error while checking ingredients', 500);
    }

    // 4. Alokasikan item_instances untuk memenuhi kebutuhan (FIFO greedy)
    const allocation: Record<string, { need: number; current: number; remaining: number }> = {};
    const allocationDetail: Array<{ 
      item_instance_id: string; 
      item_name: string; 
      quantity_used: number;
      remaining: number;
    }> = [];

    for (const itemTypeId of itemTypeIds) {
      const need = neededMap[itemTypeId].quantity;
      const itemName = neededMap[itemTypeId].item_name;
      let remaining = need;

      const candidates = itemInstances.filter((ii: any) => ii.item_type_id === itemTypeId);

      if (candidates.length === 0) {
        return createErrorResponse(
          `No stock found for ingredient: ${itemName} (item_type: ${itemTypeId})`,
          400
        );
      }

      for (const candidate of candidates) {
        if (remaining <= 0) break;

        const current = Number(candidate.item_count || 0);
        const take = Math.min(remaining, current);

        allocation[candidate.item_instance_id] = {
          need: take,
          current,
          remaining: current - take
        };

        allocationDetail.push({
          item_instance_id: candidate.item_instance_id,
          item_name: candidate.item_types[0]?.item_name || itemName,
          quantity_used: take,
          remaining: current - take
        });

        remaining -= take;
      }

      // Cek ketersediaan - error handling SPESIFIK
      if (remaining > 0) {
        const totalAvailable = candidates.reduce((sum: number, ii: any) => sum + Number(ii.item_count || 0), 0);
        return createErrorResponse(
          `Insufficient stock for ingredient "${itemName}": need ${need}, available ${need - remaining}. Total in node: ${totalAvailable}`,
          400
        );
      }
    }

    // 5. Decrement ingredients & create cooked item
    try {
      // Decrement each allocated item_instance
      for (const [instanceId, { remaining }] of Object.entries(allocation)) {
        const { error: updateErr } = await supabase
          .from('item_instances')
          .update({ item_count: remaining })
          .eq('item_instance_id', instanceId);

        if (updateErr) {
          console.error('Failed to update ingredient stock:', instanceId, updateErr);
          return createErrorResponse(
            `Failed to deduct ingredient: ${instanceId}. Please try again.`,
            500
          );
        }
      }

      // Insert cooked item_instance
      const insertPayload: any = {
        item_type_id: recipe.result_id,
        node_id: node_id,
        item_count: quantity,
      };
      if (expire_date) {
        insertPayload.expire_date = typeof expire_date === 'string' 
          ? expire_date 
          : new Date(expire_date).toISOString();
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('item_instances')
        .insert([insertPayload])
        .select(`
          item_instance_id,
          item_count,
          expire_date,
          item_types (
            item_id,
            item_name
          )
        `)
        .single();

      if (insertErr || !inserted) {
        console.error('Failed to insert cooked item_instance:', insertErr);
        return createErrorResponse(
          'Failed to create finished product. Ingredient stocks may have been deducted.',
          500
        );
      }

      return createSuccessResponse('Recipe cooked successfully', {
        cooked_item: {
          id: inserted.item_instance_id,
          name: inserted.item_types[0]?.item_name || 'Unknown',
          quantity: inserted.item_count,
          expire_date: inserted.expire_date,
        },
        ingredients_used: allocationDetail,
        recipe: {
          id: recipe.id,
          name: recipe.name
        }
      });
    } catch (err) {
      console.error('Unexpected error during cook operation:', err);
      return createErrorResponse('Unexpected server error', 500);
    }
  });
}