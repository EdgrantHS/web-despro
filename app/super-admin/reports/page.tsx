'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { report } from 'process';

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
  updated_at?: string;
  user?: {
    id: string;
    email: string;
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

interface Node {
  id: string;
  name: string;
  type: string;
  location: string;
}

interface Pagination {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function SuperAdminReportsPage() {
  const [reports, setReports] = useState<ReportDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null);
  const [reporterNode, setReporterNode] = useState<Node | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (selectedReport && selectedReport.user?.node_id) {
      fetchNode(selectedReport.user.node_id);
    }
    
  }, [selectedReport]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/reports');
      const result = await response.json();

      if (result.success) {
        setReports(result.data.reports || []);
        setPagination(result.data.pagination);
        console.log('Fetched reports:', result);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      alert('Error fetching reports');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNode = async (nodeId: string) => {
    try {
      const response = await fetch(`/api/node/${nodeId}`);
      const result = await response.json();
      if (result.success) {
        setReporterNode(result.data);
      }
    } catch (error) {
      console.error('Error fetching node:', error);
    }
  }

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

  const getFilteredReports = () => {
    return reports.filter(report => {
      const statusMatch = !filterStatus || report.status === filterStatus;
      const typeMatch = !filterType || report.type === filterType;
      return statusMatch && typeMatch;
    });
  };

  if (isLoading) {
    return <div className="p-6">Loading reports...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reports Management</h1>
          <p className="text-gray-600">
            Review and manage all inventory reports from users
          </p>
        </div>
        <Button onClick={fetchReports}>Refresh</Button>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50 flex gap-4 items-end">
        <div className="flex-1">
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
        <div className="flex-1">
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
        >
          Clear Filters
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>User Email</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Reported At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getFilteredReports().map((report) => (
              <TableRow key={report.id} className="cursor-pointer hover:bg-gray-50">
                <TableCell className="font-mono text-xs">
                  {report.id.slice(0, 8)}...
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{getTypeLabel(report.type)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(report.status)}>
                    {report.status}
                  </Badge>
                </TableCell>
                <TableCell>{report.user?.email || 'Unknown'}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {report.description || '-'}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {new Date(report.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRowClick(report)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {getFilteredReports().length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {reports.length === 0 ? 'No reports found.' : 'No reports match your filters.'}
          </div>
        )}
      </div>

      {pagination && (
        <div className="mt-4 text-sm text-gray-600">
          Showing page {pagination.page} of {pagination.total_pages} ({pagination.total} total reports)
        </div>
      )}

      {/* Report Detail Modal */}
      {showDetailModal && selectedReport && reporterNode && (
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
                  <label className="text-sm font-medium text-gray-600">User Email</label>
                  <p>{selectedReport.user?.email || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Reporter Node</label>
                  <p className="font-mono text-sm">{selectedReport.user?.node_id ? reporterNode?.name : 'Unknown'}</p>
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
                    <p>Transit ID: <span className="font-mono text-xs">{selectedReport.item_transit.id}.</span></p>
                    <p>Item ID: <span className="font-mono text-xs">{selectedReport.item_transit.item_id}</span></p>
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
