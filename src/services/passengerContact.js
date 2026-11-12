// AI-assisted: see docs/AI_LOG.md #31
// Call and message links for the passenger of the trip, opened with Linking.
// passengerName and passengerPhone are extra fields, not in the table of
// section 6 (docs/APIS.md, service 11): without passengerPhone there is no
// contact.

// Keeps the leading + and the digits: "+57 300 000-0000" → "+573000000000"
export const cleanPhone = (phone) => {
  if (typeof phone !== "string") return "";
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
};

/**
 * { name, callUrl, smsUrl } for the trip's passenger, or null if the trip has
 * no usable passengerPhone. name is null when the trip has no passengerName.
 */
export const passengerContact = (trip) => {
  const phone = cleanPhone(trip?.passengerPhone);
  if (phone.replace("+", "").length < 7) return null;
  const name =
    typeof trip.passengerName === "string" && trip.passengerName.trim() !== ""
      ? trip.passengerName.trim()
      : null;
  return { name, callUrl: `tel:${phone}`, smsUrl: `sms:${phone}` };
};
