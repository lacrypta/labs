"use client";

import type { SignedEvent, UserSigner } from "./nostrSigner";

// NIP-78 parameterized replaceable event for arbitrary app data.
export const PROJECTS_KIND = 30078;
export const PROJECTS_D_TAG = "lacrypta.labs:projects:v1";

export type UserProject = {
  id: string;
  name: string;
  description?: string;
  url?: string;
  repo?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
};

export type ProjectsDoc = {
  projects: UserProject[];
  /** unix seconds of the event that holds this list, if any */
  eventCreatedAt?: number;
};

const CACHE_PREFIX = "labs:user-projects:";

export function getCachedProjects(pubkey: string): ProjectsDoc | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + pubkey);
    if (!raw) return null;
    return JSON.parse(raw) as ProjectsDoc;
  } catch {
    return null;
  }
}

export function setCachedProjects(pubkey: string, doc: ProjectsDoc) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_PREFIX + pubkey, JSON.stringify(doc));
  } catch {
    /* quota */
  }
}

export const DEFAULT_PROJECT_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.primal.net",
  "wss://relay.nostr.band",
  "wss://nos.lol",
];

function parseList(content: string): UserProject[] {
  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p) => p && typeof p === "object" && typeof p.name === "string")
      .map((p) => ({
        id: String(p.id ?? crypto.randomUUID()),
        name: String(p.name),
        description: p.description ? String(p.description) : undefined,
        url: p.url ? String(p.url) : undefined,
        repo: p.repo ? String(p.repo) : undefined,
        tags: Array.isArray(p.tags)
          ? p.tags.map((t: unknown) => String(t))
          : undefined,
        createdAt: Number(p.createdAt ?? Math.floor(Date.now() / 1000)),
        updatedAt: Number(p.updatedAt ?? Math.floor(Date.now() / 1000)),
      }));
  } catch {
    return [];
  }
}

export async function fetchUserProjects(
  pubkey: string,
  relays: string[] = DEFAULT_PROJECT_RELAYS,
  timeoutMs = 4000,
): Promise<ProjectsDoc> {
  const cached = getCachedProjects(pubkey);

  const { SimplePool } = await import("nostr-tools/pool");
  const pool = new SimplePool();
  const events: { content: string; created_at: number }[] = [];

  const closer = pool.subscribe(
    relays,
    {
      kinds: [PROJECTS_KIND],
      authors: [pubkey],
      "#d": [PROJECTS_D_TAG],
    },
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

  // No event from any relay: keep whatever is cached.
  if (!latest) {
    return cached ?? { projects: [] };
  }

  // Cache is equal or newer: don't overwrite with potentially stale relay data.
  if (cached?.eventCreatedAt && cached.eventCreatedAt >= latest.created_at) {
    return cached;
  }

  const doc: ProjectsDoc = {
    projects: parseList(latest.content),
    eventCreatedAt: latest.created_at,
  };
  setCachedProjects(pubkey, doc);
  return doc;
}

export type RelayResult = {
  relay: string;
  ok: boolean;
  error?: string;
};

export type PublishPhase = "signing" | "publishing" | "done";

export type PublishResult = {
  signed: SignedEvent;
  relays: RelayResult[];
};

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label} (${ms}ms)`)), ms),
    ),
  ]);
}

export async function publishUserProjects(
  signer: UserSigner,
  projects: UserProject[],
  relays: string[] = DEFAULT_PROJECT_RELAYS,
  opts?: {
    signTimeoutMs?: number;
    publishTimeoutMs?: number;
    onPhase?: (phase: PublishPhase, detail?: string) => void;
  },
): Promise<PublishResult> {
  const {
    signTimeoutMs = 30_000,
    publishTimeoutMs = 8_000,
    onPhase,
  } = opts ?? {};

  const event = {
    kind: PROJECTS_KIND,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["d", PROJECTS_D_TAG],
      ["client", "La Crypta Labs"],
    ],
    content: JSON.stringify(projects),
    pubkey: signer.pubkey,
  };

  onPhase?.("signing");
  console.log("[labs] signing event…", event);
  const signed = await withTimeout(
    signer.signEvent(event),
    signTimeoutMs,
    "esperando firma",
  );
  console.log("[labs] event signed", { id: signed.id, pubkey: signed.pubkey });

  if (signed.pubkey !== signer.pubkey) {
    throw new Error(
      `El firmante devolvió una pubkey distinta (esperada ${signer.pubkey.slice(0, 10)}…, recibida ${signed.pubkey.slice(0, 10)}…).`,
    );
  }

  const { SimplePool } = await import("nostr-tools/pool");
  const pool = new SimplePool();

  onPhase?.("publishing", `${relays.length} relays`);
  console.log("[labs] publishing to", relays);

  const publishPromises = pool.publish(relays, signed);
  const relayResults: RelayResult[] = await Promise.all(
    publishPromises.map(async (p, i) => {
      const relay = relays[i];
      try {
        await withTimeout(p, publishTimeoutMs, `${relay}`);
        console.log("[labs] relay accepted", relay);
        return { relay, ok: true };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn("[labs] relay failed", relay, msg);
        return { relay, ok: false, error: msg };
      }
    }),
  );

  try {
    pool.close(relays);
  } catch {
    /* noop */
  }

  const okCount = relayResults.filter((r) => r.ok).length;
  onPhase?.(
    "done",
    `${okCount}/${relayResults.length} relays`,
  );

  if (okCount === 0) {
    const detail = relayResults
      .map((r) => `${r.relay}: ${r.error ?? "sin respuesta"}`)
      .join("\n");
    const err = new Error(
      `Ningún relay aceptó el evento.\n${detail}`,
    );
    (err as Error & { relayResults: RelayResult[] }).relayResults = relayResults;
    throw err;
  }

  setCachedProjects(signer.pubkey, {
    projects,
    eventCreatedAt: signed.created_at,
  });

  return { signed, relays: relayResults };
}
