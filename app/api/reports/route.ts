import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  getSupabaseClient,
  handleApiError,
  getPaginationParams,
  createPaginationMeta
} from '@/lib/api-helpers';

/*
 NEXT ADDITIONAL DEVELOPMENT NOTES:
    - Adding action for reports (on proggress, diterima, ditolak, expired).
*/

// GET /api/reports - List All Reports with pagination
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const { searchParams } = new URL(request.url);
    const paginationParams = getPaginationParams(searchParams);
    const page = paginationParams.page || 1;
    const page_size = paginationParams.page_size || 50;

    const supabase = await getSupabaseClient();

    const from = (page - 1) * page_size;
    const to = from + page_size - 1;

    const { data, error, count } = await supabase
      .from('reports')
      .select('*', { count: 'exact' })
    //   .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Reports fetch error:', error);
      return createErrorResponse('Failed to fetch reports', 500);
    }

    const paginationMeta = createPaginationMeta(count || 0, page, page_size);

    return createSuccessResponse('Reports retrieved successfully', {
      reports: data || [],
      pagination: paginationMeta
    });
  });
}

// POST /api/reports - Create New Report
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const supabase = await getSupabaseClient();
    const body = await request.json();

    const {
      user_id,
      item_id,
      type,
      description,
      received_quantity,
      expired_quantity,
      evidence
    } = body;

    // Validasi field wajib
    if (!user_id || !item_id || !type) {
      return createErrorResponse('Missing required fields: user_id, item_id, type', 400);
    }

    // Validasi tipe report
    const validTypes = ['STOCK_DISCREPANCY', 'EXPIRED_ITEM', 'OTHER_ISSUE'];
    if (!validTypes.includes(type)) {
      return createErrorResponse(`Invalid type. Must be one of: ${validTypes.join(', ')}`, 400);
    }

    const { data, error } = await supabase
      .from('reports')
      .insert([{
        user_id,
        item_id,
        type,
        description: description || null,
        received_quantity: received_quantity || null,
        expired_quantity: expired_quantity || null,
        evidence: evidence || null
      }])
      .select('*')
      .single();

    if (error) {
      console.error('Report creation error:', error);
      return createErrorResponse('Failed to create report', 500);
    }

    return createSuccessResponse('Report created successfully', data);
  });
}
