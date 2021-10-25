import I18N_KEYS from '@/assets/internationalization.json';

export type LocaleIdentifier = 'en' | 'fr';

export const DEFAULT_LOCALE: LocaleIdentifier = 'en';

// Types cannot be annotated in JSON
const I18N_KEYS_TYPED = I18N_KEYS as {
  [k: string]: { [l in LocaleIdentifier]?: string };
};

export default function t(key: string, locale?: LocaleIdentifier): string {
  const localeOrDefault: LocaleIdentifier = locale || DEFAULT_LOCALE;

  const i18nKey: { [k in LocaleIdentifier]?: string } = I18N_KEYS_TYPED[key];

  if (!i18nKey) {
    // Return the key is its missing from the json file
    return key;
  }

  // Return the provided locale,
  // then fallback to the default one,
  // and if not available use the key instead.
  return i18nKey[localeOrDefault] || i18nKey[DEFAULT_LOCALE] || key;
}
