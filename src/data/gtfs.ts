import { supabase } from '@/lib/supabase';

export interface GtfsStop {
  stop_id: string;
  stop_name: string;
  location_type: number;
}

export interface IntermediateStop {
  name: string;
  sequence: number;
  arrival: string;
  mins_to_go: number;
}

export interface Pathway {
  mode: number;
  text: string | null;
}

export interface TripResult {
  trip_id: string;
  route_long_name: string;
  trip_headsign: string;
  wheelchair_accessible: number;
  bikes_allowed: number;
  origin_departure: string;
  dest_arrival: string;
  stop_count: number;
  origin_platform?: string;
  dest_platform?: string;
  intermediate_stops?: IntermediateStop[];
  origin_pathways?: Pathway[];
  dest_pathways?: Pathway[];
  isTransfer?: false;
}

export interface TransferResult {
  isTransfer: true;
  wheelchair_accessible: number;
  leg1_trip_id: string;
  leg1_route: string;
  leg1_headsign: string;
  leg1_departure: string;
  leg1_arrival: string;
  leg1_platform: string;
  leg1_intermediate_stops: IntermediateStop[];
  transfer_hub_name: string;
  transfer_platform_from: string;
  transfer_platform_to: string;
  transfer_walk_mins: number;
  transfer_notes: string;
  leg2_trip_id: string;
  leg2_route: string;
  leg2_headsign: string;
  leg2_departure: string;
  leg2_arrival: string;
  leg2_platform: string;
  leg2_intermediate_stops: IntermediateStop[];
  overall_arrival: string;
}

export type JourneyOption = TripResult | TransferResult;

export async function searchStops(query: string): Promise<GtfsStop[]> {
  if (!query || query.length < 3) return [];

  const { data, error } = await supabase
    .from('gtfs_stops')
    .select('stop_id, stop_name, location_type')
    .ilike('stop_name', `%${query}%`)
    .limit(50);

  if (error) { console.error("Error searching stops:", error); return []; }

  const all = data || [];
  const trainStops = all.filter(s => {
    const n = s.stop_name.toLowerCase();
    return (n.includes('station') || n.includes('railway')) 
      && !n.includes('bus stop') && !n.includes('coach stop') && !n.includes('replacement');
  });

  trainStops.sort((a, b) => {
    const aIsParent = a.location_type === 1 ? 0 : 1;
    const bIsParent = b.location_type === 1 ? 0 : 1;
    if (aIsParent !== bIsParent) return aIsParent - bIsParent;
    return a.stop_name.length - b.stop_name.length;
  });

  const seen = new Set<string>();
  const results: GtfsStop[] = [];
  for (const stop of trainStops) {
    const base = stop.stop_name.toLowerCase()
      .replace(/ railway station\s*$/i, '').replace(/ station\s*$/i, '').trim();
    if (!seen.has(base)) { seen.add(base); results.push(stop); }
  }
  return results.slice(0, 10);
}

export async function findJourneys(
  originId: string, 
  destId: string, 
  targetTime?: string, 
  isArrival?: boolean,
  targetDate?: string
): Promise<JourneyOption[]> {
  const [directRes, transferRes] = await Promise.allSettled([
    supabase.rpc('find_trips_path', {
      origin_station_id: originId, dest_station_id: destId,
      target_time: targetTime, is_arrival: isArrival, target_date: targetDate
    }),
    supabase.rpc('find_trips_with_transfer', {
      origin_station_id: originId, dest_station_id: destId,
      target_time: targetTime, is_arrival: isArrival, target_date: targetDate
    })
  ]);

  const journeys: JourneyOption[] = [];

  if (directRes.status === 'fulfilled') {
    if (directRes.value.error) {
      console.error("Direct RPC Error:", directRes.value.error);
    } else if (directRes.value.data) {
      journeys.push(...(directRes.value.data as TripResult[]).map(t => ({ ...t, isTransfer: false as const })));
    }
  }

  if (transferRes.status === 'fulfilled') {
    if (transferRes.value.error) {
      console.error("Transfer RPC Error:", transferRes.value.error);
      if (transferRes.value.error.code === '57014' || transferRes.value.error.message?.includes('timeout')) {
        throw new Error("The network search timed out. We've pushed an optimization to fix this—please ensure V10 SQL is applied in Supabase.");
      }
    } else if (transferRes.value.data) {
      journeys.push(...(transferRes.value.data as TransferResult[]).map(t => ({ ...t, isTransfer: true as const })));
    }
  }

  // Sort by arrival time. 
  journeys.sort((a, b) => {
    const aTime = a.isTransfer ? a.overall_arrival : a.dest_arrival;
    const bTime = b.isTransfer ? b.overall_arrival : b.dest_arrival;
    return isArrival ? bTime.localeCompare(aTime) : aTime.localeCompare(bTime);
  });

  return journeys;
}
