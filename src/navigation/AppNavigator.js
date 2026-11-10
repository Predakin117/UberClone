import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useContext } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import LoginScreen from "../screens/auth/LoginScreen";
import { AuthTabs } from "./AuthTabs";
import { MainDrawer } from "./MainDrawer";

const RootStack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // AI-assisted: see docs/AI_LOG.md #52
          // Without a session the app starts at login and then moves on to registration
          <>
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="Register" component={AuthTabs} />
          </>
        ) : (
          <RootStack.Screen name="Main" component={MainDrawer} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
