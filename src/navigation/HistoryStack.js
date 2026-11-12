// AI-assisted: see docs/AI_LOG.md #60
// History of the side menu: the trip list and, on top, the details of the
// trip the driver taps (section 6).
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../config/theme";
import { useLanguage } from "../contexts/LanguageContext";
import HistoryScreen from "../screens/main/HistoryScreen";
import TripDetailScreen from "../screens/main/TripDetailScreen";

const Stack = createNativeStackNavigator();

export const HistoryStack = () => {
  const { t } = useLanguage();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerTintColor: colors.black,
        headerTitleStyle: { fontWeight: "700" },
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      {/* The list uses the side menu header, with the menu button */}
      <Stack.Screen
        name="HistoryList"
        component={HistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TripDetail"
        component={TripDetailScreen}
        options={{ title: t("tripDetail.title") }}
      />
    </Stack.Navigator>
  );
};
