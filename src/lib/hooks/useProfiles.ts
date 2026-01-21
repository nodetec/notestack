'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchProfiles, type Profile } from '@/lib/nostr/profiles';

/**
 * Hook to fetch profiles for a list of pubkeys
 * Uses React Query for caching
 */
export function useProfiles(pubkeys: string[], relay?: string | string[]) {
  const uniquePubkeys = [...new Set(pubkeys)];
  const relayKey = Array.isArray(relay) ? relay.join('|') : relay ?? '';

  return useQuery({
    queryKey: ['profiles', relayKey, [...uniquePubkeys].sort().join(',')],
    queryFn: async () => {
      if (uniquePubkeys.length === 0) return new Map<string, Profile>();
      return fetchProfiles(uniquePubkeys, relay);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData, // Keep previous profiles while loading new ones
    enabled: uniquePubkeys.length > 0 && relayKey.length > 0,
  });
}
