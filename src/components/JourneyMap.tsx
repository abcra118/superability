'use client';

import React, { useEffect, useRef } from 'react';
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
  metro: '#0072C6',    // Metro Blue
  tram: '#FFCD00',     // Yarra Trams Gold/Yellow
  metrobus: '#00A651', // PTV Bus Green
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
      center: [144.9631, -37.8136], // Melbourne
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

  const drawJourney = (map: mapboxgl.Map, j: JourneyOption, activeMode: TransitMode) => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const stops: { lat: number; lon: number; name: string }[] = [];
    
    if (j.isTransfer) {
      const tj = j as TransferResult;
      tj.leg1_intermediate_stops?.forEach(s => stops.push({ lat: s.stop_lat, lon: s.stop_lon, name: s.name }));
      tj.leg2_intermediate_stops?.forEach(s => stops.push({ lat: s.stop_lat, lon: s.stop_lon, name: s.name }));
    } else {
      const tr = j as TripResult;
      tr.intermediate_stops?.forEach(s => stops.push({ lat: s.stop_lat, lon: s.stop_lon, name: s.name }));
    }

    if (stops.length === 0) return;

    const coordinates = stops.map(s => [s.lon, s.lat] as [number, number]);
    const routeColor = MODE_COLORS[activeMode] || MODE_COLORS.metro;

    if (map.getSource('route')) {
      (map.getSource('route') as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates },
      });
      map.setPaintProperty('route', 'line-color', routeColor);
    } else {
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates },
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

    const origin = stops[0];
    const destination = stops[stops.length - 1];

    addMarker(map, origin.lon, origin.lat, '#10b981', origin.name); 
    addMarker(map, destination.lon, destination.lat, '#ef4444', destination.name); 

    const bounds = new mapboxgl.LngLatBounds();
    coordinates.forEach(c => bounds.extend(c));
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
