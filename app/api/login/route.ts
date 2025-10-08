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
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
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
      return NextResponse.json(
        { success: false, message: 'Failed to fetch user role' },
        { status: 500 }
      )
    }

    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('node_id')
      .eq('user_id', userId)
      .single()

    if (userError) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch user data' },
        { status: 500 }
      )
    }

    const { data: nodeData, error: nodeError } = await supabase
      .from('nodes')
      .select('node_id, node_name, node_type, node_address')
      .eq('node_id', userData.node_id)
      .single()

    if (nodeError) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch node data' },
        { status: 500 }
      )
    }

    const response: LoginResponse = {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: userId,
          username: email, // Using email as username
          name: email, // Using email as name for now
          role: userRole.role,
          node_id: userData.node_id
        },
        node: {
          id: nodeData.node_id,
          name: nodeData.node_name,
          type: nodeData.node_type,
          location: nodeData.node_address
        }
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
