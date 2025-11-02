import { RouteGuard } from '@/components/auth/RouteGuard';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard requireSuperAdmin={true}>
      {children}
    </RouteGuard>
  );
}