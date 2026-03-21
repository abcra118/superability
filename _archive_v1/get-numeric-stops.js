const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('gtfs_stops')
    .select('*')
    .not('stop_id', 'like', '%:%')
    .limit(10);
  if (error) { console.error(error); return; }
  console.log(JSON.stringify(data, null, 2));
}
check();
