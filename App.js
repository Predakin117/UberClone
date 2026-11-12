import { StatusBar } from "expo-status-bar";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./src/contexts/AuthContext";
import { LanguageProvider } from "./src/contexts/LanguageContext";
import { TripProvider } from "./src/contexts/TripContext"; // Trip state shared by the trip screens
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* AI-assisted: see docs/AI_LOG.md #9 */}
      {/* Language wraps the session: it is already used during registration */}
      <LanguageProvider>
        <AuthProvider>
          {/* Navigation is wrapped with the TripProvider */}
          <TripProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </TripProvider>
        </AuthProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
