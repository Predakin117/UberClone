// AI-assisted: see docs/AI_LOG.md #2, #4, #57, #28, #30, #60, #61
// src/navigation/MainDrawer.js
import { Ionicons } from "@expo/vector-icons";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "../components/Avatar";
import { colors, radius, spacing, typography } from "../config/theme";
import { AuthContext } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useDriverProfile } from "../hooks/useDriverProfile";
import EarningsScreen from "../screens/main/EarningsScreen";
import ProfileScreen from "../screens/main/ProfileScreen";
import SettingsScreen from "../screens/main/SettingsScreen";
import { HistoryStack } from "./HistoryStack";
import { TripStack } from "./TripStack";

const Drawer = createDrawerNavigator();

// AI-assisted: see docs/AI_LOG.md #61
// Panel of the menu, like Uber: the driver's photo, name and rating on a
// black header (tap it to open the profile), the screens with their icons
// and logout at the bottom. The photo and rating come live from Firestore.
const DrawerContent = (props) => {
  const { driverData, logout } = useContext(AuthContext);
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { driver, rating } = useDriverProfile();
  const name = driverData?.name?.trim();
  const photo = driver?.personal?.profilePhotoUrl ?? "";

  return (
    <View style={styles.drawer}>
      <TouchableOpacity
        style={[styles.profile, { paddingTop: insets.top + spacing.xl }]}
        onPress={() => props.navigation.navigate("Profile")}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityHint={t("drawer.viewProfile")}
      >
        <Avatar uri={photo} size={AVATAR_SIZE} style={styles.avatar} />
        <Text style={styles.greeting} numberOfLines={1}>
          {name
            ? t("drawer.greeting").replace("{name}", name)
            : t("drawer.driver")}
        </Text>
        <View style={styles.profileRow}>
          {rating.average !== null && (
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={12} color={colors.black} />
              <Text style={styles.ratingText}>{rating.average}</Text>
            </View>
          )}
          <Text style={styles.viewProfile}>{t("drawer.viewProfile")}</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textOnDark}
          />
        </View>
      </TouchableOpacity>

      <DrawerContentScrollView {...props} contentContainerStyle={styles.items}>
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
        <Ionicons name="log-out-outline" size={20} color={colors.black} />
        <Text style={styles.drawerLogoutText}>{t("drawer.logout")}</Text>
      </TouchableOpacity>
    </View>
  );
};

// Icon of each screen in the menu
const drawerIcon = (name) => {
  const DrawerIcon = ({ color, size }) => (
    <Ionicons name={name} size={size} color={color} />
  );
  return DrawerIcon;
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
        // The map has its own menu button, the current trip its black banner
        // and the trip summary its own top: they use the whole screen
        options={{
          title: t("drawer.home"),
          headerShown: false,
          drawerIcon: drawerIcon("home-outline"),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t("drawer.profile"),
          drawerIcon: drawerIcon("person-outline"),
        }}
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
          drawerIcon: drawerIcon("time-outline"),
        })}
      />
      <Drawer.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{
          title: t("drawer.earnings"),
          drawerIcon: drawerIcon("wallet-outline"),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t("drawer.settings"),
          drawerIcon: drawerIcon("settings-outline"),
        }}
      />
    </Drawer.Navigator>
  );
};

const AVATAR_SIZE = 64;

const styles = StyleSheet.create({
  drawer: { flex: 1, backgroundColor: colors.white },
  profile: {
    backgroundColor: colors.black,
    paddingHorizontal: spacing.xl - 4,
    paddingBottom: spacing.xl,
  },
  avatar: { marginBottom: spacing.lg },
  greeting: { ...typography.section, color: colors.white },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  ratingText: { fontSize: 13, fontWeight: "700", color: colors.black },
  viewProfile: { fontSize: 14, color: colors.textOnDark },
  items: { paddingTop: spacing.md },
  drawerLogout: {
    flexDirection: "row",
    gap: spacing.sm,
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
