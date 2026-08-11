/**
 * Format Storefront API money values for market-aware display (AUD / JPY, etc.).
 */
export function formatMoney(amount, currencyCode = 'AUD', locale) {
  if (amount == null || amount === '') return '';

  const numeric = Number(amount);
  if (Number.isNaN(numeric)) return '';

  const resolvedLocale = locale || defaultLocaleForCurrency(currencyCode);

  try {
    return new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'symbol',
    }).format(numeric);
  } catch {
    return `${currencyCode} ${numeric.toFixed(2)}`;
  }
}

function defaultLocaleForCurrency(currencyCode) {
  switch ((currencyCode || '').toUpperCase()) {
    case 'JPY':
      return 'ja-JP';
    case 'AUD':
      return 'en-AU';
    default:
      return undefined;
  }
}
