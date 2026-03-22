import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface JourneyLeg {
  id: string;
  mode: string;
  durationMinutes: number;
}

export interface Journey {
  id: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  legs: JourneyLeg[];
}

export const useJourneySearch = (originStopId: string, destStopId: string, originWalkMins: number, destWalkMins: number, time: string, isArrival: boolean) => {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchJourneys = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
           throw new Error("Missing Supabase configuration");
        }

        const targetDate = time ? new Date(time).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        const targetTime = time ? new Date(time).toLocaleTimeString('en-US', { hour12: false }) : new Date().toLocaleTimeString('en-US', { hour12: false });
        
        const rpcArgs = { 
          origin_station_id: originStopId, 
          dest_station_id: destStopId, 
          target_time: targetTime, 
          is_arrival: isArrival, 
          target_date: targetDate 
        };

        const [directRes, transferRes] = await Promise.allSettled([
          supabase.rpc('find_trips_path', rpcArgs),
          supabase.rpc('find_trips_with_transfer', rpcArgs),
        ]);

        const rawJourneys: any[] = [];

        if (directRes.status === 'fulfilled' && !directRes.value.error && directRes.value.data) {
          rawJourneys.push(...(directRes.value.data as any[]).map((t: any) => ({ ...t, isTransfer: false })));
        }

        if (transferRes.status === 'fulfilled' && !transferRes.value.error && transferRes.value.data) {
          rawJourneys.push(...(transferRes.value.data as any[]).map((t: any) => ({ ...t, isTransfer: true })));
        }

        const formattedJourneys: Journey[] = rawJourneys.map((j, index) => {
          const depTime = j.isTransfer ? j.leg1_departure : j.origin_departure;
          const arrTime = j.isTransfer ? j.overall_arrival : j.dest_arrival;
          
          let durationMins = 0;
          let newDepTimeStr = '00:00';
          let newArrTimeStr = '00:00';
          let transitMins = 0;

          if (depTime && arrTime) {
              const depParts = depTime.split(':').map(Number);
              const arrParts = arrTime.split(':').map(Number);
              const dMins = depParts[0] * 60 + depParts[1];
              let aMins = arrParts[0] * 60 + arrParts[1];
              if (aMins < dMins) aMins += 24 * 60;
              transitMins = aMins - dMins;
              
              let totalDepMins = dMins - originWalkMins;
              let totalArrMins = aMins + destWalkMins;
              
              if (totalDepMins < 0) totalDepMins += 24 * 60;
              if (totalArrMins >= 24 * 60) totalArrMins -= 24 * 60;

              durationMins = totalArrMins - totalDepMins;
              if (durationMins < 0) durationMins += 24 * 60;

              const formatTime = (totalMins: number) => {
                 const h = Math.floor(totalMins / 60);
                 const m = totalMins % 60;
                 return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
              };
              
              newDepTimeStr = formatTime(totalDepMins);
              newArrTimeStr = formatTime(totalArrMins);
          }
          
          const legs: JourneyLeg[] = [];
          if (originWalkMins > 0) {
            legs.push({ id: `leg-${index}-walk-start`, mode: "Walk", durationMinutes: originWalkMins });
          }

          if (!j.isTransfer) {
            legs.push({ id: `leg-${index}-1`, mode: "Transit", durationMinutes: transitMins });
          } else {
            legs.push({ id: `leg-${index}-1`, mode: "Transit", durationMinutes: Math.floor(transitMins * 0.45) });
            legs.push({ id: `leg-${index}-2`, mode: "Walk", durationMinutes: Math.floor(transitMins * 0.1) });
            legs.push({ id: `leg-${index}-3`, mode: "Transit", durationMinutes: Math.ceil(transitMins * 0.45) });
          }

          if (destWalkMins > 0) {
            legs.push({ id: `leg-${index}-walk-end`, mode: "Walk", durationMinutes: destWalkMins });
          }

          return {
            id: `journey-${index}`,
            departureTime: newDepTimeStr,
            arrivalTime: newArrTimeStr,
            durationMinutes: durationMins,
            legs
          };
        });

        formattedJourneys.sort((a, b) => {
          return isArrival 
            ? b.arrivalTime.localeCompare(a.arrivalTime) 
            : a.departureTime.localeCompare(b.departureTime);
        });

        if (isMounted) setJourneys(formattedJourneys.slice(0, 10));
      } catch (err) {
        if (isMounted) setError(`Debug Error: ${err.message || String(err)}`);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (originStopId && destStopId) {
      if (originStopId.startsWith('fallback') || destStopId.startsWith('fallback')) {
         setError('Origin or Destination not found in transit network.');
         setLoading(false);
      } else {
         fetchJourneys();
      }
    }

    return () => { isMounted = false; };
  }, [originStopId, destStopId, originWalkMins, destWalkMins, time, isArrival]);

  return { journeys, loading, error };
};
