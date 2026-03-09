'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useJourneyStore } from '@/stores/journeyStore';
import { JourneyGuide } from '@/components/JourneyGuide';

export default function JourneyPage() {
  const router  = useRouter();
  const { selectedJourney, fromName, toName } = useJourneyStore();

  if (!selectedJourney) {
    return (
      <main className="max-w-xl mx-auto px-6 py-20 text-center">
        <h1 className="text-3xl font-black text-slate-800 mb-4">No Journey Selected</h1>
        <p className="text-slate-500 mb-8">Please search for a journey first.</p>
        <button
          className="bg-brand-blue text-white font-black px-8 py-4 rounded-2xl"
          onClick={() => router.push('/')}
        >
          Back to Search
        </button>
      </main>
    );
  }

  return <JourneyGuide journey={selectedJourney} fromName={fromName} toName={toName} />;
}
