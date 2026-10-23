// AI-assisted: see docs/AI_LOG.md #2
// src/navigation/TripStack.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, View } from "react-native";

const Stack = createNativeStackNavigator();

// Mocks temporales de las pantallas del mapa y flujo
const HomeScreen = () => (
  <View>
    <Text>Mapa - Inicio (Disponible/Desconectado)</Text>
  </View>
);
const IncomingRequestScreen = () => (
  <View>
    <Text>Solicitud Entrante (15 seg)</Text>
  </View>
);
const ActiveTripScreen = () => (
  <View>
    <Text>Viaje en Curso</Text>
  </View>
);
const TripSummaryScreen = () => (
  <View>
    <Text>Cobro y Resumen</Text>
  </View>
);

export const TripStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="IncomingRequest" component={IncomingRequestScreen} />
      <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} />
      <Stack.Screen name="TripSummary" component={TripSummaryScreen} />
    </Stack.Navigator>
  );
};
