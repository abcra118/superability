import { Location } from "../store/useJourneyStore";
import { supabase } from "../lib/supabase";

export class LocationService {
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  static async getWalkingDurationMins(start: {lat: number, lng: number}, end: {lat: number, lng: number}): Promise<number> {
    try {
      const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
      if (!token) return Math.ceil(this.calculateDistance(start.lat, start.lng, end.lat, end.lng) * 12);
      
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start.lng},${start.lat};${end.lng},${end.lat}?access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        return Math.ceil(data.routes[0].duration / 60);
      }
    } catch(e) {
      console.warn("Mapbox directions fallback used", e);
    }
    return Math.ceil(this.calculateDistance(start.lat, start.lng, end.lat, end.lng) * 12);
  }

  static async resolveJourneyEndpoints(origin: Location, destination: Location): Promise<{ originStopId: string; destStopId: string, originWalkMins: number, destWalkMins: number }> {
    const { data: allStops, error } = await supabase
      .from('gtfs_stops')
      .select('stop_id, stop_name, stop_lat, stop_lon, parent_station')
      .not('stop_lat', 'is', null)
      .not('stop_lon', 'is', null);

    if (error || !allStops || allStops.length === 0) {
      return { 
        originStopId: `fallback-${origin.name}`, 
        destStopId: `fallback-${destination.name}`,
        originWalkMins: 0, destWalkMins: 0
      };
    }

    const getNearestStop = (loc: Location) => {
      let nearestStop = null; let minDistance = Infinity;
      for (const stop of allStops) {
        if (stop.stop_lat && stop.stop_lon) {
           const dist = this.calculateDistance(loc.lat, loc.lng, stop.stop_lat, stop.stop_lon);
           if (dist < minDistance) {
             minDistance = dist;
             nearestStop = stop;
           }
        }
      }
      return nearestStop;
    };

    const oStop = getNearestStop(origin);
    const dStop = getNearestStop(destination);
    
    const originStopId = oStop ? (oStop.parent_station ? oStop.parent_station : oStop.stop_id) : `fallback-${origin.name}`;
    const destStopId = dStop ? (dStop.parent_station ? dStop.parent_station : dStop.stop_id) : `fallback-${destination.name}`;

    let originWalkMins = 0; let destWalkMins = 0;
    if (oStop) originWalkMins = await this.getWalkingDurationMins(origin, {lat: oStop.stop_lat, lng: oStop.stop_lon});
    if (dStop) destWalkMins = await this.getWalkingDurationMins({lat: dStop.stop_lat, lng: dStop.stop_lon}, destination);

    return { originStopId, destStopId, originWalkMins, destWalkMins };
  }
}
