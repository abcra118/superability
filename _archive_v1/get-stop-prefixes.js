const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('gtfs_stops')
    .select('stop_id')
    .limit(1000);
  if (error) { console.error(error); return; }
  
  const prefixes = new Set();
  data.forEach(row => {
    if (row.stop_id.includes(':')) {
      prefixes.add(row.stop_id.split(':')[1]);
    } else {
      prefixes.add('numeric');
    }
  });
  console.log("Prefixes found in gtfs_stops:", Array.from(prefixes));
}
check();
