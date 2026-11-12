// AI-assisted: see docs/AI_LOG.md #31
// Night look of the maps: between 6 p.m. and 6 a.m. (phone's time) the maps
// use a dark Google Maps style. These hex values are map style colors (the
// Google Maps JSON format), not app UI colors, so they live here and not in
// theme.js. On iOS with Apple Maps customMapStyle does nothing and doesn't
// fail; there the map uses userInterfaceStyle "dark" instead.

export const NIGHT_START_HOUR = 18;
export const NIGHT_END_HOUR = 6;

// True from 18:00 to 05:59
export const isNightTime = (date = new Date()) => {
  const hour = date.getHours();
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
};

export const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1d1d1d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1d1d1d" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#262626" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1f2a1f" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2f2f2f" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a1a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#454545" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#262626" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e5d6c" }] },
];
