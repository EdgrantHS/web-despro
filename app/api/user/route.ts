import { createAdminClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Create User
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { email, password, node_id, role } = body

    // Validate required fields
    if (!email || !password || !node_id || !role) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: email, password, node_id, and role are required' 
        },
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

    // Check if node exists
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

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) {
      console.error('API: Failed to create auth user:', authError)
      return NextResponse.json(
        { 
          success: false, 
          message: authError.message || 'Failed to create user account' 
        },
        { status: 400 }
      )
    }

    const authUserId = authData.user.id

    try {
      // Create user profile in user table
      const { data: userData, error: userError } = await supabase
        .from('user')
        .insert({
          user_id: authUserId,
          node_id: node_id
        })
        .select('user_node_id, user_id, node_id, created_at')
        .single()

      if (userError) {
        // Cleanup: Delete the auth user if user table insert fails
        await supabase.auth.admin.deleteUser(authUserId)
        console.error('API: Failed to create user profile:', userError)
        return NextResponse.json(
          { success: false, message: 'Failed to create user profile' },
          { status: 500 }
        )
      }

      // Create user role
      const { data: roleData, error: rolesError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userData.user_id,
          role: role
        })
        .select('id, role')
        .single()

      if (rolesError) {
        // Cleanup: Delete user and auth user if roles insert fails
        await supabase.from('user').delete().eq('user_id', userData.user_id)
        await supabase.auth.admin.deleteUser(authUserId)
        console.error('API: Failed to create user roles:', rolesError)
        return NextResponse.json(
          { success: false, message: 'Failed to create user roles' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'User created successfully',
        data: {
          user_node_id: userData.user_node_id,
          user_id: userData.user_id,
          email: authData.user.email,
          node_id: userData.node_id,
          role: roleData?.role || role,
          created_at: userData.created_at
        }
      })

    } catch (error) {
      // Cleanup: Delete the auth user if any database operation fails
      await supabase.auth.admin.deleteUser(authUserId)
      throw error
    }

  } catch (error) {
    console.error('API: Create user failed:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get All Users
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const node_id = searchParams.get('node_id')
    const role = searchParams.get('role')
    const page = parseInt(searchParams.get('page') || '1')
    const page_size = Math.min(parseInt(searchParams.get('page_size') || '50'), 100)
    const offset = (page - 1) * page_size

    // Get user profiles from user table
    const { data: userProfiles, error: profileError } = await supabase
      .from('user')
      .select(`
        user_node_id,
        user_id,
        node_id,
        created_at,
        nodes(node_id, node_name, node_type, node_address)
      `)

    if (profileError) {
      console.error('API: Failed to fetch user profiles:', profileError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch user profiles' },
        { status: 500 }
      )
    }

    // Get user roles separately
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, id, role')

    if (rolesError) {
      console.error('API: Failed to fetch user roles:', rolesError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch user roles' },
        { status: 500 }
      )
    }

    // Create maps for quick lookup
    const profileMap = new Map(userProfiles?.map(p => [p.user_id, p]) || [])
    const rolesMap = new Map(userRoles?.map(r => [r.user_id, r]) || [])

    // Get auth user emails for existing profiles
    const userIds = userProfiles?.map(p => p.user_id) || []
    const emailPromises = userIds.map(async (userId) => {
      try {
        const { data } = await supabase.auth.admin.getUserById(userId)
        return { userId, email: data.user?.email }
      } catch {
        return { userId, email: null }
      }
    })
    
    const emailResults = await Promise.all(emailPromises)
    const emailMap = new Map(emailResults.map(r => [r.userId, r.email]))

    // Format response - show users based on profiles (since we can't access all auth users)
    const users = userProfiles?.map(profile => {
      const roleData = rolesMap.get(profile.user_id)
      const email = emailMap.get(profile.user_id)
      
      return {
        user_id: profile.user_id,
        email: email,
        user_node_id: profile.user_node_id,
        node: profile.nodes ? {
          id: (profile.nodes as any).node_id,
          name: (profile.nodes as any).node_name,
          type: (profile.nodes as any).node_type,
          address: (profile.nodes as any).node_address
        } : null,
        role: roleData?.role || null,
        created_at: profile.created_at,
        is_valid: !!roleData, // User is valid if has role (profile already exists)
        status: roleData ? 'complete' : 'missing_role'
      }
    }).filter(user => {
      // Apply filters
      if (node_id && (!user.node || user.node.id !== node_id)) return false
      if (role && user.role !== role) return false
      return true
    }) || []

    // Apply pagination
    const startIndex = offset
    const endIndex = offset + page_size
    const paginatedUsers = users.slice(startIndex, endIndex)

    // Calculate statistics
    const totalUsers = users.length
    const validUsers = users.filter((u: any) => u.is_valid).length
    const missingRoles = users.filter((u: any) => u.status === 'missing_role').length

    return NextResponse.json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: paginatedUsers,
        statistics: {
          total_profiles: totalUsers,
          valid_users: validUsers,
          missing_roles: missingRoles,
          note: "Only showing users with profiles. Auth-only users without profiles are not visible due to API limitations."
        },
        pagination: {
          total_items: totalUsers,
          current_page: page,
          items_per_page: page_size,
          total_pages: Math.ceil(totalUsers / page_size),
          has_next: page * page_size < totalUsers,
          has_previous: page > 1
        }
      }
    })

  } catch (error) {
    console.error('API: Get users failed:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}