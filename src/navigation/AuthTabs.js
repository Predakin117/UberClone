// AI-assisted: see docs/AI_LOG.md #2, #9, #13, #54
// src/navigation/AuthTabs.js
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RegistrationStepBar from "../components/RegistrationStepBar";
import { useLanguage } from "../contexts/LanguageContext";
import { RegistrationProvider } from "../contexts/RegistrationContext";

import DocumentsScreen from "../screens/auth/DocumentsScreen";
import PersonalInfoScreen from "../screens/auth/PersonalInfoScreen";
import VehicleScreen from "../screens/auth/VehicleScreen";
import VerifyEmailScreen from "../screens/auth/VerifyEmailScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const RegistrationTabs = () => {
  const { t } = useLanguage();

  return (
    // The step bar with the % goes on top and replaces the header: each screen
    // shows its own title
    <Tab.Navigator
      tabBar={(props) => <RegistrationStepBar {...props} />}
      screenOptions={{ headerShown: false, tabBarPosition: "top" }}
    >
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
  );
};

// route.params.account ({ email, phone }) comes from the sign-up or the login.
// Email confirmation sits on top of the tabs, inside the same
// RegistrationProvider, so it can use the form data.
export const AuthTabs = ({ route }) => {
  const { t } = useLanguage();

  return (
    <RegistrationProvider account={route?.params?.account}>
      <Stack.Navigator>
        <Stack.Screen
          name="RegistrationTabs"
          component={RegistrationTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VerifyEmail"
          component={VerifyEmailScreen}
          options={{ title: t("verify.title") }}
        />
      </Stack.Navigator>
    </RegistrationProvider>
  );
};
