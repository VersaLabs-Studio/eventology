/**
 * Eventology Mobile — useDebounce
 * Delays propagating a value until `delay` milliseconds have passed
 * since the last change. Standard `setTimeout`/`clearTimeout` pattern
 * with strict cleanup on unmount and on every value change.
 */
import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => {
      clearTimeout(handle);
    };
  }, [value, delay]);

  return debounced;
}
