import { useEffect, useMemo, useState } from 'react';
import { fetchInteractionCounts, type InteractionCounts } from '@/lib/nostr/fetch';

const countCache = new Map<string, InteractionCounts>();
const loadingIds = new Set<string>();
const queuedIds = new Set<string>();
const listeners = new Set<() => void>();

let flushTimer: ReturnType<typeof setTimeout> | null = null;

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function scheduleFlush() {
  if (flushTimer) return;

  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushQueuedIds();
  }, 0);
}

async function flushQueuedIds() {
  const eventIds = Array.from(queuedIds);
  queuedIds.clear();

  if (eventIds.length === 0) return;

  try {
    const counts = await fetchInteractionCounts(eventIds);
    eventIds.forEach((eventId) => {
      countCache.set(eventId, counts.get(eventId) ?? { likeCount: 0, replyCount: 0 });
    });
  } catch {
    eventIds.forEach((eventId) => {
      if (!countCache.has(eventId)) {
        countCache.set(eventId, { likeCount: 0, replyCount: 0 });
      }
    });
  } finally {
    eventIds.forEach((eventId) => loadingIds.delete(eventId));
    notifyListeners();

    if (queuedIds.size > 0) {
      scheduleFlush();
    }
  }
}

function queueMissingCounts(eventIds: string[]) {
  let queuedAny = false;

  eventIds.forEach((eventId) => {
    if (!eventId || countCache.has(eventId) || loadingIds.has(eventId)) return;
    loadingIds.add(eventId);
    queuedIds.add(eventId);
    queuedAny = true;
  });

  if (!queuedAny) return;
  notifyListeners();
  scheduleFlush();
}

export function useInteractionCounts(eventIds: string[]) {
  const uniqueEventIds = useMemo(
    () => Array.from(new Set(eventIds.filter(Boolean))),
    [eventIds],
  );
  const eventIdsKey = useMemo(() => uniqueEventIds.join(','), [uniqueEventIds]);
  const [, setVersion] = useState(0);

  useEffect(() => subscribe(() => setVersion((version) => version + 1)), []);

  useEffect(() => {
    if (!eventIdsKey) return;
    queueMissingCounts(eventIdsKey.split(','));
  }, [eventIdsKey]);

  return useMemo(() => {
    return {
      getCounts: (eventId: string) => countCache.get(eventId),
      isLoading: (eventId: string) =>
        !!eventId && !countCache.has(eventId),
    };
  }, []);
}
