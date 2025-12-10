'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Grid2x2, ArrowLeft, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import Image from 'next/image';
import adminNodeImage from '@/assets/public/admin_node.png';

interface ReportDetail {
  id: string;
  type: 'STOCK_DISCREPANCY' | 'EXPIRED_ITEM' | 'OTHER_ISSUE';
  status: 'IN_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  description?: string;
  evidence?: string;
  quantities: {
    received: number | null;
    expired: number | null;
  };
  created_at: string;
  user?: {
    id: string;
    node_id: string;
  };
  item_transit?: {
    id: string;
    item_id: string;
    source_node_id: string;
    destination_node_id: string;
    status: string;
    item_instance?: {
      item_name: string | null;
      item_type: string | null;
    };
  };
}

interface Pagination {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface Node {
  id: string;
  name: string;
  type: string;
}

export default function NodeAdminReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<ReportDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [userNode, setUserNode] = useState<Node | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    fetchUserNode();
  }, []);

  useEffect(() => {
    if (userNode) {
      fetchReports();
    }
  }, [userNode]);

  const fetchUserNode = async () => {
    try {
      const response = await fetch('/api/user/node');
      const data = await response.json();
      if (data.success && data.data.node) {
        setUserNode(data.data.node);
      }
    } catch (error) {
      console.error('Error fetching user node:', error);
    }
  };

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const nodeId = userNode?.id;
      const url = nodeId ? `/api/reports?node_id=${nodeId}` : '/api/reports';
      
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setReports(result.data.reports || []);
        setPagination(result.data.pagination);
        console.log('Fetched reports for node:', result);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      alert('Error fetching reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (report: ReportDetail) => {
    setSelectedReport(report);
    console.log("Selected Report: ", report);
    
    setShowDetailModal(true);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedReport) return;

    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/reports/${selectedReport.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`Report status updated to ${newStatus}`);
        setSelectedReport(result.data);
        fetchReports();
      } else {
        alert(result.message || 'Failed to update report status');
      }
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Error updating report status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'STOCK_DISCREPANCY':
        return 'Stock Discrepancy';
      case 'EXPIRED_ITEM':
        return 'Expired Item';
      case 'OTHER_ISSUE':
        return 'Other Issue';
      default:
        return type;
    }
  };

  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.username) return user.username;
    return 'Admin';
  };

  const getUserNodeName = () => {
    return userNode ? `${userNode.name} (${userNode.type})` : 'Loading...';
  };

  const getFilteredReports = () => {
    return reports.filter(report => {
      const statusMatch = !filterStatus || report.status === filterStatus;
      const typeMatch = !filterType || report.type === filterType;
      return statusMatch && typeMatch;
    });
  };

  if (isLoading && !userNode) {
    return <div className="p-6">Initializing node ID...</div>;
  }

  return (
    <div className="w-full min-h-screen bg-white text-black font-sans pb-24">
      {/* Header */}
      <div 
        className="bg-blue-600 text-white px-4 pt-10 pb-6 rounded-b-3xl shadow-md"
        style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex-shrink-0">
            <ArrowLeft size={24} className="md:w-6 md:h-6 w-5 h-5" />
          </button>
          <Grid2x2 size={28} className="md:w-7 md:h-7 w-6 h-6" />
          <h1 className="text-xl md:text-2xl font-semibold">Reports Management</h1>
        </div>
      </div>

      {/* Greeting */}
      <div className="px-4 md:px-5 mt-4 flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-3xl font-bold truncate">
            Hi <span className="text-blue-600">{getUserName()}!</span>
          </h2>
          <p className="text-gray-600 text-base md:text-lg">
            Managing reports for: <span className="font-semibold text-blue-600">{getUserNodeName()}</span>
          </p>
        </div>
      </div>

      {/* Welcome Card */}
      <div className="px-4 md:px-5 mt-4">
        <div className="border border-gray-200 rounded-xl p-3 md:p-4 flex items-center justify-between shadow-sm">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base md:text-lg">Manage Reports</h3>
            <p className="text-gray-600 text-sm md:text-base">Review and manage reports from your node</p>
          </div>
          <Image
            src={adminNodeImage}
            alt="Admin Node"
            width={80}
            height={80}
            className="w-16 md:w-20 flex-shrink-0 ml-2 object-contain"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 md:px-5 mt-4">
        <div className="p-4 border rounded-lg bg-gray-50 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-sm font-medium text-gray-600 block mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 border rounded-md bg-white"
            >
              <option value="">All Status</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="text-sm font-medium text-gray-600 block mb-2">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full p-2 border rounded-md bg-white"
            >
              <option value="">All Types</option>
              <option value="STOCK_DISCREPANCY">Stock Discrepancy</option>
              <option value="EXPIRED_ITEM">Expired Item</option>
              <option value="OTHER_ISSUE">Other Issue</option>
            </select>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setFilterStatus('');
              setFilterType('');
            }}
            className="w-full md:w-auto"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      <div className="px-4 md:px-5 mt-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-base md:text-lg font-semibold">Reports List</h3>
            <Button onClick={fetchReports} size="sm" variant="outline">Refresh</Button>
        </div>
        
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
            <table className="w-full text-left text-[9px] md:text-sm min-w-[650px]">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Report ID</th>
                  <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Type</th>
                  <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Status</th>
                  <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Reporter Node</th>
                  <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Item Relation</th>
                  <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Description</th>
                  <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Reported At</th>
                  <th className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredReports().length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-1.5 md:px-3 py-3 md:py-4 text-center text-gray-500 text-[9px] md:text-sm bg-white">
                      {reports.length === 0 ? 'No reports found for your node.' : 'No reports match your filters.'}
                    </td>
                  </tr>
                ) : (
                  getFilteredReports().map((report, index) => (
                    <tr 
                      key={report.id} 
                      className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} border-b border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer`}
                      onClick={() => handleRowClick(report)}
                    >
                      <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm font-mono">
                        {report.id.slice(0, 8)}...
                      </td>
                      <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                        <Badge variant="outline" className="text-[8px] md:text-xs">{getTypeLabel(report.type)}</Badge>
                      </td>
                      <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                        <Badge className={`${getStatusColor(report.status)} text-[8px] md:text-xs`}>
                          {report.status}
                        </Badge>
                      </td>
                      <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                        {report.user?.node_id ? `${report.user.node_id.slice(0, 8)}...` : 'Unknown'}
                      </td>
                      <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm">
                        {report.item_transit?.source_node_id === userNode?.id ? (
                          <span className="px-1 md:px-2 py-0.5 md:py-1 bg-blue-100 text-blue-800 rounded text-[8px] md:text-xs">Sent from here</span>
                        ) : (
                          <span className="px-1 md:px-2 py-0.5 md:py-1 bg-gray-100 text-gray-800 rounded text-[8px] md:text-xs">Reported here</span>
                        )}
                      </td>
                      <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm max-w-[100px] truncate">
                        {report.description || '-'}
                      </td>
                      <td className="px-1.5 md:px-3 py-1 md:py-2 text-[9px] md:text-sm text-gray-600">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-1.5 md:px-3 py-1 md:py-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 md:h-8 text-[9px] md:text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(report);
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {pagination && (
            <div className="mt-4 text-sm text-gray-600">
            Showing {reports.length} report(s) for this node
            </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Report Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Report Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Report ID</label>
                  <p className="font-mono text-sm">{selectedReport.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Type</label>
                  <p>{getTypeLabel(selectedReport.type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Reporter Node</label>
                  <p className="font-mono text-sm">{selectedReport.user?.node_id || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Reported At</label>
                  <p>{new Date(selectedReport.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Description */}
              {selectedReport.description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-sm">{selectedReport.description}</p>
                </div>
              )}

              {/* Quantities */}
              <div className="grid grid-cols-2 gap-4">
                {selectedReport.quantities?.received !== null && selectedReport.quantities?.received !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Received Quantity</label>
                    <p>{selectedReport.quantities.received}</p>
                  </div>
                )}
                {selectedReport.quantities?.expired !== null && selectedReport.quantities?.expired !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Expired Quantity</label>
                    <p>{selectedReport.quantities.expired}</p>
                  </div>
                )}
              </div>

              {/* Evidence Image */}
              {selectedReport.evidence && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Evidence</label>
                  <div className="mt-2 max-w-md">
                    <img
                      src={selectedReport.evidence}
                      alt="Evidence"
                      className="max-w-full h-auto border rounded-lg cursor-pointer"
                      onClick={() => window.open(selectedReport.evidence, '_blank')}
                      title="Click to view full size"
                    />
                  </div>
                </div>
              )}

              {/* Item Transit Info */}
              {selectedReport.item_transit && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-600 block mb-2">Associated Item Transit</label>
                  <div className="mt-2 text-sm space-y-2 bg-gray-50 p-3 rounded">
                    <p>Transit ID: <span className="font-mono text-xs">{selectedReport.item_transit.id.slice(0, 8)}...</span></p>
                    <p>Item ID: <span className="font-mono text-xs">{selectedReport.item_transit.item_id.slice(0, 8)}...</span></p>
                    <p>Transit Status: <span className="font-medium">{selectedReport.item_transit.status}</span></p>
                    {selectedReport.item_transit.item_instance && (
                      <>
                        <p>Item Name: <span className="font-medium">{selectedReport.item_transit.item_instance.item_name || '-'}</span></p>
                        <p>Item Type: <span className="font-medium">{selectedReport.item_transit.item_instance.item_type || '-'}</span></p>
                      </>
                    )}
                    <p className="text-xs text-gray-600">From: {selectedReport.item_transit.source_node_id} → To: {selectedReport.item_transit.destination_node_id}</p>
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-600 block mb-2">Update Status</label>
                <div className="flex gap-2 flex-wrap">
                  {['IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={selectedReport.status === status ? 'default' : 'outline'}
                      onClick={() => handleStatusChange(status)}
                      disabled={isUpdatingStatus || selectedReport.status === status}
                      className={selectedReport.status === status ? getStatusColor(status) : ''}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
