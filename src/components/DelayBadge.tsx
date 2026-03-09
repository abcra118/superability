import React from 'react';
import { TripUpdate, getMaxDelaySecs, getScheduleRelationshipLabel } from '@/data/realtime';

interface Props { update: TripUpdate | undefined }

export function DelayBadge({ update }: Props) {
  if (!update) return null;
  const rel = getScheduleRelationshipLabel(update.scheduleRelationship);
  if (rel === 'CANCELLED') return (
    <span className="text-[10px] font-black uppercase text-white bg-red-500 px-2 py-1 rounded-lg">Cancelled</span>
  );
  const delaySecs = getMaxDelaySecs(update);
  if (delaySecs >= 60) return (
    <span className="text-[10px] font-black uppercase text-white bg-orange-500 px-2 py-1 rounded-lg">+{Math.round(delaySecs / 60)} min</span>
  );
  return (
    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">On Time</span>
  );
}
