import React, { useState } from "react";
import { View, Text } from "react-native";
import { useJourneyStore } from "../store/useJourneyStore";
import { AddressAutocomplete } from "../components/search/AddressAutocomplete";
import { TimeSelector } from "../components/search/TimeSelector";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LocationService } from "../services/LocationService";
import { StatusBadge } from "../components/ui/StatusBadge";

export const HomeScreen = () => {
  const { origin, destination, setOrigin, setDestination } = useJourneyStore();
  const [journeyTime, setJourneyTime] = useState(new Date());
  const [isArrival, setIsArrival] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const handleFindJourney = async () => {
    if (!origin || !destination) return;
    
    setIsSearching(true);
    try {
      const { originStopId, destStopId, originWalkMins, destWalkMins } = await LocationService.resolveJourneyEndpoints(origin, destination);
      
      navigation.navigate("Results", {
        originStopId,
        destStopId,
        originWalkMins,
        destWalkMins,
        time: journeyTime.toISOString(),
        isArrival
      });
    } catch (error) {
      console.error("Failed to find journey", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <View className="flex-1 px-4 py-8 bg-gray-50">
      {isSearching && (
        <View className="absolute inset-0 bg-black/50 z-[100] justify-center items-center" style={{ elevation: 100 }}>
          <View className="bg-white p-6 rounded-xl items-center shadow-lg">
            <ActivityIndicator size="large" color="#0000ff" />
            <Text className="mt-4 text-base font-semibold text-gray-800">
              Finding nearby transit connections...
            </Text>
          </View>
        </View>
      )}
      <Text className="text-2xl font-bold mb-6 text-gray-900">Metro Journey</Text>
      
      <View className="mb-6 z-50 relative" style={{ zIndex: 50, elevation: 5 }}>
        <AddressAutocomplete 
          placeholder="Where from?" 
          onSelect={setOrigin} 
          value={origin?.name}
        />
      </View>

      <View className="mb-6 z-40 relative" style={{ zIndex: 40, elevation: 4 }}>
        <AddressAutocomplete 
          placeholder="Where to?" 
          onSelect={setDestination} 
          value={destination?.name}
        />
      </View>

      <View className="relative z-30 mb-6" style={{ zIndex: 30, elevation: 3 }}>
        <TimeSelector 
          onChange={(date, arrival) => {
            setJourneyTime(date);
            setIsArrival(arrival);
          }} 
        />
      </View>

      <View className="flex-col items-center gap-4 mt-4" style={{ zIndex: 1, elevation: 1 }}>
        <Text className="text-sm font-semibold text-gray-500 mb-2">Dev Sandbox</Text>
        <Text className="text-xs text-center text-gray-600 mb-4 bg-gray-200 px-3 py-1 rounded-full">
          {isArrival ? "Arriving By:" : "Leaving At:"} {journeyTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <PrimaryButton 
          title="Find Journey" 
          disabled={!origin || !destination || isSearching} 
          onPress={handleFindJourney} 
        />
        <View className="flex-row gap-2 mt-4">
          <StatusBadge status="ON_TIME" />
          <StatusBadge status="DELAYED" />
          <StatusBadge status="CANCELLED" />
        </View>
      </View>
    </View>
  );
};
