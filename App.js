import { StatusBar } from "expo-status-bar";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./src/contexts/AuthContext";
import { LanguageProvider } from "./src/contexts/LanguageContext";
import { TripProvider } from "./src/contexts/TripContext"; // <-- Importamos el nuevo proveedor
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* AI-assisted: see docs/AI_LOG.md #9 */}
      {/* El idioma va por fuera de la sesión: se usa desde el registro */}
      <LanguageProvider>
        <AuthProvider>
          {/* Envolvemos la navegación con el TripProvider */}
          <TripProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </TripProvider>
        </AuthProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
