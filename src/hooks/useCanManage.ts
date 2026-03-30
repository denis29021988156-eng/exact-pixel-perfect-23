import { useAuth } from '@/contexts/AuthContext';

/** Returns true if the current user has mayor or deputy role (can create/edit) */
export function useCanManage(): boolean {
  const { userRole } = useAuth();
  return userRole === 'mayor' || userRole === 'deputy';
}
