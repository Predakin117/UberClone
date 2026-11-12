// AI-assisted: see docs/AI_LOG.md #56
// Visual theme of the app: black and white with light gray surfaces, bold
// type and pill-shaped secondary buttons. Screens and components take their
// colors, sizes and spacing from here instead of writing them by hand.
export const colors = {
  black: "#000000",
  white: "#FFFFFF",
  background: "#FFFFFF",
  // Input and card backgrounds
  surface: "#F3F3F3",
  surfacePressed: "#E8E8E8",
  border: "#E2E2E2",
  textPrimary: "#000000",
  textSecondary: "#5E5E5E",
  placeholder: "#757575",
  disabledBackground: "#E8E8E8",
  disabledText: "#A6A6A6",
  error: "#C62828",
  errorBackground: "#FDECEC",
  warning: "#9A5B00",
  success: "#05944F",
  link: "#276EF1",
  backdrop: "rgba(0, 0, 0, 0.5)",
};

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const typography = {
  title: { fontSize: 28, fontWeight: "700", color: colors.textPrimary },
  subtitle: { fontSize: 16, lineHeight: 22, color: colors.textSecondary },
  section: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  label: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  body: { fontSize: 16, color: colors.textPrimary },
  caption: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
};

// Height of inputs and main buttons: big enough to tap comfortably
export const CONTROL_HEIGHT = 52;
