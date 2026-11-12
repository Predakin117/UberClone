// AI-assisted: see docs/AI_LOG.md #55
// Paso 3 del login: la contraseña ya fue correcta, ahora se confirma con un código
// que llega al correo de la cuenta. Solo con el código correcto se entra a la app
// (o se vuelve a las pestañas si el registro no se había enviado).
import { useNavigation, useRoute } from "@react-navigation/native";
import { useContext, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FormField from "../../components/FormField";
import NextButton from "../../components/NextButton";
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

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text style={styles.title}>{t("verifyLogin.heading")}</Text>
          <Text style={styles.text}>{intro}</Text>

          {isSent && (
            <>
              <FormField
                label={t("verify.code")}
                value={code}
                onChangeText={(text) => setCode(text.replace(/\D/g, ""))}
                placeholder="123456"
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                onSubmitEditing={handleConfirm}
              />
              <TouchableOpacity
                onPress={sendCode}
                disabled={cooldown > 0 || isSending}
                accessibilityRole="button"
              >
                <Text
                  style={[styles.link, cooldown > 0 && styles.linkDisabled]}
                >
                  {cooldown > 0
                    ? t("verify.resendIn").replace("{seconds}", cooldown)
                    : t("verify.resend")}
                </Text>
              </TouchableOpacity>
              <Text style={styles.hint}>{t("verifyLogin.checkSpam")}</Text>
            </>
          )}
        </View>

        {isSent ? (
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
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  container: { flexGrow: 1, padding: 20, justifyContent: "space-between" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  text: { fontSize: 16, color: "#555", lineHeight: 22, marginBottom: 24 },
  link: { fontWeight: "bold", textDecorationLine: "underline", marginTop: 5 },
  linkDisabled: { color: "#888", textDecorationLine: "none" },
  hint: { color: "#888", fontSize: 13, marginTop: 15 },
  button: { marginBottom: 10 },
});
