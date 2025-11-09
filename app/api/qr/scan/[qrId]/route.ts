import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  getSupabaseClient,
  handleApiError,
  transformDbToApi
} from '@/lib/api-helpers';

export async function POST(request: NextRequest, { params }: { params: Promise<{ qrId: string }> }
) {
  return handleApiError(async () => {
    const supabase = await getSupabaseClient();
    const body = await request.json();

    const { courier_name, courier_phone } = body;
    const { qrId } = await params;

    if (!qrId) {
      return createErrorResponse("id parameter is required", 400);
    }

    // Define baseUrl and build qr_url
    const baseUrl = "http://localhost:3000/api/qr/scan";
    const qr_url = `${baseUrl}/${qrId}`;
    console.log('QR URL:', qr_url);

    // 1. Cari entry di item_transits
    const { data: found, error: findError } = await supabase
      .from('item_transits')
      .select('*')
      .eq('qr_url', qr_url)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.log("Error: ", findError)
      return createErrorResponse('Database error saat mencari entry', 500);
    }

    if (found) {
      // Entry ditemukan, update status dan time_arrival jika perlu
      const newStatus = found.status === 'active' ? 'inactive' : 'active';
      const updateFields: any = { status: newStatus };
      if (!found.time_arrival) {
        updateFields.time_arrival = new Date().toISOString();
      }

      const { data: updated, error: updateError } = await supabase
        .from('item_transits')
        .update(updateFields)
        .eq('item_transit_id', found.item_transit_id)
        .select(`
          *,
          item_instances (
            item_instance_id,
            item_count,
            item_types (
              item_name,
              item_type
            )
          ),
          item_transit_count,
          source_nodes:nodes!source_node_id (
            node_id,
            node_name
          ),
          dest_nodes:nodes!dest_node_id (
            node_id,
            node_name
          )
        `)
        .single();

      if (updateError) {
        console.error('Update Error:', updateError);
        return createErrorResponse('Failed to update entry', 500);
      }

      return createSuccessResponse("Item successfully arrived at destination", {
        action: "item_arrived",
        item_instance: updated.item_instances ? {
          id: updated.item_instances.item_instance_id,
          item_name: updated.item_instances.item_types?.item_name,
          item_type: updated.item_instances.item_types?.item_type,
          item_count: updated.item_instances.item_count
        } : null,
        item_transit_count: updated.item_transit_count,
        source_node: updated.source_nodes ? {
          id: updated.source_nodes.node_id,
          name: updated.source_nodes.node_name
        } : null,
        destination_node: updated.dest_nodes ? {
          id: updated.dest_nodes.node_id,
          name: updated.dest_nodes.node_name
        } : null,
        status: updated.status
      });
    } else {
      // 2. Cari di qr_codes
      const { data: qrCode, error: qrError } = await supabase
        .from('qr_codes')
        .select('item_instance_id, source_id, destination_id, qr_url, item_count')
        .eq('id', qrId)
        .single();

      if (qrError || !qrCode) {
        console.log('QR Code Error:', qrCode);

        return createErrorResponse("QR code not found", 404);
      }

      // --- New: check & decrement item_instances.item_count by qrCode.item_count ---
      const qty = Number(qrCode.item_count ?? 0);
      const itemInstanceId = qrCode.item_instance_id;
      if (qty > 0) {
        const { data: itemInst, error: itemInstErr } = await supabase
          .from('item_instances')
          .select('item_instance_id, item_count')
          .eq('item_instance_id', itemInstanceId)
          .single();

        if (itemInstErr || !itemInst) {
          console.error('Item instance lookup error:', itemInstErr);
          return createErrorResponse('Item instance not found', 500);
        }

        const currentCount = Number(itemInst.item_count ?? 0);
        if (currentCount < qty) {
          return createErrorResponse('Insufficient stock', 400);
        }

        const { data: updatedItemInst, error: updateItemErr } = await supabase
          .from('item_instances')
          .update({ item_count: currentCount - qty })
          .eq('item_instance_id', itemInstanceId)
          .select('item_instance_id, item_count')
          .single();

        if (updateItemErr) {
          console.error('Update Item Instance Error:', updateItemErr);
          return createErrorResponse('Failed to update item stock', 500);
        }

        // optional: you can log updatedItemInst
        console.log('Item instance stock decremented:', updatedItemInst);
      }
      // --- end decrement ---

      // Insert ke item_transits
      const { data: inserted, error: insertError } = await supabase
        .from('item_transits')
        .insert([{
          item_instance_id: qrCode.item_instance_id,
          source_node_id: qrCode.source_id,
          dest_node_id: qrCode.destination_id,
          time_departure: new Date().toISOString(),
          courier_name,
          courier_phone,
          qr_url: qrCode.qr_url,
          status: 'active',
          item_transit_count: qrCode.item_count
        }])
        .select(`
          *,
          item_instances (
            item_instance_id,
            item_count,
            item_types (
              item_name,
              item_type
            )
          ),
          item_transit_count,
          source_nodes:nodes!source_node_id (
            node_id,
            node_name
          ),
          dest_nodes:nodes!dest_node_id (
            node_id,
            node_name
          )
        `)
        .single();

      if (insertError) {
        console.error('Insert Error:', insertError);
        return createErrorResponse('Failed to create new entry', 500);
      }

      return createSuccessResponse("Item successfully placed in transit", {
        action: "item_added",
        item_instance: inserted.item_instances ? {
          id: inserted.item_instances.item_instance_id,
          item_name: inserted.item_instances.item_types?.item_name,
          item_type: inserted.item_instances.item_types?.item_type,
        } : null,
        item_transit_count: inserted.item_transit_count,
        source_node: inserted.source_nodes ? {
          id: inserted.source_nodes.node_id,
          name: inserted.source_nodes.node_name
        } : null,
        destination_node: inserted.dest_nodes ? {
          id: inserted.dest_nodes.node_id,
          name: inserted.dest_nodes.node_name
        } : null,
        status: inserted.status
      });
    }
  });
}