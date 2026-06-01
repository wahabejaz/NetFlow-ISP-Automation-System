import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../services/db';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole: 'Admin' | 'Customer' | 'Technician';
}

export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const role = sessionStorage.getItem('userRole');
  const token = sessionStorage.getItem('authToken');
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function validateSession() {
      if (!token || role !== allowedRole) {
        if (isMounted) {
          setIsAuthorized(false);
          setIsValidating(false);
        }
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (!isMounted) {
          return;
        }

        const serverRole = currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'customer' ? 'Customer' : 'Technician';
        setIsAuthorized(serverRole === allowedRole);
      } catch {
        if (!isMounted) {
          return;
        }

        sessionStorage.clear();
        setIsAuthorized(false);
      } finally {
        if (isMounted) {
          setIsValidating(false);
        }
      }
    }

    validateSession();

    return () => {
      isMounted = false;
    };
  }, [allowedRole, role, token]);

  if (!token || role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  if (isValidating) {
    return <div style={{ padding: '2rem', color: 'var(--text-light)' }}>Checking your session...</div>;
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
