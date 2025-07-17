'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

interface ScanHistory {
  transit_id: string
  item_instance_id: string
  origin_node_id: string
  destination_node_id: string
  courier_name: string
  courier_phone: string
  status: string
  created_at: string
  origin_node?: {
    node_name: string
  }
  destination_node?: {
    node_name: string
  }
  item_instance?: {
    item_type?: {
      item_name: string
    }
  }
}

export default function PetugasHistoryPage() {
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const supabase = createClient()

  useEffect(() => {
    getCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUserId) {
      fetchUserScanHistory(currentUserId)
    }
  }, [currentUserId])

  const getCurrentUser = async () => {
    // suggested implementation: get current authenticated user
    // try {
    //   const { data: { user } } = await supabase.auth.getUser()
    //   if (user) {
    //     setCurrentUserId(user.id)
    //   }
    // } catch (error) {
    //   console.error('Error getting current user:', error)
    // }
  }

  const fetchUserScanHistory = async (userId: string) => {
    // suggested implementation: get scan/transit history for user's node
    // setLoading(true)
    // try {
    //   // Get user's node first
    //   const { data: userData, error: userError } = await supabase
    //     .from('user')
    //     .select('node_id')
    //     .eq('user_id', userId)
    //     .single()

    //   if (userError) throw userError

    //   // Fetch transit history for user's node
    //   const { data, error } = await supabase
    //     .from('item_transit')
    //     .select(`
    //       *,
    //       origin_node:origin_node_id (node_name),
    //       destination_node:destination_node_id (node_name),
    //       item_instance:item_instance_id (
    //         item_type:item_type_id (item_name)
    //       )
    //     `)
    //     .or(`origin_node_id.eq.${userData.node_id},destination_node_id.eq.${userData.node_id}`)
    //     .order('created_at', { ascending: false })
    //   
    //   if (error) throw error
    //   setScanHistory(data || [])
    // } catch (error) {
    //   console.error('Error fetching scan history:', error)
    // } finally {
    //   setLoading(false)
    // }
  }

  const filteredHistory = scanHistory.filter(scan => {
    if (filterStatus && scan.status !== filterStatus) return false
    if (dateFilter) {
      const scanDate = new Date(scan.created_at).toISOString().split('T')[0]
      if (scanDate !== dateFilter) return false
    }
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_transit':
        return 'bg-yellow-100 text-yellow-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Item', 'From', 'To', 'Courier', 'Status'].join(','),
      ...filteredHistory.map(scan => [
        new Date(scan.created_at).toLocaleDateString(),
        scan.item_instance?.item_type?.item_name || 'Unknown',
        scan.origin_node?.node_name || 'Unknown',
        scan.destination_node?.node_name || 'Unknown',
        scan.courier_name,
        scan.status
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scan_history_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="p-6">Loading scan history...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Scan History</h1>
        <button
          onClick={exportToCSV}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Export to CSV
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
          <select
            className="border border-gray-300 rounded-md px-3 py-2"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Date</label>
          <input
            type="date"
            className="border border-gray-300 rounded-md px-3 py-2"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Scans</h3>
          <p className="text-2xl font-bold text-gray-900">{filteredHistory.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">In Transit</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {filteredHistory.filter(s => s.status === 'in_transit').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Delivered</h3>
          <p className="text-2xl font-bold text-green-600">
            {filteredHistory.filter(s => s.status === 'delivered').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Today's Scans</h3>
          <p className="text-2xl font-bold text-blue-600">
            {filteredHistory.filter(s => 
              new Date(s.created_at).toDateString() === new Date().toDateString()
            ).length}
          </p>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transit ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                From
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Courier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredHistory.map((scan) => (
              <tr key={scan.transit_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {scan.transit_id.substring(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {scan.item_instance?.item_type?.item_name || 'Unknown Item'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {scan.origin_node?.node_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {scan.destination_node?.node_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>
                    <div className="font-medium">{scan.courier_name}</div>
                    <div className="text-xs text-gray-400">{scan.courier_phone}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(scan.status)}`}>
                    {scan.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>
                    <div>{new Date(scan.created_at).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(scan.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredHistory.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No scan history found for the selected filters.
        </div>
      )}
    </div>
  )
}
