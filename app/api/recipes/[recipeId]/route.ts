/**
 * RECIPE MANAGEMENT API ENDPOINTS
 * 
 * Dokumentasi untuk Frontend Developer
 * ================================================================================================
 */

/**
 * GET /api/recipes/[recipeId]
 * 
 * Kegunaan:
 * - Mengambil data recipe lengkap beserta semua ingredients
 * - Digunakan saat user ingin melihat detail recipe atau edit recipe
 * 
 * Frontend Requirement:
 * 1. Buat form dengan input fields:
 *    - Recipe name (text input)
 *    - Instructions (textarea)
 *    - Node ID (dropdown/select - jika ada pilihan node)
 *    - Result item type (dropdown/select - jenis produk jadi)
 * 
 * 2. Tampilkan ingredients dalam bentuk tabel/list dengan kolom:
 *    - Item name (dari item_types.item_name)
 *    - Quantity (angka)
 *    - Unit (jika ada di schema item_types)
 *    - Note (textarea opsional)
 * 
 * 3. Setiap ingredient row harus memiliki tombol:
 *    - Edit (untuk mengubah quantity/note)
 *    - Delete (untuk menghapus dari list)
 * 
 * 4. Ada tombol "Add Ingredient" untuk menambah ingredient baru
 * 
 * Response Structure:
 * {
 *   id: string (UUID)
 *   name: string
 *   node_id: string | null (null = global recipe, ada value = local node only)
 *   result_id: string (item_types.item_id - produk yang dihasilkan)
 *   instructions: string (instruksi memasak)
 *   created_at: ISO timestamp
 *   item_types: { item_id, item_name } (info produk jadi)
 *   recipe_ingredients: [
 *     {
 *       id: string (PENTING - gunakan untuk update/delete)
 *       item_id: string
 *       quantity: number
 *       note: string | null
 *       item_types: { item_id, item_name }
 *     }
 *   ]
 * }
 * 
 * Error Handling:
 * - 404: Recipe tidak ditemukan
 * - 500: Database error
 */

/**
 * PUT /api/recipes/[recipeId]
 * 
 * Kegunaan:
 * - Update recipe metadata (name, instructions, node_id, result_id)
 * - Update/add/delete ingredients dalam satu request
 * 
 * Frontend Requirement:
 * 
 * 1. PENTING: Sebelum kirim PUT request, HARUS GET dulu untuk dapat ID dari setiap ingredient
 *    (ID dari response GET /api/recipes/[recipeId] - ada di field recipe_ingredients[].id)
 * 
 * 2. Workflow Update:
 *    Step 1: User edit form
 *    Step 2: Collect data dari form + data ingredients yang sudah diedit
 *    Step 3: Build request body dengan 3 tipe ingredient:
 * 
 *    a) UPDATE existing ingredient (punya ID):
 *       {
 *         "id": "ingredient-uuid-dari-GET",
 *         "item_id": "item-type-uuid",
 *         "quantity": 200,
 *         "note": "edited note"
 *       }
 * 
 *    b) CREATE new ingredient (TANPA ID):
 *       {
 *         "item_id": "item-type-uuid-baru",
 *         "quantity": 100,
 *         "note": "ingredient baru"
 *       }
 * 
 *    c) DELETE ingredient (JANGAN include dalam array):
 *       - Cukup jangan masukkan ingredient ID di array recipe_ingredients
 *       - API akan otomatis delete yang tidak ada
 * 
 * 3. Frontend Logic untuk Handle Ingredient Changes:
 *    - Simpan original ingredients dari GET response
 *    - Track perubahan user (edit, delete, add)
 *    - Build array ingredients untuk PUT:
 *      * Ingredients yang di-edit: include ID + changes
 *      * Ingredients yang tidak di-edit: include ID + data original
 *      * Ingredients yang dihapus: jangan include sama sekali
 *      * Ingredients baru: include tanpa ID
 * 
 * 4. Contoh Scenario Frontend:
 *    Jika user:
 *    - Update Ayam dari 1 → 2
 *    - Hapus MSG
 *    - Tambah Garam
 * 
 *    Maka request body:
 *    {
 *      "recipe_ingredients": [
 *        // Semua ingredient original KECUALI MSG
 *        { id: "...", item_id: "ayam-uuid", quantity: 2 },  // updated
 *        { id: "...", item_id: "wortel-uuid", quantity: 2 }, // unchanged
 *        { id: "...", item_id: "lobak-uuid", quantity: 2 },  // unchanged
 *        // ... ingredients lain yang tidak dihapus
 * 
 *        // Ingredient baru (TANPA ID)
 *        { item_id: "garam-uuid", quantity: 0.5, note: "baru" }
 *      ]
 *    }
 * 
 * 5. Validasi Frontend:
 *    - Quantity harus > 0
 *    - item_id harus ada (tidak null/undefined)
 *    - Minimal 1 ingredient harus ada
 *    - Recipe name tidak boleh kosong
 * 
 * Response Structure: Sama seperti GET - return updated recipe lengkap
 * 
 * Error Handling:
 * - 400: Validation error (quantity invalid, item_id missing, dll)
 * - 404: Recipe tidak ditemukan
 * - 500: Database error
 */

