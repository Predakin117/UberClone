import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Para la pantalla de carga inicial
  const [driverData, setDriverData] = useState(null);

  useEffect(() => {
    checkSession();
  }, []);

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

  const login = async (data) => {
    try {
      // Mock de login exitoso. Nunca guardar info bancaria aquí.
      await AsyncStorage.setItem(
        "@driver_session",
        JSON.stringify({ id: data.id, name: data.name, status: data.status }),
      );
      setDriverData(data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error guardando la sesión:", error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("@driver_session");
      setDriverData(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error cerrando sesión:", error);
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
