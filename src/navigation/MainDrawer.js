// AI-assisted: see docs/AI_LOG.md #2, #4, #57, #28, #30, #60
// src/navigation/MainDrawer.js
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "../config/theme";
import { AuthContext } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import EarningsScreen from "../screens/main/EarningsScreen";
import ProfileScreen from "../screens/main/ProfileScreen";
import SettingsScreen from "../screens/main/SettingsScreen";
import { HistoryStack } from "./HistoryStack";
import { TripStack } from "./TripStack";

const Drawer = createDrawerNavigator();

// Panel of the menu: the driver on a black header, the screens and logout
const DrawerContent = (props) => {
  const { driverData, logout } = useContext(AuthContext);
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const name = driverData?.name?.trim();
  const initial = (name || t("drawer.driver")).charAt(0).toUpperCase();

  return (
    <View style={styles.drawer}>
      <View style={[styles.profile, { paddingTop: insets.top + spacing.xl }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.greeting} numberOfLines={1}>
          {name
            ? t("drawer.greeting").replace("{name}", name)
            : t("drawer.driver")}
        </Text>
        {name && <Text style={styles.role}>{t("drawer.driver")}</Text>}
      </View>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.items}
      >
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <TouchableOpacity
        style={[
          styles.drawerLogout,
          { marginBottom: Math.max(insets.bottom, spacing.lg) },
        ]}
        onPress={logout}
        accessibilityRole="button"
      >
        <Text style={styles.drawerLogoutText}>{t("drawer.logout")}</Text>
      </TouchableOpacity>
    </View>
  );
};

export const MainDrawer = () => {
  const { t } = useLanguage();

  return (
    <Drawer.Navigator
      initialRouteName="TripFlow"
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShadowVisible: false,
        headerTintColor: colors.black,
        headerTitleStyle: { fontWeight: "700" },
        drawerActiveBackgroundColor: colors.surface,
        drawerActiveTintColor: colors.black,
        drawerInactiveTintColor: colors.textSecondary,
        drawerLabelStyle: { fontSize: 17, fontWeight: "600" },
        drawerItemStyle: { borderRadius: radius.sm },
      }}
    >
      <Drawer.Screen
        name="TripFlow"
        component={TripStack}
        // The map has its own menu button and the current trip its black
        // banner: without a header they use the whole screen. Only the trip
        // summary keeps the header.
        options={({ route }) => ({
          title: t("drawer.home"),
          headerShown:
            (getFocusedRouteNameFromRoute(route) ?? "Home") === "TripSummary",
        })}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t("drawer.profile") }}
      />
      <Drawer.Screen
        name="History"
        component={HistoryStack}
        // AI-assisted: see docs/AI_LOG.md #60
        // The trip details have their own header with the back arrow, and
        // opening History from the menu always starts at the list
        options={({ route }) => ({
          title: t("drawer.history"),
          headerShown:
            (getFocusedRouteNameFromRoute(route) ?? "HistoryList") ===
            "HistoryList",
          popToTopOnBlur: true,
        })}
      />
      <Drawer.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ title: t("drawer.earnings") }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t("drawer.settings") }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawer: { flex: 1, backgroundColor: colors.white },
  profile: {
    backgroundColor: colors.black,
    paddingHorizontal: spacing.xl - 4,
    paddingBottom: spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: colors.black },
  greeting: { ...typography.section, color: colors.white },
  role: { fontSize: 14, color: colors.disabledText, marginTop: spacing.xs },
  items: { paddingTop: spacing.md },
  drawerLogout: {
    marginHorizontal: spacing.lg,
    minHeight: 52,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerLogoutText: { fontSize: 16, fontWeight: "600", color: colors.black },
});
