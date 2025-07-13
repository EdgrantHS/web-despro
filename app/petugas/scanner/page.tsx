'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

interface QRScanData {
  qrData: string
  itemInstanceId?: string
  destinationNodeId?: string
  courierData?: {
    name: string
    phone: string
  }
}

interface ScanHistory {
  transit_id: string
  item_instance_id: string
  origin_node_id: string
  destination_node_id: string
  courier_name: string
  courier_phone: string
  status: string
  created_at: string
}

export default function PetugasScannerPage() {
  const [scanMode, setScanMode] = useState<'incoming' | 'outgoing'>('incoming')
  const [qrInput, setQrInput] = useState('')
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [currentNodeId, setCurrentNodeId] = useState<string>('')
  const [reportData, setReportData] = useState({
    description: '',
    isModalOpen: false,
    itemInstanceId: ''
  })
  const [outgoingFormData, setOutgoingFormData] = useState({
    isModalOpen: false,
    destinationNodeId: '',
    courierName: '',
    courierPhone: ''
  })
  const [nodes, setNodes] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Get current user's node ID from session
    getCurrentUserNode()
    fetchUserScanHistory()
    fetchNodes()
  }, [])

  const getCurrentUserNode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('user')
          .select('node_id')
          .eq('user_id', user.id)
          .single()
        
        if (error) throw error
        setCurrentNodeId(data.node_id)
      }
    } catch (error) {
      console.error('Error getting user node:', error)
    }
  }

  const fetchNodes = async () => {
    try {
      const { data, error } = await supabase
        .from('node')
        .select('node_id, node_name, node_type')
        .eq('status', 'active')
        .order('node_name')
      
      if (error) throw error
      setNodes(data || [])
    } catch (error) {
      console.error('Error fetching nodes:', error)
    }
  }

  const fetchUserScanHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('item_transit')
          .select('*')
          .or(`origin_node_id.eq.${currentNodeId},destination_node_id.eq.${currentNodeId}`)
          .order('created_at', { ascending: false })
          .limit(20)
        
        if (error) throw error
        setScanHistory(data || [])
      }
    } catch (error) {
      console.error('Error fetching scan history:', error)
    }
  }

  const processIncomingScan = async (qrData: string, nodeId: string) => {
    setLoading(true)
    try {
      // Call Postgres function to handle incoming item
      const { data, error } = await supabase.rpc('receive_item', {
        transit_id: qrData,
        receiver_node_id: nodeId
      })
      
      if (error) throw error
      
      alert('Item received successfully!')
      fetchUserScanHistory()
      setQrInput('')
    } catch (error) {
      console.error('Error processing incoming scan:', error)
      alert('Error processing scan. Please check the QR code.')
    } finally {
      setLoading(false)
    }
  }

  const processOutgoingScan = async (scanData: QRScanData) => {
    setLoading(true)
    try {
      // Call Postgres function to handle outgoing item
      const { data, error } = await supabase.rpc('send_item', {
        item_instance_id: scanData.itemInstanceId,
        destination_node_id: scanData.destinationNodeId,
        courier_name: scanData.courierData?.name,
        courier_phone: scanData.courierData?.phone,
        origin_node_id: currentNodeId
      })
      
      if (error) throw error
      
      alert('Item sent successfully! QR code generated for courier.')
      fetchUserScanHistory()
      setQrInput('')
    } catch (error) {
      console.error('Error processing outgoing scan:', error)
      alert('Error processing scan.')
    } finally {
      setLoading(false)
    }
  }

  const createDiscrepancyReport = async (reportData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('report')
        .insert([{
          user_id: user?.id,
          item_instance_id: reportData.itemInstanceId,
          report_node_id: currentNodeId,
          reported_node_id: currentNodeId,
          report_description: reportData.description,
          report_status: 'pending'
        }])
      
      if (error) throw error
      
      alert('Discrepancy report filed successfully!')
      setReportData({ description: '', isModalOpen: false, itemInstanceId: '' })
    } catch (error) {
      console.error('Error creating report:', error)
      alert('Error filing report.')
    }
  }

  const handleScan = () => {
    if (!qrInput.trim()) return
    
    if (scanMode === 'incoming') {
      processIncomingScan(qrInput, currentNodeId)
    } else {
      // For outgoing, open the form modal
      setOutgoingFormData({ ...outgoingFormData, isModalOpen: true })
    }
  }

  const handleOutgoingScan = () => {
    const scanData: QRScanData = {
      qrData: qrInput,
      itemInstanceId: qrInput, // In real app, this would be the actual item instance ID
      destinationNodeId: outgoingFormData.destinationNodeId,
      courierData: { 
        name: outgoingFormData.courierName, 
        phone: outgoingFormData.courierPhone 
      }
    }
    processOutgoingScan(scanData)
    setOutgoingFormData({
      isModalOpen: false,
      destinationNodeId: '',
      courierName: '',
      courierPhone: ''
    })
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">QR Scanner</h1>

      {/* Scan Mode Toggle */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 font-medium ${
              scanMode === 'incoming'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setScanMode('incoming')}
          >
            Incoming Items
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              scanMode === 'outgoing'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setScanMode('outgoing')}
          >
            Outgoing Items
          </button>
        </div>
      </div>

      {/* Scanner Interface */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {scanMode === 'incoming' ? 'Scan Incoming Item' : 'Scan Outgoing Item'}
        </h2>
        
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Scan or enter QR code"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleScan()}
          />
          <button
            onClick={handleScan}
            disabled={loading || !qrInput.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Process Scan'}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setReportData({ ...reportData, isModalOpen: true, itemInstanceId: qrInput })}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Report Issue
          </button>
        </div>
      </div>

      {/* Scan History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Recent Scan History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transit ID
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
              {scanHistory.map((scan) => (
                <tr key={scan.transit_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {scan.transit_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {scan.courier_name} - {scan.courier_phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      scan.status === 'delivered' 
                        ? 'bg-green-100 text-green-800'
                        : scan.status === 'in_transit'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {scan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(scan.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Modal */}
      {reportData.isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">File Discrepancy Report</h3>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
              rows={4}
              placeholder="Describe the issue..."
              value={reportData.description}
              onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setReportData({ description: '', isModalOpen: false, itemInstanceId: '' })}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => createDiscrepancyReport(reportData)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outgoing Scan Form Modal */}
      {outgoingFormData.isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Outgoing Item Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item ID/QR Code</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                  value={qrInput}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination Node</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={outgoingFormData.destinationNodeId}
                  onChange={(e) => setOutgoingFormData({ ...outgoingFormData, destinationNodeId: e.target.value })}
                  required
                >
                  <option value="">Select destination node</option>
                  {nodes.filter(node => node.node_id !== currentNodeId).map((node) => (
                    <option key={node.node_id} value={node.node_id}>
                      {node.node_name} ({node.node_type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Courier Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={outgoingFormData.courierName}
                  onChange={(e) => setOutgoingFormData({ ...outgoingFormData, courierName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Courier Phone</label>
                <input
                  type="tel"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={outgoingFormData.courierPhone}
                  onChange={(e) => setOutgoingFormData({ ...outgoingFormData, courierPhone: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setOutgoingFormData({
                  isModalOpen: false,
                  destinationNodeId: '',
                  courierName: '',
                  courierPhone: ''
                })}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleOutgoingScan}
                disabled={!outgoingFormData.destinationNodeId || !outgoingFormData.courierName || !outgoingFormData.courierPhone}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Send Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
