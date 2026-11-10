// AI-assisted: see docs/AI_LOG.md #53
import { strings } from "../i18n/strings";
import {
  AUTH_ERROR_CODES,
  authErrorKey,
  buildLoginKey,
  validateLoginIdentifier,
  validateNewAccount,
  validatePassword,
} from "./account";

const validAccount = {
  email: "ana@ejemplo.com",
  countryCode: "CO",
  phone: "3001234567",
  password: "segura123",
  confirmPassword: "segura123",
};

describe("buildLoginKey", () => {
  it("stores emails in lowercase and without spaces", () => {
    expect(buildLoginKey("email", "  Ana@Ejemplo.com ")).toBe(
      "email_ana%40ejemplo.com",
    );
  });

  it("keeps the international phone number", () => {
    expect(buildLoginKey("phone", "+573001234567")).toBe(
      "phone_%2B573001234567",
    );
  });

  it("never produces a slash, which Firestore ids don't allow", () => {
    expect(buildLoginKey("email", "a/b@ejemplo.com")).not.toContain("/");
  });
});

describe("validateLoginIdentifier", () => {
  it("checks only the email when the method is email", () => {
    expect(
      validateLoginIdentifier({ method: "email", email: "ana@ejemplo.com", phone: "" }),
    ).toEqual({});
    expect(
      validateLoginIdentifier({ method: "email", email: "ana@", phone: "" }).email,
    ).toBe("errors.emailInvalid");
  });

  it("checks only the phone when the method is phone", () => {
    expect(
      validateLoginIdentifier({
        method: "phone",
        email: "",
        countryCode: "CO",
        phone: "3001234567",
      }),
    ).toEqual({});
    expect(
      validateLoginIdentifier({
        method: "phone",
        email: "",
        countryCode: "CO",
        phone: "",
      }).phone,
    ).toBe("errors.loginPhoneRequired");
  });
});

describe("validatePassword", () => {
  it("requires at least 8 characters", () => {
    expect(validatePassword("").password).toBe("errors.passwordRequired");
    expect(validatePassword("1234567").password).toBe("errors.passwordTooShort");
    expect(validatePassword("12345678")).toEqual({});
  });
});

describe("validateNewAccount", () => {
  it("accepts a complete and valid account", () => {
    expect(validateNewAccount(validAccount)).toEqual({});
  });

  it("requires every field", () => {
    const errors = validateNewAccount({
      email: "",
      countryCode: "CO",
      phone: "",
      password: "",
      confirmPassword: "",
    });
    expect(Object.keys(errors).sort()).toEqual(
      ["confirmPassword", "email", "password", "phone"].sort(),
    );
  });

  it("requires both passwords to match", () => {
    expect(
      validateNewAccount({ ...validAccount, confirmPassword: "otra1234" })
        .confirmPassword,
    ).toBe("errors.passwordMismatch");
  });
});

describe("authErrorKey", () => {
  it("uses the same message for a wrong password and an unknown user", () => {
    expect(authErrorKey("auth/invalid-credential")).toBe(
      authErrorKey("auth/user-not-found"),
    );
  });

  it("falls back to a generic message", () => {
    expect(authErrorKey("auth/something-new")).toBe("auth.failed");
  });
});

describe("account texts", () => {
  it("translates every error in both languages", () => {
    const keys = [
      ...AUTH_ERROR_CODES.map(authErrorKey),
      authErrorKey("unknown"),
      ...Object.values(
        validateNewAccount({
          email: "",
          countryCode: "CO",
          phone: "",
          password: "",
          confirmPassword: "",
        }),
      ),
      validatePassword("123").password,
      validateNewAccount({ ...validAccount, confirmPassword: "x" }).confirmPassword,
    ];
    for (const key of keys) {
      expect(strings.es[key]).toBeDefined();
      expect(strings.en[key]).toBeDefined();
    }
  });
});
