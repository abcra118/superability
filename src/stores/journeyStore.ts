import { create } from 'zustand';
import { JourneyOption } from '@/data/gtfs';

interface JourneyState {
  selectedJourney: JourneyOption | null;
  fromName: string;
  toName: string;
  setJourney: (journey: JourneyOption, from: string, to: string) => void;
  clear: () => void;
}

export const useJourneyStore = create<JourneyState>((set) => ({
  selectedJourney: null,
  fromName: '',
  toName: '',
  setJourney: (journey, from, to) => set({ selectedJourney: journey, fromName: from, toName: to }),
  clear: () => set({ selectedJourney: null, fromName: '', toName: '' }),
}));
