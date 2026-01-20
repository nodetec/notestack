'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchProfiles, type Profile } from '@/lib/nostr/profiles';

/**
 * Hook to fetch profiles for a list of pubkeys
 * Uses React Query for caching
 */
export function useProfiles(pubkeys: string[], relay?: string) {
  return useQuery({
    queryKey: ['profiles', relay, [...pubkeys].sort().join(',')],
    queryFn: async () => {
      if (pubkeys.length === 0) return new Map<string, Profile>();
      return fetchProfiles(pubkeys, relay);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData, // Keep previous profiles while loading new ones
    enabled: pubkeys.length > 0 && !!relay,
  });
}
