'use client';

import { useAuth } from '@/lib/useAuth';
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { EnvVarWarning } from "@/components/env-var-warning";
import ClientHeaderAuth from "@/components/ClientHeaderAuth";
import Link from "next/link";
import Navigation from "@/components/navigation";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user, loading } = useAuth();

  // Show navbar and header only when user is authenticated
  if (user) {
    return (
      <>
        <nav className="sticky top-0 z-30 w-full flex justify-center border-b border-b-foreground/10 h-16 bg-background bg-opacity-90 backdrop-blur">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Project Despro 13</Link>
              <div className="flex items-center gap-2">
                {/* <DeployButton /> */}
              </div>
            </div>
            {!hasEnvVars ? <EnvVarWarning /> : <ClientHeaderAuth />}
          </div>
        </nav>
        <Navigation />
        <div className="flex flex-col gap-20 w-full lg:max-w-5xl px-5">
          {children}
        </div>
      </>
    );
  }

  // Show content without navbar/header when not authenticated or still loading
  return (
    <div className="flex flex-col gap-20 w-full lg:max-w-5xl px-5">
      {children}
    </div>
  );
}