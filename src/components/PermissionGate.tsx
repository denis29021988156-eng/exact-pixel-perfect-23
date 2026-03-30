import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionGateProps {
  roles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Shows children only if the current user's role is in the allowed list.
 * Optional fallback is shown otherwise.
 */
export default function PermissionGate({ roles, children, fallback = null }: PermissionGateProps) {
  const { userRole } = useAuth();
  if (!userRole || !roles.includes(userRole)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
