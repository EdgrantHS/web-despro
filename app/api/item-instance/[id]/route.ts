import { NextRequest } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  getSupabaseClient,
  validateUUID,
  handleApiError,
  transformDbToApi,
  ITEM_INSTANCE_FIELD_MAPPING
} from '@/lib/api-helpers';
import { UpdateItemInstanceRequest } from '@/lib/api-types';

// GET /api/item-instance/[id] - Read Item Instance
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiError(async () => {
    const { id: itemInstanceId } = await params;
    
    if (!validateUUID(itemInstanceId)) {
      return createErrorResponse('Invalid item instance ID format');
    }

    const supabase = await getSupabaseClient();
    
    const { data, error } = await supabase
      .from('item_instances')
      .select(`
        *,
        item_types (
          item_id,
          item_name,
          item_type,
          item_description
        ),
        nodes (
          node_id,
          node_name,
          node_type
        )
      `)
      .eq('item_instance_id', itemInstanceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Item instance not found', 404);
      }
      console.error('Item instance fetch error:', error);
      return createErrorResponse('Failed to fetch item instance', 500);
    }

    // Transform data to match API response format
    const transformedData = {
      ...transformDbToApi(data, ITEM_INSTANCE_FIELD_MAPPING),
      item_type: data.item_types ? {
        item_id: data.item_types.item_id,
        item_name: data.item_types.item_name,
        item_type: data.item_types.item_type,
        item_description: data.item_types.item_description
      } : null,
      current_node: data.nodes ? {
        node_id: data.nodes.node_id,
        node_name: data.nodes.node_name,
        node_type: data.nodes.node_type
      } : null
    };

    return createSuccessResponse('Item instance retrieved successfully', transformedData);
  });
}

// PUT /api/item-instance/[id] - Update Item Instance
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiError(async () => {
    const { id: itemInstanceId } = await params;
    
    if (!validateUUID(itemInstanceId)) {
      return createErrorResponse('Invalid item instance ID format');
    }

    const body: UpdateItemInstanceRequest = await request.json();
    
    // Validate node_id if provided
    if (body.node_id && !validateUUID(body.node_id)) {
      return createErrorResponse('Invalid node_id format');
    }

    // Validate item_count if provided
    if (body.item_count !== undefined && body.item_count <= 0) {
      return createErrorResponse('item_count must be greater than 0');
    }

    const supabase = await getSupabaseClient();
    
    // Create update object with only provided fields
    const updateData: any = {};
    if (body.node_id !== undefined) updateData.node_id = body.node_id;
    if (body.item_count !== undefined) updateData.item_count = body.item_count;
    if (body.expire_date !== undefined) updateData.expire_date = body.expire_date;
    if (body.status !== undefined) updateData.status = body.status;

    const { data, error } = await supabase
      .from('item_instances')
      .update(updateData)
      .eq('item_instance_id', itemInstanceId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Item instance not found', 404);
      }
      if (error.code === '23503') {
        return createErrorResponse('Invalid node_id', 400);
      }
      console.error('Item instance update error:', error);
      return createErrorResponse('Failed to update item instance', 500);
    }

    const transformedData = transformDbToApi(data, ITEM_INSTANCE_FIELD_MAPPING);
    return createSuccessResponse('Item instance updated successfully', transformedData);
  });
}

// DELETE /api/item-instance/[id] - Delete Item Instance (Soft Delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiError(async () => {
    const { id: itemInstanceId } = await params;
    
    if (!validateUUID(itemInstanceId)) {
      return createErrorResponse('Invalid item instance ID format');
    }

    const supabase = await getSupabaseClient();
    
    // Soft delete by setting status to disabled ('Inactive')
    const { data, error } = await supabase
      .from('item_instances')
      .update({ 
        status: 'Inactive' // 'Inactive' = disabled
      })
      .eq('item_instance_id', itemInstanceId)
      .select('item_instance_id, status')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Item instance not found', 404);
      }
      console.error('Item instance delete error:', error);
      return createErrorResponse('Failed to delete item instance', 500);
    }

    return createSuccessResponse('Item instance deleted successfully', {
      item_instance_id: data.item_instance_id,
      deleted_at: new Date().toISOString(), // Client-side timestamp
      status: data.status
    });
  });
}