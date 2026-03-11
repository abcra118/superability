'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { JourneyOption, TripResult, TransferResult, Pathway } from '@/data/gtfs';
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
  allStopsForLeg?: IntermediateStop[];
  destPlatform?: string;
  pathways?: Pathway[];
}

function buildSteps(journey: JourneyOption, fromName: string, toName: string): Step[] {
  const s: Step[] = [];

  if (journey.isTransfer) {
    const t = journey as TransferResult;
    const leg1Stops = t.leg1_intermediate_stops ?? [];
    const leg2Stops = t.leg2_intermediate_stops ?? [];
    s.push({ title: 'Initial Boarding', instruction: `Find Platform ${t.leg1_platform} at ${fromName}`, detail: `Look for the "${t.leg1_headsign}" train.`, tripId: t.leg1_trip_id, allStopsForLeg: leg1Stops });
    s.push({ title: 'The First Leg', instruction: `Ride to ${t.transfer_hub_name}`, detail: `You'll pass ${leg1Stops.length} stations. Tick them off as you go.`, intermediaries: leg1Stops, tripId: t.leg1_trip_id, allStopsForLeg: leg1Stops });
    s.push({ title: 'Transfer Required', instruction: `Change at ${t.transfer_hub_name}`, detail: `Leave Platform ${t.transfer_platform_from} and walk to Platform ${t.transfer_platform_to}. ~${t.transfer_walk_mins} min walk.`, isTransferAction: true });
    s.push({ title: 'Final Boarding', instruction: `Find Platform ${t.leg2_platform}`, detail: `Look for the "${t.leg2_headsign}" train.`, tripId: t.leg2_trip_id, allStopsForLeg: leg2Stops });
    s.push({ title: 'The Final Leg', instruction: `Heading to ${toName}`, detail: `Arriving at ${t.leg2_arrival.substring(0, 5)}. Almost there.`, intermediaries: leg2Stops, tripId: t.leg2_trip_id, allStopsForLeg: leg2Stops });
    // Arrival step — include the destination platform from leg2
    s.push({ title: 'Arrived', instruction: `Welcome to ${toName}`, detail: `You're arriving on Platform ${t.leg2_platform}. Head up to the main concourse and you're done!`, destPlatform: t.leg2_platform });
  } else {
    const d = journey as TripResult;
    const stops = d.intermediate_stops ?? [];
    s.push({ title: 'Find Your Train', instruction: `Find Platform ${d.origin_platform || 'TBA'} at ${fromName}`, detail: `Look for the "${d.trip_headsign}" train departing at ${d.origin_departure.substring(0, 5)}.`, tripId: d.trip_id, allStopsForLeg: stops, pathways: d.origin_pathways });
    s.push({ title: 'The Journey', instruction: `Staying on to ${toName}`, detail: `Pass ${stops.length} stations. Follow the list below.`, intermediaries: stops, tripId: d.trip_id, allStopsForLeg: stops });
    // Arrival step — include the destination platform
    const destPf = d.dest_platform;
    s.push({ title: 'Arrived', instruction: `Welcome to ${toName}`, detail: destPf ? `You're arriving on Platform ${destPf}. Head up to the main concourse and you're done!` : "You've successfully completed your journey. Have a great day!", destPlatform: destPf, pathways: d.dest_pathways });
  }

  return s;
}

interface Props {
  journey: JourneyOption;
  fromName: string;
  toName: string;
}

