// AI-assisted: see docs/AI_LOG.md #54
// Firebase is replaced by mocks: these tests check what the service writes and
// that a failed sign-up never leaves half an account behind.
import {
  createUserWithEmailAndPassword,
  linkWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getDoc, writeBatch } from "firebase/firestore";
import { auth } from "../config/firebase";
import { createAccount, findAccount, signIn } from "./accountService";

jest.mock("../config/firebase", () => ({
  auth: { currentUser: null },
  db: {},
  isFirebaseConfigured: true,
}));

jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
  EmailAuthProvider: {
    credential: jest.fn(() => "credential"),
    PROVIDER_ID: "password",
  },
  linkWithCredential: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  unlink: jest.fn(() => Promise.resolve()),
}));

// A document is its path, e.g. "loginIndex/phone_%2B573001234567"
jest.mock("firebase/firestore", () => ({
  doc: jest.fn((_db, ...path) => path.join("/")),
  getDoc: jest.fn(),
  serverTimestamp: jest.fn(() => "now"),
  writeBatch: jest.fn(),
}));

const snapshot = (data) => ({
  exists: () => data != null,
  data: () => data,
});

const newAccount = {
  email: " Ana@Ejemplo.com ",
  countryCode: "CO",
  phone: "300 123 4567",
  password: "segura123",
};

let batch;
let newUser;

beforeEach(() => {
  jest.clearAllMocks();
  auth.currentUser = null;
  batch = { set: jest.fn(), commit: jest.fn(() => Promise.resolve()) };
  writeBatch.mockReturnValue(batch);
  newUser = { uid: "uid-1", delete: jest.fn(() => Promise.resolve()) };
  createUserWithEmailAndPassword.mockResolvedValue({ user: newUser });
  getDoc.mockResolvedValue(snapshot(null));
});

describe("createAccount", () => {
  it("creates the user and saves the account and both lookup documents", async () => {
    await expect(createAccount(newAccount)).resolves.toEqual({
      uid: "uid-1",
      email: "ana@ejemplo.com",
      phone: "+573001234567",
    });

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      auth,
      "ana@ejemplo.com",
      "segura123",
    );
    const written = Object.fromEntries(
      batch.set.mock.calls.map(([path, data]) => [path, data]),
    );
    expect(written).toEqual({
      "accounts/uid-1": {
        email: "ana@ejemplo.com",
        phone: "+573001234567",
        createdAt: "now",
      },
      "loginIndex/email_ana%40ejemplo.com": {
        uid: "uid-1",
        email: "ana@ejemplo.com",
      },
      "loginIndex/phone_%2B573001234567": {
        uid: "uid-1",
        email: "ana@ejemplo.com",
      },
    });
    expect(batch.commit).toHaveBeenCalledTimes(1);
  });

  it("does not create anything when the phone already has an account", async () => {
    getDoc.mockResolvedValue(snapshot({ uid: "other", email: "otro@x.com" }));

    await expect(createAccount(newAccount)).rejects.toMatchObject({
      code: "auth/phone-in-use",
    });
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
    expect(batch.commit).not.toHaveBeenCalled();
  });

  it("deletes the new user if the lookup documents can't be saved", async () => {
    batch.commit.mockRejectedValue({ code: "permission-denied" });

    await expect(createAccount(newAccount)).rejects.toMatchObject({
      code: "permission-denied",
    });
    expect(newUser.delete).toHaveBeenCalledTimes(1);
  });

  it("keeps the uid of an anonymous session that already saved tabs", async () => {
    auth.currentUser = { uid: "anon-1", isAnonymous: true };
    linkWithCredential.mockResolvedValue({ user: { uid: "anon-1" } });

    await expect(createAccount(newAccount)).resolves.toMatchObject({
      uid: "anon-1",
    });
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("rejects invalid data before calling Firebase", async () => {
    for (const changes of [
      { email: "ana@" },
      { phone: "1234567899" },
      { password: "12345678" },
    ]) {
      await expect(
        createAccount({ ...newAccount, ...changes }),
      ).rejects.toMatchObject({ code: "auth/invalid-data" });
    }
    expect(getDoc).not.toHaveBeenCalled();
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });
});

describe("findAccount", () => {
  it("returns the email of the account or null", async () => {
    getDoc.mockResolvedValueOnce(snapshot({ uid: "uid-1", email: "ana@ejemplo.com" }));
    await expect(findAccount("phone", "+573001234567")).resolves.toEqual({
      email: "ana@ejemplo.com",
    });
    await expect(findAccount("email", "nadie@ejemplo.com")).resolves.toBeNull();
  });
});

describe("signIn", () => {
  it("returns the account data and the registration status", async () => {
    signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "uid-1", email: "ana@ejemplo.com" },
    });
    getDoc.mockImplementation((path) =>
      Promise.resolve(
        path === "accounts/uid-1"
          ? snapshot({ email: "ana@ejemplo.com", phone: "+573001234567" })
          : snapshot({ status: "pending", personal: { name: "Ana Pérez" } }),
      ),
    );

    await expect(signIn("ana@ejemplo.com", "segura123")).resolves.toEqual({
      uid: "uid-1",
      email: "ana@ejemplo.com",
      phone: "+573001234567",
      name: "Ana Pérez",
      status: "pending",
    });
  });

  it("returns status null when the registration wasn't submitted", async () => {
    signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "uid-1", email: "ana@ejemplo.com" },
    });

    await expect(signIn("ana@ejemplo.com", "segura123")).resolves.toMatchObject({
      status: null,
      phone: null,
    });
  });

  it("turns a wrong password into an AuthError", async () => {
    signInWithEmailAndPassword.mockRejectedValue({ code: "auth/invalid-credential" });

    await expect(signIn("ana@ejemplo.com", "mala1234")).rejects.toMatchObject({
      code: "auth/invalid-credential",
    });
  });
});
