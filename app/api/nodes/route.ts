import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: nodes, error } = await supabase
      .from('nodes')
      .select('id, node_name, node_type, node_address')
      .order('node_name')

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Gagal mengambil data nodes' },
        { status: 500 }
      )
    }

    const formattedNodes = nodes?.map(node => ({
      id: node.id,
      name: node.node_name,
      type: node.node_type,
      location: node.node_address
    })) || []

    return NextResponse.json({
      success: true,
      data: formattedNodes
    }, { status: 200 })

  } catch (error) {
    console.error('Nodes API error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}