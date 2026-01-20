'use client';

import { useState, useCallback, useEffect } from 'react';
import { bech32 } from '@scure/base';
import { useAuthStore } from '@/lib/stores/authStore';
import { lookupProfile } from '@/lib/nostr/profiles';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { NostrProfile } from '@/components/editor';

// NIP-07 window.nostr interface
declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>;
      signEvent(event: object): Promise<object>;
    };
  }
}

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
  const { pubkey, setPubkey, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [profile, setProfile] = useState<NostrProfile | null>(null);

  // Handle hydration to avoid mismatch between server and client
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Notify parent when pubkey changes (including on hydration)
  useEffect(() => {
    if (isHydrated && pubkey) {
      onLogin?.(pubkey);
    }
  }, [isHydrated, pubkey, onLogin]);

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

  const handleLogin = useCallback(async () => {
    if (!window.nostr) {
      setError('No Nostr extension found. Please install a NIP-07 extension like nos2x or Alby.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const pk = await window.nostr.getPublicKey();
      setPubkey(pk);
      onLogin?.(pk);
    } catch (err) {
      setError('Failed to get public key');
      console.error('NIP-07 login error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [onLogin, setPubkey]);

  const handleLogout = useCallback(() => {
    logout();
    onLogout?.();
  }, [onLogout, logout]);

  // Show nothing until hydrated to avoid flash
  if (!isHydrated) {
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
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-red-500 max-w-48 truncate" title={error}>
          {error}
        </span>
      )}
      <Button size="sm" onClick={handleLogin} disabled={isLoading}>
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Connecting...
          </>
        ) : (
          'Login'
        )}
      </Button>
    </div>
  );
}
