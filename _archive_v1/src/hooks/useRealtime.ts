'use client';

import { useEffect, useRef, useState } from 'react';
import {
  TripUpdate,
  VehiclePosition,
  ServiceAlert,
  fetchTripUpdates,
  fetchServiceAlerts,
  fetchVehiclePositions,
  TransitMode,
} from '@/data/realtime';

export interface RealtimeState {
  updates: Map<string, TripUpdate>;   
  vehicles: Map<string, VehiclePosition>; 
  alerts: ServiceAlert[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const REFRESH_INTERVAL_MS = 30_000;

export function useRealtime(tripIds: string[], mode: TransitMode = 'metro'): RealtimeState {
  const [state, setState] = useState<RealtimeState>({
    updates: new Map(),
    vehicles: new Map(),
    alerts: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function refresh() {
    try {
      const [updatesRes, alertsRes, vehiclesRes] = await Promise.allSettled([
        fetchTripUpdates(mode),
        fetchServiceAlerts(mode),
        fetchVehiclePositions(mode),
      ]);

      const updatesMap = new Map<string, TripUpdate>();
      if (updatesRes.status === 'fulfilled') {
        for (const u of updatesRes.value.updates) {
          if (u.tripId) updatesMap.set(u.tripId, u);
        }
      }

      const vehiclesMap = new Map<string, VehiclePosition>();
      if (vehiclesRes.status === 'fulfilled') {
        for (const v of vehiclesRes.value.vehicles) {
          if (v.tripId) vehiclesMap.set(v.tripId, v);
        }
      }

      const alerts = alertsRes.status === 'fulfilled' ? alertsRes.value.alerts : [];

      setState({
        updates: updatesMap,
        vehicles: vehiclesMap,
        alerts,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
      });
    } catch (e: unknown) {
      setState((prev) => ({ ...prev, loading: false, error: e instanceof Error ? e.message : String(e) }));
    }
  }

  useEffect(() => {
    if (tripIds.length === 0) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }
    refresh();
    intervalRef.current = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [tripIds.join(','), mode]);

  return state;
}
