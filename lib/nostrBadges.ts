"use client";

import { useEffect, useState } from "react";

/* NIP-58 Badges
 *   kind 30009  Badge Definition (parameterized replaceable)
 *   kind 8      Badge Award
 *
 * Fetches every award (kind 8) targeting the user (#p:[pubkey]) and
 * resolves each award's referenced badge definition (an `a` tag shaped
 * like `30009:<issuer>:<d>`).
 */

export type BadgeDefinition = {
  issuer: string; // pubkey
  d: string;
  name?: string;
  description?: string;
  image?: string;
  thumb?: string;
};

export type AwardedBadge = {
  awardId: string;
  issuer: string;
  /** aTag = `30009:<issuer>:<d>` */
  aTag: string;
  awardedAt: number;
  definition?: BadgeDefinition;
};

const CACHE_PREFIX = "labs:badges:";
const TTL_MS = 6 * 60 * 60 * 1000;

export const DEFAULT_BADGE_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.primal.net",
  "wss://relay.nostr.band",
  "wss://nos.lol",
  "wss://relay.snort.social",
  "wss://nostr.wine",
];

type IncomingEvent = {
  id: string;
  pubkey: string;
  kind: number;
  content: string;
  tags: string[][];
  created_at: number;
};

type Cached = {
  fetchedAt: number;
  badges: AwardedBadge[];
};

function getCache(pubkey: string): Cached | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + pubkey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached;
    if (Date.now() - parsed.fetchedAt > TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function setCache(pubkey: string, badges: AwardedBadge[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CACHE_PREFIX + pubkey,
      JSON.stringify({ fetchedAt: Date.now(), badges } satisfies Cached),
    );
  } catch {
    /* quota */
  }
}

function parseDefinitionEvent(ev: IncomingEvent): BadgeDefinition | null {
  if (ev.kind !== 30009) return null;
  const d = ev.tags.find((t) => t[0] === "d")?.[1];
  if (!d) return null;
  const tagVal = (name: string) =>
    ev.tags.find((t) => t[0] === name)?.[1] ?? undefined;
  return {
    issuer: ev.pubkey,
    d,
    name: tagVal("name"),
    description: tagVal("description"),
    image: tagVal("image"),
    thumb: tagVal("thumb") ?? tagVal("image"),
  };
}

export async function fetchUserBadges(
  pubkey: string,
  relays: string[] = DEFAULT_BADGE_RELAYS,
  timeoutMs = 5000,
): Promise<AwardedBadge[]> {
  const { SimplePool } = await import("nostr-tools/pool");
  const pool = new SimplePool();

  // 1) Gather all award events addressed to the user.
  const awards: IncomingEvent[] = [];
  const awardCloser = pool.subscribe(
    relays,
    { kinds: [8], "#p": [pubkey] },
    {
      onevent(ev: IncomingEvent) {
        awards.push(ev);
      },
      oneose() {
        awardCloser.close();
      },
    },
  );
  await new Promise((r) => setTimeout(r, timeoutMs));
  awardCloser.close();

  if (awards.length === 0) {
    try {
      pool.close(relays);
    } catch {
      /* noop */
    }
    setCache(pubkey, []);
    return [];
  }

  // 2) Extract unique (issuer, d) pairs from the awards' `a` tags.
  type Key = { issuer: string; d: string };
  const needed = new Map<string, Key>();
  const awardMeta: {
    event: IncomingEvent;
    aTag: string;
    key: Key;
  }[] = [];
  for (const ev of awards) {
    const aTag = ev.tags.find((t) => t[0] === "a")?.[1];
    if (!aTag) continue;
    const parts = aTag.split(":");
    if (parts.length < 3 || parts[0] !== "30009") continue;
    const key: Key = { issuer: parts[1], d: parts.slice(2).join(":") };
    needed.set(`${key.issuer}|${key.d}`, key);
    awardMeta.push({ event: ev, aTag, key });
  }

  if (needed.size === 0) {
    try {
      pool.close(relays);
    } catch {
      /* noop */
    }
    setCache(pubkey, []);
    return [];
  }

  // 3) Fetch all referenced badge definitions.
  const issuers = [...new Set([...needed.values()].map((k) => k.issuer))];
  const ds = [...new Set([...needed.values()].map((k) => k.d))];
  const defs = new Map<string, BadgeDefinition>();
  const defCloser = pool.subscribe(
    relays,
    { kinds: [30009], authors: issuers, "#d": ds },
    {
      onevent(ev: IncomingEvent) {
        const def = parseDefinitionEvent(ev);
        if (def) {
          const k = `${def.issuer}|${def.d}`;
          const prev = defs.get(k);
          // keep newest if multiple copies come in
          if (!prev) defs.set(k, def);
        }
      },
      oneose() {
        defCloser.close();
      },
    },
  );
  await new Promise((r) => setTimeout(r, timeoutMs));
  defCloser.close();
  try {
    pool.close(relays);
  } catch {
    /* noop */
  }

  // 4) Merge + dedupe (only keep the latest award per (issuer, d)).
  const byBadge = new Map<string, AwardedBadge>();
  for (const { event, aTag, key } of awardMeta) {
    const mapKey = `${key.issuer}|${key.d}`;
    const existing = byBadge.get(mapKey);
    if (existing && existing.awardedAt >= event.created_at) continue;
    byBadge.set(mapKey, {
      awardId: event.id,
      issuer: key.issuer,
      aTag,
      awardedAt: event.created_at,
      definition: defs.get(mapKey),
    });
  }

  const result = [...byBadge.values()]
    // Only return badges whose definition we could resolve (the rest are broken refs).
    .filter((b) => b.definition)
    .sort((a, b) => b.awardedAt - a.awardedAt);

  setCache(pubkey, result);
  return result;
}

export function useUserBadges(
  pubkey: string | null | undefined,
  relays?: string[],
) {
  const [badges, setBadges] = useState<AwardedBadge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCache, setHasCache] = useState(false);

  useEffect(() => {
    if (!pubkey) {
      setBadges([]);
      setHasCache(false);
      return;
    }
    const cached = getCache(pubkey);
    if (cached) {
      setBadges(cached.badges);
      setHasCache(true);
    } else {
      setBadges([]);
      setHasCache(false);
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchUserBadges(pubkey, relays)
      .then((fresh) => {
        if (cancelled) return;
        setBadges(fresh);
        setHasCache(true);
      })
      .catch((e) => {
        if (cancelled) return;
        console.warn("[labs:badges] fetch failed", e);
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubkey, relays?.join(",")]);

  return { badges, loading, error, hasCache };
}
