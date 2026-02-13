import { useEffect, type RefObject } from "react";

/**
 * Observes an element's height and writes it to the CSS custom property
 * `--header-offset` on the document root. Cleans up on unmount.
 */
export function useHeaderOffset(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const root = document.documentElement;

    const update = () => {
      const height = Math.ceil(el.getBoundingClientRect().height);
      if (height > 0) {
        root.style.setProperty("--header-offset", `${height}px`);
      }
    };

    update();

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    observer?.observe(el);
    window.addEventListener("orientationchange", update);
    window.addEventListener("resize", update);

    return () => {
      observer?.disconnect();
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("resize", update);
    };
  }, [ref]);
}
