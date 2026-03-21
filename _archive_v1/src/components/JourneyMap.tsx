'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Map, { Source, Layer, Marker, MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { JourneyOption, TripResult, TransferResult } from '@/data/gtfs';
import { VehiclePosition, TransitMode } from '@/data/realtime';

const MODE_COLORS = {
  metro: '#0072C6',    
  tram: '#FFCD00',     
  metrobus: '#00A651', 
};

interface Props {
  journey: JourneyOption;
  vehicles?: VehiclePosition[];
  mode?: TransitMode;
}

export function JourneyMap({ journey, vehicles = [], mode = 'metro' }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<number[][]>([]);
  const [stopPoints, setStopPoints] = useState<{lat: number, lon: number, name: string}[]>([]);

  useEffect(() => {
    const fetchShapes = async () => {
      const points: { lat: number; lon: number; name: string }[] = [];
      const shapeIds: string[] = [];
      
      if (journey.isTransfer) {
        const tj = journey as TransferResult;
        tj.leg1_intermediate_stops?.forEach(s => points.push({ lat: s.stop_lat, lon: s.stop_lon, name: s.name }));
        tj.leg2_intermediate_stops?.forEach(s => points.push({ lat: s.stop_lat, lon: s.stop_lon, name: s.name }));
        if (tj.leg1_shape_id) shapeIds.push(tj.leg1_shape_id);
        if (tj.leg2_shape_id) shapeIds.push(tj.leg2_shape_id);
      } else {
        const tr = journey as TripResult;
        tr.intermediate_stops?.forEach(s => points.push({ lat: s.stop_lat, lon: s.stop_lon, name: s.name }));
        if (tr.shape_id) shapeIds.push(tr.shape_id);
      }

      setStopPoints(points.filter(p => typeof p.lat === 'number' && typeof p.lon === 'number'));

      let coords: number[][] = [];
      if (shapeIds.length > 0) {
        try {
          const results = await Promise.all(shapeIds.map(async id => {
            const res = await fetch(`/api/shapes/${id}`);
            if (!res.ok) return null;
            const data = await res.json();
            return data.coordinates as number[][];
          }));
          coords = results.filter(Boolean).flat() as number[][];
        } catch (err) {
          console.error("Failed to fetch high-fidelity shapes", err);
        }
      }

      if (coords.length === 0) {
        coords = points.filter(s => s.lon !== undefined && s.lat !== undefined).map(s => [s.lon, s.lat]);
      }
      setRouteCoordinates(coords);
    };

    fetchShapes();
  }, [journey]);

  useEffect(() => {
    if (routeCoordinates.length > 1 && mapRef.current) {
      let minLng = 180, minLat = 90, maxLng = -180, maxLat = -90;
      routeCoordinates.forEach(c => {
        if (!c || c.length < 2) return;
        if (c[0] < minLng) minLng = c[0];
        if (c[0] > maxLng) maxLng = c[0];
        if (c[1] < minLat) minLat = c[1];
        if (c[1] > maxLat) maxLat = c[1];
      });
      
      if (minLng < maxLng && minLat < maxLat) {
        mapRef.current.fitBounds(
          [[minLng, minLat], [maxLng, maxLat]],
          { padding: 50, duration: 1000 }
        );
      }
    }
  }, [routeCoordinates]);

  const geojson = useMemo(() => {
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: routeCoordinates
      }
    };
  }, [routeCoordinates]);

  const vehiclesGeojson = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: vehicles.filter(v => v.latitude && v.longitude).map(v => ({
        type: 'Feature' as const,
        properties: { tripId: v.tripId },
        geometry: {
          type: 'Point' as const,
          coordinates: [v.longitude!, v.latitude!],
        },
      })),
    };
  }, [vehicles]);

  const activeColor = MODE_COLORS[mode] || MODE_COLORS.metro;
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

  if (!token) return <div className="w-full h-80 bg-slate-200 flex items-center justify-center rounded-[2rem]">Missing Mapbox Token</div>;

  return (
    <div className="relative w-full h-80 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl mb-8">
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        initialViewState={{
          longitude: 144.9631,
          latitude: -37.8136,
          zoom: 11,
          pitch: 45
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
      >
        {routeCoordinates.length > 0 && (
          <Source id="routeData" type="geojson" data={geojson}>
            <Layer
              id="routeLine"
              type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{
                'line-color': activeColor,
                'line-width': 6,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

        {vehicles.length > 0 && (
          <Source id="vehiclesData" type="geojson" data={vehiclesGeojson}>
            <Layer
              id="vehiclesPoints"
              type="circle"
              paint={{
                'circle-radius': 8,
                'circle-color': '#f59e0b',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
              }}
            />
          </Source>
        )}

        {stopPoints.length > 0 && stopPoints[0] && (
          <Marker longitude={stopPoints[0].lon} latitude={stopPoints[0].lat} color="#10b981" />
        )}
        {stopPoints.length > 1 && stopPoints[stopPoints.length - 1] && (
          <Marker longitude={stopPoints[stopPoints.length - 1].lon} latitude={stopPoints[stopPoints.length - 1].lat} color="#ef4444" />
        )}
      </Map>
    </div>
  );
}
