const fs = require('fs');
const p = 'src/components/JourneyMap.tsx';
let d = fs.readFileSync(p, 'utf8');

const target = '<div ref={mapContainerRef} className="absolute inset-0" />';
const replacement = '<style>{`.mapboxgl-canvas { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; display: block !important; }`}</style>\n      <div ref={mapContainerRef} className="absolute inset-0 bg-slate-100" />';

if (d.includes(target)) {
  d = d.replace(target, replacement);
  fs.writeFileSync(p, d);
  console.log("Injected style bypass");
} else {
  console.log("Target not found");
}

