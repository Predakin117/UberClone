// AI-assisted: see docs/AI_LOG.md #7, #54
import { StyleSheet } from "react-native";

// Styles shared by the registration fields
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
  // Data that comes from the account and can't be edited
  inputLocked: { backgroundColor: "#f2f2f2", color: "#666" },
  // Character limit reached: a warning, not an error
  warningText: { color: "#b45309", fontSize: 12, marginTop: 5 },
  hintText: { color: "#888", fontSize: 12, marginTop: 5 },
});
