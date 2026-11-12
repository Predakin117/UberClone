// AI-assisted: see docs/AI_LOG.md #60
// Date range of the history filter. Errors are keys of src/i18n/strings.js and
// go under the field, like the registration errors.
import { parseISODate } from "./dates";

/**
 * { from, to } are "YYYY-MM-DD" texts. Returns {} when the range is valid, or
 * the error of the field to fix: an empty or invalid date, or a start after
 * the end.
 */
export const validateDateRange = ({ from, to }) => {
  const errors = {};
  const fromDate = parseISODate(from);
  const toDate = parseISODate(to);
  if (!fromDate) errors.from = "errors.dateRangeRequired";
  if (!toDate) errors.to = "errors.dateRangeRequired";
  if (fromDate && toDate && fromDate > toDate) {
    errors.to = "errors.dateRangeOrder";
  }
  return errors;
};
