'use client';

import { useEffect, useState } from 'react';
import { JourneyOption } from '@/data/gtfs';

interface UseJourneysParams {
  originId: string | null;
  destId: string | null;
  time?: string | null;
  date?: string | null;
  isArrival?: boolean;
}

export function useJourneys({ originId, destId, time, date, isArrival }: UseJourneysParams) {
  const [journeys, setJourneys] = useState<JourneyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!originId || !destId) return;

    const params = new URLSearchParams({ originId, destId });
    if (time)     params.set('time', time);
    if (date)     params.set('date', date);
    if (isArrival) params.set('isArrival', 'true');

    let cancelled = false;
    setTimeout(() => setLoading(true), 0);
    setError(null);

    fetch(`/api/journeys?${params}`)
      .then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.error || 'Search failed'); });
        return r.json();
      })
      .then(data => { if (!cancelled) setJourneys(data); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [originId, destId, time, date, isArrival]);

  return { journeys, loading, error };
}
