// AI-assisted: see docs/AI_LOG.md #2, #4, #21
// src/navigation/TripStack.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ActiveTripScreen from "../screens/trip/ActiveTripScreen";
import HomeScreen from "../screens/trip/HomeScreen";
import TripSummaryScreen from "../screens/trip/TripSummaryScreen";

const Stack = createNativeStackNavigator();

// La solicitud nueva no es una pantalla aparte: HomeScreen la muestra sobre el
// mapa, porque ahí vive la suscripción y el temporizador de useTripRequests
export const TripStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} />
      <Stack.Screen name="TripSummary" component={TripSummaryScreen} />
    </Stack.Navigator>
  );
};
