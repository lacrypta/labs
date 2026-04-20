"use client";

import { useEffect, useState } from "react";

export type AuthMethod = "nip07" | "nip46";

export type Auth = {
  method: AuthMethod;
  pubkey: string;
  bunker?: {
    pubkey?: string;
    relays: string[];
    /** one-time auth secret from nostrconnect:// URI or bunker:// URL */
    secret?: string | null;
  };
  clientSecret?: number[];
};

const STORAGE_KEY = "labs:auth";
const EVENT = "labs:auth:changed";

export function getAuth(): Auth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Auth;
  } catch {
    return null;
  }
}

export function setAuth(auth: Auth) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* quota */
  }
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useAuth(): { auth: Auth | null; ready: boolean } {
  const [auth, setState] = useState<Auth | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(getAuth());
    setReady(true);
    const onChange = () => setState(getAuth());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return { auth, ready };
}
