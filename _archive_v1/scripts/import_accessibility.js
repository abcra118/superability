#!/usr/bin/env node
// =====================================================================
// Metro Guide — Accessibility CSV Import Script
// =====================================================================
// Usage:
//   node --env-file=.env.local /tmp/import_accessibility.js /path/to/your/data.csv
//
// The script:
//   1. Reads your CSV
//   2. Looks up each station by name in gtfs_stops to find its parent_station ID
//   3. Upserts into station_accessibility + station_patronage
// =====================================================================

const fs   = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const CSV_PATH = process.argv[2];
if (!CSV_PATH) {
  console.error('Usage: node import_accessibility.js /path/to/data.csv');
  process.exit(1);
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  // swap for service_role key for writes
);

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseBoolean(val) {
  if (!val) return null;
  return val.trim().toLowerCase() === 'yes';
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    // Handle commas inside quoted fields
    const values = [];
    let cur = '', inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { values.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    values.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const raw = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCSV(raw);
  console.log(`\nParsed ${rows.length} rows from CSV.\n`);

  // Fetch all parent stations from gtfs_stops (location_type=1 = station)
  const { data: allStations, error } = await sb
    .from('gtfs_stops')
    .select('stop_id,stop_name')
    .eq('location_type', 1);

  if (error) {
    console.error('Failed to fetch gtfs_stops:', error.message);
    console.error('⚠️  If you see an auth error, replace ANON_KEY with your Supabase SERVICE_ROLE key.');
    process.exit(1);
  }

  // Build a name lookup map (normalised: lowercase, no "Railway Station" suffix)
  const normalise = (name) =>
    name.toLowerCase()
      .replace(/\s*railway station\s*/gi, '')
      .replace(/\s*train station\s*/gi, '')
      .replace(/\s*station\s*$/gi, '')
      .trim();

  const stationByName = new Map(
    allStations.map(s => [normalise(s.stop_name), s.stop_id])
  );

  const accessRows = [];
  const patronageRows = [];
  const unmatched = [];

  for (const row of rows) {
    const key = normalise(row['Stop_name']);
    const stationId = stationByName.get(key);

    if (!stationId) {
      unmatched.push(row['Stop_name']);
      continue;
    }

    accessRows.push({
      station_id:           stationId,
      station_name:         row['Stop_name'],
      ptv_stop_id:          row['Stop_ID'] || null,
      stop_lat:             parseFloat(row['Stop_lat']) || null,
      stop_lon:             parseFloat(row['Stop_long']) || null,
      station_access:       parseBoolean(row['Station access']),
      is_staffed:           parseBoolean(row['Staffed']),
      has_escalators:       parseBoolean(row['Escalators']),
      has_lift:             parseBoolean(row['Lift']),
      independent_boarding: parseBoolean(row['Independent boarding']),
      has_shelter:          parseBoolean(row['Shelter']),
      is_low_platform:      parseBoolean(row['Low platform']),
      has_tactile_edges:    parseBoolean(row['Tactile edges']),
      has_hearing_loop:     parseBoolean(row['Hearing loop']),
      has_info_screens:     parseBoolean(row['Info screens']),
      adequate_path_widths: parseBoolean(row['Path widths']),
      has_accessible_toilet: parseBoolean(row['Accessible toilet']),
      has_parking:          parseBoolean(row['Parking']),
      has_pickup_dropoff:   parseBoolean(row['Pick up / Drop off']),
    });

    patronageRows.push({
      station_id:           stationId,
      pax_am_peak:          parseInt(row['Pax_AM_peak'])         || null,
      pax_pm_peak:          parseInt(row['Pax_PM_peak'])         || null,
      pax_pm_late:          parseInt(row['Pax_PM_late'])         || null,
      pax_interpeak:        parseInt(row['Pax_interpeak'])       || null,
      pax_pre_am_peak:      parseInt(row['Pax_pre_AM_peak'])     || null,
      pax_norm_weekday:     parseInt(row['Pax_norm_weekday'])    || null,
      pax_weekday:          parseInt(row['Pax_weekday'])         || null,
      pax_sch_hol_weekday:  parseInt(row['Pax_sch_hol_weekday']) || null,
      pax_saturday:         parseInt(row['Pax_Saturday'])        || null,
      pax_sunday:           parseInt(row['Pax_Sunday'])          || null,
      pax_annual:           parseInt(row['Pax_annual'])          || null,
    });

    console.log(`✅  ${row['Stop_name'].padEnd(30)} → ${stationId}`);
  }

  if (unmatched.length > 0) {
    console.log('\n⚠️  Could not match these station names to gtfs_stops:');
    unmatched.forEach(n => console.log(`   ✗ ${n}`));
    console.log('\nFor each unmatched station, find its ID by running:');
    console.log("   SELECT stop_id, stop_name FROM gtfs_stops WHERE location_type = 1 AND stop_name ILIKE '%NAME%';");
    console.log('Then add a manual mapping in the stationByName override below.\n');
  }

  if (accessRows.length === 0) {
    console.error('\nNo rows matched. Aborting.');
    process.exit(1);
  }

  // ── Upsert accessibility data ──────────────────────────────────────────────
  console.log(`\nUpserting ${accessRows.length} rows into station_accessibility...`);
  const { error: e1 } = await sb
    .from('station_accessibility')
    .upsert(accessRows, { onConflict: 'station_id' });
  if (e1) { console.error('station_accessibility error:', e1.message); process.exit(1); }
  console.log('✅  station_accessibility done.');

  // ── Upsert patronage data ─────────────────────────────────────────────────
  console.log(`Upserting ${patronageRows.length} rows into station_patronage...`);
  const { error: e2 } = await sb
    .from('station_patronage')
    .upsert(patronageRows, { onConflict: 'station_id' });
  if (e2) { console.error('station_patronage error:', e2.message); process.exit(1); }
  console.log('✅  station_patronage done.');

  console.log(`\n🎉  Import complete! ${accessRows.length} stations loaded.`);
  if (unmatched.length > 0) console.log(`   ${unmatched.length} stations could not be matched — see warnings above.`);
}

main().catch(err => { console.error(err); process.exit(1); });
