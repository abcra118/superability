import { create } from "zustand";

export interface Location {
  name: string;
  lat: number;
  lng: number;
}

export interface JourneyState {
  origin: Location | null;
  destination: Location | null;
  setOrigin: (origin: Location | null) => void;
  setDestination: (destination: Location | null) => void;
}

export const useJourneyStore = create<JourneyState>((set) => ({
  origin: null,
  destination: null,
  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
}));
