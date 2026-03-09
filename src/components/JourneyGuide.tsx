'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { JourneyOption, TripResult, TransferResult } from '@/data/gtfs';
import { useRealtime } from '@/hooks/useRealtime';
import { RealtimePanel } from './RealtimePanel';

interface IntermediateStop {
  name: string;
  sequence: number;
  arrival: string;
  mins_to_go: number;
}

interface Step {
  title: string;
  instruction: string;
  detail: string;
  intermediaries?: IntermediateStop[];
  isTransferAction?: boolean;
  tripId?: string;
}

function buildSteps(journey: JourneyOption, fromName: string, toName: string): Step[] {
  const s: Step[] = [];

  if (journey.isTransfer) {
    const t = journey as TransferResult;
    s.push({ title: 'Initial Boarding', instruction: `Find Platform ${t.leg1_platform} at ${fromName}`, detail: `Look for the "${t.leg1_headsign}" train.`, tripId: t.leg1_trip_id });
    s.push({ title: 'The First Leg', instruction: `Ride to ${t.transfer_hub_name}`, detail: `You'll pass ${t.leg1_intermediate_stops.length} stations. Tick them off as you go.`, intermediaries: t.leg1_intermediate_stops, tripId: t.leg1_trip_id });
    s.push({ title: 'Transfer Required', instruction: `Change at ${t.transfer_hub_name}`, detail: `Leave Platform ${t.transfer_platform_from} and walk to Platform ${t.transfer_platform_to}. ~${t.transfer_walk_mins} min walk.`, isTransferAction: true });
    s.push({ title: 'Final Boarding', instruction: `Find Platform ${t.leg2_platform}`, detail: `Look for the "${t.leg2_headsign}" train.`, tripId: t.leg2_trip_id });
    s.push({ title: 'The Final Leg', instruction: `Heading to ${toName}`, detail: `Arriving at ${t.leg2_arrival.substring(0, 5)}.`, intermediaries: t.leg2_intermediate_stops, tripId: t.leg2_trip_id });
  } else {
    const d = journey as TripResult;
    s.push({ title: 'Find Your Train', instruction: `Find Platform ${d.origin_platform || 'TBA'} at ${fromName}`, detail: `Look for the "${d.trip_headsign}" train departing at ${d.origin_departure.substring(0, 5)}.`, tripId: d.trip_id });
    s.push({ title: 'The Journey', instruction: `Staying on to ${toName}`, detail: `Pass ${(d.intermediate_stops || []).length} stations. Follow the list below.`, intermediaries: d.intermediate_stops, tripId: d.trip_id });
  }

  s.push({ title: 'Arrived', instruction: `Welcome to ${toName}`, detail: "You've successfully completed your journey. Have a great day!" });
  return s;
}

interface Props {
  journey: JourneyOption;
  fromName: string;
  toName: string;
}

export function JourneyGuide({ journey, fromName, toName }: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedStops, setCompletedStops] = useState<Set<number>>(new Set());

  const steps = buildSteps(journey, fromName, toName);
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const allTripIds = journey.isTransfer
    ? [(journey as TransferResult).leg1_trip_id, (journey as TransferResult).leg2_trip_id]
    : [(journey as TripResult).trip_id];

  const { updates, vehicles } = useRealtime(allTripIds.filter(Boolean) as string[]);

  const toggleStop = (seq: number) => {
    setCompletedStops(prev => {
      const next = new Set(prev);
      if (next.has(seq)) next.delete(seq); else next.add(seq);
      return next;
    });
  };

  return (
    <main className="max-w-xl mx-auto px-6 py-12 min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Step {currentStep + 1} of {steps.length}
          </span>
          <button className="text-xs font-black text-slate-500 uppercase" onClick={() => router.back()}>Quit</button>
        </div>
        <h1 className="text-4xl font-black text-slate-900 leading-tight">{step.title}</h1>
        <div className="w-full h-2 bg-slate-200 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-brand-blue transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* Realtime panel */}
      {step.tripId && (
        <RealtimePanel update={updates.get(step.tripId)} vehicle={vehicles.get(step.tripId)} />
      )}

      {/* Step card */}
      <div className="flex-grow space-y-8">
        <div className={`p-8 rounded-[2.5rem] bg-white border-2 shadow-sm ${step.isTransferAction ? 'border-amber-200' : 'border-slate-100'}`}>
          <h2 className="text-3xl font-black text-slate-900 mb-4">{step.instruction}</h2>
          <p className="text-xl font-bold text-slate-500 italic border-l-4 border-brand-blue pl-6">
            {step.detail}
          </p>
        </div>

        {/* Intermediate stops */}
        {step.intermediaries && step.intermediaries.length > 0 && (
          <div className="pb-12">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">
              Intermediate Stops
            </h3>
            <div className="space-y-5 pl-4 border-l-4 border-slate-200">
              {step.intermediaries.map((stop) => {
                const done = completedStops.has(stop.sequence);
                return (
                  <button key={stop.sequence} className="flex items-start gap-4 w-full text-left group" onClick={() => toggleStop(stop.sequence)}>
                    <div className={`w-8 h-8 rounded-full border-4 flex-shrink-0 flex items-center justify-center transition-all ${done ? 'bg-brand-blue border-brand-blue' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}>
                      {done && <span className="text-white text-xs font-black">✓</span>}
                    </div>
                    <div>
                      <p className={`text-xl font-black ${done ? 'text-slate-300 line-through' : 'text-slate-800'}`}>{stop.name}</p>
                      <p className={`text-xs font-black uppercase tracking-wider mt-0.5 ${done ? 'text-slate-200' : 'text-brand-blue'}`}>
                        {done ? 'Arrived' : stop.mins_to_go > 0 ? `${stop.mins_to_go}m to go` : 'Next stop'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-12">
        {currentStep < steps.length - 1 ? (
          <button
            className="w-full py-8 text-3xl font-black bg-brand-blue text-white rounded-[2rem] shadow-xl hover:bg-brand-blue-dark active:scale-[0.98] transition-all"
            onClick={() => setCurrentStep(p => p + 1)}
          >
            {currentStep === steps.length - 2 ? 'Finish Journey' : 'Next Step'} →
          </button>
        ) : (
          <button className="w-full py-8 text-3xl font-black bg-slate-900 text-white rounded-[2rem] shadow-xl" onClick={() => router.push('/')}>
            Done
          </button>
        )}
      </div>
    </main>
  );
}
