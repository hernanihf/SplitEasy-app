// The fixed currency list a group can be created in, mirroring the backend's
// domain.CurrencyCodes (same codes, same order). The backend stores and
// validates the ISO 4217 code; the flag here and the localized names in i18n
// (`currencies.<code>`) are the frontend's half of the model. Actual amount
// formatting (symbol, placement) comes from Intl's currency formatter in
// formatAmount — this list is only for the picker UI.
export const CURRENCIES = [
  { code: 'USD', flag: '🇺🇸' },
  { code: 'ARS', flag: '🇦🇷' },
  { code: 'EUR', flag: '🇪🇺' },
  { code: 'BRL', flag: '🇧🇷' },
  { code: 'CLP', flag: '🇨🇱' },
  { code: 'UYU', flag: '🇺🇾' },
  { code: 'MXN', flag: '🇲🇽' },
  { code: 'COP', flag: '🇨🇴' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export const DEFAULT_CURRENCY: CurrencyCode = 'USD';
