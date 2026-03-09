'use client';

import { useEffect, useState, useRef } from 'react';
import { GtfsStop } from '@/data/gtfs';

export function useStopSearch(query: string, enabled: boolean) {
  const [results, setResults] = useState<GtfsStop[]>([]);
  const [searching, setSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || query.length < 3) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setSearching(true);
      try {
        const res = await fetch(`/api/stops?q=${encodeURIComponent(query)}`, {
          signal: abortRef.current.signal,
        });
        if (res.ok) setResults(await res.json());
      } catch (e: any) {
        if (e.name !== 'AbortError') console.error(e);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => { clearTimeout(timer); abortRef.current?.abort(); };
  }, [query, enabled]);

  return { results, searching };
}
