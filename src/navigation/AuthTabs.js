// AI-assisted: see docs/AI_LOG.md #2, #9
// src/navigation/AuthTabs.js
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useLanguage } from "../contexts/LanguageContext";
import { RegistrationProvider } from "../contexts/RegistrationContext";

import DocumentsScreen from "../screens/auth/DocumentsScreen";
import PersonalInfoScreen from "../screens/auth/PersonalInfoScreen";
import VehicleScreen from "../screens/auth/VehicleScreen";

const Tab = createBottomTabNavigator();

export const AuthTabs = () => {
  const { t } = useLanguage();

  return (
    <RegistrationProvider>
      <Tab.Navigator screenOptions={{ headerShown: true }}>
        <Tab.Screen
          name="PersonalInfo"
          component={PersonalInfoScreen}
          options={{ title: t("tabs.personal") }}
        />
        <Tab.Screen
          name="Vehicle"
          component={VehicleScreen}
          options={{ title: t("tabs.vehicle") }}
        />
        <Tab.Screen
          name="Documents"
          component={DocumentsScreen}
          options={{ title: t("tabs.documents") }}
        />
      </Tab.Navigator>
    </RegistrationProvider>
  );
};
