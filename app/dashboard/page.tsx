'use client'

import { useAuth } from '@/lib/useAuth'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user, node, isSuperAdmin, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('userData')
    if (!userData) {
      router.push('/login')
    } else {
      setLoading(false)
    }
  }, [router])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="text-lg">Loading...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>

            {user && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">User Information</h2>
                  <div className="space-y-2">
                    <p><span className="font-medium">ID:</span> {user.id}</p>
                    <p><span className="font-medium">Username:</span> {user.username}</p>
                    <p><span className="font-medium">Role:</span> {user.role}</p>
                    {isSuperAdmin && (
                      <p className="text-red-600 font-medium">Super Admin</p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">User Details</h2>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {user.name}</p>
                    <p><span className="font-medium">Role:</span> {user.role}</p>
                    <p><span className="font-medium">Node ID:</span> {user.node_id || 'Not assigned'}</p>
                  </div>
                </div>

                {node && (
                  <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Node Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p><span className="font-medium">Node ID:</span> {node.id}</p>
                        <p><span className="font-medium">Name:</span> {node.name}</p>
                      </div>
                      <div>
                        <p><span className="font-medium">Type:</span> {node.type}</p>
                        <p><span className="font-medium">Location:</span> {node.location}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Development Tools Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🛠️ Development Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/qr-scan-dev')}
                className="bg-blue-50 hover:bg-blue-100 border border-blue-200 p-4 rounded-lg text-left transition-colors"
              >
                <div className="text-2xl mb-2">📱</div>
                <h3 className="font-medium text-gray-900">QR Scanner Dev</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Test QR scanning with camera and manual input
                </p>
              </button>
              
              <button
                onClick={() => router.push('/qr-scan')}
                className="bg-green-50 hover:bg-green-100 border border-green-200 p-4 rounded-lg text-left transition-colors"
              >
                <div className="text-2xl mb-2">📷</div>
                <h3 className="font-medium text-gray-900">QR Scanner</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Production QR code scanner
                </p>
              </button>
              
              <button
                onClick={() => router.push('/qr-create')}
                className="bg-purple-50 hover:bg-purple-100 border border-purple-200 p-4 rounded-lg text-left transition-colors"
              >
                <div className="text-2xl mb-2">🔗</div>
                <h3 className="font-medium text-gray-900">QR Generator</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Create QR codes for testing
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
