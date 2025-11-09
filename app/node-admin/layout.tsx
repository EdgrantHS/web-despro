import { RouteGuard } from '@/components/auth/RouteGuard';

export default function NodeAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard requiredRole="admin_node">
      {children}
    </RouteGuard>
  );
}