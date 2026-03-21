const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('gtfs_stops')
    .select('stop_id, stop_name')
    .not('stop_name', 'ilike', '%Station%')
    .not('stop_name', 'ilike', '%Railway%')
    .limit(20);
  if (error) { console.error(error); return; }
  console.log(JSON.stringify(data, null, 2));
}
check();
