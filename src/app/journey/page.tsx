'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface IntermediateStop {
  name: string;
  sequence: number;
  arrival: string;
  mins_to_go: number;
}

interface Step {
  title: string;
  instruction: string;
  detail: string;
  intermediaries?: IntermediateStop[];
  isTransferAction?: boolean;
}

export default function JourneyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedStops, setCompletedStops] = useState<Set<number>>(new Set());

  const type = searchParams.get('type') || 'direct';
  const from = searchParams.get('from') || 'Origin';
  const to = searchParams.get('to') || 'Destination';

  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    const s: Step[] = [];

    if (type === 'transfer') {
      const leg1Headsign = searchParams.get('leg1_headsign');
      const leg1Platform = searchParams.get('leg1_platform') || 'TBA';
      const leg1Inter = JSON.parse(searchParams.get('leg1_intermediates') || '[]');
      const hubName = searchParams.get('transfer_hub');
      const transferPfFrom = searchParams.get('transfer_pf_from');
      const transferPfTo = searchParams.get('transfer_pf_to');
      const transferMins = searchParams.get('transfer_mins');
      const leg2Headsign = searchParams.get('leg2_headsign');
      const leg2Platform = searchParams.get('leg2_platform') || 'TBA';
      const leg2Inter = JSON.parse(searchParams.get('leg2_intermediates') || '[]');
      const leg2Arrival = searchParams.get('leg2_arrival');

      s.push({
        title: "Initial Boarding",
        instruction: `Find Platform ${leg1Platform} at ${from}`,
        detail: `Look for the "${leg1Headsign}" train. Take your time.`
      });
      s.push({
        title: "The First Leg",
        instruction: `Ride to ${hubName}`,
        detail: `You'll pass ${leg1Inter.length} stations. Tick them off as you go.`,
        intermediaries: leg1Inter
      });
      s.push({
        title: "Transfer Required",
        instruction: `Change at ${hubName}`,
        detail: `Leave Platform ${transferPfFrom} and walk to Platform ${transferPfTo}. It's a ~${transferMins} min walk.`,
        isTransferAction: true
      });
      s.push({
        title: "Final Boarding",
        instruction: `Find Platform ${leg2Platform}`,
        detail: `Look for the "${leg2Headsign}" train. This is your final train.`
      });
      s.push({
        title: "The Final Leg",
        instruction: `Heading to ${to}`,
        detail: `Arriving at ${leg2Arrival?.substring(0,5)}. Almost there.`,
        intermediaries: leg2Inter
      });
    } else {
      const headsign = searchParams.get('headsign');
      const platform = searchParams.get('platform') || 'TBA';
      const inter = JSON.parse(searchParams.get('intermediates') || '[]');
      const depTime = searchParams.get('departure_time');

      s.push({
        title: "Find Your Train",
        instruction: `Find Platform ${platform} at ${from}`,
        detail: `Look for the "${headsign}" train departing at ${depTime?.substring(0,5)}.`
      });
      s.push({
        title: "The Journey",
        instruction: `Staying on to ${to}`,
        detail: `Pass ${inter.length} stations. Follow the list below.`,
        intermediaries: inter
      });
    }

    s.push({
      title: "Arrived",
      instruction: `Welcome to ${to}`,
      detail: "You've successfully completed your journey. Have a great day!"
    });

    setSteps(s);
  }, [searchParams, from, to, type]);

  const toggleStop = (id: number) => {
    const newSet = new Set(completedStops);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setCompletedStops(newSet);
  };

  if (steps.length === 0) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <main className="max-w-xl mx-auto px-6 py-12 min-h-screen bg-slate-50 flex flex-col">
      <header className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Step {currentStep + 1} of {steps.length}</span>
          <button className="text-xs font-black text-slate-500 uppercase" onClick={() => router.push('/')}>Quit</button>
        </div>
        <h1 className="text-4xl font-black text-slate-900 leading-tight">{step.title}</h1>
        <div className="w-full h-2 bg-slate-200 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-brand-blue transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
      </header>

      <div className="flex-grow space-y-8">
        <div className={`p-8 rounded-[2.5rem] bg-white border-2 shadow-sm ${step.isTransferAction ? 'border-amber-200 shadow-amber-100' : 'border-slate-50 shadow-slate-100'}`}>
           <h2 className="text-3xl font-black text-slate-900 mb-4">{step.instruction}</h2>
           <p className="text-xl font-bold text-slate-500 leading-relaxed italic border-l-4 border-brand-blue pl-6">
             {step.detail}
           </p>
        </div>

        {step.intermediaries && step.intermediaries.length > 0 && (
          <div className="space-y-4 pb-12">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Intermediate Stops</h3>
            <div className="space-y-6 pl-4 border-l-4 border-slate-200">
               {step.intermediaries.map((s, i) => {
                 const isCompleted = completedStops.has(s.sequence);
                 const minsLabel = s.mins_to_go > 0 ? `${s.mins_to_go}m to go` : "Next stop";
                 return (
                   <button 
                     key={i} 
                     className="flex items-start gap-4 w-full text-left group"
                     onClick={() => toggleStop(s.sequence)}
                   >
                     <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center flex-shrink-0 transition-all ${isCompleted ? 'bg-brand-blue border-brand-blue' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}>
                       {isCompleted && <span className="text-white text-xs font-black">✓</span>}
                     </div>
                     <div className="flex-1">
                        <p className={`text-xl font-black leading-none ${isCompleted ? 'text-slate-300 line-through' : 'text-slate-800'}`}>{s.name}</p>
                        <p className={`text-xs font-black uppercase tracking-wider mt-1 ${isCompleted ? 'text-slate-200' : 'text-brand-blue'}`}>
                          {isCompleted ? "Arrived" : minsLabel}
                        </p>
                     </div>
                   </button>
                 );
               })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-12">
        {currentStep < steps.length - 1 ? (
          <button 
            className="w-full py-8 text-3xl font-black bg-brand-blue text-white rounded-[2rem] shadow-xl hover:bg-brand-blue-dark active:scale-[0.98] transition-all"
            onClick={() => setCurrentStep(prev => prev + 1)}
          >
            {currentStep === steps.length - 2 ? "Finish Journey" : "Next Step"} →
          </button>
        ) : (
          <button 
            className="w-full py-8 text-3xl font-black bg-slate-900 text-white rounded-[2rem] shadow-xl"
            onClick={() => router.push('/')}
          >
            Done
          </button>
        )}
      </div>
    </main>
  );
}
