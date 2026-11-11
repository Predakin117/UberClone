// AI-assisted: see docs/AI_LOG.md #54
// Line under a field: the error first; if there's none, the character limit
// warning (when showLimit is on) and the hint. error and hint are translated.
import { StyleSheet, Text, View } from "react-native";
import { useLanguage } from "../contexts/LanguageContext";
import { limitStatus } from "../validation/textLimit";
import { formStyles } from "./formStyles";

export default function FieldMessage({
  error,
  hint,
  length = 0,
  maxLength,
  showLimit = false,
}) {
  const { t } = useLanguage();

  if (error) return <Text style={formStyles.errorText}>{error}</Text>;

  const status = showLimit ? limitStatus(length, maxLength) : "none";
  if (status === "reached") {
    return (
      <Text style={formStyles.warningText} accessibilityLiveRegion="polite">
        {t("form.maxLengthReached").replace("{max}", maxLength)}
      </Text>
    );
  }

  if (!hint && status === "none") return null;

  return (
    <View style={styles.row}>
      <Text style={[formStyles.hintText, styles.hint]}>{hint ?? ""}</Text>
      {status === "near" && (
        <Text style={formStyles.hintText}>
          {t("form.charCount")
            .replace("{count}", length)
            .replace("{max}", maxLength)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  hint: { flex: 1 },
});
