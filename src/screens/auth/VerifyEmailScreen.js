// AI-assisted: see docs/AI_LOG.md #13, #14
// Último paso del registro: confirma con un código que el correo de la pestaña 1 es
// del conductor. Solo con el código correcto se guarda el registro como Pendiente.
import { useNavigation } from "@react-navigation/native";
import { useContext, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import FormField from "../../components/FormField";
import NextButton from "../../components/NextButton";
import { useLanguage } from "../../contexts/LanguageContext";
import { RegistrationContext } from "../../contexts/RegistrationContext";
import { useEmailVerification } from "../../hooks/useEmailVerification";

export default function VerifyEmailScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { formData, lockedFields, submitRegistration, isSaving, saveError } =
    useContext(RegistrationContext);
  const [code, setCode] = useState("");

  const {
    isSent,
    isVerified,
    minutes,
    isSending,
    isVerifying,
    error,
    cooldown,
    sendCode,
    verifyCode,
  } = useEmailVerification({ email: formData.email, name: formData.name });

  const email = formData.email.trim();
  const errorText =
    error &&
    t(error.key)
      .replace("{seconds}", error.values.seconds)
      .replace("{attempts}", error.values.attempts);

  const handleConfirm = async () => {
    if (!(await verifyCode(code))) return;
    // Correo confirmado: se guarda el registro y la cuenta queda Pendiente de aprobación.
    // Si el guardado falla, el botón lo reintenta sin pedir otro código.
    await submitRegistration();
  };

  // Si el correo viene de la cuenta del login está bloqueado en la pestaña 1:
  // no se ofrece cambiarlo
  const canChangeEmail = !lockedFields.includes("email");
  const changeEmail = () =>
    navigation.navigate("RegistrationTabs", { screen: "PersonalInfo" });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{t("verify.heading")}</Text>
      <Text style={styles.text}>
        {(isSent ? t("verify.sentTo") : t("verify.willSendTo")).replace(
          "{email}",
          email,
        )}
        {isSent && minutes
          ? ` ${t("verify.expiresIn").replace("{minutes}", minutes)}`
          : null}
      </Text>

      {!isSent ? (
        <NextButton
          label={t("verify.sendCode")}
          onPress={sendCode}
          isSaving={isSending}
          loadingLabel={t("verify.sending")}
          error={errorText}
        />
      ) : (
        <>
          <FormField
            label={t("verify.code")}
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, ""))}
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={6}
            editable={!isVerified}
          />
          <NextButton
            label={t("verify.confirm")}
            onPress={handleConfirm}
            isSaving={isVerifying || isSaving}
            loadingLabel={isVerifying ? t("verify.verifying") : undefined}
            error={errorText || (saveError && t(saveError.code))}
          />
          {!isVerified && (
            <TouchableOpacity
              onPress={sendCode}
              disabled={cooldown > 0 || isSending}
              accessibilityRole="button"
            >
              <Text style={[styles.link, cooldown > 0 && styles.linkDisabled]}>
                {cooldown > 0
                  ? t("verify.resendIn").replace("{seconds}", cooldown)
                  : t("verify.resend")}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {canChangeEmail && (
        <TouchableOpacity onPress={changeEmail} accessibilityRole="button">
          <Text style={styles.link}>{t("verify.changeEmail")}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  text: { fontSize: 15, color: "#444", lineHeight: 22, marginBottom: 20 },
  link: {
    fontSize: 14,
    color: "#1a56db",
    textDecorationLine: "underline",
    marginTop: 15,
  },
  linkDisabled: { color: "#888", textDecorationLine: "none" },
});
