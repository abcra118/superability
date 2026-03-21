import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const token = process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  
  if (!token) {
    return NextResponse.json({ error: 'Mapbox token not configured' }, { status: 500 });
  }

  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  try {
    const { data: currentData } = await supabase
      .from('api_usage')
      .select('requests')
      .eq('month', month)
      .single();
      
    const currentRequests = currentData?.requests || 0;
    
    // Limit to 40000 requests per month limit check
    if (currentRequests >= 40000) {
      return NextResponse.json({ error: 'Monthly Mapbox API quota reached' }, { status: 429 });
    }
    
    // Increment usage
    await supabase
      .from('api_usage')
      .upsert({ month, requests: currentRequests + 1 });
      
  } catch (error) {
    console.warn('Failed to log API usage (table may not exist yet):', error);
  }

  return NextResponse.json({ token }, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate' }
  });
}
