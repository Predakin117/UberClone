// AI-assisted: see docs/AI_LOG.md #2, #4, #57, #28
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
import HistoryScreen from "../screens/main/HistoryScreen";
import { TripStack } from "./TripStack";

const Drawer = createDrawerNavigator();

// Temporary mocks
const ProfileScreen = () => (
  <View>
    <Text>Perfil del Conductor</Text>
  </View>
);
const SettingsScreen = () => {
  const { logout } = useContext(AuthContext);
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={logout}
        accessibilityRole="button"
      >
        <Text style={styles.logoutText}>{t("drawer.logout")}</Text>
      </TouchableOpacity>
    </View>
  );
};

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
        // The map has its own menu button: without a header it uses the whole
        // screen. The trip screens keep the header.
        options={({ route }) => ({
          title: t("drawer.home"),
          headerShown:
            (getFocusedRouteNameFromRoute(route) ?? "Home") !== "Home",
        })}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t("drawer.profile") }}
      />
      <Drawer.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: t("drawer.history") }}
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
  container: {
    flex: 1,
    padding: spacing.xl - 4,
    backgroundColor: colors.white,
  },
  logoutButton: {
    marginTop: spacing.xl,
    minHeight: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: { color: colors.white, fontSize: 16, fontWeight: "600" },

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
