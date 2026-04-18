"use client";

import { useEffect } from "react";

let lockCount = 0;

function apply() {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  if (lockCount > 0) {
    const sbw = window.innerWidth - root.clientWidth;
    root.style.setProperty("--sbw", `${sbw}px`);
    root.dataset.scrollLock = "true";
  } else {
    root.removeAttribute("data-scroll-lock");
    root.style.removeProperty("--sbw");
  }
}

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lockCount += 1;
    apply();
    return () => {
      lockCount = Math.max(0, lockCount - 1);
      apply();
    };
  }, [active]);
}
