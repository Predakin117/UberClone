import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useEffect, useState } from "react";
import { signOutAccount } from "../services/accountService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // For the initial loading screen
  const [driverData, setDriverData] = useState(null);

  // AI-assisted: see docs/AI_LOG.md #19
  // La lectura de la sesión vive dentro del efecto: así no se usa antes de declararla
  useEffect(() => {
    const checkSession = async () => {
      try {
        // REGLA: AsyncStorage solo para sesión, idioma y último estado de disponibilidad.
        const storedSession = await AsyncStorage.getItem("@driver_session");
        if (storedSession) {
          setDriverData(JSON.parse(storedSession));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error leyendo la sesión:", error);
      } finally {
        setIsLoading(false); // Terminamos de verificar
      }
    };

    checkSession();
  }, []);

  const login = async (data) => {
    try {
      // Successful login mock. Never store banking info here.
      await AsyncStorage.setItem(
        "@driver_session",
        JSON.stringify({ id: data.id, name: data.name, status: data.status }),
      );
      setDriverData(data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error saving the session:", error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("@driver_session");
      // AI-assisted: see docs/AI_LOG.md #53
      // Also closes the Firebase session, so the next login starts clean
      await signOutAccount();
      setDriverData(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, driverData, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
