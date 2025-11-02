import { createClient } from '@/utils/supabase/client'
import { useState, useEffect } from 'react'

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

export const useAuth = () => {
  const [user, setUser] = useState<UserData | null>(null)
  const [node, setNode] = useState<NodeData | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true) // Start with loading true
  const supabase = createClient()

  useEffect(() => {
    const initializeAuth = () => {
      try {
        console.log('useAuth: Initializing authentication...');
        const userData = localStorage.getItem('userData')
        const superAdminStatus = localStorage.getItem('isSuperAdmin')
        
        console.log('useAuth: Raw localStorage data:', { userData: !!userData, superAdminStatus });
        
        if (userData) {
          const parsedData = JSON.parse(userData)
          console.log('useAuth: Setting user data:', parsedData.user);
          setUser(parsedData.user)
          setNode(parsedData.node)
        }
        
        if (superAdminStatus) {
          const isSuper = JSON.parse(superAdminStatus);
          console.log('useAuth: Setting super admin status:', isSuper);
          setIsSuperAdmin(isSuper)
        }
        
        console.log('useAuth: Authentication initialized');
      } catch (error) {
        console.error('Error initializing auth:', error)
        // Clear corrupted data
        localStorage.removeItem('userData')
        localStorage.removeItem('isSuperAdmin')
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string): Promise<LoginResponse | null> => {
    setLoading(true)
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password,
      })
      
      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('User not found')
      }

      const userId = authData.user.id

      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single()

      if (roleError) {
        throw new Error('Failed to fetch user role')
      }

      const { data: userData, error: userError } = await supabase
        .from('user')
        .select('node_id')
        .eq('user_id', userId)
        .single()

      if (userError) {
        throw new Error('Failed to fetch user data')
      }

      const { data: nodeData, error: nodeError } = await supabase
        .from('nodes')
        .select('node_id, node_name, node_type, node_address')
        .eq('node_id', userData.node_id)
        .single()

      if (nodeError) {
        throw new Error('Failed to fetch node data')
      }

      const { data: superAdminData, error: superAdminError } = await supabase
        .from('super_admin')
        .select('user_id')
        .eq('user_id', userId)
        .single()

      const isSuperAdmin = !superAdminError && superAdminData

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

      setUser(response.data.user)
      setNode(response.data.node)
      setIsSuperAdmin(!!isSuperAdmin)
      
      console.log('useAuth: Login successful, setting localStorage data:', {
        user: response.data.user,
        isSuperAdmin: !!isSuperAdmin
      });
      
      localStorage.setItem('userData', JSON.stringify(response.data))
      localStorage.setItem('isSuperAdmin', JSON.stringify(!!isSuperAdmin))
      
      return response
      
    } catch (error) {
      console.error('Login error:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const register = async (registerData: any) => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData)
      })

      const result = await response.json()
      
      if (result.success) {
        return result
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('Register error:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setNode(null)
      setIsSuperAdmin(false)
      localStorage.removeItem('userData')
      localStorage.removeItem('isSuperAdmin')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const hasRole = (role: string): boolean => {
    return user?.role === role
  }

  return {
    user,
    node,
    isSuperAdmin,
    loading,
    login,
    register,
    logout,
    hasRole
  }
}
