import { NextResponse } from 'next/server';
import { fetchRealtime } from '../_lib';

export async function GET() {
  try {
    const feed = await fetchRealtime('/vehicle-positions');

    const vehicles = feed.entity.map((e) => {
      const vp = e.vehicle;
      if (!vp) return null;
      return {
        entityId: e.id,
        tripId: vp.trip?.tripId,
        routeId: vp.trip?.routeId,
        currentStopSequence: vp.currentStopSequence,
        stopId: vp.stopId,
        currentStatus: vp.currentStatus, // STOPPED_AT, IN_TRANSIT_TO, INCOMING_AT
        occupancyStatus: vp.occupancyStatus, // EMPTY, MANY_SEATS_AVAILABLE, FEW_SEATS_AVAILABLE, STANDING_ROOM_ONLY, etc.
        latitude: vp.position?.latitude ?? null,
        longitude: vp.position?.longitude ?? null,
        timestamp: vp.timestamp ? Number(vp.timestamp) * 1000 : null,
      };
    }).filter(Boolean);

    return NextResponse.json({ vehicles, timestamp: Date.now() });
  } catch (e: any) {
    console.error('Vehicle positions error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
