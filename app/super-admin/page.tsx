'use client';

import { Button } from '@/components/ui/button';
import { LoadingLink } from '@/components/LoadingLink';

export default function SuperAdminPage() {
  const adminModules = [
    {
      title: 'Users Management',
      description: 'Manage system users, roles, and permissions across all nodes',
      href: '/super-admin/users',
      icon: '👥',
      color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
    },
    {
      title: 'Nodes Management',
      description: 'Manage all nodes in the system - create, edit, and delete nodes',
      href: '/super-admin/nodes',
      icon: '🏢',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      title: 'Item Types Management',
      description: 'Define and manage all item types and categories',
      href: '/super-admin/item-types',
      icon: '📦',
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      title: 'Item Instances Management',
      description: 'View and manage all item instances across all nodes',
      href: '/super-admin/item-instances',
      icon: '📋',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    },
    {
      title: 'Item Transits Management',
      description: 'Monitor and manage all item transits between nodes',
      href: '/super-admin/item-transits',
      icon: '🚚',
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
    }
  ];

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Super Admin Dashboard</h1>
          <p className="text-gray-600">
            Comprehensive system management with full access to all nodes and data
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminModules.map((module) => (
            <LoadingLink 
              key={module.title} 
              href={module.href}
              loadingMessage={`Loading ${module.title}...`}
            >
              <div className={`p-6 border-2 rounded-lg transition-all ${module.color}`}>
                <div className="flex items-start space-x-4">
                  <div className="text-3xl">{module.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {module.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {module.description}
                    </p>
                    <Button variant="outline" size="sm">
                      Manage →
                    </Button>
                  </div>
                </div>
              </div>
            </LoadingLink>
          ))}
        </div>

        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            ⚠️ Super Admin Access
          </h3>
          <p className="text-yellow-700">
            You have full administrative privileges. All changes made here will affect the entire system 
            and all nodes. Please use caution when modifying or deleting data.
          </p>
        </div>
      </div>
    </div>
  );
}