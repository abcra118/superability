'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { findJourneys, JourneyOption, TripResult, TransferResult } from '@/data/gtfs';

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || 'Origin';
  const fromId = searchParams.get('fromId');
  const to = searchParams.get('to') || 'Destination';
  const toId = searchParams.get('toId');
  const time = searchParams.get('time');
  const dateStr = searchParams.get('date');
  const isArrival = searchParams.get('isArrival') === 'true';

  const [journeys, setJourneys] = useState<JourneyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadJourneys() {
      if (fromId && toId) {
        setLoading(true); setError(null);
        try {
          const results = await findJourneys(fromId, toId, time || undefined, isArrival, dateStr || undefined);
          setJourneys(results);
        } catch (err: any) {
          setError(err.message || "Failed to find journeys.");
        } finally {
          setLoading(false);
        }
      }
    }
    loadJourneys();
  }, [fromId, toId, time, dateStr, isArrival]);

  const handleSelectJourney = (j: JourneyOption) => {
    const q = new URLSearchParams({ from, to });
    if (j.isTransfer) {
      const t = j as TransferResult;
      q.set('type', 'transfer');
      q.set('leg1_trip_id', t.leg1_trip_id);
      q.set('leg1_route', t.leg1_route);
      q.set('leg1_headsign', t.leg1_headsign);
      q.set('leg1_platform', t.leg1_platform);
      q.set('leg1_departure', t.leg1_departure);
      q.set('leg1_arrival', t.leg1_arrival);
      q.set('leg1_intermediates', JSON.stringify(t.leg1_intermediate_stops || []));
      q.set('transfer_hub', t.transfer_hub_name);
      q.set('transfer_pf_from', t.transfer_platform_from);
      q.set('transfer_pf_to', t.transfer_platform_to);
      q.set('transfer_mins', t.transfer_walk_mins.toString());
      q.set('transfer_notes', t.transfer_notes || '');
      q.set('leg2_trip_id', t.leg2_trip_id);
      q.set('leg2_route', t.leg2_route);
      q.set('leg2_headsign', t.leg2_headsign);
      q.set('leg2_platform', t.leg2_platform);
      q.set('leg2_departure', t.leg2_departure);
      q.set('leg2_arrival', t.leg2_arrival);
      q.set('leg2_intermediates', JSON.stringify(t.leg2_intermediate_stops || []));
    } else {
      const d = j as TripResult;
      q.set('type', 'direct');
      q.set('tripId', d.trip_id);
      q.set('route', d.route_long_name);
      q.set('headsign', d.trip_headsign || d.route_long_name);
      q.set('platform', d.origin_platform || 'TBA');
      q.set('dest_platform', d.dest_platform || 'TBA');
      q.set('departure_time', d.origin_departure);
      q.set('intermediates', JSON.stringify(d.intermediate_stops || []));
    }
    router.push(`/journey?${q.toString()}`);
  };

  return (
    <main className="max-w-xl mx-auto px-6 py-12 min-h-screen bg-slate-50">
      <header className="mb-10">
        <button className="mb-6 font-black text-brand-blue uppercase tracking-widest text-xs flex items-center" onClick={() => router.push('/')}>
          ← Refine Search
        </button>
        <h1 className="text-4xl font-black text-slate-900 leading-tight">Recommended Journeys</h1>
        <p className="text-slate-500 font-bold mt-2">{from} to {to}</p>
        {isArrival && <p className="text-xs font-black text-amber-600 uppercase mt-1 tracking-widest">Arriving By {time}</p>}
      </header>

      {loading ? (
        <div className="py-20 text-center animate-pulse">
           <p className="text-2xl font-black text-slate-300">Searching Network...</p>
        </div>
      ) : journeys.length > 0 ? (
        <div className="space-y-6">
          {journeys.map((j, i) => (
            <button 
              key={i} 
              className="w-full text-left bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:border-brand-blue hover:shadow-xl transition-all"
              onClick={() => handleSelectJourney(j)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                   {j.isTransfer && <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-1 rounded-lg mb-2 inline-block">1 Change Required</span>}
                   <h2 className="text-2xl font-black text-slate-900">
                     {j.isTransfer ? (j as TransferResult).leg1_headsign : (j as TripResult).trip_headsign}
                   </h2>
                </div>
                <div className="text-right">
                   <p className="text-2xl font-black text-brand-blue">
                     {j.isTransfer ? (j as TransferResult).leg1_departure.substring(0,5) : (j as TripResult).origin_departure.substring(0,5)}
                   </p>
                   <p className="text-[10px] font-black text-slate-400 uppercase">Departure</p>
                </div>
              </div>

              <div className="flex items-center gap-4 py-4 border-y border-slate-50">
                <div className="flex-1">
                   {j.isTransfer ? (
                     <p className="text-sm font-bold text-slate-600">
                       Change at <span className="text-slate-900">{(j as TransferResult).transfer_hub_name}</span>
                     </p>
                   ) : (
                     <p className="text-sm font-bold text-slate-600">
                       Direct to <span className="text-slate-900">{to}</span>
                     </p>
                   )}
                </div>
                <div className="text-right">
                   <p className="text-sm font-black text-slate-900 leading-none">
                     {j.isTransfer ? (j as TransferResult).overall_arrival.substring(0,5) : (j as TripResult).dest_arrival.substring(0,5)}
                   </p>
                   <p className="text-[10px] font-black text-slate-400 uppercase">Arrival</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[2.5rem] border-2 border-slate-100 text-center">
          <p className="text-xl font-bold text-slate-400">No journeys found. Try another time?</p>
          <p className="text-xs text-slate-300 mt-4 italic">Tip: Arriving by 1:30pm might be too early for some services.</p>
        </div>
      )}
    </main>
  );
}
