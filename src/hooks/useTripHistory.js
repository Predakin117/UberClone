// AI-assisted: see docs/AI_LOG.md #28
// Listens in real time to the driver's last 20 finished trips (completed or
// paid), newest first. Returns { trips, isLoading, error }; error is a key of
// src/i18n/strings.js.
import { subscribeToTripHistory } from "../services/tripRepository";
import { useDriverTrips } from "./useDriverTrips";

export const useTripHistory = () =>
  useDriverTrips(subscribeToTripHistory, "history.loadFailed");
