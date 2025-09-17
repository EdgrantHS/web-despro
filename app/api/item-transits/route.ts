import { NextRequest } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  getPaginationParams,
  createPaginationMeta,
  getSupabaseClient,
  handleApiError,
  transformDbToApi,
  ITEM_TRANSIT_FIELD_MAPPING
} from '@/lib/api-helpers';

// GET /api/item-transits - List Active Transits
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const { searchParams } = new URL(request.url);
    const paginationParams = getPaginationParams(searchParams);
    const page = paginationParams.page || 1;
    const page_size = paginationParams.page_size || 50;
    
    // Optional filters
    const source_node_id = searchParams.get('source_node_id');
    const dest_node_id = searchParams.get('dest_node_id');
    const status = searchParams.get('status');
    const courier_name = searchParams.get('courier_name');
    
    const supabase = await getSupabaseClient();
    
    let query = supabase
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
          node_name
        ),
        dest_nodes:nodes!dest_node_id (
          node_id,
          node_name
        )
      `, { count: 'exact' });
    
    // Apply additional filters
    if (source_node_id) {
      query = query.eq('source_node_id', source_node_id);
    }
    if (dest_node_id) {
      query = query.eq('dest_node_id', dest_node_id);
    }
    if (courier_name) {
      query = query.ilike('courier_name', `%${courier_name}%`);
    }
    
    // TODO: Add status filtering once column is confirmed to exist
    // For now, temporarily disabled due to column not found error
    
    // Apply pagination
    const from = (page - 1) * page_size;
    const to = from + page_size - 1;
    
    const { data, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Transit records fetch error:', error);
      return createErrorResponse('Failed to fetch transit records', 500);
    }

    // Transform data to match API response format
    const transformedData = data?.map((item: any) => ({
      ...transformDbToApi(item, ITEM_TRANSIT_FIELD_MAPPING),
      item_instance: item.item_instances ? {
        item_instance_id: item.item_instances.item_instance_id,
        item_count: item.item_instances.item_count,
        item_type: item.item_instances.item_types ? {
          item_name: item.item_instances.item_types.item_name,
          item_type: item.item_instances.item_types.item_type
        } : null
      } : null,
      source_node: item.source_nodes ? {
        node_id: item.source_nodes.node_id,
        node_name: item.source_nodes.node_name
      } : null,
      dest_node: item.dest_nodes ? {
        node_id: item.dest_nodes.node_id,
        node_name: item.dest_nodes.node_name
      } : null
    })) || [];

    // Calculate summary statistics
    const activeTransits = transformedData.filter((item: any) => item.status === 'Active');
    const durations = transformedData
      .filter((item: any) => item.time_arrival && item.time_departure)
      .map((item: any) => {
        const departure = new Date(item.time_departure);
        const arrival = new Date(item.time_arrival);
        return (arrival.getTime() - departure.getTime()) / (1000 * 60); // minutes
      });

    const summary = {
      total_active_transits: activeTransits.length,
      average_duration_minutes: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
      longest_transit_days: durations.length > 0 ? Math.round(Math.max(...durations) / (60 * 24)) : 0
    };

    const paginationMeta = createPaginationMeta(count || 0, page, page_size);

    return createSuccessResponse('Transit records retrieved successfully', {
      transits: transformedData,
      summary,
      pagination: paginationMeta
    });
  });
}