'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { bech32 } from '@scure/base';
import { lookupProfile } from '@/lib/nostr/profiles';
import { generateAvatar } from '@/lib/avatar';
import { useSettingsStore } from '@/lib/stores/settingsStore';
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
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

function hexToNpub(hex: string): string {
  const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
  const words = bech32.toWords(bytes);
  return bech32.encode('npub', words, 1000);
}

export default function LoginButton({ onLogin, onLogout, size = 'sm' }: LoginButtonProps) {
  const { data: session, status } = useSession();
  const user = session?.user as UserWithKeys | undefined;
  const pubkey = user?.publicKey;
  const relays = useSettingsStore((state) => state.relays);
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<NostrProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

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
      setIsLoadingProfile(false);
      return;
    }

    setIsLoadingProfile(true);
    const npub = hexToNpub(pubkey);
    lookupProfile(npub, relays).then((result) => {
      setProfile(result);
      setIsLoadingProfile(false);
    });
  }, [pubkey, relays]);

  const handleLogin = useCallback(() => {
    const callbackUrl = encodeURIComponent(pathname || '/');
    router.push(`/login?callbackUrl=${callbackUrl}`);
  }, [router, pathname]);

  const handleLogout = useCallback(async () => {
    await signOut({ redirect: false });
    onLogout?.();
  }, [onLogout]);

  // Generate fallback avatar from pubkey (must be before early returns)
  const fallbackAvatar = useMemo(() => {
    return pubkey ? generateAvatar(pubkey) : null;
  }, [pubkey]);

  // Show skeleton while loading session
  if (status === 'loading') {
    return <div className="h-7 w-20" />;
  }

  if (pubkey) {
    const avatarSrc = profile?.picture || fallbackAvatar;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {isLoadingProfile ? (
            <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />
          ) : (
            <button className="w-7 h-7 rounded-full overflow-hidden hover:ring-2 hover:ring-border transition-shadow">
              <img
                src={avatarSrc!}
                alt={profile?.name || 'Profile'}
                className="w-full h-full object-cover"
              />
            </button>
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
    <Button size={size} onClick={handleLogin}>
      Login
    </Button>
  );
}
