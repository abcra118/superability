const fs = require('fs');
const p = 'src/components/JourneyMap.tsx';
let d = fs.readFileSync(p, 'utf8');
d = d.replace(/fetch\(\\\`\/api\/shapes\/\\\$\\{id\\}\\\`\)/g, "fetch(`/api/shapes/${id}`)");
fs.writeFileSync(p, d);
