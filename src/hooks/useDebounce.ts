import { useEffect, useState } from 'react'

/**
 * Egyszerű debounce hook – visszaadja a késleltetett értéket.
 * @param value A bemeneti érték (string, szám, objektum stb.)
 * @param delay Idő ms-ben (alapértelmezett: 300ms)
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debounced
} 