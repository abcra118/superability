'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useJourneys } from '@/hooks/useJourneys';
import { useRealtime } from '@/hooks/useRealtime';
import { JourneyOption, TripResult, TransferResult } from '@/data/gtfs';
import { JourneyCard } from '@/components/JourneyCard';
import { AlertBanners } from '@/components/AlertBanner';
import { useJourneyStore } from '@/stores/journeyStore';

export default function ResultsPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const from    = searchParams.get('from')     || 'Origin';
  const fromId  = searchParams.get('fromId');
  const to      = searchParams.get('to')       || 'Destination';
  const toId    = searchParams.get('toId');
  const time    = searchParams.get('time');
  const date    = searchParams.get('date');
  const isArrival = searchParams.get('isArrival') === 'true';

  const { journeys, loading, error } = useJourneys({ originId: fromId, destId: toId, time, date, isArrival });

  const tripIds = journeys.flatMap((j: JourneyOption) =>
    j.isTransfer ? [j.leg1_trip_id, j.leg2_trip_id].filter(Boolean) as string[] : [(j as TripResult).trip_id]
  );
  const { updates, alerts, loading: rtLoading } = useRealtime(loading ? [] : tripIds);

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const setJourney = useJourneyStore(s => s.setJourney);

  const handleSelect = (j: JourneyOption) => {
    setJourney(j, from, to);
    router.push('/journey');
  };

  return (
    <main className="max-w-xl mx-auto px-6 py-12 min-h-screen bg-slate-50">
      <header className="mb-10">
        <button
          className="mb-6 font-black text-brand-blue uppercase tracking-widest text-xs"
          onClick={() => router.back()}
        >
          ← Refine Search
        </button>
        <h1 className="text-4xl font-black text-slate-900">Recommended Journeys</h1>
        <p className="text-slate-500 font-bold mt-2">{from} → {to}</p>
        {isArrival && <p className="text-xs font-black text-amber-600 uppercase mt-1 tracking-widest">Arriving By {time}</p>}
      </header>

      <AlertBanners alerts={alerts} dismissed={dismissed} onDismiss={id => setDismissed(prev => new Set([...prev, id]))} />

      {loading ? (
        <div className="py-20 text-center animate-pulse">
          <p className="text-2xl font-black text-slate-300">Searching Network...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-2 border-red-200 text-red-800 p-6 rounded-2xl">
          <p className="font-black">Search Failed</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : journeys.length > 0 ? (
        <div className="space-y-5">
          {journeys.map((j: JourneyOption, i: number) => (
            <JourneyCard
              key={i}
              journey={j}
              toName={to}
              updates={updates}
              rtLoading={rtLoading}
              onClick={() => handleSelect(j)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[2.5rem] border-2 border-slate-100 text-center">
          <p className="text-xl font-bold text-slate-400">No journeys found. Try another time?</p>
        </div>
      )}
    </main>
  );
}
