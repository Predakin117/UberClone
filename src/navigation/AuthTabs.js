// AI-assisted: see docs/AI_LOG.md #2
// src/navigation/AuthTabs.js
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { RegistrationProvider } from "../contexts/RegistrationContext";

import DocumentsScreen from "../screens/auth/DocumentsScreen";
import PersonalInfoScreen from "../screens/auth/PersonalInfoScreen";
import VehicleScreen from "../screens/auth/VehicleScreen";

const Tab = createBottomTabNavigator();

export const AuthTabs = () => {
  return (
    <RegistrationProvider>
      <Tab.Navigator screenOptions={{ headerShown: true }}>
        <Tab.Screen
          name="PersonalInfo"
          component={PersonalInfoScreen}
          options={{ title: "1. Datos" }}
        />
        <Tab.Screen
          name="Vehicle"
          component={VehicleScreen}
          options={{ title: "2. Vehículo" }}
        />
        <Tab.Screen
          name="Documents"
          component={DocumentsScreen}
          options={{ title: "3. Docs" }}
        />
      </Tab.Navigator>
    </RegistrationProvider>
  );
};
