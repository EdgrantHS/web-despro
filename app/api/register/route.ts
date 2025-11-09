import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RegisterData {
  username: string
  email: string
  password: string
  role: string
}

export async function POST(request: NextRequest) {
  try {
    const {
      username,
      email,
      password,
      role
    }: RegisterData = await request.json()

    if (!username || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: 'Semua field harus diisi' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password minimal 6 karakter' },
        { status: 400 }
      )
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Format email tidak valid' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      console.error('Auth error:', authError)
      
      // Handle specific error cases
      if (authError.message.includes('invalid')) {
        return NextResponse.json(
          { success: false, message: 'Format email tidak valid. Gunakan format email yang benar seperti: user@example.com' },
          { status: 400 }
        )
      }
      
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { success: false, message: 'Email sudah terdaftar. Gunakan email lain atau login dengan email ini.' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { success: false, message: `Gagal membuat akun: ${authError.message}` },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, message: 'Gagal membuat user' },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // 2. Insert user role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role
      })

    if (roleError) {
      // Rollback: delete user if role insertion fails
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { success: false, message: 'Gagal menambahkan role' },
        { status: 500 }
      )
    }

    // 3. Insert default user data (sesuai database schema yang ada)
    // Ambil node pertama sebagai default
    const { data: defaultNode, error: nodeError } = await supabase
      .from('nodes')
      .select('node_id')
      .limit(1)
      .single()

    if (nodeError) {
      console.error('No nodes available:', nodeError)
      // Rollback: delete user and role if no nodes available
      try {
        await supabase.auth.admin.deleteUser(userId)
        await supabase.from('user_roles').delete().eq('user_id', userId)
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError)
      }
      return NextResponse.json(
        { success: false, message: 'Tidak ada node yang tersedia. Silakan buat node terlebih dahulu.' },
        { status: 500 }
      )
    }

    const { error: userError } = await supabase
      .from('user')
      .insert({
        user_id: userId,
        node_id: defaultNode.node_id
      })

    if (userError) {
      console.error('User data insertion error:', userError)
      // Rollback: delete user and role if user data insertion fails
      try {
        await supabase.auth.admin.deleteUser(userId)
        await supabase.from('user_roles').delete().eq('user_id', userId)
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError)
      }
      return NextResponse.json(
        { success: false, message: `Gagal menambahkan data user: ${userError.message}` },
        { status: 500 }
      )
    }

    // 4. Insert super admin jika role adalah admin_pusat
    if (role === 'admin_pusat') {
      const { error: superAdminError } = await supabase
        .from('super_admin')
        .insert({
          user_id: userId
        })

      if (superAdminError) {
        console.error('Super admin insertion failed:', superAdminError)
        // Don't rollback for super admin error, just log it
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Akun berhasil dibuat. Admin akan mengassign node dan permissions nanti.',
      data: {
        userId,
        username,
        email,
        role
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Register API error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
