// AI-assisted: see docs/AI_LOG.md #32
import { ExecutionEnvironment } from "expo-constants";
import {
  canUsePush,
  pushTokenFields,
  registerForPushNotifications,
  subscribeToTripRequestTaps,
  TRIP_REQUEST_TYPE,
  tripIdFromResponse,
} from "./pushNotifications";

// Jest hoists these mocks above the imports: no real Firebase, emulator device
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { executionEnvironment: "bare" },
  ExecutionEnvironment: {
    Bare: "bare",
    Standalone: "standalone",
    StoreClient: "storeClient",
  },
}));
jest.mock("expo-device", () => ({ isDevice: false }));
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: () => "SERVER_TIME",
}));
jest.mock("../config/firebase", () => ({
  auth: { currentUser: { uid: "uid-ana" } },
  db: {},
}));

describe("canUsePush", () => {
  const phone = {
    isDevice: true,
    os: "android",
    executionEnvironment: ExecutionEnvironment.Bare,
  };

  it("works in a development build on an Android phone", () => {
    expect(canUsePush(phone)).toBe(true);
    expect(
      canUsePush({ ...phone, executionEnvironment: ExecutionEnvironment.Standalone }),
    ).toBe(true);
  });

  it("does not work in Expo Go, on an emulator or on iOS", () => {
    expect(
      canUsePush({ ...phone, executionEnvironment: ExecutionEnvironment.StoreClient }),
    ).toBe(false);
    expect(canUsePush({ ...phone, isDevice: false })).toBe(false);
    expect(canUsePush({ ...phone, os: "ios" })).toBe(false);
  });
});

describe("pushTokenFields", () => {
  it("saves the token with the server time and the app language", () => {
    expect(pushTokenFields("fcm-123", "en")).toEqual({
      fcmToken: "fcm-123",
      fcmTokenUpdatedAt: "SERVER_TIME",
      notificationLanguage: "en",
    });
  });
});

describe("tripIdFromResponse", () => {
  const responseWith = (request) => ({ notification: { request } });

  it("reads the tripId from content.data", () => {
    const response = responseWith({
      content: { data: { type: TRIP_REQUEST_TYPE, tripId: "trip-1" } },
    });
    expect(tripIdFromResponse(response)).toBe("trip-1");
  });

  it("reads the tripId from the FCM message data", () => {
    const response = responseWith({
      content: { data: {} },
      trigger: {
        remoteMessage: { data: { type: TRIP_REQUEST_TYPE, tripId: "trip-2" } },
      },
    });
    expect(tripIdFromResponse(response)).toBe("trip-2");
  });

  it("ignores other notifications and empty responses", () => {
    expect(
      tripIdFromResponse(
        responseWith({ content: { data: { type: "other", tripId: "trip-1" } } }),
      ),
    ).toBeNull();
    expect(
      tripIdFromResponse(
        responseWith({ content: { data: { type: TRIP_REQUEST_TYPE, tripId: "" } } }),
      ),
    ).toBeNull();
    expect(tripIdFromResponse(null)).toBeNull();
    expect(tripIdFromResponse(undefined)).toBeNull();
  });
});

describe("without push support (emulator or Expo Go)", () => {
  it("does nothing and never throws", async () => {
    await expect(
      registerForPushNotifications({
        language: "es",
        channel: { name: "Solicitudes", description: "..." },
      }),
    ).resolves.toBeNull();
    const cleanup = subscribeToTripRequestTaps(jest.fn());
    expect(() => cleanup()).not.toThrow();
  });
});
