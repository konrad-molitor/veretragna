export const safeParseFloat = (value: unknown, defaultValue = 0): number => {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? defaultValue : value;
  }

  if (typeof value === 'string') {
    const sanitizedValue = value.replace(',', '.');
    const parsed = parseFloat(sanitizedValue);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }

  return defaultValue;
};

export default safeParseFloat;
