'use client';

import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode, useState } from 'react';

interface RouteGuardProps {
  children: ReactNode;
  requiredRole?: 'admin_pusat' | 'admin_node' | 'petugas';
  requireSuperAdmin?: boolean;
}

export function RouteGuard({ children, requiredRole, requireSuperAdmin }: RouteGuardProps) {
  const { user, isSuperAdmin, loading } = useAuth();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (loading) return; // Wait for auth to load

      console.log('RouteGuard: Checking auth state:', { 
        user: user?.role, 
        isSuperAdmin, 
        requireSuperAdmin, 
        requiredRole,
        loading 
      });

      // Add small delay to ensure state is fully loaded
      await new Promise(resolve => setTimeout(resolve, 50));

      // If no user is logged in, redirect to login
      if (!user) {
        console.log('RouteGuard: No user found, redirecting to login');
        router.push('/login');
        return;
      }

      // If super admin access is required but user is not super admin
      if (requireSuperAdmin && !isSuperAdmin) {
        console.log('RouteGuard: Super admin required but user is not super admin, redirecting to dashboard');
        router.push('/dashboard');
        return;
      }

      // If specific role is required but user doesn't have it
      if (requiredRole && user.role !== requiredRole) {
        console.log(`RouteGuard: Role ${requiredRole} required but user has role ${user.role}, redirecting to dashboard`);
        router.push('/dashboard');
        return;
      }

      console.log('RouteGuard: Access granted', { user: user.role, isSuperAdmin, requireSuperAdmin, requiredRole });
      setAuthChecked(true);
    };

    checkAuth();
  }, [user, isSuperAdmin, loading, router, requiredRole, requireSuperAdmin]);

  // Show loading while checking auth
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render children if user doesn't have access
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Not Authenticated</h1>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if ((requireSuperAdmin && !isSuperAdmin) || (requiredRole && user.role !== requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500 mt-2">
            Required: {requireSuperAdmin ? 'Super Admin' : requiredRole} | Your role: {user.role}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}