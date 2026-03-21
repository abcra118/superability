const fs = require('fs');
const mapPath = '/Users/adamcraig/.gemini/antigravity/brain/c6ae6629-5ff5-449f-9110-f0f61a9cd819/metro-journey-app/src/components/JourneyMap.tsx';

const webglCheckMap = `'use client';
import React, { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';

export function JourneyMap(props: any) {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setSupported(mapboxgl.supported());
  }, []);

  return (
    <div className="relative w-full h-80 rounded-[2rem] overflow-hidden border-4 border-slate-900 mb-8 flex items-center justify-center font-black text-2xl text-white" style={{ background: supported ? 'green' : 'red' }}>
      WebGL Supported: {supported === null ? 'Checking...' : supported ? 'YES' : 'NO'}
    </div>
  );
}`;

fs.writeFileSync(mapPath, webglCheckMap);
console.log("Replaced with WebGL check map");
