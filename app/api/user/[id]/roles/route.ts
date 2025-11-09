import { createAdminClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Get User Roles
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id } = await params
    const userNodeId = id

    // Check if user exists - try by user_node_id first, then by user_id
    let userData, userError;
    
    const { data: userByNodeId, error: nodeIdError } = await supabase
      .from('user')
      .select('user_node_id, user_id')
      .eq('user_node_id', userNodeId)
      .single()

    if (nodeIdError?.code === 'PGRST116') {
      // Not found by user_node_id, try by user_id
      const { data: userByUserId, error: userIdError } = await supabase
        .from('user')
        .select('user_node_id, user_id')
        .eq('user_id', userNodeId)
        .single()
      
      userData = userByUserId
      userError = userIdError
    } else {
      userData = userByNodeId
      userError = nodeIdError
    }

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Get user roles
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('id, role')
      .eq('user_id', userData.user_id)

    if (rolesError) {
      console.error('API: Failed to fetch user roles:', rolesError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch user roles' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User role retrieved successfully',
      data: {
        user_node_id: userData.user_node_id,
        role: rolesData && rolesData.length > 0 ? rolesData[0] : null
      }
    })

  } catch (error) {
    console.error('API: Get user roles failed:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update User Role (Replace role)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id } = await params
    const userNodeId = id
    const body = await request.json()

    const { role } = body

    // Validate input
    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Role is required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['petugas', 'admin_node', 'admin_pusat']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Invalid role: ${role}. Valid roles are: ${validRoles.join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Check if user exists - try by user_node_id first, then by user_id
    let userData, userError;
    
    const { data: userByNodeId, error: nodeIdError } = await supabase
      .from('user')
      .select('user_node_id, user_id')
      .eq('user_node_id', userNodeId)
      .single()

    if (nodeIdError?.code === 'PGRST116') {
      // Not found by user_node_id, try by user_id
      const { data: userByUserId, error: userIdError } = await supabase
        .from('user')
        .select('user_node_id, user_id')
        .eq('user_id', userNodeId)
        .single()
      
      userData = userByUserId
      userError = userIdError
    } else {
      userData = userByNodeId
      userError = nodeIdError
    }

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Delete existing role
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userData.user_id)

    if (deleteError) {
      console.error('API: Failed to delete existing role:', deleteError)
      return NextResponse.json(
        { success: false, message: 'Failed to delete existing role' },
        { status: 500 }
      )
    }

    // Insert new role
    const { data: newRoleData, error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userData.user_id,
        role: role
      })
      .select('id, role')
      .single()

    if (insertError) {
      console.error('API: Failed to insert new role:', insertError)
      return NextResponse.json(
        { success: false, message: 'Failed to insert new role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        user_node_id: userData.user_node_id,
        role: newRoleData,
        updated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('API: Update user role failed:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Set User Role (replaces existing role if any)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id } = await params
    const userNodeId = id
    const body = await request.json()

    const { role } = body

    // Validate input
    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Role is required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['petugas', 'admin_node', 'admin_pusat']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Invalid role: ${role}. Valid roles are: ${validRoles.join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Check if user exists - try by user_node_id first, then by user_id
    let userData, userError;
    
    const { data: userByNodeId, error: nodeIdError } = await supabase
      .from('user')
      .select('user_node_id, user_id')
      .eq('user_node_id', userNodeId)
      .single()

    if (nodeIdError?.code === 'PGRST116') {
      // Not found by user_node_id, try by user_id
      const { data: userByUserId, error: userIdError } = await supabase
        .from('user')
        .select('user_node_id, user_id')
        .eq('user_id', userNodeId)
        .single()
      
      userData = userByUserId
      userError = userIdError
    } else {
      userData = userByNodeId
      userError = nodeIdError
    }

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Delete existing role if any
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userData.user_id)

    // Insert new role
    const { data: newRoleData, error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userData.user_id,
        role: role
      })
      .select('id, role')
      .single()

    if (insertError) {
      console.error('API: Failed to set role:', insertError)
      return NextResponse.json(
        { success: false, message: 'Failed to set role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Role set successfully',
      data: newRoleData
    })

  } catch (error) {
    console.error('API: Set user role failed:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}