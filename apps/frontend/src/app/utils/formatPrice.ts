import safeParseFloat from './safeParseFloat';

export const formatPrice = (price: unknown): string => {
  const parsedValue = safeParseFloat(price);
  return parsedValue.toFixed(2);
};

export default formatPrice;
