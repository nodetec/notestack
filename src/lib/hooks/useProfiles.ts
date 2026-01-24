'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchProfiles, type Profile } from '@/lib/nostr/profiles';

/**
 * Hook to fetch profiles for a list of pubkeys
 * Uses React Query for caching and populates individual profile cache entries
 */
export function useProfiles(pubkeys: string[], relay?: string | string[]) {
  const queryClient = useQueryClient();
  const uniquePubkeys = [...new Set(pubkeys)];
  const relayKey = Array.isArray(relay) ? relay.join('|') : relay ?? '';

  const query = useQuery({
    queryKey: ['profiles', relayKey, [...uniquePubkeys].sort().join(',')],
    queryFn: async () => {
      if (uniquePubkeys.length === 0) return new Map<string, Profile>();
      return fetchProfiles(uniquePubkeys, relay);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData, // Keep previous profiles while loading new ones
    enabled: uniquePubkeys.length > 0 && relayKey.length > 0,
  });

  // Populate individual profile cache entries after batch fetch completes
  useEffect(() => {
    if (query.data) {
      for (const [pk, profile] of query.data) {
        queryClient.setQueryData(['profile', pk, relayKey], profile);
      }
    }
  }, [query.data, queryClient, relayKey]);

  return query;
}

/**
 * Hook to fetch a single profile by pubkey
 * Checks individual cache first (populated by useProfiles batch fetches)
 */
export function useProfile(pubkey: string | null, relays: string[]) {
  const relayKey = relays.join('|');

  return useQuery({
    queryKey: ['profile', pubkey, relayKey],
    queryFn: async () => {
      const profiles = await fetchProfiles([pubkey!], relays);
      return profiles.get(pubkey!) || null;
    },
    enabled: !!pubkey && relayKey.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
