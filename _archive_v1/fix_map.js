const fs = require('fs');
const path = require('path');

const mapPath = '/Users/adamcraig/.gemini/antigravity/brain/c6ae6629-5ff5-449f-9110-f0f61a9cd819/metro-journey-app/src/components/JourneyMap.tsx';
let mapCode = fs.readFileSync(mapPath, 'utf8');

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
  
if (regex.test(mapCode)) {
  fs.writeFileSync(mapPath, mapCode.replace(regex, replacement));
  console.log("Success Map");
} else {
  console.log("Target Map NOT FOUND via regex");
}
