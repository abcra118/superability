import React from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useJourneySearch } from '../hooks/useJourneySearch';
import { JourneyCard } from '../components/ui/JourneyCard';

type RouteParams = {
  params: {
    originStopId: string;
    destStopId: string;
    originWalkMins: number;
    destWalkMins: number;
    time: string;
    isArrival: boolean;
  };
};

export const ResultsScreen = () => {
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const { originStopId, destStopId, originWalkMins, destWalkMins, time, isArrival } = route.params;

  const { journeys, loading, error } = useJourneySearch(originStopId, destStopId, originWalkMins, destWalkMins, time, isArrival);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-4 text-gray-600">Searching for best routes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-red-500">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 px-4 pt-6">
      <Text className="text-xl font-bold text-gray-900 mb-4">Recommended Journeys</Text>
      <FlatList
        data={journeys}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <JourneyCard journey={item} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};
