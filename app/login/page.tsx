'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/useAuth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, loading } = useAuth()
  const router = useRouter()

  const handleLogin = async (email: string, password: string) => {
    setError('')
    
    try {
      console.log('🌐 UI: Starting login process for:', email);
      const result = await login(email, password)
      
      if (result) {
        const role = result.data.user.role
        const userName = result.data.user.name
        const nodeName = result.data.node.name
        
        console.log('🎉 UI: Login successful!', { 
          role, 
          user: userName, 
          location: nodeName 
        });
        
        // Small delay to ensure localStorage is set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Role-based redirection with user feedback
        // Using window.location.href to ensure full page reload and proper auth state update
        if (role === 'admin_pusat') {
          console.log('🏢 UI: Redirecting to super admin dashboard');
          window.location.href = '/super-admin'
          return
        }
        if (role === 'admin_node') {
          console.log('📍 UI: Redirecting to node admin dashboard');
          window.location.href = '/node-admin'
          return
        }
        // Petugas default to QR Scan
        console.log('📱 UI: Redirecting to QR scanner');
        window.location.href = '/qr-scan'
      } else {
        console.log('❌ UI: Login failed - no result returned');
        setError('Login failed for an unknown reason. Please try again or contact support.')
      }
    } catch (error) {
      console.error('💥 UI: Login error caught:', error);
      
      // Display the detailed error message from useAuth
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred during login. Please try again.'
      
      console.log('📋 UI: Displaying error to user:', errorMessage);
      setError(errorMessage)
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleLogin(email, password)
  }

  return (
    <div className="max-w-7xl flex flex-col gap-12 items-start">
      <form className="flex-1 flex flex-col min-w-64" onSubmit={onSubmit}>
        <h1 className="text-2xl font-medium">Login</h1>
        {/* <p className="text-sm text-foreground">
          Belum punya akun?{' '}
          <Link className="text-foreground font-medium underline" href="/register">
            Register
          </Link>
        </p> */}
        <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email"
            name="email" 
            type="email"
            placeholder="you@example.com" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="Your password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-red-400 text-lg">⚠️</span>
                </div>
                <div className="ml-2">
                  <p className="text-sm text-red-700 font-medium">Login Error</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
