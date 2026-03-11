'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { JourneyOption, TripResult, TransferResult } from '@/data/gtfs';
import { VehiclePosition, TransitMode } from '@/data/realtime';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Props {
  journey: JourneyOption;
  vehicles?: VehiclePosition[];
  mode?: TransitMode;
}

const MODE_COLORS = {
  metro: '#0072C6',    
  tram: '#FFCD00',     
  metrobus: '#00A651', 
};

export function JourneyMap({ journey, vehicles = [], mode = 'metro' }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [144.9631, -37.8136], 
      zoom: 11,
      pitch: 45,
    });

    mapRef.current = map;

    map.on('load', () => {
      drawJourney(map, journey, mode);
    });

    return () => {
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      drawJourney(mapRef.current, journey, mode);
    }
  }, [journey, mode]);

  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      updateVehicles(mapRef.current, vehicles);
    }
  }, [vehicles]);

  const drawJourney = async (map: mapboxgl.Map, j: JourneyOption, activeMode: TransitMode) => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const stopPoints: { lat: number; lon: number; name: string }[] = [];
    let shapeIds: string[] = [];
    
    if (j.isTransfer) {
      const tj = j as TransferResult;
      tj.leg1_intermediate_stops?.forEach(s => stopPoints.push({ lat: s.stop_lat, lon: s.stop_lon, name: s.name }));
      tj.leg2_intermediate_stops?.forEach(s => stopPoints.push({ lat: s.stop_lat, lon: s.stop_lon, name: s.name }));
      if (tj.leg1_shape_id) shapeIds.push(tj.leg1_shape_id);
      if (tj.leg2_shape_id) shapeIds.push(tj.leg2_shape_id);
    } else {
      const tr = j as TripResult;
      tr.intermediate_stops?.forEach(s => stopPoints.push({ lat: s.stop_lat, lon: s.stop_lon, name: s.name }));
      if (tr.shape_id) shapeIds.push(tr.shape_id);
    }

    if (stopPoints.length === 0) return;

    let routeCoordinates: number[][] = [];

    // Prioritize high-fidelity shapes if available
    if (shapeIds.length > 0) {
      try {
        const shapeResults = await Promise.all(shapeIds.map(async id => {
          const res = await fetch(\`/api/shapes/\${id}\`);
          if (!res.ok) return null;
          const data = await res.json();
          return data.coordinates as number[][];
        }));
        
        // Flatten non-null results
        routeCoordinates = shapeResults.filter(Boolean).flat() as number[][];
      } catch (err) {
        console.error("Failed to fetch high-fidelity shapes, falling back to stops", err);
      }
    }

    // Fallback to stop-to-stop straight lines
    if (routeCoordinates.length === 0) {
      routeCoordinates = stopPoints.map(s => [s.lon, s.lat]);
    }

    const routeColor = MODE_COLORS[activeMode] || MODE_COLORS.metro;

    if (map.getSource('route')) {
      (map.getSource('route') as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: routeCoordinates },
      });
      map.setPaintProperty('route', 'line-color', routeColor);
    } else {
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: routeCoordinates },
        },
      });

      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': routeColor,
          'line-width': 6,
          'line-opacity': 0.8,
        },
      });
    }

    const origin = stopPoints[0];
    const destination = stopPoints[stopPoints.length - 1];

    addMarker(map, origin.lon, origin.lat, '#10b981', origin.name); 
    addMarker(map, destination.lon, destination.lat, '#ef4444', destination.name); 

    const bounds = new mapboxgl.LngLatBounds();
    routeCoordinates.forEach(c => bounds.extend(c as [number, number]));
    map.fitBounds(bounds, { padding: 50, duration: 1000 });
  };

  const addMarker = (map: mapboxgl.Map, lon: number, lat: number, color: string, title: string) => {
    const marker = new mapboxgl.Marker({ color })
      .setLngLat([lon, lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(title))
      .addTo(map);
    markersRef.current.push(marker);
  };

  const updateVehicles = (map: mapboxgl.Map, vehicles: VehiclePosition[]) => {
    const vSourceId = 'vehicles';
    const geojson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: 'FeatureCollection',
      features: vehicles.filter(v => v.latitude && v.longitude).map(v => ({
        type: 'Feature',
        properties: { tripId: v.tripId },
        geometry: {
          type: 'Point',
          coordinates: [v.longitude!, v.latitude!],
        },
      })),
    };

    if (map.getSource(vSourceId)) {
      (map.getSource(vSourceId) as mapboxgl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource(vSourceId, { type: 'geojson', data: geojson });
      map.addLayer({
        id: vSourceId,
        type: 'circle',
        source: vSourceId,
        paint: {
          'circle-radius': 8,
          'circle-color': '#f59e0b',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });
    }
  };

  return (
    <div className="relative w-full h-80 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl mb-8">
      <div ref={mapContainerRef} className="absolute inset-0" />
    </div>
  );
}
