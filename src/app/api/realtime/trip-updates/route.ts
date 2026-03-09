import { NextResponse } from 'next/server';
import { fetchRealtime } from '../_lib';

export async function GET() {
  try {
    const feed = await fetchRealtime('/trip-updates');

    // Extract relevant fields into a clean JSON structure
    const updates = feed.entity.map((e) => {
      const tu = e.tripUpdate;
      if (!tu) return null;
      return {
        entityId: e.id,
        tripId: tu.trip?.tripId,
        routeId: tu.trip?.routeId,
        scheduleRelationship: tu.trip?.scheduleRelationship,
        stopTimeUpdates: (tu.stopTimeUpdate || []).map((stu) => ({
          stopSequence: stu.stopSequence,
          stopId: stu.stopId,
          arrivalDelay: stu.arrival?.delay ?? null,
          departureDelay: stu.departure?.delay ?? null,
          scheduleRelationship: stu.scheduleRelationship,
        })),
      };
    }).filter(Boolean);

    return NextResponse.json({ updates, timestamp: Date.now() });
  } catch (e: any) {
    console.error('Trip updates error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
