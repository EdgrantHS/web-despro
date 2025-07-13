'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

interface NodeDashboard {
  totalInventory: number
  pendingReports: number
  todayTransfers: number
  lowStockItems: number
}

export default function NodeDashboard() {
  const [dashboardData, setDashboardData] = useState<NodeDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentNodeId, setCurrentNodeId] = useState<string>('')
  const [nodeInfo, setNodeInfo] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    getCurrentUserNode()
  }, [])

  useEffect(() => {
    if (currentNodeId) {
      fetchNodeDashboardData(currentNodeId)
    }
  }, [currentNodeId])

  const getCurrentUserNode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('user')
          .select(`
            node_id,
            node:node_id (
              node_name,
              node_type,
              node_address
            )
          `)
          .eq('user_id', user.id)
          .single()
        
        if (error) throw error
        setCurrentNodeId(data.node_id)
        setNodeInfo(data.node)
      }
    } catch (error) {
      console.error('Error getting user node:', error)
    }
  }

  const fetchNodeDashboardData = async (nodeId: string) => {
    setLoading(true)
    try {
      // You could replace this with a single RPC call: get_node_dashboard
      const [inventoryResult, reportsResult, transfersResult] = await Promise.all([
        supabase
          .from('item_instance')
          .select('item_count', { count: 'exact' })
          .eq('node_id', nodeId),
        supabase
          .from('report')
          .select('*', { count: 'exact', head: true })
          .or(`report_node_id.eq.${nodeId},reported_node_id.eq.${nodeId}`)
          .eq('report_status', 'pending'),
        supabase
          .from('item_transit')
          .select('*', { count: 'exact', head: true })
          .or(`origin_node_id.eq.${nodeId},destination_node_id.eq.${nodeId}`)
          .gte('created_at', new Date().toISOString().split('T')[0])
      ])

      // Calculate total inventory
      const totalInventory = inventoryResult.data?.reduce((sum, item) => sum + item.item_count, 0) || 0

      setDashboardData({
        totalInventory,
        pendingReports: reportsResult.count || 0,
        todayTransfers: transfersResult.count || 0,
        lowStockItems: 0 // You'd implement logic to determine low stock
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Node Dashboard</h1>
        {nodeInfo && (
          <p className="text-gray-600 mt-2">
            {nodeInfo.node_name} - {nodeInfo.node_type}
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Total Inventory</h3>
          <p className="text-3xl font-bold text-blue-600">{dashboardData?.totalInventory}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Pending Reports</h3>
          <p className="text-3xl font-bold text-red-600">{dashboardData?.pendingReports}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Today's Transfers</h3>
          <p className="text-3xl font-bold text-green-600">{dashboardData?.todayTransfers}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Low Stock Items</h3>
          <p className="text-3xl font-bold text-yellow-600">{dashboardData?.lowStockItems}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded">
              Manage Users
            </button>
            <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded">
              View Inventory
            </button>
            <button className="w-full text-left p-3 bg-yellow-50 hover:bg-yellow-100 rounded">
              Manage Menus
            </button>
            <button className="w-full text-left p-3 bg-red-50 hover:bg-red-100 rounded">
              Review Reports
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Node Information</h3>
          {nodeInfo && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Name:</span>
                <span className="font-semibold">{nodeInfo.node_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-semibold">{nodeInfo.node_type}</span>
              </div>
              <div className="flex justify-between">
                <span>Address:</span>
                <span className="font-semibold text-sm">{nodeInfo.node_address}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
