const fs = require('fs');

const guidePath = '/Users/adamcraig/.gemini/antigravity/brain/c6ae6629-5ff5-449f-9110-f0f61a9cd819/metro-journey-app/src/components/JourneyGuide.tsx';
let guideCode = fs.readFileSync(guidePath, 'utf8');

// 1. Add dynamic import
if (!guideCode.includes("import dynamic from 'next/dynamic';")) {
  guideCode = guideCode.replace(
    "import { useRouter } from 'next/navigation';",
    "import { useRouter } from 'next/navigation';\nimport dynamic from 'next/dynamic';"
  );
}

// 2. Replace the static import with dynamic
if (guideCode.includes("import { JourneyMap } from './JourneyMap';")) {
  guideCode = guideCode.replace(
    "import { JourneyMap } from './JourneyMap';",
    "const JourneyMap = dynamic(() => import('./JourneyMap').then(mod => mod.JourneyMap), { ssr: false, loading: () => <div className=\"w-full h-80 rounded-[2rem] bg-slate-200 animate-pulse mb-8\"></div> });"
  );
}

fs.writeFileSync(guidePath, guideCode);
console.log("Success Guide");
