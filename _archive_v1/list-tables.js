const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_tables_info');
  if (error) {
    // If RPC doesn't exist, try a standard query to some meta info if possible
    // or just try to guess some table names based on common GTFS.
    console.error("RPC Error:", error.message);
    console.log("Guessing table names...");
    const guesses = ['gtfs_stops', 'gtfs_routes', 'gtfs_trips', 'gtfs_stop_times', 'gtfs_calendar', 'stops', 'tram_stops', 'bus_stops'];
    for (const g of guesses) {
       const { count, error } = await supabase.from(g).select('*', { count: 'exact', head: true });
       if (!error) console.log(`Table exists: ${g} (${count} rows)`);
    }
    return;
  }
  console.log(JSON.stringify(data, null, 2));
}
check();
