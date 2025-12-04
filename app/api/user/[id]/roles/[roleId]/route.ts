import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Remove Specific Role from User
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roleId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: userNodeId, roleId } = await params

    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('user_node_id')
      .eq('user_node_id', userNodeId)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Check if role exists
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('id, role')
      .eq('id', roleId)
      .eq('user_node_id', userNodeId)
      .single()

    if (roleError || !roleData) {
      return NextResponse.json(
        { success: false, message: 'Role not found for this user' },
        { status: 404 }
      )
    }

    // Delete the role
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', roleId)
      .eq('user_node_id', userNodeId)

    if (deleteError) {
      console.error('API: Failed to delete role:', deleteError)
      return NextResponse.json(
        { success: false, message: 'Failed to delete role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Role removed successfully',
      data: {
        user_node_id: userNodeId,
        removed_role: roleData.role,
        removed_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('API: Remove user role failed:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}