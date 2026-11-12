// AI-assisted: see docs/AI_LOG.md #57
// Outline icons of the registration steps, drawn with borders so the app
// doesn't need an icon library: a person (personal info), a car (vehicle)
// and a document (documents). Each one fits in a 24 x 24 box.
import { StyleSheet, View } from "react-native";
import { colors } from "../config/theme";

const STROKE = 2;

const Person = ({ color }) => (
  <View style={styles.box}>
    <View style={[styles.head, { borderColor: color }]} />
    <View style={[styles.shoulders, { borderColor: color }]} />
  </View>
);

const Car = ({ color }) => (
  <View style={styles.box}>
    <View style={[styles.cabin, { borderColor: color }]} />
    <View style={[styles.carBody, { borderColor: color }]} />
    <View style={styles.wheels}>
      <View style={[styles.wheel, { backgroundColor: color }]} />
      <View style={[styles.wheel, { backgroundColor: color }]} />
    </View>
  </View>
);

const Document = ({ color }) => (
  <View style={styles.box}>
    <View style={[styles.page, { borderColor: color }]}>
      <View style={[styles.line, { backgroundColor: color }]} />
      <View style={[styles.line, { backgroundColor: color }]} />
      <View
        style={[styles.line, styles.shortLine, { backgroundColor: color }]}
      />
    </View>
  </View>
);

// name is the route name of each tab in src/navigation/AuthTabs.js
const ICONS = { PersonalInfo: Person, Vehicle: Car, Documents: Document };

export default function StepIcon({ name, color = colors.black }) {
  const Icon = ICONS[name];
  return Icon ? <Icon color={color} /> : null;
}

const styles = StyleSheet.create({
  box: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  head: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: STROKE,
  },
  shoulders: {
    width: 18,
    height: 9,
    marginTop: 2,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderWidth: STROKE,
    borderBottomWidth: 0,
  },
  cabin: {
    width: 12,
    height: 6,
    marginBottom: -STROKE,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: STROKE,
    borderBottomWidth: 0,
  },
  carBody: {
    width: 22,
    height: 9,
    borderRadius: 3,
    borderWidth: STROKE,
  },
  wheels: {
    width: 14,
    marginTop: -3,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  wheel: { width: 5, height: 5, borderRadius: 2.5 },
  page: {
    width: 17,
    height: 21,
    borderRadius: 3,
    borderWidth: STROKE,
    paddingTop: 4,
    paddingHorizontal: 3,
    gap: 3,
  },
  line: { height: STROKE, borderRadius: 1 },
  shortLine: { width: 5 },
});
