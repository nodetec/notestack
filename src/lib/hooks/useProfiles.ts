'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchProfiles, type Profile } from '@/lib/nostr/profiles';

// Session-scoped negative cache: pubkeys confirmed to have no profile.
const missingProfilePubkeys = new Set<string>();

/**
 * Hook to fetch profiles for a list of pubkeys
 * Uses React Query for caching and populates individual profile cache entries
 * Returns a getProfile function that checks both batch and individual cache
 */
export function useProfiles(pubkeys: string[]) {
  const queryClient = useQueryClient();
  const uniquePubkeys = [...new Set(pubkeys)];
  const sortedPubkeys = [...uniquePubkeys].sort();

  const query = useQuery({
    queryKey: ['profiles', sortedPubkeys.join(',')],
    queryFn: async () => {
      if (sortedPubkeys.length === 0) return new Map<string, Profile>();

      const mergedProfiles = new Map<string, Profile>();
      const missingPubkeys: string[] = [];

      // Reuse already-cached individual profiles and only fetch missing pubkeys.
      for (const pubkey of sortedPubkeys) {
        if (missingProfilePubkeys.has(pubkey)) {
          continue;
        }

        const cachedProfile = queryClient.getQueryData<Profile | null>(['profile', pubkey]);
        if (cachedProfile !== undefined) {
          if (cachedProfile !== null) {
            mergedProfiles.set(pubkey, cachedProfile);
          }
        } else {
          missingPubkeys.push(pubkey);
        }
      }

      if (missingPubkeys.length > 0) {
        const fetchedProfiles = await fetchProfiles(missingPubkeys);
        for (const pubkey of missingPubkeys) {
          const profile = fetchedProfiles.get(pubkey) ?? null;
          queryClient.setQueryData<Profile | null>(['profile', pubkey], profile);

          if (profile) {
            missingProfilePubkeys.delete(pubkey);
            mergedProfiles.set(pubkey, profile);
          } else {
            missingProfilePubkeys.add(pubkey);
          }
        }
      }

      return mergedProfiles;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData, // Keep previous profiles while loading new ones
    enabled: uniquePubkeys.length > 0,
  });

  // Populate individual profile cache entries after batch fetch completes
  useEffect(() => {
    if (query.data) {
      for (const [pk, profile] of query.data) {
        queryClient.setQueryData(['profile', pk], profile);
      }
    }
  }, [query.data, queryClient]);

  // Helper to get a profile, checking both batch result and individual cache
  const getProfile = useCallback((pubkey: string): Profile | undefined => {
    // First check batch result
    const fromBatch = query.data?.get(pubkey);
    if (fromBatch) return fromBatch;

    // Fall back to individual cache (may have been fetched by useProfile)
    const cached = queryClient.getQueryData<Profile | null>(['profile', pubkey]);
    return cached ?? undefined;
  }, [query.data, queryClient]);

  const pendingPubkeys = useMemo(() => {
    const pending = new Set<string>();
    if (!query.isFetching) return pending;

    for (const pubkey of sortedPubkeys) {
      if (query.data?.has(pubkey)) continue;
      if (missingProfilePubkeys.has(pubkey)) continue;

      const cached = queryClient.getQueryData<Profile | null>(['profile', pubkey]);
      if (cached === undefined) {
        pending.add(pubkey);
      }
    }

    return pending;
  }, [query.isFetching, query.data, queryClient, sortedPubkeys]);

  const isProfilePending = useCallback(
    (pubkey: string) => pendingPubkeys.has(pubkey),
    [pendingPubkeys],
  );

  const isInitialLoading = query.isPending && !query.data;

  return { ...query, isInitialLoading, isProfilePending, getProfile };
}

/**
 * Hook to fetch a single profile by pubkey
 * Checks individual cache first (populated by useProfiles batch fetches)
 * Also updates batch query caches so feed panels re-render with the new profile
 */
export function useProfile(pubkey: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['profile', pubkey],
    queryFn: async () => {
      if (!pubkey) return null;
      if (missingProfilePubkeys.has(pubkey)) return null;

      const profiles = await fetchProfiles([pubkey]);
      const profile = profiles.get(pubkey) || null;
      if (profile) {
        missingProfilePubkeys.delete(pubkey);
      } else {
        missingProfilePubkeys.add(pubkey);
      }
      return profile;
    },
    enabled: !!pubkey,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // When a profile is fetched, update any batch queries that include this pubkey
  useEffect(() => {
    if (query.data && pubkey) {
      // Find and update all batch queries that might include this pubkey
      const queries = queryClient.getQueriesData<Map<string, Profile>>({
        queryKey: ['profiles'],
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
  }, [query.data, pubkey, queryClient]);

  return query;
}
