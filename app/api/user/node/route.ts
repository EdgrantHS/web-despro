import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'User not authenticated' },
        { status: 401 }
      )
    }

    const userId = user.id

    // Get user's node_id from user table
    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('node_id')
      .eq('user_id', userId)
      .single()

    if (userError) {
      console.error('API: Failed to fetch user data:', userError)
      if (userError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'User profile not found in database' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { success: false, message: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    if (!userData || !userData.node_id) {
      return NextResponse.json(
        { success: false, message: 'No node assigned to this user' },
        { status: 404 }
      )
    }

    // Get the node details
    const { data: nodeData, error: nodeError } = await supabase
      .from('nodes')
      .select('node_id, node_name, node_type, node_address')
      .eq('node_id', userData.node_id)
      .single()

    if (nodeError) {
      console.error('API: Failed to fetch node data:', nodeError)
      if (nodeError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: `Node with ID ${userData.node_id} not found` },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { success: false, message: 'Failed to fetch node information' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User node retrieved successfully',
      data: {
        user_id: userId,
        node: {
          id: nodeData.node_id,
          name: nodeData.node_name,
          type: nodeData.node_type,
          location: nodeData.node_address
        }
      }
    })

  } catch (error) {
    console.error('API: Get user node failed:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}