/**
 * DELETE /api/recipes/[recipeId]
 * 
 * Kegunaan:
 * - Hapus recipe beserta semua ingredients-nya secara permanent
 * - Biasanya dipanggil saat user klik "Delete Recipe" dengan confirmation
 * 
 * Frontend Requirement:
 * 
 * 1. Tambahkan confirmation dialog/modal sebelum panggil DELETE:
 *    "Apakah Anda yakin ingin menghapus recipe ini? Tindakan ini tidak dapat dibatalkan."
 * 
 * 2. Show recipe name di confirmation untuk extra clarity
 * 
 * 3. Disable button selama proses delete (loading state)
 * 
 * 4. Response akan return:
 *    {
 *      "success": true,
 *      "message": "Recipe deleted successfully",
 *      "data": { "id": "recipe-uuid" }
 *    }
 * 
 * 5. Setelah delete sukses:
 *    - Redirect ke halaman list recipes
 *    - Atau close modal dan refresh list
 *    - Show success notification/toast
 * 
 * Error Handling:
 * - 404: Recipe tidak ditemukan (sudah dihapus sebelumnya?)
 * - 500: Database error - show error notification
 */

/**
 * FRONTEND IMPLEMENTATION CHECKLIST
 * ================================================================================================
 */

/**
 * 1. FORM STRUCTURE:
 *    ☐ Recipe Name input (required)
 *    ☐ Instructions textarea (required)
 *    ☐ Node ID dropdown/select (nullable - untuk global/local recipe)
 *    ☐ Result Item Type dropdown/select (required - produk jadi)
 *    ☐ Ingredients table/list
 *      ☐ Item Name column (read-only dari item_types)
 *      ☐ Quantity column (editable number)
 *      ☐ Note column (editable text)
 *      ☐ Actions column (Edit button, Delete button)
 *    ☐ "Add Ingredient" button
 *    ☐ "Save Recipe" button
 *    ☐ "Delete Recipe" button (dengan confirmation)
 * 
 * 2. DATA MANAGEMENT:
 *    ☐ State untuk store recipe data (dari GET response)
 *    ☐ State untuk store original ingredients (untuk track changes)
 *    ☐ State untuk store edited ingredients
 *    ☐ State untuk store new ingredients (belum punya ID)
 *    ☐ State untuk store deleted ingredient IDs
 *    ☐ Loading state untuk setiap API call
 *    ☐ Error state untuk display error messages
 * 
 * 3. INGREDIENT MANAGEMENT:
 *    ☐ Function untuk add ingredient (build object tanpa ID)
 *    ☐ Function untuk edit ingredient (update quantity/note)
 *    ☐ Function untuk delete ingredient (mark untuk deletion)
 *    ☐ Function untuk build request body (combine all changes)
 *    ☐ Validation: quantity > 0, item_id exists
 * 
 * 4. API INTEGRATION:
 *    ☐ GET /api/recipes/[recipeId] - pada component mount/page load
 *    ☐ PUT /api/recipes/[recipeId] - saat user klik "Save"
 *    ☐ DELETE /api/recipes/[recipeId] - saat user confirm delete
 *    ☐ Error handling untuk setiap request
 *    ☐ Loading states untuk UX feedback
 * 
 * 5. VALIDATION:
 *    ☐ Client-side validation sebelum submit
 *    ☐ Display error messages dari API response
 *    ☐ Prevent double submit (disable button saat loading)
 * 
 * 6. USER FEEDBACK:
 *    ☐ Show loading spinner saat fetch data
 *    ☐ Show success toast/notification setelah update/delete
 *    ☐ Show error toast/notification saat ada error
 *    ☐ Disable form fields saat loading
 *    ☐ Unsaved changes warning (opsional tapi recommended)
 * 
 * 7. EDGE CASES:
 *    ☐ Handle recipe tidak ditemukan (404)
 *    ☐ Handle empty ingredients list
 *    ☐ Handle network error
 *    ☐ Handle concurrent requests
 *    ☐ Handle user refresh/navigate away saat ada unsaved changes
 */

