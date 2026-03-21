import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, View } from "react-native";

const Stack = createNativeStackNavigator();

const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text>{title}</Text>
  </View>
);

const Home = () => <PlaceholderScreen title="Home" />;
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
