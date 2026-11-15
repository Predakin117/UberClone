// AI-assisted: see docs/AI_LOG.md #28, #61
// Listens in real time to every finished trip (completed or paid) the
// earnings need: from the start of this month, or of this week if it started
// in the previous month. No limit, unlike the history. Returns
// { trips, isLoading, error }; error is a key of src/i18n/strings.js.
// weeksBack is the oldest week the driver opened in the week navigator: the
// listener starts at that week when it is older than the month.
import { useCallback } from "react";
import { earningsSince } from "../services/earningsWeeks";
import { subscribeToTripsSince } from "../services/tripRepository";
import { useDriverTrips } from "./useDriverTrips";

export const useEarningsTrips = (weeksBack = 0) => {
  // A new function only when weeksBack changes: useDriverTrips listens again
  // from the older week and keeps showing the current trips meanwhile. The
  // start is computed when the session is ready, each time the screen opens.
  const subscribe = useCallback(
    (uid, onTrips, onError) =>
      subscribeToTripsSince(uid, earningsSince(weeksBack), onTrips, onError),
    [weeksBack],
  );
  return useDriverTrips(subscribe, "earnings.loadFailed");
};
