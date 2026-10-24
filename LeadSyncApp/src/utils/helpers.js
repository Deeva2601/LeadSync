// ─────────────────────────────────────────────────────────────────────────────
// src/utils/helpers.js
// Small pure utility functions used across the app.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract a named field value from the Meta field_data array.
 * field_data looks like: [{ name: 'full_name', values: ['John Doe'] }, ...]
 */
export const getFieldValue = (fields = [], fieldName) => {
  const match = fields.find(
    (f) => f.name === fieldName || f.name === fieldName.replace(/ /g, '_'),
  );
  return match && match.values && match.values.length > 0
    ? match.values[0]
    : null;
};

/**
 * Derive the best display name from a lead's field_data.
 */
export const getLeadName = (fields = []) => {
  return (
    getFieldValue(fields, 'full_name') ||
    getFieldValue(fields, 'name') ||
    getFieldValue(fields, 'first_name') ||
    'Unknown'
  );
};

/**
 * Format an ISO timestamp to a human-readable string.
 */
export const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Generate initials from a name (up to 2 chars).
 */
export const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
