const fs = require('fs');

const mapPath = '/Users/adamcraig/.gemini/antigravity/brain/c6ae6629-5ff5-449f-9110-f0f61a9cd819/metro-journey-app/src/components/JourneyMap.tsx';

const simpleMap = `'use client';
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export function JourneyMap(props: any) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [144.9631, -37.8136],
      zoom: 11,
      pitch: 45,
    });

    mapRef.current = map;

    return () => {
      setTimeout(() => {
        if (mapRef.current === map) {
          map.remove();
          mapRef.current = null;
        }
      }, 0);
    };
  }, []);

  return (
    <div className="relative w-full h-80 rounded-[2rem] overflow-hidden border-4 border-slate-900 mb-8" style={{ background: 'red' }}>
      <div ref={mapContainerRef} className="absolute inset-0" />
    </div>
  );
}`;

fs.writeFileSync(mapPath, simpleMap);
console.log("Replaced with simple map");
