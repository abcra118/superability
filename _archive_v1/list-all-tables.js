const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_tables');
  if (error) {
    console.error("RPC Error:", error.message);
    // fallback to querying information_schema if possible, but RPC is better.
    // Let's try to query a common table and see if it has siblings.
    return;
  }
  console.log(JSON.stringify(data, null, 2));
}
check();
