import { NextRequest } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  getPaginationParams,
  createPaginationMeta,
  getSupabaseClient,
  handleApiError,
  transformDbToApi,
  ITEM_INSTANCE_FIELD_MAPPING
} from '@/lib/api-helpers';

// GET /api/items/active - Read All Active Items
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const { searchParams } = new URL(request.url);
    const paginationParams = getPaginationParams(searchParams);
    const page = paginationParams.page || 1;
    const page_size = paginationParams.page_size || 50;
    
    // Optional filters
    const node_id = searchParams.get('node_id');
    const item_type_id = searchParams.get('item_type_id');
    const expired = searchParams.get('expired') === 'true';
    
    const supabase = await getSupabaseClient();
    
    let query = supabase
      .from('item_instances')
      .select(`
        *,
        item_types (
          id,
          item_name,
          item_type,
          item_description,
          item_image
        ),
        nodes (
          id,
          node_name,
          node_type,
          node_address
        )
      `, { count: 'exact' })
      .eq('status', false); // Only active items
    
    // Apply filters
    if (node_id) {
      query = query.eq('node_id', node_id);
    }
    if (item_type_id) {
      query = query.eq('item_type_id', item_type_id);
    }
    if (!expired) {
      // Exclude expired items if not explicitly requested
      query = query.or('expire_date.is.null,expire_date.gt.' + new Date().toISOString());
    }
    
    // Apply pagination
    const from = (page - 1) * page_size;
    const to = from + page_size - 1;
    
    const { data, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Active items fetch error:', error);
      return createErrorResponse('Failed to fetch active items', 500);
    }

    // Transform data to match API response format
    const transformedData = data?.map((item: any) => ({
      ...transformDbToApi(item, ITEM_INSTANCE_FIELD_MAPPING),
      location_type: item.node_id ? 'node' : 'transit',
      item_type: item.item_types ? {
        item_id: item.item_types.id,
        item_name: item.item_types.item_name,
        item_type: item.item_types.item_type,
        item_description: item.item_types.item_description,
        item_image: item.item_types.item_image
      } : null,
      current_node: item.nodes ? {
        node_id: item.nodes.id,
        node_name: item.nodes.node_name,
        node_type: item.nodes.node_type,
        node_address: item.nodes.node_address
      } : null
    })) || [];

    // Calculate summary statistics
    const summary = {
      total_active_items: count || 0,
      items_in_nodes: transformedData.filter(item => item.location_type === 'node').length,
      items_in_transit: transformedData.filter(item => item.location_type === 'transit').length,
      expiring_soon: transformedData.filter(item => 
        item.expire_date && 
        new Date(item.expire_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      ).length
    };

    const paginationMeta = createPaginationMeta(count || 0, page, page_size);

    return createSuccessResponse('Active items retrieved successfully', {
      items: transformedData,
      summary,
      pagination: paginationMeta
    });
  });
}