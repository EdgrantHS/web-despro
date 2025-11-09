import { createAdminClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Get User by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id } = await params
    const userNodeId = id

    // Try to get user profile by user_node_id first, then by user_id if not found
    let userData, userError;
    
    // First try by user_node_id
    const { data: userByNodeId, error: nodeIdError } = await supabase
      .from('user')
      .select(`
        user_node_id,
        user_id,
        node_id,
        created_at,
        nodes(node_id, node_name, node_type, node_address)
      `)
      .eq('user_node_id', userNodeId)
      .single()

    if (nodeIdError?.code === 'PGRST116') {
      // Not found by user_node_id, try by user_id
      const { data: userByUserId, error: userIdError } = await supabase
        .from('user')
        .select(`
          user_node_id,
          user_id,
          node_id,
          created_at,
          nodes(node_id, node_name, node_type, node_address)
        `)
        .eq('user_id', userNodeId)
        .single()
      
      userData = userByUserId
      userError = userIdError
    } else {
      userData = userByNodeId
      userError = nodeIdError
    }

    if (userError || !userData) {
      console.error('API: Failed to fetch user:', userError)
      if (userError?.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { success: false, message: 'Failed to fetch user' },
        { status: 500 }
      )
    }

    // Get user role separately
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('id, role')
      .eq('user_id', userData.user_id)
      .single()

    // Get auth user email
    const { data: authData } = await supabase.auth.admin.getUserById(userData.user_id)

    return NextResponse.json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        user_node_id: userData.user_node_id,
        user_id: userData.user_id,
        email: authData.user?.email,
        node: userData.nodes ? {
          id: (userData.nodes as any).node_id,
          name: (userData.nodes as any).node_name,
          type: (userData.nodes as any).node_type,
          address: (userData.nodes as any).node_address
        } : null,
        role: roleData?.role || null,
        created_at: userData.created_at
      }
    })

  } catch (error) {
    console.error('API: Get user failed:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update User
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id } = await params
    const userNodeId = id
    const body = await request.json()

    const { email, password, node_id, role } = body

    // Get current user data - try by user_node_id first, then by user_id
    let currentUser, currentUserError;
    
    const { data: userByNodeId, error: nodeIdError } = await supabase
      .from('user')
      .select('user_node_id, user_id, node_id')
      .eq('user_node_id', userNodeId)
      .single()

    if (nodeIdError?.code === 'PGRST116') {
      // Not found by user_node_id, try by user_id
      const { data: userByUserId, error: userIdError } = await supabase
        .from('user')
        .select('user_node_id, user_id, node_id')
        .eq('user_id', userNodeId)
        .single()
      
      currentUser = userByUserId
      currentUserError = userIdError
    } else {
      currentUser = userByNodeId
      currentUserError = nodeIdError
    }

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Validate role if provided
    if (role) {
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
    }

    // Validate node_id if provided
    if (node_id && node_id !== currentUser.node_id) {
      const { data: nodeData, error: nodeError } = await supabase
        .from('nodes')
        .select('node_id')
        .eq('node_id', node_id)
        .single()

      if (nodeError || !nodeData) {
        return NextResponse.json(
          { success: false, message: 'Invalid node_id. Node does not exist.' },
          { status: 400 }
        )
      }
    }

    // Validate password if provided
    if (password) {
      if (typeof password !== 'string' || password.length < 6) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Password must be at least 6 characters long' 
          },
          { status: 400 }
        )
      }
    }

    const updates: any = {}
    
    // Update email and/or password in auth if provided
    const authUpdates: any = {}
    if (email) {
      authUpdates.email = email
    }
    if (password) {
      authUpdates.password = password
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
        currentUser.user_id,
        authUpdates
      )

      if (authUpdateError) {
        console.error('API: Failed to update user auth data:', authUpdateError)
        const errorMessage = email && password 
          ? 'Failed to update user email and password' 
          : email 
          ? 'Failed to update user email'
          : 'Failed to update user password'
        
        return NextResponse.json(
          { success: false, message: errorMessage },
          { status: 500 }
        )
      }
    }

    // Update node_id if provided
    if (node_id && node_id !== currentUser.node_id) {
      updates.node_id = node_id
    }

    // Update user table if there are changes
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('user')
        .update(updates)
        .eq('user_node_id', currentUser.user_node_id)

      if (updateError) {
        console.error('API: Failed to update user:', updateError)
        return NextResponse.json(
          { success: false, message: 'Failed to update user' },
          { status: 500 }
        )
      }
    }

    // Update role if provided
    if (role) {
      // Delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', currentUser.user_id)

      // Insert new role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: currentUser.user_id,
          role: role
        })

      if (roleError) {
        console.error('API: Failed to update user role:', roleError)
        return NextResponse.json(
          { success: false, message: 'Failed to update user role' },
          { status: 500 }
        )
      }
    }

    // Get updated user data
    const { data: updatedUser } = await supabase
      .from('user')
      .select(`
        user_node_id,
        user_id,
        node_id,
        created_at,
        nodes(node_id, node_name, node_type, node_address)
      `)
      .eq('user_node_id', currentUser.user_node_id)
      .single()

    // Get updated role data
    const { data: updatedRole } = await supabase
      .from('user_roles')
      .select('id, role')
      .eq('user_id', currentUser.user_id)
      .single()

    // Get updated auth data
    const { data: authData } = await supabase.auth.admin.getUserById(currentUser.user_id)

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user_node_id: updatedUser?.user_node_id,
        user_id: updatedUser?.user_id,
        email: authData.user?.email,
        node: updatedUser?.nodes ? {
          id: (updatedUser.nodes as any).node_id,
          name: (updatedUser.nodes as any).node_name,
          type: (updatedUser.nodes as any).node_type,
          address: (updatedUser.nodes as any).node_address
        } : null,
        role: updatedRole?.role || null,
        created_at: updatedUser?.created_at,
        updated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('API: Update user failed:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete User
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id } = await params
    const userNodeId = id

    // Get user data before deletion - try by user_node_id first, then by user_id
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

    const authUserId = userData.user_id

    // Delete user roles first (foreign key constraint)
    const { error: rolesDeleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', authUserId)

    if (rolesDeleteError) {
      console.error('API: Failed to delete user roles:', rolesDeleteError)
      return NextResponse.json(
        { success: false, message: 'Failed to delete user roles' },
        { status: 500 }
      )
    }

    // Delete user profile
    const { error: userDeleteError } = await supabase
      .from('user')
      .delete()
      .eq('user_node_id', userData.user_node_id)

    if (userDeleteError) {
      console.error('API: Failed to delete user profile:', userDeleteError)
      return NextResponse.json(
        { success: false, message: 'Failed to delete user profile' },
        { status: 500 }
      )
    }

    // Delete auth user
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(authUserId)

    if (authDeleteError) {
      console.error('API: Failed to delete auth user:', authDeleteError)
      return NextResponse.json(
        { success: false, message: 'Failed to delete auth user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      data: {
        user_node_id: userData.user_node_id,
        deleted_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('API: Delete user failed:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}