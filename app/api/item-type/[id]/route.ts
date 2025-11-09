import { NextRequest } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  getSupabaseClient,
  validateUUID,
  handleApiError,
  transformDbToApi,
  ITEM_TYPE_FIELD_MAPPING
} from '@/lib/api-helpers';
import { UpdateItemTypeRequest } from '@/lib/api-types';

// GET /api/item-type/[id] - Read Item Type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiError(async () => {
    const { id: itemId } = await params;
    
    if (!validateUUID(itemId)) {
      return createErrorResponse('Invalid item type ID format');
    }

    const supabase = await getSupabaseClient();
    
    const { data, error } = await supabase
      .from('item_types')
      .select('*')
      .eq('item_id', itemId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Item type not found', 404);
      }
      console.error('Item type fetch error:', error);
      return createErrorResponse('Failed to fetch item type', 500);
    }

    const transformedData = transformDbToApi(data, ITEM_TYPE_FIELD_MAPPING);
    return createSuccessResponse('Item type retrieved successfully', transformedData);
  });
}

// PUT /api/item-type/[id] - Update Item Type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiError(async () => {
    const { id: itemId } = await params;
    
    if (!validateUUID(itemId)) {
      return createErrorResponse('Invalid item type ID format');
    }

    const body: UpdateItemTypeRequest = await request.json();
    const supabase = await getSupabaseClient();
    
    // Create update object with only provided fields
    const updateData: any = {};
    if (body.item_name) updateData.item_name = body.item_name;
    if (body.item_type) updateData.item_type = body.item_type;
    if (body.item_description !== undefined) updateData.item_description = body.item_description;
    if (body.item_image !== undefined) updateData.item_image = body.item_image;
    if (body.status !== undefined) updateData.status = body.status;

    const { data, error } = await supabase
      .from('item_types')
      .update(updateData)
      .eq('item_id', itemId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Item type not found', 404);
      }
      console.error('Item type update error:', error);
      return createErrorResponse('Failed to update item type', 500);
    }

    const transformedData = transformDbToApi(data, ITEM_TYPE_FIELD_MAPPING);
    return createSuccessResponse('Item type updated successfully', transformedData);
  });
}

// DELETE /api/item-type/[id] - Delete Item Type (Soft Delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiError(async () => {
    const { id: itemId } = await params;
    
    if (!validateUUID(itemId)) {
      return createErrorResponse('Invalid item type ID format');
    }

    const supabase = await getSupabaseClient();
    
    // Soft delete by setting status to disabled ('Inactive')
    const { data, error } = await supabase
      .from('item_types')
      .update({ 
        status: 'Inactive' // 'Inactive' = disabled
      })
      .eq('item_id', itemId)
      .select('item_id, status')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Item type not found', 404);
      }
      console.error('Item type delete error:', error);
      return createErrorResponse('Failed to delete item type', 500);
    }

    return createSuccessResponse('Item type deleted successfully', {
      item_id: data.item_id,
      deleted_at: new Date().toISOString(), // Client-side timestamp
      status: data.status
    });
  });
}