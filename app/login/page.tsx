'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/useAuth'
import { useLoading } from '@/contexts/LoadingContext'
import Image from 'next/image'
import logoImage from '@/assets/public/LOGO.png'
import { User, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const { setLoading, isLoading } = useLoading()
  const router = useRouter()

  const handleLogin = async (email: string, password: string) => {
    setError('')
    setLoading(true, 'Logging in...')
    
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
        
        setLoading(true, 'Redirecting...')
        
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
        // Petugas redirect to petugas dashboard
        if (role === 'petugas') {
          console.log('👤 UI: Redirecting to petugas dashboard');
          window.location.href = '/petugas'
          return
        }
        // Default fallback to QR Scan
        console.log('📱 UI: Redirecting to QR scanner');
        window.location.href = '/qr-scan'
      } else {
        console.log('❌ UI: Login failed - no result returned');
        setError('Login failed for an unknown reason. Please try again or contact support.')
        setLoading(false)
      }
    } catch (error) {
      console.error('💥 UI: Login error caught:', error);
      
      // Display the detailed error message from useAuth
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred during login. Please try again.'
      
      console.log('📋 UI: Displaying error to user:', errorMessage);
      setError(errorMessage)
      setLoading(false)
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Use username/email field for login
    handleLogin(username, password)
  }

  return (
    <div className="min-h-screen flex justify-center bg-white font-sans">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col sm:border-2 border-blue-600">
        {/* Blue header */}
        <div className="bg-blue-600 pt-16 pb-20 flex items-center justify-center rounded-b-[32px]">
        
        <div className="flex items-center justify-center">
          {/* Logo */}
          <div className="relative">
            <Image
              src={logoImage}
              alt="Despro Logo"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>

        {/* Main */}
        <div className="flex-1 px-6 flex flex-col items-center mt-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Login to your Account
          </h1>

          <form onSubmit={onSubmit} className="w-full">
          {/* USERNAME */}
          <div className="mb-5 relative group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10 pointer-events-none">
              <div className="text-white transition-all duration-300 group-focus-within:scale-110 group-focus-within:text-blue-200">
                <User className="h-5 w-5" />
              </div>
              <div className="h-6 w-px bg-blue-400/50 group-focus-within:bg-blue-300 transition-colors duration-300"></div>
            </div>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-blue-600 text-white placeholder-blue-200 py-3 pl-14 pr-4 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-blue-600 focus:bg-blue-500 focus:scale-[1.02] transition-all duration-300 text-sm hover:bg-blue-500 relative z-0"
            />
          </div>

          {/* PASSWORD */}
          <div className="mb-3 relative group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10 pointer-events-none">
              <div className="text-white transition-all duration-300 group-focus-within:scale-110 group-focus-within:text-blue-200">
                <Lock className="h-5 w-5" />
              </div>
              <div className="h-6 w-px bg-blue-400/50 group-focus-within:bg-blue-300 transition-colors duration-300"></div>
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-blue-600 text-white placeholder-blue-200 py-3 pl-14 pr-10 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-blue-600 focus:bg-blue-500 focus:scale-[1.02] transition-all duration-300 text-sm hover:bg-blue-500 relative z-0"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white opacity-80 hover:opacity-100 focus:outline-none transition-opacity"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="text-right mb-8">
            <button 
              type="button"
              className="text-gray-600 text-sm hover:text-gray-800 focus:outline-none"
            >
              Forget Password ?
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 mb-5">
              <p className="text-xs text-red-700 font-medium">Login Error</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full px-10 py-2.5 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors uppercase text-sm"
          >
            {isLoading ? 'Logging in...' : 'LOGIN'}
          </button>
          </form>
        </div>
      </div>
    </div>
  )
}
