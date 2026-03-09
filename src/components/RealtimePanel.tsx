import React from 'react';
import { TripUpdate, VehiclePosition, getMaxDelaySecs, getScheduleRelationshipLabel, OCCUPANCY_LABELS, VEHICLE_STATUS_LABELS } from '@/data/realtime';

interface Props {
  update?: TripUpdate;
  vehicle?: VehiclePosition;
}

export function RealtimePanel({ update, vehicle }: Props) {
  const schedRel  = update ? getScheduleRelationshipLabel(update.scheduleRelationship) : null;
  const delaySecs = update ? getMaxDelaySecs(update) : 0;
  const occupancy = vehicle?.occupancyStatus !== undefined ? OCCUPANCY_LABELS[vehicle.occupancyStatus] : null;
  const status    = vehicle?.currentStatus   !== undefined ? VEHICLE_STATUS_LABELS[vehicle.currentStatus] : null;

  const hasData = schedRel || delaySecs > 0 || occupancy || status;
  if (!hasData) return null;

  const isCancelled = schedRel === 'CANCELLED';

  return (
    <div className={`mb-6 p-4 rounded-2xl border-2 flex flex-wrap gap-2 items-center ${isCancelled ? 'bg-red-50 border-red-200' : 'bg-slate-100 border-slate-200'}`}
      role="status" aria-live="polite">
      {isCancelled && (
        <span className="text-xs font-black uppercase text-white bg-red-500 px-3 py-1.5 rounded-lg">⚠ Cancelled</span>
      )}
      {!isCancelled && delaySecs >= 60 && (
        <span className="text-xs font-black uppercase text-white bg-orange-500 px-3 py-1.5 rounded-lg">
          +{Math.round(delaySecs / 60)} min delay
        </span>
      )}
      {!isCancelled && delaySecs < 60 && update && (
        <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">✓ On Time</span>
      )}
      {status && (
        <span className="text-xs font-black uppercase text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
          🚆 {status}
        </span>
      )}
      {occupancy && (
        <span className={`text-xs font-black uppercase px-3 py-1.5 rounded-lg ${occupancy.color}`}>
          👥 {occupancy.label}
        </span>
      )}
    </div>
  );
}
