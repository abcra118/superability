import { Location } from "../store/useJourneyStore";

export class LocationService {
  static async resolveJourneyEndpoints(origin: Location, destination: Location): Promise<{ originStopId: string; destStopId: string }> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      originStopId: `mock-stop-${origin.lat.toFixed(4)}-${origin.lng.toFixed(4)}`,
      destStopId: `mock-stop-${destination.lat.toFixed(4)}-${destination.lng.toFixed(4)}`
    };
  }
}
