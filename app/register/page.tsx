'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/useAuth'
import { useLoading } from '@/contexts/LoadingContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mounted, setMounted] = useState(false)
  const { register } = useAuth()
  const { isLoading, setLoading } = useLoading()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password) {
      setError('Username, email, dan password harus diisi')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak sama')
      return false
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter')
      return false
    }

    if (!formData.role) {
      setError('Role harus dipilih')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) return

    setLoading(true, 'Creating account...')

    try {
      const result = await register(formData)
      
      if (result) {
        setSuccess('Akun berhasil dibuat! Redirecting...')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setError('Gagal membuat akun. Silakan coba lagi.')
      }
    } catch (error) {
      setError('Terjadi kesalahan saat membuat akun')
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = [
    { value: 'admin_pusat', label: 'Admin Pusat' },
    { value: 'admin_node', label: 'Admin Node' },
    { value: 'petugas', label: 'Petugas' }
  ]

  if (!mounted) {
    return (
      <div className="max-w-7xl flex flex-col gap-12 items-start">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl flex flex-col gap-12 items-start">
      <form className="flex flex-col min-w-64 max-w-64 mx-auto" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-medium">Register</h1>
        <p className="text-sm text-foreground">
          Sudah punya akun?{' '}
          <Link className="text-primary font-medium underline" href="/login">
            Login
          </Link>
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Node dan permissions akan diassign oleh admin setelah akun dibuat
        </p>
        <p className="text-xs text-blue-600">
          Gunakan format email yang valid seperti: user@example.com
        </p>
        
        <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
          <Label htmlFor="username">Username</Label>
          <Input 
            id="username"
            name="username" 
            type="text"
            placeholder="Masukkan username" 
            required 
            value={formData.username}
            onChange={handleInputChange}
          />
          
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email"
            name="email" 
            type="email"
            placeholder="you@example.com" 
            required 
            value={formData.email}
            onChange={handleInputChange}
          />
          
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="Your password"
            minLength={6}
            required
            value={formData.password}
            onChange={handleInputChange}
          />
          
          <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            placeholder="Konfirmasi password"
            required
            value={formData.confirmPassword}
            onChange={handleInputChange}
          />
          
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            name="role"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={formData.role}
            onChange={handleInputChange}
          >
            <option value="">Pilih Role</option>
            {roleOptions.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Membuat Akun...' : 'Register'}
          </button>
          
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
          
          {success && (
            <div className="text-green-600 text-sm text-center">{success}</div>
          )}
        </div>
      </form>
    </div>
  )
}
