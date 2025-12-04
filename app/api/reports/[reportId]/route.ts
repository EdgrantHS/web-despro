import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  getSupabaseClient,
  handleApiError
} from '@/lib/api-helpers';

// GET /api/reports/[reportId] - Get Single Report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  return handleApiError(async () => {
    const { reportId } = await params;

    if (!reportId) {
      return createErrorResponse('Report ID is required', 400);
    }

    const supabase = await getSupabaseClient();

    const { data, error } = await supabase
      .from('reports')
      .select(`
        id,
        user_id,
        item_id,
        item_transit_id,
        type,
        status,
        description,
        received_quantity,
        expired_quantity,
        evidence,
        created_at,
        item_transits:item_transit_id (
          item_transit_id,
          item_instance_id,
          source_node_id,
          dest_node_id,
          status
        ),
        users:user_id (
          user_id,
          user_node_id
        )
      `)
      .eq('id', reportId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Report not found', 404);
      }
      console.error('Report fetch error:', error);
      return createErrorResponse('Failed to fetch report', 500);
    }

    return createSuccessResponse('Report retrieved successfully', data);
  });
}

// PUT /api/reports/[reportId] - Update Report Status
// Admin hanya bisa update status, tidak bisa edit informasi report
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  return handleApiError(async () => {
    const { reportId } = await params;
    const body = await request.json();

    if (!reportId) {
      return createErrorResponse('Report ID is required', 400);
    }

    const { status } = body;

    // Admin hanya bisa update status
    if (!status) {
      return createErrorResponse('status field is required', 400);
    }

    // Validasi status enum - harus match dengan Supabase enum dengan underscore
    const validStatuses = ['IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return createErrorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const supabase = await getSupabaseClient();

    const { data, error } = await supabase
      .from('reports')
      .update({ 
        status
      })
      .eq('id', reportId)
      .select(`
        id,
        user_id,
        item_id,
        item_transit_id,
        type,
        status,
        description,
        received_quantity,
        expired_quantity,
        evidence,
        created_at,
        item_transits:item_transit_id (
          item_transit_id,
          item_instance_id,
          source_node_id,
          dest_node_id,
          status
        ),
        users:user_id (
          user_id,
          user_node_id
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Report not found', 404);
      }
      console.error('Report update error:', error);
      return createErrorResponse('Failed to update report', 500);
    }

    return createSuccessResponse('Report status updated successfully', data);
  });
}

// DELETE /api/reports/[reportId] - Delete Report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  return handleApiError(async () => {
    const { reportId } = await params;

    if (!reportId) {
      return createErrorResponse('Report ID is required', 400);
    }

    const supabase = await getSupabaseClient();

    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Report not found', 404);
      }
      console.error('Report delete error:', error);
      return createErrorResponse('Failed to delete report', 500);
    }

    return createSuccessResponse('Report deleted successfully', { id: reportId });
  });
}
