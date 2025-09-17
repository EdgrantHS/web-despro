import { NextRequest } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  getPaginationParams,
  createPaginationMeta,
  getSupabaseClient,
  handleApiError,
  transformDbToApi,
  ITEM_TYPE_FIELD_MAPPING
} from '@/lib/api-helpers';

// GET /api/item-types - List All Item Types with filtering and pagination
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const { searchParams } = new URL(request.url);
    const paginationParams = getPaginationParams(searchParams);
    const page = paginationParams.page || 1;
    const page_size = paginationParams.page_size || 50;
    
    // Optional filters
    const item_type = searchParams.get('item_type');
    const status = searchParams.get('status');
    
    const supabase = await getSupabaseClient();
    
    let query = supabase.from('item_types').select('*', { count: 'exact' });
    
    // Default filter: only show active items unless status is explicitly specified
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
    if (item_type) {
      query = query.eq('item_type', item_type);
    }
    
    // Apply pagination
    const from = (page - 1) * page_size;
    const to = from + page_size - 1;
    
    const { data, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Item types fetch error:', error);
      return createErrorResponse('Failed to fetch item types', 500);
    }

    const transformedData = data?.map((item: any) => transformDbToApi(item, ITEM_TYPE_FIELD_MAPPING)) || [];
    const paginationMeta = createPaginationMeta(count || 0, page, page_size);

    return createSuccessResponse('Item types retrieved successfully', {
      item_types: transformedData,
      pagination: paginationMeta
    });
  });
}