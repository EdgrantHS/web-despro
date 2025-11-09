import { NextRequest } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  getSupabaseClient,
  validateUUID,
  handleApiError,
  transformDbToApi,
  ITEM_TRANSIT_FIELD_MAPPING
} from '@/lib/api-helpers';
import { UpdateItemTransitRequest, CompleteTransitRequest } from '@/lib/api-types';

// GET /api/item-transit/[id] - Read Item Transit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiError(async () => {
    const { id: transitId } = await params;
    
    if (!validateUUID(transitId)) {
      return createErrorResponse('Invalid transit ID format');
    }

    const supabase = await getSupabaseClient();
    
    const { data, error } = await supabase
      .from('item_transits')
      .select(`
        *,
        item_instances (
          item_instance_id,
          item_count,
          item_types (
            item_name,
            item_type
          )
        ),
        source_nodes:nodes!source_node_id (
          node_id,
          node_name,
          node_type
        ),
        dest_nodes:nodes!dest_node_id (
          node_id,
          node_name,
          node_type
        )
      `)
      .eq('item_transit_id', transitId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Item transit not found', 404);
      }
      console.error('Item transit fetch error:', error);
      return createErrorResponse('Failed to fetch item transit', 500);
    }

    // Transform data to match API response format
    const transformedData = {
      ...transformDbToApi(data, ITEM_TRANSIT_FIELD_MAPPING),
      item_instance: data.item_instances ? {
        item_instance_id: data.item_instances.item_instance_id,
        item_count: data.item_instances.item_count,
        item_type: data.item_instances.item_types ? {
          item_name: data.item_instances.item_types.item_name,
          item_type: data.item_instances.item_types.item_type
        } : null
      } : null,
      source_node: data.source_nodes ? {
        node_id: data.source_nodes.node_id,
        node_name: data.source_nodes.node_name,
        node_type: data.source_nodes.node_type
      } : null,
      dest_node: data.dest_nodes ? {
        node_id: data.dest_nodes.node_id,
        node_name: data.dest_nodes.node_name,
        node_type: data.dest_nodes.node_type
      } : null
    };

    return createSuccessResponse('Item transit retrieved successfully', transformedData);
  });
}

// PUT /api/item-transit/[id] - Update Item Transit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiError(async () => {
    const { id: transitId } = await params;
    
    if (!validateUUID(transitId)) {
      return createErrorResponse('Invalid transit ID format');
    }

    const body: UpdateItemTransitRequest = await request.json();
    
    // Validate dest_node_id if provided
    if (body.dest_node_id && !validateUUID(body.dest_node_id)) {
      return createErrorResponse('Invalid dest_node_id format');
    }

    const supabase = await getSupabaseClient();
    
    // Create update object with only provided fields
    const updateData: any = {};
    if (body.dest_node_id !== undefined) updateData.dest_node_id = body.dest_node_id;
    if (body.time_arrival !== undefined) updateData.time_arrival = body.time_arrival;
    if (body.courier_name !== undefined) updateData.courier_name = body.courier_name;
    if (body.courier_phone !== undefined) updateData.courier_phone = body.courier_phone;
    if (body.status !== undefined) updateData.status = body.status;

    const { data, error } = await supabase
      .from('item_transits')
      .update(updateData)
      .eq('item_transit_id', transitId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Item transit not found', 404);
      }
      if (error.code === '23503') {
        return createErrorResponse('Invalid dest_node_id', 400);
      }
      console.error('Item transit update error:', error);
      return createErrorResponse('Failed to update item transit', 500);
    }

    const transformedData = transformDbToApi(data, ITEM_TRANSIT_FIELD_MAPPING);
    return createSuccessResponse('Item transit updated successfully', transformedData);
  });
}