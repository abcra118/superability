// NOTE: searchStops and findJourneys now have server-side counterparts at
// /api/stops and /api/journeys respectively. This file retains the TypeScript
// interfaces and the Supabase client versions (used by existing callers).

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
  mins_to_go: number; stop_lat: number; stop_lon: number;
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
