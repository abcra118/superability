import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { shapeId: string } }
) {
  const { shapeId } = params;

  if (!shapeId) {
    return NextResponse.json({ error: 'Missing shapeId' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('gtfs_shapes')
    .select('shape_pt_lat, shape_pt_lon')
    .eq('shape_id', shapeId)
    .order('shape_pt_sequence', { ascending: true });

  if (error) {
    console.error('Shape fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const coordinates = (data || []).map(p => [p.shape_pt_lon, p.shape_pt_lat]);

  return NextResponse.json({ coordinates }, {
    headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate' }
  });
}
