// AI-assisted: see docs/AI_LOG.md #55, #58
// Step 3 of the login: the password was right, now a code sent to the
// account's email confirms it. Only the right code opens the app (or the
// tabs again if the registration wasn't submitted).
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
  // driver is what signIn() returned: { uid, email, phone, name, status }
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

  // The code is requested once, when the screen opens
  useEffect(() => {
    if (autoSent.current) return;
    autoSent.current = true;
    sendCode();
  }, [sendCode]);

  // Going back without confirming signs out of the Firebase session the
  // password opened: without the code nobody stays signed in
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
      // The account exists but the registration wasn't submitted: to the
      // tabs, with the account's email and phone already filled in
      navigation.replace("Register", {
        account: { email: driver.email, phone: driver.phone },
      });
      return;
    }
    // Registration submitted (pending or approved): AppNavigator opens the main menu
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