/**
 * PENTING - WORKFLOW UNTUK EDIT RECIPE:
 * ================================================================================================
 * 
 * 1. USER OPENS EDIT PAGE:
 *    GET /api/recipes/[recipeId]
 *    → Store response di state (this is "original data")
 *    → Display di form
 * 
 * 2. USER MAKES CHANGES:
 *    → Collect all changes di state
 *    → Track: which ingredients changed, which added, which deleted
 * 
 * 3. USER CLICKS SAVE:
 *    → Build request body:
 *      * Include ALL ingredients yang tidak dihapus (dengan ID jika update)
 *      * Include new ingredients tanpa ID
 *      * Ingredients yang dihapus: jangan include
 *    → PUT /api/recipes/[recipeId] dengan body tersebut
 *    → If success: show toast, redirect or refresh
 *    → If error: show error message, keep form data
 * 
 * 4. SERVER LOGIC (Backend - sudah implemented):
 *    → Auto-detect: update vs insert vs delete
 *    → Execute sesuai dengan ID presence:
 *      * ada ID: UPDATE
 *      * no ID: INSERT
 *      * not in request array: DELETE
 */

/**
 * CONTOH REQUEST BODY UNTUK DIFFERENT SCENARIOS:
 * ================================================================================================
 */

/**
 * SCENARIO 1: Update 1 ingredient quantity only
 * User hanya ubah Ayam dari 1 → 2
 * 
 * Request:
 * {
 *   "recipe_ingredients": [
 *     { id: "uuid-1", item_id: "ayam-uuid", quantity: 2 },     // CHANGED
 *     { id: "uuid-2", item_id: "wortel-uuid", quantity: 2 },   // unchanged
 *     { id: "uuid-3", item_id: "lobak-uuid", quantity: 2 },    // unchanged
 *     ...semua ingredient lain...
 *   ]
 * }
 */

/**
 * SCENARIO 2: Add new ingredient (tanpa delete yang lain)
 * User tambah Garam
 * 
 * Request:
 * {
 *   "recipe_ingredients": [
 *     { id: "uuid-1", item_id: "ayam-uuid", quantity: 1 },     // unchanged
 *     { id: "uuid-2", item_id: "wortel-uuid", quantity: 2 },   // unchanged
 *     ...semua ingredient lain unchanged...
 *     { item_id: "garam-uuid", quantity: 0.5 }                 // NEW (NO ID)
 *   ]
 * }
 */

