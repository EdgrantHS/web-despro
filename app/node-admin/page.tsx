'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NodeAdminPage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Node Admin Dashboard</h1>
          <p className="text-gray-600">
            Node-specific administration with access to your assigned node's data
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Link href="/node-admin/item-instances">
            <div className="p-6 border-2 bg-blue-50 border-blue-200 hover:bg-blue-100 rounded-lg transition-all">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">📋</div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Item Instances Management
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Manage item instances for your specific node. View, create, and update items 
                    assigned to your node location.
                  </p>
                  <Button variant="outline" size="sm">
                    Manage Items →
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              ✅ Node-Specific Access
            </h3>
            <p className="text-green-700">
              Your access is restricted to your assigned node. This ensures data security 
              and prevents accidental modifications to other nodes' data.
            </p>
          </div>

          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              📱 Quick Actions
            </h3>
            <div className="space-y-2">
              <Link href="/qr-scan" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  🔍 QR Code Scanner
                </Button>
              </Link>
              <Link href="/node-admin/item-instances" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  ➕ Add New Item
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}