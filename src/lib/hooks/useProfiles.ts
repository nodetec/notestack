'use client';

import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchProfiles, type Profile } from '@/lib/nostr/profiles';

/**
 * Hook to fetch profiles for a list of pubkeys
 * Uses React Query for caching and populates individual profile cache entries
 * Returns a getProfile function that checks both batch and individual cache
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

  // Helper to get a profile, checking both batch result and individual cache
  const getProfile = useCallback((pubkey: string): Profile | undefined => {
    // First check batch result
    const fromBatch = query.data?.get(pubkey);
    if (fromBatch) return fromBatch;

    // Fall back to individual cache (may have been fetched by useProfile)
    return queryClient.getQueryData<Profile>(['profile', pubkey, relayKey]) ?? undefined;
  }, [query.data, queryClient, relayKey]);

  return { ...query, getProfile };
}

/**
 * Hook to fetch a single profile by pubkey
 * Checks individual cache first (populated by useProfiles batch fetches)
 * Also updates batch query caches so feed panels re-render with the new profile
 */
export function useProfile(pubkey: string | null, relays: string[]) {
  const queryClient = useQueryClient();
  const relayKey = relays.join('|');

  const query = useQuery({
    queryKey: ['profile', pubkey, relayKey],
    queryFn: async () => {
      const profiles = await fetchProfiles([pubkey!], relays);
      return profiles.get(pubkey!) || null;
    },
    enabled: !!pubkey && relayKey.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // When a profile is fetched, update any batch queries that include this pubkey
  useEffect(() => {
    if (query.data && pubkey) {
      // Find and update all batch queries that might include this pubkey
      const queries = queryClient.getQueriesData<Map<string, Profile>>({
        queryKey: ['profiles', relayKey],
      });

      for (const [queryKey, data] of queries) {
        if (data && !data.has(pubkey)) {
          // Update the batch Map with the new profile
          const updatedMap = new Map(data);
          updatedMap.set(pubkey, query.data);
          queryClient.setQueryData(queryKey, updatedMap);
        }
      }
    }
  }, [query.data, pubkey, queryClient, relayKey]);

  return query;
}
