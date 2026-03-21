import React from "react";
import { View, Text } from "react-native";
import { useJourneyStore } from "../store/useJourneyStore";
import { AddressAutocomplete } from "../components/search/AddressAutocomplete";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { StatusBadge } from "../components/ui/StatusBadge";

export const HomeScreen = () => {
  const { origin, destination, setOrigin, setDestination } = useJourneyStore();

  return (
    <View className="flex-1 px-4 py-8 bg-gray-50">
      <Text className="text-2xl font-bold mb-6 text-gray-900">Metro Journey</Text>
      
      <View className="mb-6 z-50 relative" style={{ zIndex: 50, elevation: 5 }}>
        <AddressAutocomplete 
          placeholder="Where from?" 
          onSelect={setOrigin} 
          value={origin?.name}
        />
      </View>

      <View className="mb-8 z-40 relative" style={{ zIndex: 40, elevation: 4 }}>
        <AddressAutocomplete 
          placeholder="Where to?" 
          onSelect={setDestination} 
          value={destination?.name}
        />
      </View>

      <View className="flex-col items-center gap-4 mt-8" style={{ zIndex: 1, elevation: 1 }}>
        <Text className="text-sm font-semibold text-gray-500 mb-2">Dev Sandbox</Text>
        <PrimaryButton title="Test Button" onPress={() => console.log("pressed")} />
        <PrimaryButton title="Disabled" disabled onPress={() => {}} />
        <View className="flex-row gap-2 mt-4">
          <StatusBadge status="ON_TIME" />
          <StatusBadge status="DELAYED" />
          <StatusBadge status="CANCELLED" />
        </View>
      </View>
    </View>
  );
};
