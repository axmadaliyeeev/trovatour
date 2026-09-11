import { useState, useEffect } from "react";

interface Breakpoint {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const QUERIES = {
  mobile:  "(max-width: 639px)",
  tablet:  "(min-width: 640px) and (max-width: 1023px)",
  desktop: "(min-width: 1024px)",
} as const;

// Read synchronously so the FIRST render already knows the real viewport.
// The previous version started every field at `false` and only corrected
// itself in an effect — meaning MainLayout rendered its MOBILE branch
// (bottom nav, h-dvh, no sidebar) for one frame on every desktop page
// load, then threw that entire tree away and remounted the desktop one.
// That is a visible flash plus a full unmount/remount of the routed page
// on every hard navigation, and it also re-ran every page-level effect
// twice. matchMedia is available in every browser this app targets;
// the typeof guard is only there so the module stays import-safe.
function read(): Breakpoint {
  if (typeof window === "undefined" || !window.matchMedia) {
    return { isMobile: false, isTablet: false, isDesktop: true };
  }
  return {
    isMobile:  window.matchMedia(QUERIES.mobile).matches,
    isTablet:  window.matchMedia(QUERIES.tablet).matches,
    isDesktop: window.matchMedia(QUERIES.desktop).matches,
  };
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(read);

  useEffect(() => {
    if (!window.matchMedia) return;

    // matchMedia fires only when a threshold is actually CROSSED, so a
    // window drag inside one breakpoint costs zero re-renders — the old
    // resize listener re-rendered every consumer on every settled drag
    // regardless of whether the breakpoint had changed at all, which is
    // why it needed a debounce to be tolerable in the first place.
    const lists = Object.values(QUERIES).map((q) => window.matchMedia(q));
    const onChange = () => setBp(read());
    lists.forEach((l) => l.addEventListener("change", onChange));

    // The viewport can differ from the initial read if the browser
    // restored a different window size between module eval and mount.
    onChange();

    return () => lists.forEach((l) => l.removeEventListener("change", onChange));
  }, []);

  return bp;
}
