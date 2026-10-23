import { StatusBar } from "expo-status-bar";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./src/contexts/AuthContext";
import { TripProvider } from "./src/contexts/TripContext"; // <-- Importamos el nuevo proveedor
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        {/* Envolvemos la navegación con el TripProvider */}
        <TripProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </TripProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
