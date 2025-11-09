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
    isSuperAdmin: boolean
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
        const userData = localStorage.getItem('userData')
        const superAdminStatus = localStorage.getItem('isSuperAdmin')
        
        if (userData) {
          const parsedData = JSON.parse(userData)
          setUser(parsedData.user)
          setNode(parsedData.node)
        }
        
        if (superAdminStatus) {
          const isSuper = JSON.parse(superAdminStatus);
          setIsSuperAdmin(isSuper)
        }
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
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || `Login failed: ${response.status} ${response.statusText}`)
      }

      if (!result.success) {
        throw new Error(result.message || 'Login failed')
      }

      // Set up Supabase client session
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password,
      })
      
      if (authError) {
        console.warn('useAuth: Supabase session setup failed:', authError.message)
        // Continue anyway since the API login was successful
      }

      // Update local state with API response data
      const { user: userData, node: nodeData, isSuperAdmin } = result.data
      
      setUser(userData)
      setNode(nodeData)
      setIsSuperAdmin(isSuperAdmin)
      
      localStorage.setItem('userData', JSON.stringify({ user: userData, node: nodeData }))
      localStorage.setItem('isSuperAdmin', JSON.stringify(isSuperAdmin))
      
      return result
      
    } catch (error) {
      console.error('useAuth: Login failed:', error)
      // Re-throw the error so the UI can display it
      throw error
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
