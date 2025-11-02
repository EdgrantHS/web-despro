import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  getSupabaseClient,
  validateRequired,
  validateUUID,
  handleApiError,
  transformDbToApi,
  ITEM_TRANSIT_FIELD_MAPPING
} from '@/lib/api-helpers';
import { CreateItemTransitRequest } from '@/lib/api-types';

// POST /api/item-transit - Create Item Transit
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    console.log('=== Item Transit Creation Started ===');
    const body: CreateItemTransitRequest = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    const missingFields = validateRequired(body, ['item_instance_id', 'source_node_id', 'time_departure']);
    if (missingFields.length > 0) {
      return createErrorResponse(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate UUIDs
    if (!validateUUID(body.item_instance_id)) {
      return createErrorResponse('Invalid item_instance_id format');
    }
    if (!validateUUID(body.source_node_id)) {
      return createErrorResponse('Invalid source_node_id format');
    }
    if (body.dest_node_id && !validateUUID(body.dest_node_id)) {
      return createErrorResponse('Invalid dest_node_id format');
    }

    const supabase = await getSupabaseClient();
    
    // Check if item is already in transit
    const { data: existingTransit, error: transitCheckError } = await supabase
      .from('item_transits')
      .select('item_transit_id')
      .eq('item_instance_id', body.item_instance_id)
      .is('time_arrival', null) // Only incomplete transits
      .single();

    if (transitCheckError && transitCheckError.code !== 'PGRST116') {
      console.error('Transit check error:', transitCheckError);
      return createErrorResponse('Failed to validate item transit status', 500);
    }

    if (existingTransit) {
      return createErrorResponse('Item is already in transit. Complete the current transit before creating a new one.', 400);
    }

    // Check if item instance exists and get its current node
    const { data: itemInstance, error: itemError } = await supabase
      .from('item_instances')
      .select('item_instance_id, node_id')
      .eq('item_instance_id', body.item_instance_id)
      .single();

    if (itemError) {
      console.error('Item instance check error:', itemError);
      return createErrorResponse('Item instance not found', 404);
    }

    if (!itemInstance.node_id) {
      return createErrorResponse('Item is not currently at any node (may already be in transit)', 400);
    }

    // Validate that source_node_id matches the item's current location
    if (itemInstance.node_id !== body.source_node_id) {
      return createErrorResponse('Source node must match the item\'s current location', 400);
    }

    // Generate QR code if destination is provided and no QR URL is given
    let qrUrl: string | undefined = body.qr_url;
    if (!qrUrl && body.dest_node_id) {
      try {
        // Generate QR code directly instead of making HTTP call to avoid connection issues
        const qrId = uuidv4();
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        qrUrl = `${baseUrl}/api/qr/scan/${qrId}`;

        // Insert into qr_codes table directly
        const { data: qrData, error: qrError } = await supabase
          .from('qr_codes')
          .insert({
            id: qrId,
            item_instance_id: body.item_instance_id,
            source_id: body.source_node_id,
            destination_id: body.dest_node_id,
            qr_url: qrUrl,
            item_count: 1
          })
          .select()
          .single();

        if (qrError) {
          console.error('QR code creation error:', qrError);
          // Continue without QR URL if generation fails
          qrUrl = undefined;
        } else {
          console.log('QR code created successfully:', qrData);
        }
      } catch (error) {
        console.error('QR generation error:', error);
        qrUrl = undefined;
      }
    }

    // If we still don't have a QR URL, generate a placeholder to satisfy NOT NULL constraint
    if (!qrUrl) {
      const placeholderQrId = uuidv4();
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      qrUrl = `${baseUrl}/qr-placeholder/${placeholderQrId}`;
      console.log('Using placeholder QR URL:', qrUrl);
    }
    
    // Insert item transit
    const { data, error } = await supabase
      .from('item_transits')
      .insert({
        item_instance_id: body.item_instance_id,
        source_node_id: body.source_node_id,
        dest_node_id: body.dest_node_id || null,
        time_departure: body.time_departure,
        courier_name: body.courier_name || null,
        courier_phone: body.courier_phone || null,
        qr_url: qrUrl // This should always have a value now
        // status: body.status || 'Active' // Temporarily disabled - column may not exist
      })
      .select()
      .single();

    if (error) {
      console.error('Item transit creation error:', error);
      if (error.code === '23503') {
        return createErrorResponse('Invalid item_instance_id, source_node_id, or dest_node_id', 400);
      }
      if (error.code === '23502') {
        return createErrorResponse('Missing required field: qr_url constraint violation', 500);
      }
      return createErrorResponse('Failed to create item transit', 500);
    }

    // Update item instance to remove from node (set node_id to null)
    const { error: updateError } = await supabase
      .from('item_instances')
      .update({ node_id: null })
      .eq('id', body.item_instance_id);

    if (updateError) {
      console.error('Item instance update error:', updateError);
      // Continue anyway, transit was created successfully
    }

    const transformedData = transformDbToApi(data, ITEM_TRANSIT_FIELD_MAPPING);
    console.log('=== Item Transit Created Successfully ===');
    console.log('Transit data:', JSON.stringify(transformedData, null, 2));
    
    return createSuccessResponse('Item transit created successfully', transformedData);
  });
}