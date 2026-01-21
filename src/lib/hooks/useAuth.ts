'use client';

import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { type UserWithKeys } from '@/types/auth';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user as UserWithKeys | undefined;

  const signOut = useCallback(async () => {
    await nextAuthSignOut({ redirect: false });
    router.push('/');
  }, [router]);

  const requireAuth = useCallback(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return false;
    }
    return status === 'authenticated';
  }, [status, router]);

  return {
    user,
    publicKey: user?.publicKey,
    secretKey: user?.secretKey,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    hasSecretKey: !!user?.secretKey,
    signOut,
    requireAuth,
  };
}