/**
 * SCENARIO 3: Delete ingredient (tanpa include di array)
 * User hapus MSG
 * 
 * Request:
 * {
 *   "recipe_ingredients": [
 *     { id: "uuid-1", item_id: "ayam-uuid", quantity: 1 },     // unchanged
 *     { id: "uuid-2", item_id: "wortel-uuid", quantity: 2 },   // unchanged
 *     { id: "uuid-4", item_id: "lobak-uuid", quantity: 2 },    // unchanged
 *     ...semua ingredient lain EXCEPT MSG...
 *     
 *     // uuid-3 (MSG) TIDAK DIINCLUDE → akan DELETE otomatis
 *   ]
 * }
 */

/**
 * SCENARIO 4: Multiple changes (update + add + delete)
 * User: ubah Wortel 2→3, hapus MSG, tambah Garam
 * 
 * Request:
 * {
 *   "recipe_ingredients": [
 *     { id: "uuid-1", item_id: "ayam-uuid", quantity: 1 },     // unchanged
 *     { id: "uuid-2", item_id: "wortel-uuid", quantity: 3 },   // CHANGED
 *     { id: "uuid-4", item_id: "lobak-uuid", quantity: 2 },    // unchanged
 *     ...semua ingredient lain EXCEPT MSG...
 *     { item_id: "garam-uuid", quantity: 0.5 }                 // NEW (NO ID)
 *     
 *     // uuid-3 (MSG) TIDAK DIINCLUDE → akan DELETE otomatis
 *   ]
 * }
 */

import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  getSupabaseClient,
  handleApiError
} from '@/lib/api-helpers';

// GET /api/recipes/[recipeId] - Get single recipe
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  return handleApiError(async () => {
    const { recipeId } = await params;

    if (!recipeId) {
      return createErrorResponse('Recipe ID is required', 400);
    }

    const supabase = await getSupabaseClient();

    const { data: recipe, error } = await supabase
      .from('recipes')
      .select(`
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
      `)
      .eq('id', recipeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Recipe not found', 404);
      }
      console.error('Recipe fetch error:', error);
      return createErrorResponse('Failed to fetch recipe', 500);
    }

    return createSuccessResponse('Recipe retrieved successfully', recipe);
  });
}

