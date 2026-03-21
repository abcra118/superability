#!/usr/bin/env node
// Metro Guide — GTFS Pathways Import
// Usage: SUPABASE_SERVICE_ROLE_KEY=your_key node --env-file=.env.local scripts/import_pathways.js

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const CSV_PATH = process.argv[2] || '/Users/adamcraig/Downloads/_MConverter.eu_pathways.csv';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) { console.error('NEXT_PUBLIC_SUPABASE_URL not set'); process.exit(1); }
if (!SERVICE_KEY)  { console.error('SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1); }

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

function parseCSV(text) {
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/^"(.*)"$/, '$1').trim());
  return lines.slice(1).map(line => {
    const values = []; let cur = '', inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { values.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    values.push(cur.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (values[i] ?? '').replace(/^"(.*)"$/, '$1'); });
    return obj;
  });
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) { console.error('File not found: ' + CSV_PATH); process.exit(1); }
  const rows = parseCSV(fs.readFileSync(CSV_PATH, 'utf8'));
  console.log(`Parsed ${rows.length} rows. Headers: ${Object.keys(rows[0]).join(', ')}`);

  // Only include columns that actually exist in the CSV to avoid schema errors
  const records = rows.map(r => {
    const rec = {
      pathway_id:       r['pathway_id'],
      from_stop_id:     r['from_stop_id'],
      to_stop_id:       r['to_stop_id'],
      pathway_mode:     parseInt(r['pathway_mode'])     || null,
      // Keep as integer (GTFS spec: 0 or 1), never convert to JS boolean
      is_bidirectional: parseInt(r['is_bidirectional']) === 1 ? 1 : 0,
      traversal_time:   r['traversal_time'] ? parseInt(r['traversal_time']) : null,
    };
    // Only add optional columns if they exist in this CSV
    if (r['length']       !== undefined && r['length']       !== '') rec.length       = parseFloat(r['length']);
    if (r['stair_count']  !== undefined && r['stair_count']  !== '') rec.stair_count  = parseInt(r['stair_count']);
    if (r['max_slope']    !== undefined && r['max_slope']    !== '') rec.max_slope    = parseFloat(r['max_slope']);
    if (r['min_width']    !== undefined && r['min_width']    !== '') rec.min_width    = parseFloat(r['min_width']);
    if (r['signposted_as']!== undefined && r['signposted_as']!== '') rec.signposted_as = r['signposted_as'];
    return rec;
  }).filter(r => r.pathway_id && r.from_stop_id && r.to_stop_id);

  console.log(`Prepared ${records.length} valid records. Sample:`, records[0]);

  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH) {
    const { error } = await sb.from('gtfs_pathways').upsert(records.slice(i, i + BATCH), { onConflict: 'pathway_id' });
    if (error) { console.error(`\nUpsert error at batch ${Math.floor(i/BATCH)+1}:`, error.message); process.exit(1); }
    inserted += Math.min(BATCH, records.length - i);
    process.stdout.write(`\r  ${inserted}/${records.length} rows upserted...`);
  }
  console.log(`\nDone! ${inserted} pathways imported into gtfs_pathways.`);
}

main().catch(err => { console.error(err); process.exit(1); });
