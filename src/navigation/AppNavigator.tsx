import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, View } from "react-native";
import { HomeScreen } from "../screens/HomeScreen";

const Stack = createNativeStackNavigator();

const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text>{title}</Text>
  </View>
);

const Results = () => <PlaceholderScreen title="Results" />;
const JourneyGuide = () => <PlaceholderScreen title="JourneyGuide" />;

export const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Results" component={Results} />
      <Stack.Screen name="JourneyGuide" component={JourneyGuide} />
    </Stack.Navigator>
  );
};