// PUT /api/recipes/[recipeId] - Update recipe dengan smart ingredient handling
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  return handleApiError(async () => {
    const { recipeId } = await params;
    const body = await request.json();

    if (!recipeId) {
      return createErrorResponse('Recipe ID is required', 400);
    }

    const {
      name,
      node_id,
      result_id,
      instructions,
      recipe_ingredients  // array dengan id untuk update, atau tanpa id untuk create
    } = body;

    const supabase = await getSupabaseClient();

    try {
      // 1. Update recipe metadata
      const updateFields: any = {};
      if (name !== undefined) updateFields.name = name;
      if (node_id !== undefined) updateFields.node_id = node_id;
      if (result_id !== undefined) updateFields.result_id = result_id;
      if (instructions !== undefined) updateFields.instructions = instructions;

      if (Object.keys(updateFields).length > 0) {
        const { error: updateErr } = await supabase
          .from('recipes')
          .update(updateFields)
          .eq('id', recipeId);

        if (updateErr) {
          console.error('Recipe update error:', updateErr);
          return createErrorResponse('Failed to update recipe', 500);
        }
      }

      // 2. Handle ingredients updates (smart: delete/update/create)
      if (Array.isArray(recipe_ingredients)) {
        // Validasi ingredients
        for (const ing of recipe_ingredients) {
          if (!ing.item_id || typeof ing.item_id !== 'string') {
            return createErrorResponse('Each ingredient must have item_id (uuid)', 400);
          }
          if (typeof ing.quantity !== 'number' || ing.quantity <= 0) {
            return createErrorResponse('Each ingredient quantity must be a positive number', 400);
          }
        }

        // Separate ingredients ke 3 kategori
        const toCreate = recipe_ingredients.filter((ing: any) => !ing.id);
        const toUpdate = recipe_ingredients.filter((ing: any) => ing.id);
        const toUpdateIds = toUpdate.map((ing: any) => ing.id);

        // DELETE ingredients yang tidak ada di request (SMART DELETE)
        if (toUpdateIds.length > 0) {
          // Hanya delete yang tidak ada di array yang dikirim
          const { error: deleteErr } = await supabase
            .from('recipe_ingredients')
            .delete()
            .eq('recipe_id', recipeId)
            .not('id', 'in', `(${toUpdateIds.map(id => `"${id}"`).join(',')})`);

          if (deleteErr && deleteErr.code !== 'PGRST116') {
            console.error('Failed to delete removed ingredients:', deleteErr);
            return createErrorResponse('Failed to update ingredients', 500);
          }
        } else if (recipe_ingredients.length === 0) {
          // Jika array kosong, delete semua
          const { error: deleteErr } = await supabase
            .from('recipe_ingredients')
            .delete()
            .eq('recipe_id', recipeId);

          if (deleteErr) {
            console.error('Failed to delete all ingredients:', deleteErr);
            return createErrorResponse('Failed to delete ingredients', 500);
          }
        }

        // UPDATE existing ingredients (SMART UPDATE)
        for (const ing of toUpdate) {
          const { error: updateErr } = await supabase
            .from('recipe_ingredients')
            .update({
              item_id: ing.item_id,
              quantity: ing.quantity,
              note: ing.note || null
            })
            .eq('id', ing.id);

          if (updateErr) {
            console.error('Failed to update ingredient:', ing.id, updateErr);
            return createErrorResponse(`Failed to update ingredient ${ing.id}`, 500);
          }
        }

        // CREATE new ingredients (SMART CREATE)
        if (toCreate.length > 0) {
          const ingredientRows = toCreate.map((ing: any) => ({
            recipe_id: recipeId,
            item_id: ing.item_id,
            quantity: ing.quantity,
            note: ing.note || null
          }));

          const { error: insertErr } = await supabase
            .from('recipe_ingredients')
            .insert(ingredientRows);

          if (insertErr) {
            console.error('Failed to insert new ingredients:', insertErr);
            return createErrorResponse('Failed to add new ingredients', 500);
          }
        }
      }

      // 3. Fetch updated recipe
      const { data: updatedRecipe, error: fetchErr } = await supabase
        .from('recipes')
        .select(`
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
        `)
        .eq('id', recipeId)
        .single();

      if (fetchErr) {
        console.error('Failed to fetch updated recipe:', fetchErr);
        return createErrorResponse('Recipe updated but failed to retrieve updated data', 500);
      }

      return createSuccessResponse('Recipe updated successfully', updatedRecipe);
    } catch (err) {
      console.error('Unexpected error updating recipe:', err);
      return createErrorResponse('Unexpected server error', 500);
    }
  });
}

// DELETE /api/recipes/[recipeId] - Delete recipe
export async function DELETE(
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
      // 1. Delete recipe_ingredients (cascade should handle this, but explicit for safety)
      const { error: deleteIngrErr } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', recipeId);

      if (deleteIngrErr) {
        console.error('Failed to delete ingredients:', deleteIngrErr);
        return createErrorResponse('Failed to delete recipe ingredients', 500);
      }

      // 2. Delete recipe
      const { error: deleteErr } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId);

      if (deleteErr) {
        if (deleteErr.code === 'PGRST116') {
          return createErrorResponse('Recipe not found', 404);
        }
        console.error('Recipe delete error:', deleteErr);
        return createErrorResponse('Failed to delete recipe', 500);
      }

      return createSuccessResponse('Recipe deleted successfully', { id: recipeId });
    } catch (err) {
      console.error('Unexpected error deleting recipe:', err);
      return createErrorResponse('Unexpected server error', 500);
    }
  });
}
