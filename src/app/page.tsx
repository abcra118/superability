'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GtfsStop } from '@/data/gtfs';
import { StationSearch } from '@/components/StationSearch';

export default function HomePage() {
  const router   = useRouter();
  const [origin,      setOrigin]      = useState('');
  const [destination, setDestination] = useState('');
  const [originId,    setOriginId]    = useState<string | null>(null);
  const [destId,      setDestId]      = useState<string | null>(null);
  const [time,        setTime]        = useState('');
  const [date,        setDate]        = useState('');
  const [isArrival,   setIsArrival]   = useState(false);

  useEffect(() => {
    const now   = new Date();
    const hh    = now.getHours().toString().padStart(2, '0');
    const mm    = now.getMinutes().toString().padStart(2, '0');
    const yyyy  = now.getFullYear();
    const mo    = (now.getMonth() + 1).toString().padStart(2, '0');
    const dd    = now.getDate().toString().padStart(2, '0');
    setTime(`${hh}:${mm}`);
    setDate(`${yyyy}-${mo}-${dd}`);
  }, []);

  const handleSearch = () => {
    if (!originId || !destId) return;
    const q = new URLSearchParams({ from: origin, fromId: originId, to: destination, toId: destId, time, date, isArrival: isArrival.toString() });
    router.push(`/results?${q}`);
  };

  const canSearch = Boolean(originId && destId);

  return (
    <main className="max-w-xl mx-auto px-6 pt-16 pb-24">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-black text-brand-blue-dark mb-3">Metro Guide</h1>
        <p className="text-lg text-slate-600 font-medium">The calm way to plan your Melbourne journey.</p>
      </header>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 space-y-8">
          <h2 className="text-2xl font-black text-slate-800 border-b border-slate-100 pb-4">Plan Your Journey</h2>

          <div className="space-y-6">
            <StationSearch
              id="origin"
              label="Starting Station"
              value={origin}
              selectedId={originId}
              onChange={v => { setOrigin(v); setOriginId(null); }}
              onSelect={(stop: GtfsStop) => { setOrigin(stop.stop_name); setOriginId(stop.stop_id); }}
            />
            <StationSearch
              id="destination"
              label="Finishing Station"
              value={destination}
              selectedId={destId}
              onChange={v => { setDestination(v); setDestId(null); }}
              onSelect={(stop: GtfsStop) => { setDestination(stop.stop_name); setDestId(stop.stop_id); }}
            />

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-xs font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">Date</label>
              <input id="date" type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full p-5 text-xl font-bold border-2 border-slate-200 rounded-2xl focus:border-brand-blue outline-none transition-all" />
            </div>

            {/* Time + Arrive/Depart toggle */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label htmlFor="time" className="block text-xs font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">
                  {isArrival ? 'Arrive By' : 'Depart At'}
                </label>
                <input id="time" type="time" value={time} onChange={e => setTime(e.target.value)}
                  className="w-full p-5 text-xl font-bold border-2 border-slate-200 rounded-2xl focus:border-brand-blue outline-none transition-all" />
              </div>
              <button
                onClick={() => setIsArrival(a => !a)}
                className={`p-5 rounded-2xl border-2 font-bold transition-all text-sm ${isArrival ? 'bg-brand-blue text-white border-brand-blue' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
              >
                {isArrival ? 'Arrive By' : 'Depart At'}
              </button>
            </div>

            <div className="pt-2">
              <button
                className={`w-full py-6 text-2xl font-black rounded-2xl transition-all shadow-lg ${!canSearch ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-brand-blue text-white hover:bg-brand-blue-dark active:scale-[0.98]'}`}
                onClick={handleSearch}
                disabled={!canSearch}
              >
                Find My Options
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-12 text-center opacity-50 space-y-1">
        <p className="font-bold text-slate-600">Accessible. Simple. Reliable.</p>
        <p className="text-xs text-slate-500">Based on latest PTV Transit Data</p>
      </footer>
    </main>
  );
}
