const fs = require('fs');

const mapPath = '/Users/adamcraig/.gemini/antigravity/brain/c6ae6629-5ff5-449f-9110-f0f61a9cd819/metro-journey-app/src/components/JourneyMap.tsx';
let code = fs.readFileSync(mapPath, 'utf8');

// Ensure Mapbox CSS import is present
if (!code.includes("import 'mapbox-gl/dist/mapbox-gl.css';")) {
  code = code.replace("import mapboxgl from 'mapbox-gl';", "import mapboxgl from 'mapbox-gl';\nimport 'mapbox-gl/dist/mapbox-gl.css';");
}

// Add a style tag inside the component to absolutely FORCE the mapbox canvas to be visible
const styleTag = `<style>{\`.mapboxgl-canvas { position: absolute !important; top: 0; left: 0; width: 100% !important; height: 100% !important; display: block !important; }\`}</style>`;

code = code.replace(
  '<div ref={mapContainerRef} className="absolute inset-0" />',
  `${styleTag}\n      <div ref={mapContainerRef} className="absolute inset-0" />`
);

// Apply strict mode fix
const regex = /useEffect\(\(\) => \{[\s\S]*?const map = new mapboxgl\.Map\(\{[\s\S]*?\}, \[\]\);/;
const replacement = `useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [144.9631, -37.8136], 
      zoom: 11,
      pitch: 45,
    });

    mapRef.current = map;

    map.on('load', () => {
      map.resize();
      drawJourney(map, journey, mode);
    });

    return () => {
      if (mapRef.current === map) {
        map.remove();
        mapRef.current = null;
      }
    };
  }, []);`;
  
code = code.replace(regex, replacement);

fs.writeFileSync(mapPath, code);
console.log("Restored and patched Mapbox component");
