// AI-assisted: see docs/AI_LOG.md #2
// src/navigation/MainDrawer.js
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Text, View } from "react-native";
import { TripStack } from "./TripStack";

const Drawer = createDrawerNavigator();

// Mocks temporales
const ProfileScreen = () => (
  <View>
    <Text>Perfil del Conductor</Text>
  </View>
);
const HistoryScreen = () => (
  <View>
    <Text>Historial de Carreras</Text>
  </View>
);
const EarningsScreen = () => (
  <View>
    <Text>Ganancias</Text>
  </View>
);
const SettingsScreen = () => (
  <View>
    <Text>Configuración</Text>
  </View>
);

export const MainDrawer = () => {
  return (
    <Drawer.Navigator initialRouteName="TripFlow">
      <Drawer.Screen
        name="TripFlow"
        component={TripStack}
        options={{ title: "Inicio" }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Mi Perfil" }}
      />
      <Drawer.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: "Historial" }}
      />
      <Drawer.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ title: "Mis Ganancias" }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Configuración" }}
      />
    </Drawer.Navigator>
  );
};
