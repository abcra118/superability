const fs = require('fs');
const path = require('path');
const p = '/Users/adamcraig/.gemini/antigravity/brain/c6ae6629-5ff5-449f-9110-f0f61a9cd819/metro-journey-app/src/components/JourneyMap.tsx';
let data = fs.readFileSync(p, 'utf8');

// Replace map.remove() with setTimeout and add if (mapRef.current) return;
data = data.replace(
  "if (!mapContainerRef.current) return;",
  "if (!mapContainerRef.current) return;\n    if (mapRef.current) return; // Prevent double init"
);

data = data.replace(
  "return () => {\n      map.remove();\n    };",
  "return () => {\n      setTimeout(() => {\n        if (mapRef.current === map) {\n          map.remove();\n          mapRef.current = null;\n        }\n      }, 0);\n    };"
);

fs.writeFileSync(p, data);
console.log("Success");
