// AI-assisted: see docs/AI_LOG.md #55, #58
// Paso 3 del login: la contraseña ya fue correcta, ahora se confirma con un código
// que llega al correo de la cuenta. Solo con el código correcto se entra a la app
// (o se vuelve a las pestañas si el registro no se había enviado).
import { useNavigation, useRoute } from "@react-navigation/native";
import { useContext, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CodeInput from "../../components/CodeInput";
import NextButton from "../../components/NextButton";
import StepLayout from "../../components/StepLayout";
import { colors, spacing, typography } from "../../config/theme";
import { AuthContext } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useEmailVerification } from "../../hooks/useEmailVerification";
import { signOutAccount } from "../../services/accountService";
import { MOTIVOS } from "../../services/emailVerification";

export default function VerifyLoginScreen() {
  const navigation = useNavigation();
  // driver es lo que devolvió signIn(): { uid, email, phone, name, status }
  const { driver } = useRoute().params;
  const { login } = useContext(AuthContext);
  const { t } = useLanguage();

  const [code, setCode] = useState("");
  const [isEntering, setIsEntering] = useState(false);
  const autoSent = useRef(false);
  const verified = useRef(false);

  const {
    isSent,
    minutes,
    isSending,
    isVerifying,
    error,
    cooldown,
    sendCode,
    verifyCode,
  } = useEmailVerification({
    email: driver.email,
    name: driver.name,
    motivo: MOTIVOS.LOGIN,
  });

  // El código se pide solo al abrir la pantalla, una única vez
  useEffect(() => {
    if (autoSent.current) return;
    autoSent.current = true;
    sendCode();
  }, [sendCode]);

  // Si vuelve atrás sin confirmar, se cierra la sesión de Firebase que abrió la
  // contraseña: sin el código no queda nadie con sesión
  useEffect(
    () =>
      navigation.addListener("beforeRemove", () => {
        if (!verified.current) {
          signOutAccount().catch((signOutError) =>
            console.warn("Could not sign out:", signOutError),
          );
        }
      }),
    [navigation],
  );

  const errorText =
    error &&
    t(error.key)
      .replace("{seconds}", error.values.seconds)
      .replace("{attempts}", error.values.attempts);

  const handleConfirm = async () => {
    if (isEntering) return;
    if (!(await verifyCode(code))) return;
    verified.current = true;

    if (!driver.status) {
      // La cuenta existe pero el registro no se envió: a las pestañas, con el
      // correo y el celular de la cuenta ya puestos
      navigation.replace("Register", {
        account: { email: driver.email, phone: driver.phone },
      });
      return;
    }
    // Registro enviado (pendiente o aprobado): AppNavigator pasa al menú principal
    setIsEntering(true);
    await login({ id: driver.uid, name: driver.name, status: driver.status });
  };

  let intro;
  if (isSent) {
    intro = t("verifyLogin.sentTo").replace("{email}", driver.email);
    if (minutes) intro += ` ${t("verify.expiresIn").replace("{minutes}", minutes)}`;
  } else if (isSending || !error) {
    intro = t("verifyLogin.sending").replace("{email}", driver.email);
  } else {
    intro = t("verifyLogin.notSent").replace("{email}", driver.email);
  }

  // AI-assisted: see docs/AI_LOG.md #58
  // Only the look changes: the code in 6 boxes and the button fixed at the
  // bottom (StepLayout), with the error under it
  return (
    <StepLayout
      title={t("verifyLogin.heading")}
      subtitle={intro}
      footer={
        isSent ? (
          <NextButton
            label={t("verifyLogin.confirm")}
            onPress={handleConfirm}
            isSaving={isVerifying || isEntering}
            loadingLabel={isVerifying ? t("verify.verifying") : undefined}
            error={errorText}
            style={styles.button}
          />
        ) : (
          <NextButton
            label={t("verify.sendCode")}
            onPress={sendCode}
            isSaving={isSending}
            loadingLabel={t("verify.sending")}
            error={errorText}
            style={styles.button}
          />
        )
      }
    >
      {isSent && (
        <View>
          <CodeInput
            label={t("verify.code")}
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, ""))}
            hasError={Boolean(error)}
            autoFocus
            onSubmitEditing={handleConfirm}
          />
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
          <Text style={styles.hint}>{t("verifyLogin.checkSpam")}</Text>
        </View>
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
  hint: { ...typography.caption, marginTop: spacing.lg },
  button: { marginTop: 0 },
});
