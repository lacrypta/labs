"use client";

import { useEffect, useState } from "react";

export type NostrProfile = {
  name?: string;
  display_name?: string;
  picture?: string;
  banner?: string;
  about?: string;
  nip05?: string;
  lud16?: string;
  website?: string;
};

export type CachedProfile = {
  pubkey: string;
  profile: NostrProfile;
  fetchedAt: number;
  eventCreatedAt: number;
  relaysUsed: string[];
};

const CACHE_PREFIX = "labs:profile:";
// Serve from cache up to 24h even if stale
const HARD_TTL_MS = 24 * 60 * 60 * 1000;
// Consider entries older than 30 min as stale and refresh in the background
const STALE_MS = 30 * 60 * 1000;
const EVENT = "labs:profile:changed";

export const DEFAULT_PROFILE_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.primal.net",
  "wss://relay.nostr.band",
  "wss://nos.lol",
  "wss://relay.snort.social",
];

export function getCachedProfile(pubkey: string): CachedProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + pubkey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedProfile;
    if (Date.now() - parsed.fetchedAt > HARD_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function setCachedProfile(cached: CachedProfile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CACHE_PREFIX + cached.pubkey,
      JSON.stringify(cached),
    );
    window.dispatchEvent(
      new CustomEvent(EVENT, { detail: { pubkey: cached.pubkey } }),
    );
  } catch {
    /* quota */
  }
}

export async function fetchNostrProfile(
  pubkey: string,
  relays: string[] = DEFAULT_PROFILE_RELAYS,
  timeoutMs = 4000,
): Promise<CachedProfile | null> {
  const { SimplePool } = await import("nostr-tools/pool");
  const pool = new SimplePool();
  const events: { content: string; created_at: number }[] = [];

  const closer = pool.subscribe(
    relays,
    { kinds: [0], authors: [pubkey] },
    {
      onevent(ev: { content: string; created_at: number }) {
        events.push(ev);
      },
      oneose() {
        closer.close();
      },
    },
  );

  await new Promise((r) => setTimeout(r, timeoutMs));
  closer.close();

  events.sort((a, b) => b.created_at - a.created_at);
  const latest = events[0];
  if (!latest) return null;

  try {
    const parsed = JSON.parse(latest.content);
    const cached: CachedProfile = {
      pubkey,
      profile: {
        name: parsed.name,
        display_name: parsed.display_name ?? parsed.displayName,
        picture: parsed.picture,
        banner: parsed.banner,
        about: parsed.about,
        nip05: parsed.nip05,
        lud16: parsed.lud16,
        website: parsed.website,
      },
      fetchedAt: Date.now(),
      eventCreatedAt: latest.created_at,
      relaysUsed: relays,
    };
    setCachedProfile(cached);
    return cached;
  } catch {
    return null;
  }
}

export function useNostrProfile(
  pubkey: string | null | undefined,
  relays?: string[],
) {
  const [cached, setCached] = useState<CachedProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Hydrate from cache once on client
  useEffect(() => {
    if (!pubkey) {
      setCached(null);
      return;
    }
    setCached(getCachedProfile(pubkey));
  }, [pubkey]);

  // Subscribe to cache updates from other hook instances
  useEffect(() => {
    if (!pubkey) return;
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<{ pubkey?: string }>).detail;
      if (!detail || detail.pubkey === pubkey) {
        setCached(getCachedProfile(pubkey));
      }
    };
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [pubkey]);

  // Refresh if stale or missing
  useEffect(() => {
    if (!pubkey) return;
    const existing = getCachedProfile(pubkey);
    const isFresh = existing && Date.now() - existing.fetchedAt < STALE_MS;
    if (isFresh) return;

    let cancelled = false;
    setLoading(true);
    fetchNostrProfile(pubkey, relays)
      .then((fresh) => {
        if (!cancelled && fresh) setCached(fresh);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubkey, relays?.join(",")]);

  return {
    profile: cached?.profile ?? null,
    cached,
    loading,
    /** true if we have any cached data, even if stale */
    hasCache: !!cached,
  };
}
