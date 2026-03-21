import React from 'react';
import { TripUpdate, VehiclePosition, getMaxDelaySecs, getScheduleRelationshipLabel, OCCUPANCY_LABELS, VEHICLE_STATUS_LABELS } from '@/data/realtime';

interface IntermediateStop {
  name: string;
  sequence: number;
}

interface Props {
  update?: TripUpdate;
  vehicle?: VehiclePosition;
  /** All stops on this leg (for the position tracker) */
  stops?: IntermediateStop[];
  /** Sequence number of the first stop on this leg */
  originSequence?: number;
  /** Sequence number of the destination stop on this leg */
  destSequence?: number;
}

// ─── Occupancy Visualization ────────────────────────────────────────────────
function OccupancyBar({ level }: { level: number }) {
  // 0=Empty, 1=Many seats, 2=Few seats, 3=Standing, 4=Crushed, 5=Full
  const totalDots = 6;
  const filledDots = Math.min(level + 1, totalDots);

  const colors: Record<number, string> = {
    0: 'bg-emerald-400',
    1: 'bg-emerald-400',
    2: 'bg-amber-400',
    3: 'bg-orange-500',
    4: 'bg-red-500',
    5: 'bg-red-600',
    6: 'bg-red-700',
  };
  const dotColor = colors[level] ?? 'bg-slate-400';
  const labels = OCCUPANCY_LABELS[level];

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passenger Load</p>
      <div className="flex items-center gap-2">
        {/* Carriage icon with fill */}
        <div className="flex gap-1">
          {Array.from({ length: totalDots }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-6 rounded-sm border-2 border-slate-200 transition-all ${i < filledDots ? dotColor : 'bg-white'}`}
            />
          ))}
        </div>
        <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${labels?.color}`}>
          {labels?.label ?? 'Unknown'}
        </span>
      </div>
    </div>
  );
}

// ─── Train Position Tracker ──────────────────────────────────────────────────
function TrainPositionTracker({
  stops,
  currentStopSequence,
  currentStatus,
  originSequence,
  destSequence,
}: {
  stops: IntermediateStop[];
  currentStopSequence?: number;
  currentStatus?: number;
  originSequence: number;
  destSequence: number;
}) {
  if (!stops?.length || currentStopSequence == null) return null;

  // Build the display list: origin + intermediates + destination
  // We show at most 5 "dots" — the nearest context around the train
  const allSequences = stops.map(s => s.sequence);
  const trainIdx = allSequences.findLastIndex(seq => seq <= currentStopSequence);
  const windowStart = Math.max(0, trainIdx - 1);
  const windowEnd   = Math.min(stops.length - 1, trainIdx + 3);
  const windowStops = stops.slice(windowStart, windowEnd + 1);
  const showLeadingEllipsis = windowStart > 0;
  const showTrailingEllipsis = windowEnd < stops.length - 1;

  const isAtOrPassed = (seq: number) =>
    currentStatus === 1 /* STOPPED_AT */ ? seq <= currentStopSequence : seq < currentStopSequence;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Train Position</p>
      <div className="relative flex items-center gap-0">
        {showLeadingEllipsis && (
          <span className="text-slate-300 font-black text-sm mr-1">···</span>
        )}
        {windowStops.map((stop, i) => {
          const passed = isAtOrPassed(stop.sequence);
          const isTrain = stop.sequence === currentStopSequence;
          const isLast  = i === windowStops.length - 1;
          return (
            <React.Fragment key={stop.sequence}>
              {/* Dot */}
              <div className="flex flex-col items-center" style={{ minWidth: 28 }}>
                <div className={`w-3.5 h-3.5 rounded-full border-2 z-10 transition-all ${
                  isTrain
                    ? 'bg-brand-blue border-brand-blue scale-125'
                    : passed
                    ? 'bg-brand-blue border-brand-blue opacity-40'
                    : 'bg-white border-slate-300'
                }`}>
                  {isTrain && (
                    <span className="sr-only">Train is here</span>
                  )}
                </div>
                <p className={`text-[9px] font-bold text-center leading-tight mt-1 max-w-[40px] ${passed ? 'text-slate-300' : isTrain ? 'text-brand-blue font-black' : 'text-slate-500'}`}
                  style={{ wordBreak: 'break-word', fontSize: '0.55rem' }}>
                  {stop.name.replace(/ (Railway )?Station$/i, '').replace(/ Station$/i, '')}
                </p>
              </div>
              {/* Track line */}
              {!isLast && (
                <div className={`h-0.5 flex-1 min-w-4 -mt-4 ${
                  isAtOrPassed(windowStops[i + 1]?.sequence)
                    ? 'bg-brand-blue opacity-40'
                    : 'bg-slate-200'
                }`} />
              )}
            </React.Fragment>
          );
        })}
        {showTrailingEllipsis && (
          <span className="text-slate-300 font-black text-sm ml-1">···</span>
        )}
      </div>
      {/* Train emoji marker below the track */}
      {currentStatus != null && (
        <p className="text-[10px] font-bold text-brand-blue">
          🚆 {VEHICLE_STATUS_LABELS[currentStatus]}
          {currentStatus === 1 && ' — doors may be open'}
        </p>
      )}
    </div>
  );
}

// ─── Main Panel ─────────────────────────────────────────────────────────────
export function RealtimePanel({ update, vehicle, stops, originSequence = 0, destSequence = 9999 }: Props) {
  const schedRel  = update ? getScheduleRelationshipLabel(update.scheduleRelationship) : null;
  const delaySecs = update ? getMaxDelaySecs(update) : 0;
  const isCancelled = schedRel === 'CANCELLED';

  const hasVehicle = vehicle && (vehicle.currentStopSequence != null || vehicle.occupancyStatus != null);
  const hasDelay   = delaySecs >= 60;
  const hasData    = isCancelled || hasVehicle || hasDelay || (update && delaySecs >= 0);

  if (!hasData) return null;

  return (
    <div className={`mb-6 rounded-2xl border-2 overflow-hidden ${isCancelled ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
      {/* Status bar */}
      {(isCancelled || hasDelay || update) && (
        <div className={`px-4 py-2 flex items-center gap-2 border-b ${isCancelled ? 'bg-red-100 border-red-200' : 'bg-slate-100 border-slate-200'}`}>
          {isCancelled && <span className="text-xs font-black text-red-600">⚠ SERVICE CANCELLED</span>}
          {!isCancelled && hasDelay && <span className="text-xs font-black text-orange-600">🕐 +{Math.round(delaySecs / 60)} min delay</span>}
          {!isCancelled && !hasDelay && update && <span className="text-xs font-black text-emerald-600">✓ Running on time</span>}
        </div>
      )}

      {/* Body */}
      {hasVehicle && (
        <div className="px-5 py-4 space-y-5">
          {stops && stops.length > 0 && vehicle?.currentStopSequence != null && (
            <TrainPositionTracker
              stops={stops}
              currentStopSequence={vehicle.currentStopSequence}
              currentStatus={vehicle.currentStatus}
              originSequence={originSequence}
              destSequence={destSequence}
            />
          )}
          {vehicle?.occupancyStatus != null && (
            <OccupancyBar level={vehicle.occupancyStatus} />
          )}
        </div>
      )}
    </div>
  );
}
