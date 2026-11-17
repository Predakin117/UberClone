// AI-assisted: see docs/AI_LOG.md #32
// Push notifications of new trip requests while the driver is logged in. It
// runs in MainDrawer, the part of the app that only exists with a session:
// - with the Firebase user known, it saves the device token in drivers/{uid}
//   and saves it again if FCM changes it or the driver changes the language;
// - with the app open, notifications still show as a banner;
// - tapping one opens the home map, where the request card shows.
// Outside a development build on an Android phone it does nothing
// (src/services/pushNotifications.js).
import { useNavigation } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, isFirebaseConfigured } from "../config/firebase";
import { useLanguage } from "../contexts/LanguageContext";
import { translate } from "../i18n/strings";
import {
  registerForPushNotifications,
  showNotificationsInForeground,
  subscribeToPushTokenChanges,
  subscribeToTripRequestTaps,
} from "../services/pushNotifications";

export const usePushNotifications = () => {
  const navigation = useNavigation();
  const { language } = useLanguage();
  const [uid, setUid] = useState(null);

  // The Firebase session is restored when the app opens: wait to know it
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null));
  }, []);

  useEffect(() => showNotificationsInForeground(), []);

  // The token goes with the language, so the backend writes the text in it.
  // translate gives the same texts as t(), but it doesn't change every render.
  useEffect(() => {
    if (!uid) return;
    registerForPushNotifications({
      language,
      channel: {
        name: translate(language, "notifications.channelName"),
        description: translate(language, "notifications.channelDescription"),
      },
    });
    return subscribeToPushTokenChanges(language);
  }, [uid, language]);

  // The request card lives on the home map (TripStack → Home). With a trip in
  // progress, Home itself moves on to the trip.
  useEffect(
    () =>
      subscribeToTripRequestTaps(() =>
        navigation.navigate("Main", {
          screen: "TripFlow",
          params: { screen: "Home" },
        }),
      ),
    [navigation],
  );
};
