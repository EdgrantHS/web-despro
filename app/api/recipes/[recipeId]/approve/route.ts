import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  getSupabaseClient,
  handleApiError
} from '@/lib/api-helpers';

/**
 * PUT /api/recipes/[recipeId]/approve - Approve recipe untuk global usage
 * 
 * Kegunaan:
 * - Admin approve recipe agar bisa digunakan secara global (set node_id = null)
 * - Jika recipe sudah global, return message bahwa recipe sudah global
 * 
 * Frontend Requirement:
 * 1. Add approval/promote button di recipe detail/list
 * 2. Show confirmation dialog sebelum kirim request:
 *    "Apakah Anda yakin ingin mempromosikan recipe ini menjadi global?
 *     Recipe ini akan tersedia untuk semua node."
 * 3. Success: show toast/notification dan refresh recipe data
 * 4. Error: show error notification
 * 
 * Response Success (200):
 * - Jika recipe berhasil diubah dari lokal → global:
 *   {
 *     "success": true,
 *     "message": "Recipe promoted to global successfully",
 *     "data": {
 *       "id": "recipe-uuid",
 *       "name": "Nasi Ayam Geprek",
 *       "node_id": null,  // ← now global
 *       "status": "global"
 *     }
 *   }
 * 
 * Response Success (200) - Already Global:
 * - Jika recipe sudah global:
 *   {
 *     "success": true,
 *     "message": "Recipe is already globally available",
 *     "data": {
 *       "id": "recipe-uuid",
 *       "name": "Nasi Ayam Geprek",
 *       "node_id": null,
 *       "status": "global"
 *     }
 *   }
 * 
 * Error Responses:
 * - 404: Recipe tidak ditemukan
 * - 500: Database error
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  return handleApiError(async () => {
    const { recipeId } = await params;

    if (!recipeId) {
      return createErrorResponse('Recipe ID is required', 400);
    }

    const supabase = await getSupabaseClient();

    try {
      // 1. Fetch current recipe
      const { data: recipe, error: fetchErr } = await supabase
        .from('recipes')
        .select('id, name, node_id')
        .eq('id', recipeId)
        .single();

      if (fetchErr) {
        if (fetchErr.code === 'PGRST116') {
          return createErrorResponse('Recipe not found', 404);
        }
        console.error('Recipe fetch error:', fetchErr);
        return createErrorResponse('Failed to fetch recipe', 500);
      }

      // 2. Check if recipe is already global
      if (recipe.node_id === null) {
        return createSuccessResponse('Recipe is already globally available', {
          id: recipe.id,
          name: recipe.name,
          node_id: null,
          status: 'global'
        });
      }

      // 3. Update node_id to null (promote to global)
      const { data: updatedRecipe, error: updateErr } = await supabase
        .from('recipes')
        .update({ node_id: null })
        .eq('id', recipeId)
        .select('id, name, node_id')
        .single();

      if (updateErr) {
        console.error('Recipe update error:', updateErr);
        return createErrorResponse('Failed to promote recipe to global', 500);
      }

      return createSuccessResponse('Recipe promoted to global successfully', {
        id: updatedRecipe.id,
        name: updatedRecipe.name,
        node_id: updatedRecipe.node_id,
        status: 'global'
      });
    } catch (err) {
      console.error('Unexpected error approving recipe:', err);
      return createErrorResponse('Unexpected server error', 500);
    }
  });
}
