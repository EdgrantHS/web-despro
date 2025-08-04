'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

interface SystemOverview {
  totalNodes: number
  totalUsers: number
  totalItems: number
  totalReports: number
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState<SystemOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchSystemOverview()
  }, [])

  const fetchSystemOverview = async () => {
    // suggested implementation: get system-wide statistics with multiple queries or RPC
    // setLoading(true)
    // try {
    //   const [nodesResult, usersResult, itemsResult, reportsResult] = await Promise.all([
    //     supabase.from('node').select('*', { count: 'exact', head: true }),
    //     supabase.from('user').select('*', { count: 'exact', head: true }),
    //     supabase.from('item_instance').select('*', { count: 'exact', head: true }),
    //     supabase.from('report').select('*', { count: 'exact', head: true })
    //   ])

    //   setOverview({
    //     totalNodes: nodesResult.count || 0,
    //     totalUsers: usersResult.count || 0,
    //     totalItems: itemsResult.count || 0,
    //     totalReports: reportsResult.count || 0
    //   })
    // } catch (error) {
    //   console.error('Error fetching system overview:', error)
    // } finally {
    //   setLoading(false)
    // }
  }

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Total Nodes</h3>
          <p className="text-3xl font-bold text-blue-600">{overview?.totalNodes}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Total Users</h3>
          <p className="text-3xl font-bold text-green-600">{overview?.totalUsers}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Total Items</h3>
          <p className="text-3xl font-bold text-yellow-600">{overview?.totalItems}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Total Reports</h3>
          <p className="text-3xl font-bold text-red-600">{overview?.totalReports}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded">
              Manage Nodes
            </button>
            <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded">
              Manage Users
            </button>
            <button className="w-full text-left p-3 bg-yellow-50 hover:bg-yellow-100 rounded">
              View Inventory
            </button>
            <button className="w-full text-left p-3 bg-red-50 hover:bg-red-100 rounded">
              Review Reports
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">System Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>System Health:</span>
              <span className="text-green-600 font-semibold">Good</span>
            </div>
            <div className="flex justify-between">
              <span>Active Nodes:</span>
              <span className="text-blue-600 font-semibold">{overview?.totalNodes}</span>
            </div>
            <div className="flex justify-between">
              <span>Pending Reports:</span>
              <span className="text-orange-600 font-semibold">{overview?.totalReports}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
