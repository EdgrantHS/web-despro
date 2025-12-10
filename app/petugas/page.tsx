'use client';

import React, { useState, useEffect } from "react";
import { Search, User, QrCode, FileWarning, ChevronRight, LayoutGrid, PlusCircle, LogOut, ChefHat, ScanLine } from "lucide-react";
import { LoadingLink } from '@/components/LoadingLink';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import petugasImage from '@/assets/public/image_petugas.png';

export default function PetugasPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [greeting, setGreeting] = useState('Good Morning');
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userNode, setUserNode] = useState<any>(null);
  const [nodeLoading, setNodeLoading] = useState(true);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };
  
  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
    
    // Fetch user's node to check if they can access Cook recipe
    fetchUserNode();
  }, []);

  const fetchUserNode = async () => {
    try {
      const response = await fetch('/api/user/node');
      const data = await response.json();
      if (data.success && data.data.node) {
        setUserNode(data.data.node);
      }
    } catch (error) {
      console.error('Error fetching user node:', error);
    } finally {
      setNodeLoading(false);
    }
  };  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.username) return user.username;
    return 'Petugas';
  };

  const menuItems = [
    {
      id: 'qr-create',
      title: 'QR Code Create',
      description: 'For Node Source & Assembly role',
      href: '/qr-create',
      icon: PlusCircle,
      loadingMessage: 'Loading QR Create...'
    },
    {
      id: 'qr-scan',
      title: 'QR Code Scan',
      description: 'Available to all staff roles',
      href: '/qr-scan',
      icon: QrCode,
      loadingMessage: 'Loading QR Scan...'
    },
    {
      id: 'scanner-interface',
      title: 'Scanner Interface',
      description: 'Interface for scanner input',
      href: '/scanner-interface',
      icon: ScanLine,
      loadingMessage: 'Loading Scanner Interface...'
    },
    {
      id: 'cook-recipe',
      title: 'Cook Recipe',
      description: 'Cook items from available ingredients',
      href: '/petugas/cook',
      icon: ChefHat,
      loadingMessage: 'Loading Cook Recipe...'
    },
    // {
    //   id: 'report',
    //   title: 'Report',
    //   description: 'Report discrepancies or damage',
    //   href: '#',
    //   icon: FileWarning,
    //   loadingMessage: 'Loading Report...'
    // }
  ];

  const filteredMenuItems = menuItems.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    );
  });

  // Show loading screen while fetching node data
  if (nodeLoading) {
    return (
      <div className="min-h-screen flex justify-center bg-white font-sans">
        <div className="w-full max-w-md bg-white min-h-screen flex flex-col items-center justify-center sm:border-2 border-blue-600">
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .animate-spin-custom {
              animation: spin 1s linear infinite;
            }
          `}</style>
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin-custom">
              <LayoutGrid className="w-12 h-12 text-blue-600" />
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-gray-800">Loading Dashboard</p>
              <p className="text-sm text-gray-500 mt-2">Please wait while we prepare your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center bg-white font-sans">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col sm:border-2 border-blue-600 pb-12">
        {/* Header */}
        <div className="bg-blue-600 text-white py-4 px-5 rounded-b-3xl flex items-center justify-between gap-2.5 shadow-md">
        <div className="flex items-center gap-2.5">
          <LayoutGrid className="w-5 h-5" />
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Greeting */}
      <div className="px-5 py-4 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hi <span className="text-blue-600">{getUserName()}!</span></h2>
          <p className="text-gray-600 text-base">{mounted ? greeting : 'Good Morning'}</p>
        </div>
        <User className="w-8 h-8 text-black" />
      </div>

      {/* Search Box */}
      <div className="px-5">
        <div className="bg-blue-50 flex items-center gap-2.5 px-3 py-2 rounded-xl">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 flex-1"
          />
        </div>
      </div>

      {/* Welcome Card */}
      <div className="px-5 mt-5">
        <div className="border border-blue-200 rounded-lg p-4 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-lg font-semibold">Welcome!</h3>
            <p className="text-gray-500 text-xs">Let's get started with your tasks</p>
          </div>
          <Image
            src={petugasImage}
            alt="Petugas"
            width={60}
            height={60}
            className="object-contain"
          />
        </div>
      </div>

      {/* Menu Options */}
      <div className="mt-6 px-5">
        {filteredMenuItems.length > 0 ? (
          filteredMenuItems.map((item) => {
            const IconComponent = item.icon;
            const menuItemContent = (
              <div className="border border-blue-400 rounded-xl p-4 min-h-[80px] flex items-center justify-between shadow-sm bg-white cursor-pointer hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <div className="bg-blue-100 p-2.5 rounded-full flex-shrink-0">
                    <IconComponent className="w-6 h-6 text-blue-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-blue-700 mb-1">{item.title}</h3>
                    <p className="text-gray-600 text-xs leading-tight">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0 ml-2" />
              </div>
            );

            return (
              <div key={item.id} className="mb-4">
                {item.href && item.href !== '#' ? (
                  <LoadingLink href={item.href} loadingMessage={item.loadingMessage}>
                    {menuItemContent}
                  </LoadingLink>
                ) : (
                  menuItemContent
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            No results found for "{searchQuery}"
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center px-5 text-gray-600 text-xs">
        <p className="font-semibold">Having trouble or found a bug?</p>
        <p>Tap <span className="text-blue-600 font-semibold">Admin</span> to get quick help — we're here to support you.</p>
      </div>
      </div>
    </div>
  );
}

