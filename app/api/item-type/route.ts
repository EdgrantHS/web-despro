import { NextRequest } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  getSupabaseClient,
  validateRequired,
  handleApiError,
  transformDbToApi,
  ITEM_TYPE_FIELD_MAPPING
} from '@/lib/api-helpers';
import { CreateItemTypeRequest } from '@/lib/api-types';

// POST /api/item-type - Create Item Type
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const body: CreateItemTypeRequest = await request.json();
    
    // Validate required fields
    const missingFields = validateRequired(body, ['item_name', 'item_type']);
    if (missingFields.length > 0) {
      return createErrorResponse(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const supabase = await getSupabaseClient();
    
    // Insert item type
    const { data, error } = await supabase
      .from('item_types')
      .insert({
        item_name: body.item_name,
        item_type: body.item_type,
        item_description: body.item_description || null,
        item_image: body.item_image || null,
        status: 'Active' // default to active
      })
      .select()
      .single();

    if (error) {
      console.error('Item type creation error:', error);
      return createErrorResponse('Failed to create item type', 500);
    }

    const transformedData = transformDbToApi(data, ITEM_TYPE_FIELD_MAPPING);
    return createSuccessResponse('Item type created successfully', transformedData);
  });
}