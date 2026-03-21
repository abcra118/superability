import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, View } from "react-native";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { StatusBadge } from "../components/ui/StatusBadge";

const Stack = createNativeStackNavigator();

const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text>{title}</Text>
  </View>
);

const Home = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 16 }}>
    <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Home</Text>
    <PrimaryButton title="Test Button" onPress={() => console.log('pressed')} />
    <PrimaryButton title="Disabled" disabled onPress={() => {}} />
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <StatusBadge status="ON_TIME" />
      <StatusBadge status="DELAYED" />
      <StatusBadge status="CANCELLED" />
    </View>
  </View>
);

const Results = () => <PlaceholderScreen title="Results" />;
const JourneyGuide = () => <PlaceholderScreen title="JourneyGuide" />;

export const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Results" component={Results} />
      <Stack.Screen name="JourneyGuide" component={JourneyGuide} />
    </Stack.Navigator>
  );
};
