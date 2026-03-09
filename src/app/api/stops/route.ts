import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  if (q.length < 3) return NextResponse.json([]);

  const { data, error } = await supabase
    .from('gtfs_stops')
    .select('stop_id, stop_name, location_type')
    .ilike('stop_name', `%${q}%`)
    .limit(50);

  if (error) return NextResponse.json([], { status: 500 });

  const all = data || [];
  const trainStops = all.filter(s => {
    const n = s.stop_name.toLowerCase();
    return (n.includes('station') || n.includes('railway'))
      && !n.includes('bus stop') && !n.includes('coach stop') && !n.includes('replacement');
  });

  trainStops.sort((a, b) => {
    const aP = a.location_type === 1 ? 0 : 1;
    const bP = b.location_type === 1 ? 0 : 1;
    if (aP !== bP) return aP - bP;
    return a.stop_name.length - b.stop_name.length;
  });

  const seen = new Set<string>();
  const results = [];
  for (const stop of trainStops) {
    const base = stop.stop_name.toLowerCase()
      .replace(/ railway station\s*$/i, '').replace(/ station\s*$/i, '').trim();
    if (!seen.has(base)) { seen.add(base); results.push(stop); }
  }

  return NextResponse.json(results.slice(0, 10), {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' }
  });
}
