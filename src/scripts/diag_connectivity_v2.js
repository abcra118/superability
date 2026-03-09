const { createClient } = require('@supabase/supabase-client');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function debug() {
  const origin = 'vic:rail:GHY';
  const dest = 'vic:rail:PKV';
  
  console.log(`Checking connectivity for tomorrow...`);
  
  const { data: leg1, error: e1 } = await supabase.rpc('find_trips_path', {
    origin_station_id: origin,
    dest_station_id: 'vic:rail:CFD',
    target_date: '2026-03-10',
    target_time: '13:00:00'
  });
  if (e1) console.error('E1:', e1);
  console.log('Can reach Caulfield (CFD) from GHY:', leg1?.length || 0);

  const { data: leg2, error: e2 } = await supabase.rpc('find_trips_path', {
    origin_station_id: 'vic:rail:CFD',
    dest_station_id: dest,
    target_date: '2026-03-10',
    target_time: '13:00:00'
  });
  if (e2) console.error('E2:', e2);
  console.log('Can reach Parkville from Caulfield:', leg2?.length || 0);
}

debug();
