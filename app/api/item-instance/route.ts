import { NextRequest } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  getSupabaseClient,
  validateRequired,
  validateUUID,
  handleApiError,
  transformDbToApi,
  ITEM_INSTANCE_FIELD_MAPPING
} from '@/lib/api-helpers';
import { CreateItemInstanceRequest } from '@/lib/api-types';

// POST /api/item-instance - Create Item Instance
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const body: CreateItemInstanceRequest = await request.json();
    
    // Validate required fields
    const missingFields = validateRequired(body, ['item_type_id', 'item_count']);
    if (missingFields.length > 0) {
      return createErrorResponse(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate UUIDs
    if (!validateUUID(body.item_type_id)) {
      return createErrorResponse('Invalid item_type_id format');
    }
    if (body.node_id && !validateUUID(body.node_id)) {
      return createErrorResponse('Invalid node_id format');
    }

    // Validate item_count
    if (body.item_count <= 0) {
      return createErrorResponse('item_count must be greater than 0');
    }

    const supabase = await getSupabaseClient();
    
    // Insert item instance
    const { data, error } = await supabase
      .from('item_instances')
      .insert({
        item_type_id: body.item_type_id,
        node_id: body.node_id || null,
        item_count: body.item_count,
        expire_date: body.expire_date || null,
        status: 'Active' // default to active
      })
      .select()
      .single();

    if (error) {
      console.error('Item instance creation error:', error);
      if (error.code === '23503') {
        return createErrorResponse('Invalid item_type_id or node_id', 400);
      }
      return createErrorResponse('Failed to create item instance', 500);
    }

    const transformedData = transformDbToApi(data, ITEM_INSTANCE_FIELD_MAPPING);
    return createSuccessResponse('Item instance created successfully', transformedData);
  });
}