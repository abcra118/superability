import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  if (q.length < 3) return NextResponse.json([]);

  // Search across multiple transit tables if they exist
  // We'll try metro first, then tram/bus if user has imported them
  const [metroRes, tramRes, busRes] = await Promise.allSettled([
    supabase.from('gtfs_stops').select('stop_id, stop_name, location_type').ilike('stop_name', \`%\${q}%\`).limit(20),
    supabase.from('gtfs_tram_stops').select('stop_id, stop_name, location_type').ilike('stop_name', \`%\${q}%\`).limit(20),
    supabase.from('gtfs_bus_stops').select('stop_id, stop_name, location_type').ilike('stop_name', \`%\${q}%\`).limit(20),
  ]);

  let results: any[] = [];

  if (metroRes.status === 'fulfilled' && metroRes.value.data) {
    results.push(...metroRes.value.data.map(s => ({ ...s, mode: 'train' })));
  }
  if (tramRes.status === 'fulfilled' && tramRes.value.data) {
    results.push(...tramRes.value.data.map(s => ({ ...s, mode: 'tram' })));
  }
  if (busRes.status === 'fulfilled' && busRes.value.data) {
    results.push(...busRes.value.data.map(s => ({ ...s, mode: 'bus' })));
  }

  // Filter and deduplicate
  const seen = new Set<string>();
  const final = [];

  // Prioritize parent stations and shorter names
  results.sort((a, b) => {
    const aP = a.location_type === 1 ? 0 : 1;
    const bP = b.location_type === 1 ? 0 : 1;
    if (aP !== bP) return aP - bP;
    return a.stop_name.length - b.stop_name.length;
  });

  for (const stop of results) {
    const key = \`\${stop.mode}:\${stop.stop_name.toLowerCase()}\`;
    if (!seen.has(key)) {
      seen.add(key);
      final.push(stop);
    }
  }

  return NextResponse.json(final.slice(0, 10), {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' }
  });
}
