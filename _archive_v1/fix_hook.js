const fs = require('fs');
const p = 'src/components/JourneyMap.tsx';
let d = fs.readFileSync(p, 'utf8');

const badCleanup = 
`    return () => {
      setTimeout(() => {
        if (mapRef.current === map) {
          map.remove();
          mapRef.current = null;
        }
      }, 0);
    };`;

const goodCleanup =
`    return () => {
      if (map) map.remove();
      mapRef.current = null;
    };`;

if (d.includes(badCleanup)) {
  d = d.replace(badCleanup, goodCleanup);
  fs.writeFileSync(p, d);
  console.log("Hook fixed!");
} else {
  console.log("Hook not found");
}

