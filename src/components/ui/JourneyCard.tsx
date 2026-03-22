import React from 'react';
import { View, Text } from 'react-native';
import { Journey } from '../../hooks/useJourneySearch';

export const JourneyCard = ({ journey }: { journey: Journey }) => {
  return (
    <View className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-gray-100">
      <View className="flex-row justify-between mb-2">
        <Text className="text-lg font-bold text-gray-900">
          {journey.departureTime} <Text className="text-gray-400 font-normal">→</Text> {journey.arrivalTime}
        </Text>
        <Text className="text-base font-medium text-blue-600">{journey.durationMinutes} min</Text>
      </View>
      <View className="flex-row items-center gap-2 mt-2">
        {journey.legs.map((leg, index) => (
          <View key={leg.id} className="flex-row items-center">
            {index > 0 && <Text className="text-gray-400 mx-1">→</Text>}
            <View className="bg-gray-100 px-2 py-1 rounded-md">
              <Text className="text-xs text-gray-700">{leg.mode} ({leg.durationMinutes}m)</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};
