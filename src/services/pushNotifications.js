// AI-assisted: see docs/AI_LOG.md #32
// Push notifications of new trip requests (docs/APIS.md, service 10). It is the
// only module of the app that talks to expo-notifications. The backend sends
// the notification with Firebase Cloud Messaging to the token saved here.
//
// It only works in a development build on a physical Android phone: Expo Go
// on Android has no push notifications since SDK 53, and the backend sends
// through FCM, not APNs. Anywhere else every function does nothing. No
// function throws: without permission or without a connection the app keeps
// working, it just doesn't get notifications.
//
// drivers/{uid} gets fcmToken, fcmTokenUpdatedAt (server time) and
// notificationLanguage (the language of the app, for the notification text).
// firestore.rules already lets the driver write them: the owner can change
// their document while status stays the same.
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Platform } from "react-native";
import { auth, db } from "../config/firebase";
import { withTimeout } from "./withTimeout";

// Same id as the backend (backend/src/notificaciones.js) and as
// defaultChannel of the expo-notifications plugin in app.json
export const TRIP_REQUESTS_CHANNEL_ID = "trip-requests";
// data.type of a new trip request notification
export const TRIP_REQUEST_TYPE = "trip_request";

const SAVE_TIMEOUT_MS = 5_000;

/** If this app can get push notifications: Android phone, not Expo Go. */
export const canUsePush = ({ isDevice, os, executionEnvironment }) =>
  Boolean(isDevice) &&
  os === "android" &&
  executionEnvironment !== ExecutionEnvironment.StoreClient;

const isPushAvailable = () =>
  canUsePush({
    isDevice: Device.isDevice,
    os: Platform.OS,
    executionEnvironment: Constants.executionEnvironment,
  });

// expo-notifications is loaded only where push works, so Expo Go never loads
// the push part that it no longer has
const loadNotifications = () => import("expo-notifications");

/** Fields saved in drivers/{uid} with the device token. */
export const pushTokenFields = (token, language) => ({
  fcmToken: token,
  fcmTokenUpdatedAt: serverTimestamp(),
  notificationLanguage: language,
});

/**
 * The tripId of a tapped trip request notification, or null if it is another
 * notification. A message sent with FCM can bring its data in content.data or
 * in the FCM message itself (trigger.remoteMessage.data).
 */
export const tripIdFromResponse = (response) => {
  const request = response?.notification?.request;
  const data = {
    ...(request?.trigger?.remoteMessage?.data ?? {}),
    ...(request?.content?.data ?? {}),
  };
  const isTripRequest =
    data.type === TRIP_REQUEST_TYPE &&
    typeof data.tripId === "string" &&
    data.tripId !== "";
  return isTripRequest ? data.tripId : null;
};

// Saves the token in the driver's document. Without a document (the
// registration was never saved) there is nothing to update.
const saveToken = async (token, language) => {
  const uid = auth?.currentUser?.uid;
  if (!uid || typeof token !== "string" || token === "") return false;
  try {
    await withTimeout(
      updateDoc(doc(db, "drivers", uid), pushTokenFields(token, language)),
      SAVE_TIMEOUT_MS,
    );
    return true;
  } catch (error) {
    if (error.code !== "not-found") {
      console.warn("Could not save the notifications token:", error);
    }
    return false;
  }
};

/**
 * With the driver logged in: creates the Android channel, asks for
 * permission, gets the FCM device token and saves it in drivers/{uid}.
 * channel is { name, description } already translated. Returns the token, or
 * null if push is not available, there is no permission or something failed.
 */
export const registerForPushNotifications = async ({ language, channel }) => {
  if (!isPushAvailable()) return null;
  try {
    const Notifications = await loadNotifications();
    // Android 13: the channel must exist before asking for the token
    await Notifications.setNotificationChannelAsync(TRIP_REQUESTS_CHANNEL_ID, {
      name: channel.name,
      description: channel.description,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });

    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted && permission.canAskAgain) {
      permission = await Notifications.requestPermissionsAsync();
    }
    if (!permission.granted) return null;

    const { data: token } = await Notifications.getDevicePushTokenAsync();
    await saveToken(token, language);
    return token;
  } catch (error) {
    console.warn("Push notifications are not available:", error);
    return null;
  }
};

// Runs subscribe(Notifications) once expo-notifications loads. Returns the
// cleanup for the useEffect, which works even if it hasn't loaded yet.
const subscribeWhenLoaded = (subscribe) => {
  if (!isPushAvailable()) return () => {};
  let cancelled = false;
  let subscriptions = [];
  loadNotifications()
    .then(async (Notifications) => {
      if (cancelled) return;
      const created = await subscribe(Notifications, () => cancelled);
      // Cleaned up while subscribe was waiting: remove them right away
      if (cancelled) created.forEach((subscription) => subscription.remove());
      else subscriptions = created;
    })
    .catch((error) => console.warn("Push notifications are not available:", error));
  return () => {
    cancelled = true;
    subscriptions.forEach((subscription) => subscription.remove());
  };
};

/** Saves the new token when FCM changes it. Returns the cleanup. */
export const subscribeToPushTokenChanges = (language) =>
  subscribeWhenLoaded((Notifications) => [
    Notifications.addPushTokenListener((token) => {
      saveToken(token.data, language);
    }),
  ]);

/**
 * With the app open, a notification shows as a banner with sound, like with
 * the app in the background: the driver may be on another screen.
 */
export const showNotificationsInForeground = () =>
  subscribeWhenLoaded((Notifications) => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    return [];
  });

/**
 * Calls onTripRequest(tripId) when the driver taps a trip request
 * notification: with the app in the background, or when the tap opened the
 * closed app. Returns the cleanup.
 */
export const subscribeToTripRequestTaps = (onTripRequest) =>
  subscribeWhenLoaded(async (Notifications, isCancelled) => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const tripId = tripIdFromResponse(response);
        if (tripId) onTripRequest(tripId);
      },
    );
    // The tap that opened the app, if it was closed. It is cleared so it
    // doesn't open the request again the next time this runs.
    const last = await Notifications.getLastNotificationResponseAsync();
    const tripId = tripIdFromResponse(last);
    if (tripId && !isCancelled()) {
      await Notifications.clearLastNotificationResponseAsync();
      onTripRequest(tripId);
    }
    return [subscription];
  });
