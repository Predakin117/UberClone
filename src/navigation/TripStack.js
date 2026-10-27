// AI-assisted: see docs/AI_LOG.md #2, #4
// src/navigation/TripStack.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ActiveTripScreen from "../screens/trip/ActiveTripScreen";
import HomeScreen from "../screens/trip/HomeScreen";
import IncomingRequestScreen from "../screens/trip/IncomingRequestScreen";
import TripSummaryScreen from "../screens/trip/TripSummaryScreen";

const Stack = createNativeStackNavigator();

export const TripStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      {/* Se muestra como overlay semitransparente sobre el mapa */}
      <Stack.Screen
        name="IncomingRequest"
        component={IncomingRequestScreen}
        options={{ presentation: "transparentModal", animation: "fade" }}
      />
      <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} />
      <Stack.Screen name="TripSummary" component={TripSummaryScreen} />
    </Stack.Navigator>
  );
};
