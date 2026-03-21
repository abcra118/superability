// try querying via fetch to the actual supabase url 
// or test API inserting a dummy row if allowed
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const table = 'gtfs_tram_stops';
  // Try inserting a dummy row to test permissions or get an error back
  // Or just try to read with service_role if available (but we only have ANON_KEY)
  const { data, error } = await supabase.from(table).select('*').limit(1);
  console.log('Select result:', data, 'Error:', error?.message);
}
check();
