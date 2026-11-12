// AI-assisted: see docs/AI_LOG.md #28, #60
// Listens in real time to the driver's last finished trips (completed or
// paid), newest first: 20 at first and 20 more with each loadMore(). Returns
// { trips, isLoading, error, hasMore, loadMore }; error is a key of
// src/i18n/strings.js.
import { useCallback, useState } from "react";
import {
  HISTORY_LIMIT,
  subscribeToTripHistory,
} from "../services/tripRepository";
import { useDriverTrips } from "./useDriverTrips";

export const useTripHistory = () => {
  const [maxTrips, setMaxTrips] = useState(HISTORY_LIMIT);

  // A new function only when maxTrips changes: useDriverTrips listens again
  // with the bigger limit and keeps showing the current trips meanwhile
  const subscribe = useCallback(
    (uid, onTrips, onError) =>
      subscribeToTripHistory(uid, onTrips, onError, maxTrips),
    [maxTrips],
  );
  const state = useDriverTrips(subscribe, "history.loadFailed");

  // A full page means there may be older trips
  const hasMore = state.trips.length >= maxTrips;
  const loadMore = useCallback(
    () => setMaxTrips((current) => current + HISTORY_LIMIT),
    [],
  );

  return { ...state, hasMore, loadMore };
};
