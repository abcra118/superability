'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { searchStops, GtfsStop } from '@/data/gtfs';

export default function TripPlanner() {
  const router = useRouter();
  
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originId, setOriginId] = useState<string | null>(null);
  const [destId, setDestId] = useState<string | null>(null);
  
  const [targetTime, setTargetTime] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [isArrival, setIsArrival] = useState(false);

  const [originResults, setOriginResults] = useState<GtfsStop[]>([]);
  const [destResults, setDestResults] = useState<GtfsStop[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState({ origin: false, dest: false });
  const [showDropdown, setShowDropdown] = useState({ origin: false, dest: false });

  // Set default time & date to NOW
  useEffect(() => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    setTargetTime(`${hours}:${minutes}`);
    
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    setTargetDate(`${year}-${month}-${day}`);
  }, []);

  useEffect(() => {
    if (origin.length < 3 || originId) {
      setOriginResults([]);
      setShowDropdown(prev => ({ ...prev, origin: false }));
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(prev => ({ ...prev, origin: true }));
      const results = await searchStops(origin);
      setOriginResults(results);
      setShowDropdown(prev => ({ ...prev, origin: results.length > 0 }));
      setSearching(prev => ({ ...prev, origin: false }));
    }, 400);
    return () => clearTimeout(timer);
  }, [origin, originId]);

  useEffect(() => {
    if (destination.length < 3 || destId) {
      setDestResults([]);
      setShowDropdown(prev => ({ ...prev, dest: false }));
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(prev => ({ ...prev, dest: true }));
      const results = await searchStops(destination);
      setDestResults(results);
      setShowDropdown(prev => ({ ...prev, dest: results.length > 0 }));
      setSearching(prev => ({ ...prev, dest: false }));
    }, 400);
    return () => clearTimeout(timer);
  }, [destination, destId]);

  const handleSearch = () => {
    if (!originId || !destId) return;
    setLoading(true);
    const query = new URLSearchParams({
      from: origin,
      fromId: originId,
      to: destination,
      toId: destId,
      time: targetTime,
      date: targetDate,
      isArrival: isArrival.toString()
    });
    router.push(`/results?${query.toString()}`);
  };

  return (
    <main className="max-w-xl mx-auto px-6 pt-16 pb-24">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-black text-brand-blue-dark mb-3">
          Metro Guide
        </h1>
        <p className="text-lg text-slate-600 font-medium">
          The calm way to plan your Melbourne journey.
        </p>
      </header>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 space-y-8">
          <h2 className="text-2xl font-black text-slate-800 border-b border-slate-100 pb-4">Plan Your Journey</h2>
          
          <div className="space-y-6">
            {/* Origin */}
            <div className="relative">
              <label htmlFor="origin" className="block text-sm font-bold text-slate-500 mb-2 ml-1 uppercase tracking-wider">Starting Station</label>
              <div className="relative">
                <input 
                  id="origin"
                  type="text" 
                  placeholder="Search stations..."
                  value={origin}
                  onChange={(e) => { setOrigin(e.target.value); setOriginId(null); }}
                  className="w-full p-5 text-xl font-bold border-2 border-slate-200 rounded-2xl focus:border-brand-blue outline-none transition-all placeholder:text-slate-300"
                  autoComplete="off"
                />
                {searching.origin && <div className="absolute right-4 top-5 animate-spin w-6 h-6 border-4 border-brand-blue border-t-transparent rounded-full"></div>}
              </div>
              
              {showDropdown.origin && (
                <ul className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-2xl mt-2 z-50 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {originResults.map(stop => (
                    <li 
                      key={stop.stop_id} 
                      className="p-5 hover:bg-brand-blue-light cursor-pointer border-b last:border-0 border-slate-100 font-bold text-lg text-slate-800 transition-colors"
                      onClick={() => { 
                        setOrigin(stop.stop_name); 
                        setOriginId(stop.stop_id); 
                        setShowDropdown(prev => ({ ...prev, origin: false }));
                      }}
                    >
                      {stop.stop_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Destination */}
            <div className="relative">
              <label htmlFor="destination" className="block text-sm font-bold text-slate-500 mb-2 ml-1 uppercase tracking-wider">Finishing Station</label>
              <div className="relative">
                <input 
                  id="destination"
                  type="text" 
                  placeholder="Search stations..."
                  value={destination}
                  onChange={(e) => { setDestination(e.target.value); setDestId(null); }}
                  className="w-full p-5 text-xl font-bold border-2 border-slate-200 rounded-2xl focus:border-brand-blue outline-none transition-all placeholder:text-slate-300"
                  autoComplete="off"
                />
                {searching.dest && <div className="absolute right-4 top-5 animate-spin w-6 h-6 border-4 border-brand-blue border-t-transparent rounded-full"></div>}
              </div>
              
              {showDropdown.dest && (
                <ul className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-2xl mt-2 z-50 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {destResults.map(stop => (
                    <li 
                      key={stop.stop_id} 
                      className="p-5 hover:bg-brand-blue-light cursor-pointer border-b last:border-0 border-slate-100 font-bold text-lg text-slate-800 transition-colors"
                      onClick={() => { 
                        setDestination(stop.stop_name); 
                        setDestId(stop.stop_id); 
                        setShowDropdown(prev => ({ ...prev, dest: false }));
                      }}
                    >
                      {stop.stop_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Date Selection */}
            <div className="relative">
              <label htmlFor="targetDate" className="block text-sm font-bold text-slate-500 mb-2 ml-1 uppercase tracking-wider">Departure Date</label>
              <input 
                id="targetDate"
                type="date" 
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full p-5 text-xl font-bold border-2 border-slate-200 rounded-2xl focus:border-brand-blue outline-none transition-all"
              />
            </div>

            {/* Time Selection */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-500 mb-2 ml-1 uppercase tracking-wider">
                  {isArrival ? 'Arrival Time' : 'Departure Time'}
                </label>
                <input 
                  type="time" 
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                  className="w-full p-5 text-xl font-bold border-2 border-slate-200 rounded-2xl focus:border-brand-blue outline-none transition-all"
                />
              </div>
              <button 
                onClick={() => setIsArrival(!isArrival)}
                className={`p-5 rounded-2xl border-2 font-bold transition-all ${isArrival ? 'bg-brand-blue text-white border-brand-blue' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
              >
                {isArrival ? 'Arrive By' : 'Depart At'}
              </button>
            </div>

            <div className="pt-4">
              <button 
                className={`w-full py-6 text-2xl font-black rounded-2xl transition-all shadow-lg ${!originId || !destId ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-brand-blue text-white hover:bg-brand-blue-dark active:scale-[0.98]'}`}
                onClick={handleSearch} 
                disabled={!originId || !destId || loading}
              >
                {loading ? 'CALCULATING...' : 'Find My Options'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-12 text-center space-y-2 opacity-50">
        <p className="font-bold text-slate-600">Accessible. Simple. Reliable.</p>
        <p className="text-xs">Based on latest PTV Transit Data</p>
      </footer>
    </main>
  );
}
