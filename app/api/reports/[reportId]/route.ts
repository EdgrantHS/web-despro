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
      .select('*')
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

// PUT /api/reports/[reportId] - Update Report
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

    const {
      type,
      description,
      received_quantity,
      expired_quantity,
      evidence
    } = body;

    // Validasi tipe report jika ada
    if (type) {
      const validTypes = ['STOCK_DISCREPANCY', 'EXPIRED_ITEM', 'OTHER_ISSUE'];
      if (!validTypes.includes(type)) {
        return createErrorResponse(`Invalid type. Must be one of: ${validTypes.join(', ')}`, 400);
      }
    }

    const supabase = await getSupabaseClient();

    // Siapkan field yang akan di-update
    const updateFields: any = {};
    if (type !== undefined) updateFields.type = type;
    if (description !== undefined) updateFields.description = description;
    if (received_quantity !== undefined) updateFields.received_quantity = received_quantity;
    if (expired_quantity !== undefined) updateFields.expired_quantity = expired_quantity;
    if (evidence !== undefined) updateFields.evidence = evidence;

    if (Object.keys(updateFields).length === 0) {
      return createErrorResponse('No fields to update', 400);
    }

    const { data, error } = await supabase
      .from('reports')
      .update(updateFields)
      .eq('id', reportId)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Report not found', 404);
      }
      console.error('Report update error:', error);
      return createErrorResponse('Failed to update report', 500);
    }

    return createSuccessResponse('Report updated successfully', data);
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
