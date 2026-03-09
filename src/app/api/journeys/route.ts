import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const originId   = searchParams.get('originId');
  const destId     = searchParams.get('destId');
  const targetTime = searchParams.get('time')     || undefined;
  const targetDate = searchParams.get('date')     || undefined;
  const isArrival  = searchParams.get('isArrival') === 'true';

  if (!originId || !destId) {
    return NextResponse.json({ error: 'originId and destId are required' }, { status: 400 });
  }

  const rpcArgs = { origin_station_id: originId, dest_station_id: destId, target_time: targetTime, is_arrival: isArrival, target_date: targetDate };

  const [directRes, transferRes] = await Promise.allSettled([
    supabase.rpc('find_trips_path', rpcArgs),
    supabase.rpc('find_trips_with_transfer', rpcArgs),
  ]);

  const journeys: any[] = [];

  if (directRes.status === 'fulfilled' && !directRes.value.error && directRes.value.data) {
    journeys.push(...(directRes.value.data as any[]).map(t => ({ ...t, isTransfer: false })));
  }

  if (transferRes.status === 'fulfilled' && !transferRes.value.error && transferRes.value.data) {
    journeys.push(...(transferRes.value.data as any[]).map(t => ({ ...t, isTransfer: true })));
  }

  if (transferRes.status === 'fulfilled' && transferRes.value.error) {
    const err = transferRes.value.error as any;
    if (err.code === '57014' || err.message?.includes('timeout')) {
      return NextResponse.json({ error: 'Search timed out. Please try again.' }, { status: 504 });
    }
  }

  journeys.sort((a, b) => {
    const aTime = a.isTransfer ? a.overall_arrival : a.dest_arrival;
    const bTime = b.isTransfer ? b.overall_arrival : b.dest_arrival;
    return isArrival ? bTime.localeCompare(aTime) : aTime.localeCompare(bTime);
  });

  return NextResponse.json(journeys, {
    headers: { 'Cache-Control': 'no-store' }
  });
}
