import { useEffect, useState } from "react";

/**
 * Returns a debounced value that only updates after the delay has passed
 * without changes to the input value.
 * @param {any} value
 * @param {number} delay
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
