// AI-assisted: see docs/AI_LOG.md #54
// Warning of a text field close to its character limit, like the Uber app:
// a counter from 80 % of the limit and a message when the limit is reached
// (TextInput's maxLength stops the typing without saying anything).

export const NEAR_LIMIT_RATIO = 0.8;

// "none", "near" or "reached"
export const limitStatus = (length, maxLength) => {
  if (!maxLength) return "none";
  if (length >= maxLength) return "reached";
  if (length >= Math.ceil(maxLength * NEAR_LIMIT_RATIO)) return "near";
  return "none";
};
