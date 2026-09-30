'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function SessionSync() {
  const verifySession = useAuthStore((s) => s.verifySession);

  useEffect(() => {
    // Verify session token on client mount to ensure validity against server
    verifySession();
  }, [verifySession]);

  return null;
}
