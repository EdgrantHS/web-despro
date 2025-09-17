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

// GET /api/item-instances - List Item Instances by Node with filtering
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const { searchParams } = new URL(request.url);
    const paginationParams = getPaginationParams(searchParams);
    const page = paginationParams.page || 1;
    const page_size = paginationParams.page_size || 50;
    
    // Optional filters
    const node_id = searchParams.get('node_id');
    const item_type_id = searchParams.get('item_type_id');
    const status = searchParams.get('status');
    const expired = searchParams.get('expired') === 'true';
    
    const supabase = await getSupabaseClient();
    
    let query = supabase
      .from('item_instances')
      .select(`
        *,
        item_types (
          item_id,
          item_name,
          item_type
        ),
        nodes (
          node_id,
          node_name,
          node_type
        )
      `, { count: 'exact' });
    
    // Default filter: only show active instances unless status is explicitly specified
    if (status === null) {
      query = query.eq('status', 'Active');
    } else {
      // Apply status filter if explicitly provided
      if (status === 'active') {
        query = query.eq('status', 'Active');
      } else if (status === 'inactive') {
        query = query.eq('status', 'Inactive');
      }
    }
    
    // Apply additional filters
    if (node_id) {
      query = query.eq('node_id', node_id);
    }
    if (item_type_id) {
      query = query.eq('item_type_id', item_type_id);
    }
    if (expired) {
      query = query.lt('expire_date', new Date().toISOString());
    }
    
    // Apply pagination
    const from = (page - 1) * page_size;
    const to = from + page_size - 1;
    
    const { data, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Item instances fetch error:', error);
      return createErrorResponse('Failed to fetch item instances', 500);
    }

    // Transform data to match API response format
    const transformedData = data?.map((item: any) => ({
      ...transformDbToApi(item, ITEM_INSTANCE_FIELD_MAPPING),
      item_type: item.item_types ? {
        item_id: item.item_types.item_id,
        item_name: item.item_types.item_name,
        item_type: item.item_types.item_type
      } : null,
      current_node: item.nodes ? {
        node_id: item.nodes.node_id,
        node_name: item.nodes.node_name,
        node_type: item.nodes.node_type
      } : null
    })) || [];

    const paginationMeta = createPaginationMeta(count || 0, page, page_size);

    return createSuccessResponse('Item instances retrieved successfully', {
      item_instances: transformedData,
      pagination: paginationMeta
    });
  });
}