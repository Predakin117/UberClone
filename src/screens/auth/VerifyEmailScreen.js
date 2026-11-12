// AI-assisted: see docs/AI_LOG.md #13, #14, #58
// Último paso del registro: confirma con un código que el correo de la pestaña 1 es
// del conductor. Solo con el código correcto se guarda el registro como Pendiente.
import { useNavigation } from "@react-navigation/native";
import { useContext, useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import CodeInput from "../../components/CodeInput";
import NextButton from "../../components/NextButton";
import StepLayout from "../../components/StepLayout";
import { colors, spacing } from "../../config/theme";
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

  // AI-assisted: see docs/AI_LOG.md #58
  // Only the look changes: the code in 6 boxes and the main button fixed at
  // the bottom (StepLayout), with the error under it
  let intro = (isSent ? t("verify.sentTo") : t("verify.willSendTo")).replace(
    "{email}",
    email,
  );
  if (isSent && minutes) {
    intro += ` ${t("verify.expiresIn").replace("{minutes}", minutes)}`;
  }

  return (
    <StepLayout
      title={t("verify.heading")}
      subtitle={intro}
      footer={
        !isSent ? (
          <NextButton
            label={t("verify.sendCode")}
            onPress={sendCode}
            isSaving={isSending}
            loadingLabel={t("verify.sending")}
            error={errorText}
            style={styles.button}
          />
        ) : (
          <NextButton
            label={t("verify.confirm")}
            onPress={handleConfirm}
            isSaving={isVerifying || isSaving}
            loadingLabel={isVerifying ? t("verify.verifying") : undefined}
            error={errorText || (saveError && t(saveError.code))}
            style={styles.button}
          />
        )
      }
    >
      {isSent && (
        <>
          <CodeInput
            label={t("verify.code")}
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, ""))}
            hasError={Boolean(error)}
            editable={!isVerified}
            autoFocus
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
          <Text style={[styles.link, styles.changeEmail]}>
            {t("verify.changeEmail")}
          </Text>
        </TouchableOpacity>
      )}
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  link: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    textDecorationLine: "underline",
  },
  linkDisabled: { color: colors.disabledText, textDecorationLine: "none" },
  changeEmail: { marginTop: spacing.lg },
  button: { marginTop: 0 },
});
