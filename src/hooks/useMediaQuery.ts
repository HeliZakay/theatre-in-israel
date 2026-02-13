import { useEffect, useSyncExternalStore } from "react";

/**
 * Returns whether the viewport is at or below the given breakpoint width.
 * SSR-safe: defaults to `false` on the server and resolves on the client.
 */
export function useMediaQuery(breakpointWidth: number): boolean {
  const subscribe = (callback: () => void) => {
    const mql = window.matchMedia(`(max-width: ${breakpointWidth}px)`);
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
  };

  const getSnapshot = () =>
    window.matchMedia(`(max-width: ${breakpointWidth}px)`).matches;

  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
