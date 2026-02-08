'use client';

import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { type UserWithKeys } from '@/types/auth';
import { restoreFromSession, disconnect } from '@/lib/nostr/bunkerManager';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const restoringRef = useRef(false);

  const user = session?.user as UserWithKeys | undefined;

  // Restore bunker connection on page load for NIP-46 sessions
  useEffect(() => {
    if (
      user?.signingMethod === 'nip46' &&
      user.bunkerParams &&
      !restoringRef.current
    ) {
      restoringRef.current = true;
      restoreFromSession(user.bunkerParams).catch((err) => {
        console.error('Failed to restore bunker connection:', err);
      });
    }
  }, [user?.signingMethod, user?.bunkerParams]);

  const signOut = useCallback(async () => {
    // Clean up bunker connection before signing out
    await disconnect();
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
    signingMethod: user?.signingMethod,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    hasSecretKey: !!user?.secretKey,
    signOut,
    requireAuth,
  };
}
