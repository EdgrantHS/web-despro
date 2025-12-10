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

    const { current_node } = body;
    console.log("current node: ", current_node);

    const { qrId } = await params;

    if (!qrId) {
      return createErrorResponse("id parameter is required", 400);
    }

    // Use QR ID for matching (since we now store UUID in qr_url field)
    console.log('QR ID:', qrId);

    // 1. Cari entry di item_transits using the QR ID
    const { data: found, error: findError } = await supabase
      .from('item_transits')
      .select('*')
      .eq('qr_url', qrId)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.log("Error: ", findError)
      return createErrorResponse('Database error saat mencari entry', 500);
    }

    if (found) {

      if (found.status === 'inactive' && found.source_node_id !== current_node) {
        return createErrorResponse('This QR code is not valid for this node', 403);
      } else if (found.status === 'active' && found.dest_node_id !== current_node) {
        return createErrorResponse('This QR code is not valid for this node', 403);
      }

      // Entry ditemukan, this is the second scan (delivery)
      if (found.status === 'active') {
        // Mark transit as delivered
        const updateFields: any = {
          status: 'inactive',
          time_arrival: new Date().toISOString()
        };

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
          return createErrorResponse('Failed to update delivery status', 500);
        }

        // Now update the item instance at destination - add the stock and mark as active
        const destinationNodeId = found.dest_node_id;
        const itemCount = found.item_transit_count;

        // Get the item type ID from the source item instance
        const { data: sourceItemInstance, error: sourceError } = await supabase
          .from('item_instances')
          .select('item_type_id')
          .eq('item_instance_id', found.item_instance_id)
          .single();

        if (sourceError) {
          console.error('Source item instance lookup error:', sourceError);
          return createErrorResponse('Failed to get item type information', 500);
        }

        // Check if there's already an item instance at the destination
        const { data: destItemInstance, error: destError } = await supabase
          .from('item_instances')
          .select('item_instance_id, item_count')
          .eq('item_type_id', sourceItemInstance.item_type_id)
          .eq('node_id', destinationNodeId)
          .eq('status', 'Active')
          .single();

        if (destError && destError.code !== 'PGRST116') {
          console.error('Destination item instance lookup error:', destError);
          return createErrorResponse('Failed to check destination inventory', 500);
        }

        if (destItemInstance) {
          // Update existing item instance at destination
          const { error: updateDestError } = await supabase
            .from('item_instances')
            .update({ item_count: destItemInstance.item_count + itemCount })
            .eq('item_instance_id', destItemInstance.item_instance_id);

          if (updateDestError) {
            console.error('Update destination item instance error:', updateDestError);
            return createErrorResponse('Failed to update destination inventory', 500);
          }
        } else {
          // Create new item instance at destination
          const { error: createDestError } = await supabase
            .from('item_instances')
            .insert([{
              item_type_id: sourceItemInstance.item_type_id,
              node_id: destinationNodeId,
              item_count: itemCount,
              status: 'Active'
            }]);

          if (createDestError) {
            console.error('Create destination item instance error:', createDestError);
            return createErrorResponse('Failed to create destination inventory', 500);
          }
        }

        return createSuccessResponse("Item successfully delivered to destination", {
          action: "item_delivered",
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
        return createErrorResponse('QR code has already been processed', 400);
      }
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

      if (qrCode.source_id !== current_node) {
        return createErrorResponse('This QR code is not valid for this node', 403);
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
          qr_url: qrId, // Use the QR ID directly
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
        item_transit_id: inserted.item_transit_id,
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