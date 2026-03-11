export interface GtfsStop {
  stop_id: string;
  stop_name: string;
  location_type: number;
  mode?: "train" | "tram" | "bus";
  stop_lat?: number;
  stop_lon?: number;
}

export interface IntermediateStop {
  name: string;
  sequence: number;
  arrival: string;
  mins_to_go: number;
  stop_lat: number;
  stop_lon: number;
}

export interface Pathway {
  mode: number;
  text?: string;
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
  origin_platform: string;
  dest_platform: string;
  intermediate_stops: IntermediateStop[];
  origin_pathways: Pathway[];
  dest_pathways: Pathway[];
  shape_id?: string;
}

export interface TransferResult {
  leg1_trip_id: string;
  leg1_route: string;
  leg1_headsign: string;
  leg1_departure: string;
  leg1_arrival: string;
  leg1_platform: string;
  leg1_intermediate_stops: IntermediateStop[];
  leg1_shape_id?: string;
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
  leg2_shape_id?: string;
  overall_arrival: string;
  wheelchair_accessible: number;
}

export type JourneyOption = TripResult | TransferResult;
