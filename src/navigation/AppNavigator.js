// AI-assisted: see docs/AI_LOG.md #2
// src/navigation/AppNavigator.js
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { AuthTabs } from "./AuthTabs";
import { MainDrawer } from "./MainDrawer";

const RootStack = createNativeStackNavigator();

export const AppNavigator = () => {
  // TODO: Más adelante esto vendrá de useContext (AuthContext)
  const { isAuthenticated, isLoading } = useContext(AuthContext);

  if (isLoading) {
    // Pantalla de carga mientras lee el AsyncStorage
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
          <RootStack.Screen name="Auth" component={AuthTabs} />
        ) : (
          <RootStack.Screen name="Main" component={MainDrawer} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
