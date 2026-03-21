const fs = require('fs');
const p = 'src/components/JourneyMap.tsx';
let d = fs.readFileSync(p, 'utf8');

const bad = 'fetch(\\`/api/shapes/\\${id}\\`);';
const good = 'fetch(`/api/shapes/${id}`);';

if (d.includes(bad)) {
  d = d.replace(bad, good);
  fs.writeFileSync(p, d);
  console.log("Fixed!");
} else {
  console.log("Not found.");
}
