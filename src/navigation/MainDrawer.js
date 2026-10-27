// AI-assisted: see docs/AI_LOG.md #2, #4
// src/navigation/MainDrawer.js
import { createDrawerNavigator } from "@react-navigation/drawer";
import { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import EarningsScreen from "../screens/main/EarningsScreen";
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
const SettingsScreen = () => {
  const { logout } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Text>Configuración</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  logoutButton: {
    marginTop: 20,
    backgroundColor: "#F44336",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
