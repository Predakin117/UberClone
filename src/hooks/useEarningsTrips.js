// AI-assisted: see docs/AI_LOG.md #28
// Listens in real time to every finished trip (completed or paid) the
// earnings need: from the start of this month, or of this week if it started
// in the previous month. No limit, unlike the history. Returns
// { trips, isLoading, error }; error is a key of src/i18n/strings.js.
import { earningsQueryStart } from "../services/earnings";
import { subscribeToTripsSince } from "../services/tripRepository";
import { useDriverTrips } from "./useDriverTrips";

// The start is computed when the session is ready, each time the screen opens
const subscribeToEarningsTrips = (uid, onTrips, onError) =>
  subscribeToTripsSince(uid, earningsQueryStart(), onTrips, onError);

export const useEarningsTrips = () =>
  useDriverTrips(subscribeToEarningsTrips, "earnings.loadFailed");
