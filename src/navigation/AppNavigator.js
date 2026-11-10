import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useContext } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import CreateAccountScreen from "../screens/auth/CreateAccountScreen";
import LoginPasswordScreen from "../screens/auth/LoginPasswordScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import { AuthTabs } from "./AuthTabs";
import { MainDrawer } from "./MainDrawer";

const RootStack = createNativeStackNavigator();

// Only the back arrow, no title: the screen shows its own title
const backHeader = {
  headerShown: true,
  title: "",
  headerShadowVisible: false,
  headerBackButtonDisplayMode: "minimal",
};

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
          // AI-assisted: see docs/AI_LOG.md #52, #53
          // Without a session the app starts at login. A new driver creates the
          // account and then fills in the registration tabs.
          <>
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen
              name="LoginPassword"
              component={LoginPasswordScreen}
              options={backHeader}
            />
            <RootStack.Screen
              name="CreateAccount"
              component={CreateAccountScreen}
              options={backHeader}
            />
            <RootStack.Screen name="Register" component={AuthTabs} />
          </>
        ) : (
          <RootStack.Screen name="Main" component={MainDrawer} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
