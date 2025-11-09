'use client';

import { useAuth } from '@/lib/useAuth';
import { useEffect, useState } from 'react';

export default function AuthTestPage() {
  const { user, isSuperAdmin, loading } = useAuth();
  const [localStorage, setLocalStorage] = useState<any>(null);

  useEffect(() => {
    // Read localStorage data for debugging
    if (typeof window !== 'undefined') {
      const userData = window.localStorage.getItem('userData');
      const superAdminStatus = window.localStorage.getItem('isSuperAdmin');
      
      setLocalStorage({
        userData: userData ? JSON.parse(userData) : null,
        superAdminStatus: superAdminStatus ? JSON.parse(superAdminStatus) : null
      });
    }
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">Loading State:</h2>
          <p>{loading ? 'Loading...' : 'Loaded'}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">User State:</h2>
          <pre className="text-sm">{JSON.stringify(user, null, 2)}</pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">Super Admin Status:</h2>
          <p>{isSuperAdmin ? 'Yes' : 'No'}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">LocalStorage Data:</h2>
          <pre className="text-sm">{JSON.stringify(localStorage, null, 2)}</pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">Role-based Access:</h2>
          <p>Admin Pusat: {user?.role === 'admin_pusat' ? '✅' : '❌'}</p>
          <p>Admin Node: {user?.role === 'admin_node' ? '✅' : '❌'}</p>
          <p>Petugas: {user?.role === 'petugas' ? '✅' : '❌'}</p>
          <p>Super Admin: {isSuperAdmin ? '✅' : '❌'}</p>
        </div>
      </div>
    </div>
  );
}