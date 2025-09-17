import { NextRequest, NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  getSupabaseClient,
  validateUUID,
  handleApiError,
  transformDbToApi,
  NODE_FIELD_MAPPING
} from '@/lib/api-helpers';
import { UpdateNodeRequest } from '@/lib/api-types';

// GET /api/node/[id] - Read Node
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiError(async () => {
    const { id: nodeId } = await params;
    
    if (!validateUUID(nodeId)) {
      return createErrorResponse('Invalid node ID format');
    }

    const supabase = await getSupabaseClient();
    
    const { data, error } = await supabase
      .from('nodes')
      .select('*')
      .eq('node_id', nodeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Node not found', 404);
      }
      console.error('Node fetch error:', error);
      return createErrorResponse('Failed to fetch node', 500);
    }

    const transformedData = transformDbToApi(data, NODE_FIELD_MAPPING);
    return createSuccessResponse('Node retrieved successfully', transformedData);
  });
}

// PUT /api/node/[id] - Update Node
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiError(async () => {
    const { id: nodeId } = await params;
    
    if (!validateUUID(nodeId)) {
      return createErrorResponse('Invalid node ID format');
    }

    const body: UpdateNodeRequest = await request.json();
    
    // Validate node_type if provided
    if (body.node_type) {
      const validNodeTypes = ['Source', 'Assembly', 'Distribution'];
      if (!validNodeTypes.includes(body.node_type)) {
        return createErrorResponse(`Invalid node_type. Must be one of: ${validNodeTypes.join(', ')}`);
      }
    }

    const supabase = await getSupabaseClient();
    
    // Create update object with only provided fields
    const updateData: any = {};
    if (body.node_name) updateData.node_name = body.node_name;
    if (body.node_type) updateData.node_type = body.node_type;
    if (body.node_address !== undefined) updateData.node_address = body.node_address;
    if (body.node_latitude !== undefined) updateData.node_latitude = body.node_latitude;
    if (body.node_longitude !== undefined) updateData.node_longitude = body.node_longitude;
    if (body.node_status !== undefined) updateData.node_status = body.node_status;

    const { data, error } = await supabase
      .from('nodes')
      .update(updateData)
      .eq('node_id', nodeId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Node not found', 404);
      }
      console.error('Node update error:', error);
      return createErrorResponse('Failed to update node', 500);
    }

    const transformedData = transformDbToApi(data, NODE_FIELD_MAPPING);
    return createSuccessResponse('Node updated successfully', transformedData);
  });
}

// DELETE /api/node/[id] - Delete Node (Soft Delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiError(async () => {
    const { id: nodeId } = await params;
    
    if (!validateUUID(nodeId)) {
      return createErrorResponse('Invalid node ID format');
    }

    const supabase = await getSupabaseClient();
    
    // Soft delete by setting status to Inactive
    const { data, error } = await supabase
      .from('nodes')
      .update({ 
        node_status: 'Inactive' // Inactive status
      })
      .eq('node_id', nodeId)
      .select('node_id, node_status')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Node not found', 404);
      }
      console.error('Node delete error:', error);
      return createErrorResponse('Failed to delete node', 500);
    }

    return createSuccessResponse('Node deleted successfully', {
      node_id: data.node_id,
      deleted_at: new Date().toISOString(), // Client-side timestamp since DB doesn't track this
      status: data.node_status
    });
  });
}