// AI-assisted: see docs/AI_LOG.md #31, #59
// The driver on the map: a car seen from above, drawn with Views (no images),
// that turns with the GPS heading. It replaces the blue location dot.
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import { colors } from "../config/theme";

// The car alone, pointing up. The welcome screen also draws it.
export function CarShape() {
  return (
    <View style={styles.car}>
      <View style={styles.windshield} />
      <View style={styles.roof} />
      <View style={styles.rearWindow} />
    </View>
  );
}

export default function CarMarker({ position }) {
  if (!position) return null;
  return (
    <Marker
      coordinate={{
        latitude: position.latitude,
        longitude: position.longitude,
      }}
      // flat + rotation: the car turns with the map and points where it drives
      flat
      rotation={position.heading ?? 0}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={10}
    >
      <CarShape />
    </Marker>
  );
}

const styles = StyleSheet.create({
  // Points up (north) when rotation is 0
  car: {
    width: 22,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.black,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: "center",
    paddingTop: 6,
    gap: 3,
  },
  windshield: {
    width: 14,
    height: 7,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: colors.disabledText,
  },
  roof: { width: 14, height: 12, borderRadius: 2, backgroundColor: colors.black },
  rearWindow: {
    width: 14,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.disabledText,
  },
});
