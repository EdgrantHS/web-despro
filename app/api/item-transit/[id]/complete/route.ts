import { NextRequest } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  getSupabaseClient,
  validateRequired,
  validateUUID,
  handleApiError
} from '@/lib/api-helpers';
import { CompleteTransitRequest } from '@/lib/api-types';

// POST /api/item-transit/[id]/complete - Complete Item Transit
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiError(async () => {
    const { id: transitId } = await params;
    
    if (!validateUUID(transitId)) {
      return createErrorResponse('Invalid transit ID format');
    }

    const body: CompleteTransitRequest = await request.json();
    
    // Validate required fields
    const missingFields = validateRequired(body, ['time_arrival']);
    if (missingFields.length > 0) {
      return createErrorResponse(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const supabase = await getSupabaseClient();
    
    // First, get the transit details to update the item instance
    const { data: transitData, error: fetchError } = await supabase
      .from('item_transits')
      .select('item_instance_id, dest_node_id, time_departure')
      .eq('item_transit_id', transitId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse('Item transit not found', 404);
      }
      console.error('Transit fetch error:', fetchError);
      return createErrorResponse('Failed to fetch transit details', 500);
    }

    // Update transit to completed
    const { data, error } = await supabase
      .from('item_transits')
      .update({
        time_arrival: body.time_arrival
        // status: 'Completed' // Temporarily disabled - column may not exist
      })
      .eq('item_transit_id', transitId)
      .select('item_transit_id, time_departure, time_arrival, status, item_instance_id')
      .single();

    if (error) {
      console.error('Transit completion error:', error);
      return createErrorResponse('Failed to complete transit', 500);
    }

    // Update item instance location if dest_node_id exists
    if (transitData.dest_node_id) {
      const { error: updateError } = await supabase
        .from('item_instances')
        .update({ node_id: transitData.dest_node_id })
        .eq('item_instance_id', transitData.item_instance_id);

      if (updateError) {
        console.error('Item instance location update error:', updateError);
        // Continue anyway, transit completion was successful
      }
    }

    // Calculate duration
    const departureTime = new Date(transitData.time_departure);
    const arrivalTime = new Date(body.time_arrival);
    const durationMinutes = Math.floor((arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60));

    return createSuccessResponse('Item transit completed successfully', {
      item_transit_id: data.item_transit_id,
      completed_at: data.time_arrival,
      time_departure: data.time_departure,
      time_arrival: data.time_arrival,
      duration_minutes: durationMinutes,
      status: data.status,
      item_instance: {
        item_instance_id: data.item_instance_id,
        new_location: transitData.dest_node_id ? {
          node_id: transitData.dest_node_id,
          node_name: 'Updated Location' // This would need a join to get actual name
        } : null
      }
    });
  });
}