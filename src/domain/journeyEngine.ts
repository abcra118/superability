/**
 * Journey Engine
 * Converts technical GTFS trip data into human-first micro-instructions.
 */

export type StepType = 'WALK' | 'ENTER' | 'PLATFORM' | 'BOARD' | 'DEPART' | 'EXIT' | 'LANDMARK';

export interface JourneyStep {
  id: string;
  type: StepType;
  instruction: string;
  detail?: string;
  landmark?: string;
}

export interface TripData {
  originName: string;
  destinationName: string;
  routeName: string;
  platform?: string;
  stopCount: number;
}

/**
 * Generates a sequence of calm steps for a single-train journey.
 */
export function generateJourneySteps(trip: TripData): JourneyStep[] {
  const steps: JourneyStep[] = [];

  // Logic: Each step is a single action. Simple language.

  steps.push({
    id: 's1',
    type: 'WALK',
    instruction: `Walk to ${trip.originName} Station.`,
  });

  steps.push({
    id: 's2',
    type: 'ENTER',
    instruction: "Enter the station.",
    detail: "Breathe if you need to. You're in the right place."
  });

  steps.push({
    id: 's3',
    type: 'PLATFORM',
    instruction: `Follow signs to Platform ${trip.platform || 'X'}.`,
    detail: `Look for the ${trip.routeName} line signs.`
  });

  steps.push({
    id: 's4',
    type: 'BOARD',
    instruction: `Board the ${trip.routeName} train.`,
    detail: "Wait behind the yellow line for the train to stop."
  });

  steps.push({
    id: 's5',
    type: 'DEPART',
    instruction: `Stay on the train for ${trip.stopCount} ${trip.stopCount === 1 ? 'stop' : 'stops'}.`,
    detail: `Your stop is ${trip.destinationName}.`
  });

  steps.push({
    id: 's6',
    type: 'EXIT',
    instruction: `Exit at ${trip.destinationName} Station.`,
  });

  return steps;
}
