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
// Query parameters:
//   - node_id (optional): Filter reports untuk node admin. Menampilkan reports dimana:
//     1. user membuat report berasal dari node ini (reports.users.user_node_id = node_id)
//     2. paket yang dilapor berasal dari node ini (item_transits.source_node_id = node_id)
//   - Jika node_id tidak diberikan: tampilkan semua reports (untuk super admin)
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const { searchParams } = new URL(request.url);
    const paginationParams = getPaginationParams(searchParams);
    const page = paginationParams.page || 1;
    const page_size = paginationParams.page_size || 50;
    const nodeIdFilter = searchParams.get('node_id');

    const supabase = await getSupabaseClient();

    let query = supabase
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
          item_instances:item_instance_id (
            item_types(
              item_name,
              item_type
            )
          ),
          source_node_id,
          dest_node_id,
          status,
          source_nodes:nodes!source_node_id (
            node_name
          ),
          dest_nodes:nodes!dest_node_id (
            node_name
          )
        ),
        users:user_id (
          user_id,
          node_id,
          nodes:node_id (
            node_name
          )
        )
      `, { count: 'exact' });

    // Jika node_id diberikan, filter reports
    if (nodeIdFilter) {
      // Fetch full data terlebih dahulu, kemudian filter di aplikasi
      // karena Supabase RLS dan OR logic bisa kompleks dengan nested relations
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Reports fetch error:', error);
      return createErrorResponse('Failed to fetch reports', 500);
    }

    // Transform dan filter data
    let formattedReports = (data || []).map((report: any) => ({
      id: report.id,
      type: report.type,
      status: report.status,
      description: report.description,
      evidence: report.evidence,
      quantities: {
        received: report.received_quantity,
        expired: report.expired_quantity
      },
      created_at: report.created_at,
      user: report.users ? {
        id: report.users.user_id,
        node_id: report.users.node_id,
        node_name: report.users.nodes?.node_name
      } : null,
      item_transit: report.item_transits ? {
        id: report.item_transits.item_transit_id,
        item_id: report.item_transits.item_instance_id,
        source_node_id: report.item_transits.source_node_id,
        source_node_name: report.item_transits.source_nodes?.node_name,
        destination_node_id: report.item_transits.dest_node_id,
        destination_node_name: report.item_transits.dest_nodes?.node_name,
        status: report.item_transits.status,
        item_instance: report.item_transits.item_instances ? {
          item_name: report.item_transits.item_instances.item_types?.item_name || null,
          item_type: report.item_transits.item_instances.item_types?.item_type || null
        } : null
      } : null
    }));

    // Filter jika node_id diberikan
    if (nodeIdFilter) {
      formattedReports = formattedReports.filter(report => {
        // Kondisi 1: user yang membuat report berasal dari node ini
        const userFromThisNode = report.user?.node_id === nodeIdFilter;
        // Kondisi 2: paket yang dilapor berasal dari node ini (source_node_id)
        const packageFromThisNode = report.item_transit?.source_node_id === nodeIdFilter;
        
        return userFromThisNode || packageFromThisNode;
      });
    }

    const paginationMeta = createPaginationMeta(formattedReports.length, page, page_size);

    return createSuccessResponse('Reports retrieved successfully', {
      reports: formattedReports,
      pagination: paginationMeta,
      filter: nodeIdFilter ? `node ${nodeIdFilter}` : 'all'
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
      item_transit_id,
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
        item_transit_id: item_transit_id || null,
        type,
        status: 'IN_REVIEW',  // Default status - match Supabase enum with underscores
        description: description || null,
        received_quantity: received_quantity || null,
        expired_quantity: expired_quantity || null,
        evidence: evidence || null
      }])
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
        created_at
      `)
      .single();

    if (error) {
      console.error('Report creation error:', error);
      return createErrorResponse('Failed to create report', 500);
    }

    return createSuccessResponse('Report created successfully', {
      id: data.id,
      type: data.type,
      status: data.status,
      description: data.description,
      evidence: data.evidence,
      quantities: {
        received: data.received_quantity,
        expired: data.expired_quantity
      },
      user_id: data.user_id,
      item_transit_id: data.item_transit_id,
      created_at: data.created_at
    });
  });
}
