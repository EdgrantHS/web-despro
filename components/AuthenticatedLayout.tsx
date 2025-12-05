'use client';

import { useAuth } from '@/lib/useAuth';
import { usePathname } from 'next/navigation';
import Navigation from "@/components/navigation";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Don't show navigation on login/register pages
  const isAuthPage = pathname === '/login' || pathname === '/register';
  
  // Don't show navigation only on main petugas dashboard page
  const isPetugasDashboard = pathname === '/petugas';

  // Show navbar and header only when user is authenticated and not on auth pages or main petugas dashboard
  if (user && !loading && !isAuthPage && !isPetugasDashboard) {
    return (
      <>
        <Navigation />
        <div className="flex flex-col gap-20 w-full lg:max-w-5xl px-5">
          {children}
        </div>
      </>
    );
  }

  // Show content without navbar/header when not authenticated, still loading, or on auth pages
  return (
    <div className="flex flex-col gap-20 w-full lg:max-w-5xl px-5">
      {children}
    </div>
  );
}