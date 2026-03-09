-- DEBUGGING SCRIPT: Why can't we find Glen Huntly to Ormond?

-- 1. Check if both stations exist and see their location_type
SELECT stop_id, stop_name, location_type, parent_station 
FROM gtfs_stops 
WHERE stop_name ILIKE '%Glen Huntly%' OR stop_name ILIKE '%Ormond%';

-- 2. Check if there are any trips passing through either station
-- (Change the IDs below based on the result of Query 1)
-- Example: 19991 is Glen Huntly, 19992 is Ormond
SELECT trip_id, stop_sequence, arrival_time 
FROM gtfs_stop_times 
WHERE stop_id IN (
  SELECT stop_id FROM gtfs_stops WHERE stop_name ILIKE '%Glen Huntly%'
)
LIMIT 10;

-- 3. Check for any direct trip between the two
-- This tests the core logic of the find_trips_path RPC manually
SELECT count(*) 
FROM gtfs_stop_times s1
JOIN gtfs_stop_times s2 ON s1.trip_id = s2.trip_id
WHERE s1.stop_id IN (SELECT stop_id FROM gtfs_stops WHERE stop_name ILIKE '%Glen Huntly%')
  AND s2.stop_id IN (SELECT stop_id FROM gtfs_stops WHERE stop_name ILIKE '%Ormond%')
  AND s1.stop_sequence < s2.stop_sequence;
