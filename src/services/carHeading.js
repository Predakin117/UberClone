// AI-assisted: see docs/AI_LOG.md #31
// Direction (degrees clockwise from north) the car marker points to. GPS only
// knows the heading while moving: standing still, Android reports 0 (north)
// and iOS -1. So a reading only counts above a walking speed; otherwise the
// car keeps its last direction instead of snapping to north.

// m/s (about 3.6 km/h)
export const MIN_SPEED_FOR_HEADING = 1;

/**
 * Next heading of the car from the previous one and a location reading
 * { heading, speed } of expo-location. Always between 0 and 360.
 */
export const nextHeading = (previous, { heading, speed } = {}) => {
  const moving = Number.isFinite(speed) && speed >= MIN_SPEED_FOR_HEADING;
  if (moving && Number.isFinite(heading) && heading >= 0) {
    return heading % 360;
  }
  return Number.isFinite(previous) ? previous : 0;
};
