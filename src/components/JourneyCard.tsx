import React from 'react';
import { JourneyOption, TripResult, TransferResult } from '@/data/gtfs';
import { TripUpdate } from '@/data/realtime';
import { DelayBadge } from './DelayBadge';

interface Props {
  journey: JourneyOption;
  toName: string;
  updates: Map<string, TripUpdate>;
  rtLoading: boolean;
  onClick: () => void;
}

export function JourneyCard({ journey: j, toName, updates, rtLoading, onClick }: Props) {
  const tripIds = j.isTransfer
    ? [j.leg1_trip_id, j.leg2_trip_id].filter(Boolean) as string[]
    : [(j as TripResult).trip_id];

  const headsign     = j.isTransfer ? (j as TransferResult).leg1_headsign : (j as TripResult).trip_headsign;
  const departure    = j.isTransfer ? (j as TransferResult).leg1_departure : (j as TripResult).origin_departure;
  const arrival      = j.isTransfer ? (j as TransferResult).overall_arrival  : (j as TripResult).dest_arrival;
  const transferHub  = j.isTransfer ? (j as TransferResult).transfer_hub_name : null;

  return (
    <button
      className="w-full text-left bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:border-brand-blue hover:shadow-xl transition-all group"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1.5">
          {j.isTransfer && (
            <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
              1 Change Required
            </span>
          )}
          <div className="flex items-center flex-wrap gap-2 mt-1">
            <h2 className="text-2xl font-black text-slate-900">{headsign}</h2>
            {!rtLoading && tripIds[0] && <DelayBadge update={updates.get(tripIds[0])} />}
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <p className="text-2xl font-black text-brand-blue">{departure.substring(0, 5)}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase">Departs</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex items-center justify-between py-4 border-t border-slate-100">
        <div>
          {transferHub ? (
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-500">
                Change at <span className="text-slate-800">{transferHub}</span>
              </p>
              {!rtLoading && tripIds[1] && <DelayBadge update={updates.get(tripIds[1])} />}
            </div>
          ) : (
            <p className="text-sm font-bold text-slate-500">
              Direct to <span className="text-slate-800">{toName}</span>
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-slate-900">{arrival.substring(0, 5)}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase">Arrives</p>
        </div>
      </div>
    </button>
  );
}
