import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "./api";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Lightweight hook that fetches from the FastAPI backend via apiFetch.
 * Automatically attaches a JWT Bearer token obtained via Better Auth's JWT plugin.
 *
 * @param path  - API path, e.g. "/expenses?page=1&page_size=5"
 * @param deps  - Extra dependencies that should trigger a re-fetch (default [])
 */
export function useApi<T>(path: string, deps: unknown[] = []): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch(path)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.detail ?? `API error ${res.status}`);
        }
        const json = await res.json();
        if (!cancelled) setData(json);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tick, ...deps]);

  return { data, loading, error, refetch };
}
