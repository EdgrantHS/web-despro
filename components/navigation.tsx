'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/useAuth';

export default function Navigation() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { user, isSuperAdmin } = useAuth();

  const role = user?.role;

  const navigation = useMemo(() => {
    if (!user) return [] as any[];

    const items: any[] = [];

    // QR Scan available for all authenticated roles
    items.push({ name: 'QR Scan', href: '/qr-scan' });

    // Super Admin menu for Admin Pusat
    if (role === 'admin_pusat' || isSuperAdmin) {
      items.push({
        name: 'Super Admin',
        href: '#',
        children: [
          { name: 'Nodes', href: '/super-admin/nodes' },
          { name: 'Item Types', href: '/super-admin/item-types' },
          { name: 'Item Instances', href: '/super-admin/item-instances' },
          { name: 'Item Transits', href: '/super-admin/item-transits' },
        ],
      });
    }

    // Node Admin menu
    if (role === 'admin_node') {
      items.push({
        name: 'Node Admin',
        href: '#',
        children: [
          { name: 'My Item Instances', href: '/node-admin/item-instances' },
        ],
      });
    }

    return items;
  }, [user, role, isSuperAdmin]);

  const isActive = (item: any) => {
    if (item.children) {
      return item.children.some((child: any) => pathname === child.href);
    }
    return pathname === item.href;
  };

  const handleDropdownToggle = (itemName: string) => {
    setOpenDropdown(openDropdown === itemName ? null : itemName);
  };

  // Hide entire navigation when not authenticated
  if (!user) {
    return null;
  }

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between">
          <div className="flex space-x-8">
            <div className="flex items-center py-4">
              <Link href="/" className="text-xl font-bold text-gray-800">
                Despro System
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => (
                <div key={item.name} className="relative">
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => handleDropdownToggle(item.name)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                          isActive(item)
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {item.name}
                        <svg
                          className={`ml-1 h-4 w-4 transition-transform ${
                            openDropdown === item.name ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {openDropdown === item.name && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          {item.children.map((child: any) => (
                            <Link
                              key={child.name}
                              href={child.href}
                              onClick={() => setOpenDropdown(null)}
                              className={`block px-4 py-2 text-sm transition-colors ${
                                pathname === child.href
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                              }`}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        pathname === item.href
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}