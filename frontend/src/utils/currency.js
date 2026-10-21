/**
 * Utility functions for Brazilian Real (R$) currency masking and parsing.
 */

/**
 * Applies monetary mask to raw numeric/string input.
 * E.g.: "2" -> "0,02", "20" -> "0,20", "2000" -> "20,00", "200000" -> "2.000,00"
 * @param {string|number} rawValue
 * @returns {string} Formatted string without "R$" prefix (e.g. "20,00")
 */
export const maskCurrencyInput = (rawValue) => {
  if (rawValue === '' || rawValue === null || rawValue === undefined) return '';
  const cleanDigits = String(rawValue).replace(/\D/g, '');
  if (!cleanDigits) return '';
  const num = Number(cleanDigits) / 100;
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Converts masked currency string to a float number.
 * E.g.: "20,00" -> 20.00, "1.250,50" -> 1250.50
 * @param {string|number} maskedValue
 * @returns {number}
 */
export const parseCurrencyToNumber = (maskedValue) => {
  if (typeof maskedValue === 'number') return isNaN(maskedValue) ? 0 : maskedValue;
  if (!maskedValue) return 0;
  const cleanDigits = String(maskedValue).replace(/\D/g, '');
  if (!cleanDigits) return 0;
  return Number(cleanDigits) / 100;
};

/**
 * Formats a number to BRL currency string.
 * @param {number} value
 * @returns {string} E.g. "20,00"
 */
export const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
