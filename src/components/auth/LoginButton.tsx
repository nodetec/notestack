'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { bech32 } from '@scure/base';
import { lookupProfile } from '@/lib/nostr/profiles';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { NostrProfile } from '@/components/editor';
import type { UserWithKeys } from '@/types/auth';

interface LoginButtonProps {
  onLogin?: (pubkey: string) => void;
  onLogout?: () => void;
}

function hexToNpub(hex: string): string {
  const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
  const words = bech32.toWords(bytes);
  return bech32.encode('npub', words, 1000);
}

function formatNpub(npub: string): string {
  return `npub...${npub.slice(-4)}`;
}

export default function LoginButton({ onLogin, onLogout }: LoginButtonProps) {
  const { data: session, status } = useSession();
  const user = session?.user as UserWithKeys | undefined;
  const pubkey = user?.publicKey;
  const router = useRouter();

  const [profile, setProfile] = useState<NostrProfile | null>(null);

  // Notify parent when pubkey changes
  useEffect(() => {
    if (status === 'authenticated' && pubkey) {
      onLogin?.(pubkey);
    }
  }, [status, pubkey, onLogin]);

  // Fetch profile when pubkey is available
  useEffect(() => {
    if (!pubkey) {
      setProfile(null);
      return;
    }

    const npub = hexToNpub(pubkey);
    lookupProfile(npub).then((result) => {
      setProfile(result);
    });
  }, [pubkey]);

  const handleLogin = useCallback(() => {
    router.push('/login');
  }, [router]);

  const handleLogout = useCallback(async () => {
    await signOut({ redirect: false });
    onLogout?.();
  }, [onLogout]);

  // Show skeleton while loading session
  if (status === 'loading') {
    return <div className="h-7 w-20" />;
  }

  if (pubkey) {
    const npub = hexToNpub(pubkey);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {profile?.picture ? (
            <button className="w-7 h-7 rounded-full overflow-hidden hover:ring-2 hover:ring-zinc-300 dark:hover:ring-zinc-600 transition-shadow">
              <img
                src={profile.picture}
                alt={profile.name || 'Profile'}
                className="w-full h-full object-cover"
              />
            </button>
          ) : (
            <Button variant="ghost" size="sm" className="font-mono">
              {formatNpub(npub)}
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleLogout}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button size="sm" onClick={handleLogin}>
      Login
    </Button>
  );
}
