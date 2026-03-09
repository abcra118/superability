'use client';

import { useEffect, useRef, useState } from 'react';
import {
  TripUpdate,
  VehiclePosition,
  ServiceAlert,
  fetchTripUpdates,
  fetchServiceAlerts,
  fetchVehiclePositions,
} from '@/data/realtime';

export interface RealtimeState {
  updates: Map<string, TripUpdate>;   // keyed by tripId
  vehicles: Map<string, VehiclePosition>; // keyed by tripId
  alerts: ServiceAlert[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const REFRESH_INTERVAL_MS = 30_000;

/**
 * Fetches and periodically refreshes all three realtime feeds.
 * tripIds: the trip IDs on the results page that we want to look up.
 */
export function useRealtime(tripIds: string[]): RealtimeState {
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
        fetchTripUpdates(),
        fetchServiceAlerts(),
        fetchVehiclePositions(),
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
    } catch (e: any) {
      setState((prev) => ({ ...prev, loading: false, error: e.message }));
    }
  }

  useEffect(() => {
    // Don't bother fetching if there are no trip IDs to look up
    if (tripIds.length === 0) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }
    refresh();
    intervalRef.current = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripIds.join(',')]);

  return state;
}
