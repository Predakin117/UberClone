// AI-assisted: see docs/AI_LOG.md #58
// Selfie step of the registration, like Uber: tips for a good photo, the front
// camera, and a preview to use it or take another. The photo is still the
// "profilePhoto" field of tab 1: this screen only fills it in.
import { useNavigation } from "@react-navigation/native";
import { CameraType } from "expo-image-picker";
import { useContext, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Avatar from "../../components/Avatar";
import NextButton from "../../components/NextButton";
import StepLayout from "../../components/StepLayout";
import { colors, spacing, typography } from "../../config/theme";
import { useLanguage } from "../../contexts/LanguageContext";
import { RegistrationContext } from "../../contexts/RegistrationContext";
import { usePhotoPicker } from "../../hooks/usePhotoPicker";

const TIPS = [
  "selfie.tipFace",
  "selfie.tipLight",
  "selfie.tipAccessories",
  "selfie.tipAlone",
];

// Square crop, so the photo fits the round avatar
const CROP = { allowsEditing: true, aspect: [1, 1] };
const PHOTO_SIZE = 200;

export default function ProfilePhotoScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { formData, handleChange, touchField } =
    useContext(RegistrationContext);

  // The photo under review: starts with the one already chosen, if any
  const [uri, setUri] = useState(formData.profilePhoto);
  const { pick, errorKey } = usePhotoPicker(setUri);
  const hasPhoto = uri !== "";

  const takeSelfie = () =>
    pick("camera", { ...CROP, cameraType: CameraType.front });
  const chooseFromGallery = () => pick("library", CROP);

  const confirmPhoto = () => {
    handleChange("profilePhoto", uri);
    touchField("profilePhoto");
    navigation.goBack();
  };

  return (
    <StepLayout
      title={hasPhoto ? t("selfie.reviewTitle") : t("selfie.title")}
      subtitle={hasPhoto ? t("selfie.reviewSubtitle") : t("selfie.subtitle")}
      footer={
        <>
          <NextButton
            label={hasPhoto ? t("selfie.use") : t("selfie.take")}
            onPress={hasPhoto ? confirmPhoto : takeSelfie}
            error={t(errorKey)}
            style={styles.primary}
          />
          <TouchableOpacity
            style={styles.secondary}
            onPress={hasPhoto ? takeSelfie : chooseFromGallery}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>
              {hasPhoto ? t("selfie.retake") : t("photo.chooseFromGallery")}
            </Text>
          </TouchableOpacity>
        </>
      }
    >
      {/* The photo, or a silhouette inside a dashed frame for the face */}
      <View style={[styles.frame, !hasPhoto && styles.frameEmpty]}>
        <Avatar
          uri={uri}
          size={PHOTO_SIZE}
          accessibilityLabel={hasPhoto ? t("selfie.preview") : undefined}
        />
      </View>

      {!hasPhoto && (
        <View style={styles.tips}>
          {TIPS.map((tip) => (
            <View key={tip} style={styles.tip}>
              <View style={styles.tipCheck}>
                <Text style={styles.tipCheckText}>✓</Text>
              </View>
              <Text style={styles.tipText}>{t(tip)}</Text>
            </View>
          ))}
        </View>
      )}
    </StepLayout>
  );
}

const FRAME_GAP = 8;
const TIP_CHECK = 24;

const styles = StyleSheet.create({
  frame: {
    alignSelf: "center",
    padding: FRAME_GAP,
    borderRadius: PHOTO_SIZE / 2 + FRAME_GAP,
    borderWidth: 3,
    borderColor: colors.success,
    marginBottom: spacing.xl,
  },
  frameEmpty: { borderColor: colors.border, borderStyle: "dashed" },
  tips: { gap: spacing.lg },
  tip: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  tipCheck: {
    width: TIP_CHECK,
    height: TIP_CHECK,
    borderRadius: TIP_CHECK / 2,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  tipCheckText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  tipText: { ...typography.body, flex: 1 },
  primary: { marginTop: 0 },
  secondary: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  secondaryText: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
});
