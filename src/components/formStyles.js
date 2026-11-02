// AI-assisted: see docs/AI_LOG.md #7
import { StyleSheet } from "react-native";

// Estilos compartidos por los campos del registro
export const formStyles = StyleSheet.create({
  field: { marginBottom: 15 },
  label: { fontSize: 16, marginBottom: 5, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
  },
  inputError: { borderColor: "red" },
  errorText: { color: "red", fontSize: 12, marginTop: 5 },
});
