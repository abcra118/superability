import { NextResponse } from 'next/server';
import { TransitMode, fetchRealtime } from '../_lib';

export async function GET(req: any) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = (searchParams.get('mode') as TransitMode) || 'metro';
    const feed = await fetchRealtime('/service-alerts', mode);

    const alerts = feed.entity.map((e) => {
      const alert = e.alert;
      if (!alert) return null;

      const activePeriods = (alert.activePeriod || []).map((p) => ({
        start: p.start ? Number(p.start) * 1000 : null,
        end: p.end ? Number(p.end) * 1000 : null,
      }));

      const affectedEntities = (alert.informedEntity || []).map((ie) => ({
        routeId: ie.routeId,
        stopId: ie.stopId,
        tripId: ie.trip?.tripId,
        agencyId: ie.agencyId,
      }));

      const header = (alert.headerText?.translation || []).find((t) => t.language === 'en')?.text
        || alert.headerText?.translation?.[0]?.text || 'Service Alert';

      const description = (alert.descriptionText?.translation || []).find((t) => t.language === 'en')?.text
        || alert.descriptionText?.translation?.[0]?.text || '';

      return {
        entityId: e.id,
        cause: alert.cause,
        effect: alert.effect,
        header,
        description,
        activePeriods,
        affectedEntities,
      };
    }).filter(Boolean);

    return NextResponse.json({ alerts, timestamp: Date.now() });
  } catch (e: any) {
    console.error('Service alerts error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
