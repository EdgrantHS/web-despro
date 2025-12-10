'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useLoading } from '@/contexts/LoadingContext';
import { createClient } from '@/utils/supabase/client';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isSuperAdmin } = useAuth();
  const { setLoading } = useLoading();

  const role = user?.role;

  const handleLogout = async () => {
    const supabase = createClient();
    setLoading(true, 'Logging out...');
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navigation = useMemo(() => {
    if (!user) return [] as any[];

    const items: any[] = [];

    if (role === 'petugas') {
      items.push({ name : 'QR Scan', href: '/qr-scan' } );
      items.push({ name : 'QR Create', href: '/qr-create' } );
      items.push({ name : 'Scanner Interface', href: '/scanner-interface' } );
      items.push({ name : 'Cook Recipe', href: '/petugas/cook' } );
    }
    else {
      items.push({
        name: 'Petugas',
        href: '#',
        children: [
          { name: 'QR Scan', href: '/qr-scan' },
          { name: 'QR Create', href: '/qr-create' },
          { name: 'Scanner Interface', href: '/scanner-interface' },
          { name: 'Cook Recipe', href: '/petugas/cook' },
        ],
      });
    }

    // Super Admin menu for Admin Pusat
    if (role === 'admin_pusat' || isSuperAdmin) {
      items.push({
        name: 'Super Admin',
        href: '#',
        children: [
          { name: 'Users', href: '/super-admin/users' },
          { name: 'Nodes', href: '/super-admin/nodes' },
          { name: 'Item Types', href: '/super-admin/item-types' },
          { name: 'Item Instances', href: '/super-admin/item-instances' },
          { name: 'Item Transits', href: '/super-admin/item-transits' },
          { name: 'Recipes', href: '/super-admin/recipes' },
          { name: 'Reports', href: '/super-admin/reports' },
        ],
      });
    }

    // Node Admin menu
    if (role === 'admin_node') {
      items.push({
        name: 'Node Admin',
        href: '#',
        children: [
          { name: 'Inventory', href: '/node-admin/inventory' },
          { name: 'Item Instances', href: '/node-admin/item-instances' },
          { name: 'Item Transits', href: '/node-admin/item-transits' },
          { name: 'Recipes', href: '/node-admin/recipes' },
          { name: 'Reports', href: '/node-admin/reports' },
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

  const handleNavigation = (href: string) => {
    setLoading(true, 'Loading page...');
    setMobileMenuOpen(false); // Close mobile menu when navigating
    setOpenDropdown(null); // Close any open dropdowns
    router.push(href);
  };

  // Hide loading overlay when route changes complete
  useEffect(() => {
    setLoading(false);
  }, [pathname, setLoading]);

  // Hide entire navigation when not authenticated
  if (!user) {
    return null;
  }

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl w-screen mx-auto px-4">
        <div className="flex justify-center">
          <div className="flex justify-between w-full py-4 px-8">
            <div className="flex items-center">
              <Link 
                href={
                  role === 'petugas' ? '/petugas' :
                  role === 'admin_node' ? '/node-admin' :
                  role === 'admin_pusat' || isSuperAdmin ? '/super-admin' :
                  '/'
                }
                className="text-xl font-bold text-gray-800"
              >
                QR Logistic
              </Link>
            </div>
            
            {/* Hamburger button for mobile */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {!mobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>

            {/* Desktop navigation */}
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
                            <button
                              key={child.name}
                              onClick={() => {
                                setOpenDropdown(null);
                                handleNavigation(child.href);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                                pathname === child.href
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                              }`}
                            >
                              {child.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleNavigation(item.href)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        pathname === item.href
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {item.name}
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleLogout}
                className="ml-4 px-3 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t">
              {navigation.map((item) => (
                <div key={item.name}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => handleDropdownToggle(item.name)}
                        className={`w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center justify-between ${
                          isActive(item)
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        {item.name}
                        <svg
                          className={`h-5 w-5 transition-transform ${
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
                        <div className="ml-4 mt-1 space-y-1">
                          {item.children.map((child: any) => (
                            <button
                              key={child.name}
                              onClick={() => handleNavigation(child.href)}
                              className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                pathname === child.href
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {child.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleNavigation(item.href)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        pathname === item.href
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {item.name}
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 mt-4 rounded-md text-base font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}