export function JourneyGuide({ journey, fromName, toName }: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep]     = useState(0);
  const [completedStops, setCompletedStops] = useState<Set<number>>(new Set());
  const autoTickedRef = useRef<Set<number>>(new Set());

  const steps = buildSteps(journey, fromName, toName);
  const step  = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const allTripIds = journey.isTransfer
    ? [(journey as TransferResult).leg1_trip_id, (journey as TransferResult).leg2_trip_id]
    : [(journey as TripResult).trip_id];

  const { updates, vehicles } = useRealtime(allTripIds.filter(Boolean) as string[]);

  // Auto-tick: when vehicle position reports currentStopSequence, mark all stops
  // up to (but not including) that sequence as passed.
  useEffect(() => {
    if (!step.tripId || !step.intermediaries) return;
    const vehicle = vehicles.get(step.tripId);
    if (!vehicle || vehicle.currentStopSequence == null) return;

    // currentStopSequence is the sequence of the stop the train is AT or heading to.
    // Any stop with sequence < currentStopSequence has already been passed.
    const passedSquences = step.intermediaries
      .filter(s => s.sequence < vehicle.currentStopSequence!)
      .map(s => s.sequence);

    if (passedSquences.length === 0) return;

    const alreadyAutoTicked = autoTickedRef.current;
    const newOnes = passedSquences.filter(seq => !alreadyAutoTicked.has(seq));
    if (newOnes.length === 0) return;

    newOnes.forEach(seq => alreadyAutoTicked.add(seq));
    setCompletedStops(prev => {
      const next = new Set(prev);
      newOnes.forEach(seq => next.add(seq));
      return next;
    });
  }, [vehicles, step.tripId, step.intermediaries]);

  /**
   * Manual tick: ticking stop N also ticks every stop before it in the list.
   * Tapping an already-completed stop removes ONLY that stop (and those after it)
   * so the user can correct an accidental over-tick.
   */
  const handleStopTick = (tappedSeq: number) => {
    if (!step.intermediaries) return;

    // Sort all stop sequences in display order
    const seqsInOrder = step.intermediaries.map(s => s.sequence).sort((a, b) => a - b);
    const tappedIdx   = seqsInOrder.indexOf(tappedSeq);

    setCompletedStops(prev => {
      const next = new Set(prev);
      const alreadyDone = prev.has(tappedSeq);
      if (alreadyDone) {
        // Untick this stop and all after it
        seqsInOrder.slice(tappedIdx).forEach(seq => next.delete(seq));
      } else {
        // Tick this stop and all before it
        seqsInOrder.slice(0, tappedIdx + 1).forEach(seq => next.add(seq));
      }
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
        <RealtimePanel
          update={updates.get(step.tripId)}
          vehicle={vehicles.get(step.tripId)}
          stops={step.allStopsForLeg}
        />
      )}

      {/* Step card */}
      <div className="flex-grow space-y-8">
        <div className={`p-8 rounded-[2.5rem] bg-white border-2 shadow-sm ${step.isTransferAction ? 'border-amber-200' : step.title === 'Arrived' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100'}`}>
          <h2 className="text-3xl font-black text-slate-900 mb-4">{step.instruction}</h2>
          <p className="text-xl font-bold text-slate-500 italic border-l-4 border-brand-blue pl-6">
            {step.detail}
          </p>
          {/* Prominent platform callout on the Arrived step */}
          {step.destPlatform && (
            <div className="mt-6 flex items-center gap-4 bg-brand-blue text-white rounded-2xl px-6 py-4">
              <span className="text-3xl">🚉</span>
              <div>
                <p className="text-xs font-black uppercase tracking-widest opacity-70">Arriving At</p>
                <p className="text-2xl font-black">Platform {step.destPlatform}</p>
              </div>
            </div>
          )}
          {/* Accessibility badges from GTFS pathways */}
          {step.pathways && step.pathways.length > 0 && (() => {
            const modes = new Set(step.pathways!.map(p => p.mode));
            const badges: { emoji: string; label: string }[] = [];
            if (modes.has(5)) badges.push({ emoji: '🛗', label: 'Lift available' });
            if (modes.has(4)) badges.push({ emoji: '↕️', label: 'Escalator' });
            if (modes.has(2) && !modes.has(5)) badges.push({ emoji: '🪜', label: 'Stairs only' });
            if (badges.length === 0) return null;
            return (
              <div className="mt-5 flex flex-wrap gap-2">
                {badges.map(b => (
                  <span key={b.label} className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-sm font-bold px-3 py-1.5 rounded-full">
                    <span>{b.emoji}</span>
                    <span>{b.label}</span>
                  </span>
                ))}
              </div>
            );
          })()}
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
                  <button
                    key={stop.sequence}
                    className="flex items-start gap-4 w-full text-left group"
                    onClick={() => handleStopTick(stop.sequence)}
                  >
                    <div className={`w-8 h-8 rounded-full border-4 flex-shrink-0 flex items-center justify-center transition-all ${done ? 'bg-brand-blue border-brand-blue' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}>
                      {done && <span className="text-white text-xs font-black">✓</span>}
                    </div>
                    <div>
                      <p className={`text-xl font-black ${done ? 'text-slate-300 line-through' : 'text-slate-800'}`}>{stop.name}</p>
                      <p className={`text-xs font-black uppercase tracking-wider mt-0.5 ${done ? 'text-slate-200' : 'text-brand-blue'}`}>
                        {done ? 'Passed' : stop.mins_to_go > 0 ? `${stop.mins_to_go}m to go` : 'Next stop'}
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
