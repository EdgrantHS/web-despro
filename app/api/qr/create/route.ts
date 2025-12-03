import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getSupabaseClient, createSuccessResponse, createErrorResponse, handleApiError } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
    return handleApiError(async () => {
        const supabase = await getSupabaseClient();
        const body = await request.json();

        // Ambil data dari body
        const { item_instance_id, source_id, destination_id, item_count } = body;

        // Validasi sederhana
        if (!item_instance_id || !source_id || !destination_id) {
            return createErrorResponse("Missing required fields", 400);
        }

        const qrId = uuidv4();
        // Use only the UUID as QR content for shorter QR codes
        const qr_content = qrId;

        // Insert ke table qr_codes
        const { data: qrData, error: qrDataError } = await supabase
            .from("qr_codes")
            .insert([{
                id: qrId,
                item_instance_id,
                source_id,
                destination_id,
                qr_url: qr_content, // Store just the UUID
                item_count
            }])
            .select(`
                *,
                qr_url,
                item_instances (
                    item_instance_id,
                    item_types (
                        item_name,
                        item_type
                    )
                ),
                item_count,
                source_nodes:nodes!source_id (
                    node_id,
                    node_name,
                    node_type
                ),
                dest_nodes:nodes!destination_id (
                    node_id,
                    node_name,
                    node_type
                )
            `)
            .single();

        if (qrDataError) {
            console.error("Insert Error:", qrDataError); // Tambahkan ini
            return createErrorResponse("Failed to create QR code entry", 500);
        }

        console.log('QR Data:', qrData);


        return createSuccessResponse("QR code entry created successfully", {
            action: "qr_created",
            qr_url: qrData.qr_url, // This is now just the UUID
            qr_id: qrId, // Also return the ID for clarity
            item_instance: qrData.item_instances ? {
                id: qrData.item_instances.item_instance_id,
                name: qrData.item_instances.item_types?.item_name,
                type: qrData.item_instances.item_types?.item_type,
                count: qrData.item_instances.item_count
            } : null,
            source_node: qrData.source_nodes ? {
                id: qrData.source_nodes.node_id,
                name: qrData.source_nodes.node_name
            } : null,
            destination_node: qrData.dest_nodes ? {
                id: qrData.dest_nodes.node_id,
                name: qrData.dest_nodes.node_name
            } : null,
        });
    });
}