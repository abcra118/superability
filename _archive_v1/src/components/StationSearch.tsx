'use client';

import React, { useRef, useEffect } from 'react';
import { GtfsStop } from '@/data/gtfs';
import { useStopSearch } from '@/hooks/useStopSearch';

interface Props {
  id: string;
  label: string;
  value: string;
  selectedId: string | null;
  onChange: (value: string) => void;
  onSelect: (stop: GtfsStop) => void;
}

const MODE_ICONS: Record<string, string> = {
  train: '🚆',
  tram: '🚃',
  bus: '🚌',
};

export function StationSearch({ id, label, value, selectedId, onChange, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { results, searching } = useStopSearch(value, !selectedId);
  const showDropdown = results.length > 0 && !selectedId;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // Dropdown closes via parent logic
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="block text-xs font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          placeholder="Search stations or stops..."
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full p-5 text-xl font-bold border-2 border-slate-200 rounded-2xl focus:border-brand-blue outline-none transition-all placeholder:text-slate-300"
          autoComplete="off"
        />
        {selectedId && (
          <button
            aria-label="Clear"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 text-slate-500 text-xs font-black flex items-center justify-center hover:bg-slate-300 transition-colors"
            onClick={() => onChange('')}
          >
            ✕
          </button>
        )}
        {searching && !selectedId && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {showDropdown && (
        <ul className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-2xl mt-2 z-50 shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
          {results.map(stop => (
            <li
              key={stop.stop_id}
              className="p-4 hover:bg-brand-blue-light cursor-pointer border-b last:border-0 border-slate-100 font-bold text-lg text-slate-800 transition-colors flex items-center gap-3"
              onMouseDown={() => onSelect(stop)}
            >
              <span className="text-2xl">{MODE_ICONS[stop.mode || 'train']}</span>
              <div>
                <p>{stop.stop_name}</p>
                {stop.mode && <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{stop.mode}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
