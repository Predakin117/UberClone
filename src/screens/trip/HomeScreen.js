// AI-assisted: see docs/AI_LOG.md #33
// src/screens/main/HomeScreen.js
import { useNavigation } from "@react-navigation/native";
import { useContext, useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView from "react-native-maps";
import { TripContext } from "../../contexts/TripContext";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const navigation = useNavigation();
  const { acceptTrip } = useContext(TripContext);

  const [isOnline, setIsOnline] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);

  // Regla de Negocio: Temporizador de 15 segundos para aceptar viaje
  useEffect(() => {
    let interval;
    if (incomingRequest && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && incomingRequest) {
      setIncomingRequest(false);
      Alert.alert(
        "Tiempo agotado",
        "La solicitud fue reasignada a otro conductor.",
      );
    }
    return () => clearInterval(interval);
  }, [incomingRequest, timeLeft]);

  const handleSimulateRequest = () => {
    setTimeLeft(15);
    setIncomingRequest(true);
  };

  const handleAccept = () => {
    setIncomingRequest(false);

    // Simulamos los datos que normalmente llegarían desde Firebase
    const mockPassenger = {
      passengerName: "Carlos Pérez",
      pickup: "Centro Comercial Santa Fe",
      dropoff: "Parque Lleras, El Poblado",
    };

    // Inyectamos el viaje en el estado global
    acceptTrip(mockPassenger);

    // Navegamos al Stack del viaje activo
    navigation.navigate("ActiveTrip");
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 6.2442,
          longitude: -75.5812,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      />

      {/* Control de Conexión Superior */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.onlineButton,
            isOnline ? styles.online : styles.offline,
          ]}
          onPress={() => {
            setIsOnline(!isOnline);
            if (incomingRequest) setIncomingRequest(false);
          }}
        >
          <Text style={styles.onlineText}>
            {isOnline ? "CONECTADO" : "DESCONECTADO"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botón de simulación (Solo visible si estás conectado y libre) */}
      {isOnline && !incomingRequest && (
        <TouchableOpacity
          style={styles.simulateBtn}
          onPress={handleSimulateRequest}
        >
          <Text style={styles.simulateBtnText}>Simular Solicitud</Text>
        </TouchableOpacity>
      )}

      {/* Tarjeta de Solicitud Entrante con Temporizador */}
      {incomingRequest && (
        <View style={styles.requestCard}>
          <Text style={styles.requestTitle}>¡Nuevo Viaje Disponible!</Text>
          <Text style={styles.requestRoute}>
            📍 CC Santa Fe {"\n"}🏁 Parque Lleras
          </Text>
          <Text style={[styles.timerText, timeLeft <= 5 && styles.timerDanger]}>
            ⏳ {timeLeft} segundos restantes
          </Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => setIncomingRequest(false)}
            >
              <Text style={styles.btnText}>Rechazar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={handleAccept}
            >
              <Text style={styles.btnText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center" },
  map: { width: width, height: height, position: "absolute" },

  header: {
    position: "absolute",
    top: 50,
    width: "100%",
    alignItems: "center",
  },
  onlineButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 5,
  },
  online: { backgroundColor: "#4CAF50" },
  offline: { backgroundColor: "#757575" },
  onlineText: { color: "white", fontWeight: "bold", fontSize: 16 },

  simulateBtn: {
    position: "absolute",
    bottom: 30,
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 10,
    elevation: 5,
  },
  simulateBtnText: { color: "white", fontWeight: "bold" },

  requestCard: {
    position: "absolute",
    bottom: 30,
    width: "90%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
  },
  requestTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  requestRoute: {
    fontSize: 16,
    color: "#555",
    marginBottom: 15,
    textAlign: "center",
  },
  timerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF9800",
    textAlign: "center",
    marginBottom: 20,
  },
  timerDanger: { color: "#F44336" },

  actionButtons: { flexDirection: "row", justifyContent: "space-between" },
  actionBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  rejectBtn: { backgroundColor: "#F44336" },
  acceptBtn: { backgroundColor: "#4CAF50" },
  btnText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
