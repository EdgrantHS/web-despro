import { NextRequest } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  getSupabaseClient,
  validateRequired,
  handleApiError,
  transformDbToApi,
  NODE_FIELD_MAPPING
} from '@/lib/api-helpers';
import { CreateNodeRequest } from '@/lib/api-types';

// POST /api/node - Create Node
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const body: CreateNodeRequest = await request.json();
    
    // Validate required fields
    const missingFields = validateRequired(body, ['node_name', 'node_type']);
    if (missingFields.length > 0) {
      return createErrorResponse(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate node_type
    const validNodeTypes = ['Source', 'Assembly', 'Distribution'];
    if (!validNodeTypes.includes(body.node_type)) {
      return createErrorResponse(`Invalid node_type. Must be one of: ${validNodeTypes.join(', ')}`);
    }

    const supabase = await getSupabaseClient();
    
    // Insert node
    const { data, error } = await supabase
      .from('nodes')
      .insert({
        node_name: body.node_name,
        node_type: body.node_type,
        node_address: body.node_address || null,
        node_latitude: body.node_latitude || null,
        node_longitude: body.node_longitude || null,
        node_status: body.node_status || 'Active' // default to Active
      })
      .select()
      .single();

    if (error) {
      console.error('Node creation error:', error);
      return createErrorResponse('Failed to create node', 500);
    }

    const transformedData = transformDbToApi(data, NODE_FIELD_MAPPING);
    return createSuccessResponse('Node successfully created', transformedData);
  });
}