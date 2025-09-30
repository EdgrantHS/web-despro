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
    
    const result = await login(email, password)
    
    if (result) {
      router.push('/dashboard')
    } else {
      setError('Login failed. Please check your credentials.')
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
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
        </div>
      </form>
    </div>
  )
}
