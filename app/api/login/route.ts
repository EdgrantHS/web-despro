import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface UserData {
  id: string
  username: string
  name: string
  role: string
  node_id: string
}

interface NodeData {
  id: string
  name: string
  type: string
  location: string
}

interface LoginResponse {
  success: boolean
  message: string
  data: {
    user: UserData
    node: NodeData
    isSuperAdmin: boolean
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password,
    })

    if (authError) {
      console.error('API: Authentication failed:', authError)
      // Provide user-friendly error messages for common auth errors
      let errorMessage = 'Invalid credentials'
      if (authError.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.'
      } else if (authError.message.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before logging in.'
      } else if (authError.message.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.'
      } else {
        errorMessage = `Login failed: ${authError.message}`
      }
      
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 401 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication successful but no user information received. Please try again.' },
        { status: 401 }
      )
    }

    const userId = authData.user.id

    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (roleError) {
      console.error('API: Failed to fetch user role:', roleError)
      let errorMessage = 'Failed to fetch user role'
      if (roleError.code === 'PGRST116') {
        errorMessage = 'Your account exists but no role is assigned. Please contact an administrator to set up your account permissions.'
      } else {
        errorMessage = `Unable to determine your account permissions: ${roleError.message}`
      }
      
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 500 }
      )
    }

    if (!userRole) {
      return NextResponse.json(
        { success: false, message: 'Your account exists but no role is assigned. Please contact an administrator.' },
        { status: 500 }
      )
    }

    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('node_id')
      .eq('user_id', userId)
      .single()

    if (userError) {
      console.error('API: Failed to fetch user profile:', userError)
      let errorMessage = 'Failed to fetch user data'
      if (userError.code === 'PGRST116') {
        errorMessage = 'Your account exists but your profile is incomplete. Please contact an administrator to complete your profile setup.'
      } else {
        errorMessage = `Unable to load your profile information: ${userError.message}`
      }
      
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 500 }
      )
    }

    if (!userData || !userData.node_id) {
      return NextResponse.json(
        { success: false, message: 'Your account profile is incomplete. No location/node has been assigned to your account. Please contact an administrator.' },
        { status: 500 }
      )
    }

    const { data: nodeData, error: nodeError } = await supabase
      .from('nodes')
      .select('node_id, node_name, node_type, node_address')
      .eq('node_id', userData.node_id)
      .single()

    if (nodeError) {
      console.error('API: Failed to fetch node data:', nodeError)
      let errorMessage = 'Failed to fetch node data'
      if (nodeError.code === 'PGRST116') {
        errorMessage = `Your assigned location (ID: ${userData.node_id}) was not found in the system. Please contact an administrator to fix this configuration issue.`
      } else {
        errorMessage = `Unable to load location information: ${nodeError.message}`
      }
      
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 500 }
      )
    }

    if (!nodeData) {
      return NextResponse.json(
        { success: false, message: 'Location information not found for your assigned location. Please contact an administrator.' },
        { status: 500 }
      )
    }

    // const { data: superAdminData, error: superAdminError } = await supabase
    //   .from('super_admin')
    //   .select('user_id')
    //   .eq('user_id', userId)
    //   .single()

    // const isSuperAdmin = !superAdminError && !!superAdminData
    const isSuperAdmin = userRole.role === 'admin_pusat'

    const response: LoginResponse = {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: userId,
          username: email,
          name: email,
          role: userRole.role,
          node_id: userData.node_id
        },
        node: {
          id: nodeData.node_id,
          name: nodeData.node_name,
          type: nodeData.node_type,
          location: nodeData.node_address
        },
        isSuperAdmin: isSuperAdmin
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('API: Login process failed:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error occurred during login. Please try again or contact support.' },
      { status: 500 }
    )
  }
}
