// TypeScript interfaces and client-side fetch functions for realtime GTFS data
export type TransitMode = 'metro' | 'tram' | 'metrobus';

export interface StopTimeUpdate {
  stopSequence?: number;
  stopId?: string;
  arrivalDelay: number | null;   // seconds
  departureDelay: number | null; // seconds
  scheduleRelationship?: number; // 0=SCHEDULED, 1=SKIPPED, 2=NO_DATA
}

export interface TripUpdate {
  entityId: string;
  tripId: string | undefined;
  routeId: string | undefined;
  scheduleRelationship: number | undefined; // 0=SCHEDULED, 1=ADDED, 2=UNSCHEDULED, 3=CANCELED
  stopTimeUpdates: StopTimeUpdate[];
}

export interface AffectedEntity {
  routeId?: string;
  stopId?: string;
  tripId?: string;
  agencyId?: string;
}

export interface ServiceAlert {
  entityId: string;
  cause?: number;
  effect?: number;
  header: string;
  description: string;
  activePeriods: { start: number | null; end: number | null }[];
  affectedEntities: AffectedEntity[];
}

export interface VehiclePosition {
  entityId: string;
  tripId?: string;
  routeId?: string;
  currentStopSequence?: number;
  stopId?: string;
  currentStatus?: number; // 0=INCOMING_AT, 1=STOPPED_AT, 2=IN_TRANSIT_TO
  occupancyStatus?: number; // 0=EMPTY, 1=MANY_SEATS, 2=FEW_SEATS, 3=STANDING_ONLY, 4=CRUSHED, 5=FULL, 6=NOT_ACCEPTING
  latitude?: number;
  longitude?: number;
  timestamp?: number;
}

export interface RealtimeData {
  updates: TripUpdate[];
  vehicles: VehiclePosition[];
  alerts: ServiceAlert[];
  timestamp: number;
}

async function fetchJson<T>(path: string, mode: TransitMode = 'metro'): Promise<T> {
  const url = \`\${path}?mode=\${mode}\`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(\`\${url}: \${res.status}\`);
  return res.json();
}

export async function fetchTripUpdates(mode: TransitMode = 'metro'): Promise<{ updates: TripUpdate[]; timestamp: number }> {
  return fetchJson('/api/realtime/trip-updates', mode);
}

export async function fetchServiceAlerts(mode: TransitMode = 'metro'): Promise<{ alerts: ServiceAlert[]; timestamp: number }> {
  return fetchJson('/api/realtime/service-alerts', mode);
}

export async function fetchVehiclePositions(mode: TransitMode = 'metro'): Promise<{ vehicles: VehiclePosition[]; timestamp: number }> {
  return fetchJson('/api/realtime/vehicle-positions', mode);
}

// Human-readable helpers
export const OCCUPANCY_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: 'Empty', color: 'text-emerald-600 bg-emerald-50' },
  1: { label: 'Many Seats', color: 'text-emerald-600 bg-emerald-50' },
  2: { label: 'Few Seats', color: 'text-amber-600 bg-amber-50' },
  3: { label: 'Standing Room', color: 'text-orange-600 bg-orange-50' },
  4: { label: 'Crushed', color: 'text-red-600 bg-red-50' },
  5: { label: 'Full', color: 'text-red-700 bg-red-100' },
  6: { label: 'Not Accepting', color: 'text-red-700 bg-red-100' },
};

export const VEHICLE_STATUS_LABELS: Record<number, string> = {
  0: 'Approaching',
  1: 'At Stop',
  2: 'In Transit',
};

export function getScheduleRelationshipLabel(sr?: number): 'CANCELLED' | 'ADDED' | null {
  if (sr === 3) return 'CANCELLED';
  if (sr === 1) return 'ADDED';
  return null;
}

export function getMaxDelaySecs(update: TripUpdate): number {
  let maxDelay = 0;
  for (const stu of update.stopTimeUpdates) {
    const d = stu.departureDelay ?? stu.arrivalDelay ?? 0;
    if (d > maxDelay) maxDelay = d;
  }
  return maxDelay;
}
