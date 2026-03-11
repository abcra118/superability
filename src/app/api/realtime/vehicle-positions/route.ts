import { NextResponse } from 'next/server';
import { TransitMode, fetchRealtime } from '../_lib';

export async function GET(req: any) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = (searchParams.get('mode') as TransitMode) || 'metro';
    const feed = await fetchRealtime('/vehicle-positions', mode);

    const vehicles = feed.entity.map((e) => {
      const vp = e.vehicle;
      if (!vp) return null;
      return {
        entityId: e.id,
        tripId: vp.trip?.tripId,
        routeId: vp.trip?.routeId,
        currentStopSequence: vp.currentStopSequence,
        stopId: vp.stopId,
        currentStatus: vp.currentStatus, 
        occupancyStatus: vp.occupancyStatus,
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
