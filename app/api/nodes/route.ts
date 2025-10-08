import { NextRequest } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  getPaginationParams,
  createPaginationMeta,
  getSupabaseClient,
  handleApiError,
  transformDbToApi,
  NODE_FIELD_MAPPING
} from '@/lib/api-helpers';

// GET /api/nodes - List All Nodes with filtering and pagination
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const { searchParams } = new URL(request.url);
    const paginationParams = getPaginationParams(searchParams);
    const page = paginationParams.page || 1;
    const page_size = paginationParams.page_size || 50;
    
    // Optional filters
    const node_type = searchParams.get('node_type');
    const status = searchParams.get('status');
    
    const supabase = await getSupabaseClient();
    
    let query = supabase.from('nodes').select('*', { count: 'exact' });
    
    // Default filter: only show active nodes unless status is explicitly specified
    if (status === null) {
      query = query.eq('node_status', 'Active');
    } else {
      // Apply status filter if explicitly provided
      if (status === 'active') {
        query = query.eq('node_status', 'Active');
      } else if (status === 'inactive') {
        query = query.eq('node_status', 'Inactive');
      }
    }
    
    // Apply filters
    if (node_type) {
      query = query.eq('node_type', node_type);
    }
    
    // Apply pagination
    const from = (page - 1) * page_size;
    const to = from + page_size - 1;
    
    const { data, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Nodes fetch error:', error);
      return createErrorResponse('Failed to fetch nodes', 500);
    }

    const transformedData = data?.map((item: any) => transformDbToApi(item, NODE_FIELD_MAPPING)) || [];
    const paginationMeta = createPaginationMeta(count || 0, page, page_size);

    return createSuccessResponse('Nodes retrieved successfully', {
      nodes: transformedData,
      pagination: paginationMeta
    });
  });
}