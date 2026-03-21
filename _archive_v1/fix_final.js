const fs = require('fs');
const p = 'src/components/JourneyMap.tsx';
let d = fs.readFileSync(p, 'utf8');

// The file literally contains: fetch(\`/api/shapes/\${id}\`);
// We need to replace the backslashes before the backticks and dollar sign
// In regex, \` is \\\` and \$ is \\\$

d = d.replace(/fetch\(\\\`\/api\/shapes\/\\\$\\{id\\}\\\`\);/g, "fetch(`/api/shapes/${id}`);");

fs.writeFileSync(p, d);
console.log("Replaced with regex");
