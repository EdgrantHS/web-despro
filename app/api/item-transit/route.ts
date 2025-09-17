import { NextRequest } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  getSupabaseClient,
  validateRequired,
  validateUUID,
  handleApiError,
  transformDbToApi,
  ITEM_TRANSIT_FIELD_MAPPING
} from '@/lib/api-helpers';
import { CreateItemTransitRequest } from '@/lib/api-types';

// POST /api/item-transit - Create Item Transit
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const body: CreateItemTransitRequest = await request.json();
    
    // Validate required fields
    const missingFields = validateRequired(body, ['item_instance_id', 'source_node_id', 'time_departure']);
    if (missingFields.length > 0) {
      return createErrorResponse(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate UUIDs
    if (!validateUUID(body.item_instance_id)) {
      return createErrorResponse('Invalid item_instance_id format');
    }
    if (!validateUUID(body.source_node_id)) {
      return createErrorResponse('Invalid source_node_id format');
    }
    if (body.dest_node_id && !validateUUID(body.dest_node_id)) {
      return createErrorResponse('Invalid dest_node_id format');
    }

    const supabase = await getSupabaseClient();
    
    // Insert item transit
    const { data, error } = await supabase
      .from('item_transits')
      .insert({
        item_instance_id: body.item_instance_id,
        source_node_id: body.source_node_id,
        dest_node_id: body.dest_node_id || null,
        time_departure: body.time_departure,
        courier_name: body.courier_name || null,
        courier_phone: body.courier_phone || null,
        qr_url: body.qr_url || null
        // status: body.status || 'Active' // Temporarily disabled - column may not exist
      })
      .select()
      .single();

    if (error) {
      console.error('Item transit creation error:', error);
      if (error.code === '23503') {
        return createErrorResponse('Invalid item_instance_id, source_node_id, or dest_node_id', 400);
      }
      return createErrorResponse('Failed to create item transit', 500);
    }

    // Update item instance to remove from node (set node_id to null)
    const { error: updateError } = await supabase
      .from('item_instances')
      .update({ node_id: null })
      .eq('id', body.item_instance_id);

    if (updateError) {
      console.error('Item instance update error:', updateError);
      // Continue anyway, transit was created successfully
    }

    const transformedData = transformDbToApi(data, ITEM_TRANSIT_FIELD_MAPPING);
    return createSuccessResponse('Item transit created successfully', transformedData);
  });
}