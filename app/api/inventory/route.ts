import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const node_id = searchParams.get('node_id');

  if (!node_id) {
    return NextResponse.json({ success: false, message: 'Node ID is required' }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('item_instances')
      .select(`
        item_count,
        item_type:item_types (
          item_id,
          item_name,
          item_type,
          units
        )
      `)
      .eq('node_id', node_id)
      .eq('status', 'Active');

    if (error) {
      console.error('Error fetching inventory:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    // Aggregate data manually since Supabase JS client doesn't support complex GROUP BY with joins easily in one go without RPC
    // Or we can use .rpc() if we had a function, but JS aggregation is fine for this scale.
    
    const inventoryMap = new Map<string, {
      item_id: string;
      item_name: string;
      item_type: string;
      units: string | null;
      total_count: number;
    }>();

    data.forEach((instance: any) => {
      if (!instance.item_type) return;
      
      const typeId = instance.item_type.item_id;
      const current = inventoryMap.get(typeId) || {
        item_id: typeId,
        item_name: instance.item_type.item_name,
        item_type: instance.item_type.item_type,
        units: instance.item_type.units,
        total_count: 0
      };

      current.total_count += instance.item_count;
      inventoryMap.set(typeId, current);
    });

    const inventory = Array.from(inventoryMap.values());

    return NextResponse.json({ success: true, data: { inventory } });
  } catch (error) {
    console.error('Error processing inventory:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
