import t from '@/lib/internationalization';

jest.mock('@/assets/internationalization.json', () => {
  return {
    'some-key': {
      en: 'Some key',
      fr: 'Une clé',
    },
    'partial-key': {
      en: 'Partial key',
    },
    'invalid-key': {},
  };
});

describe('internationalization', () => {
  it('should return the translated key', () => {
    expect(t('some-key', 'en')).toEqual('Some key');
    expect(t('some-key', 'fr')).toEqual('Une clé');
  });

  it('should fallback to default language (en)', () => {
    expect(t('partial-key', 'en')).toEqual('Partial key');
    expect(t('partial-key', 'fr')).toEqual('Partial key');
  });

  it('should fallback to the key if no translation exists (selected or default locale)', () => {
    expect(t('invalid-key', 'en')).toEqual('invalid-key');
    expect(t('invalid-key', 'fr')).toEqual('invalid-key');
  });

  it('should fallback to the key if not present', () => {
    expect(t('non-existing-key', 'en')).toEqual('non-existing-key');
    expect(t('non-existing-key', 'fr')).toEqual('non-existing-key');
  });
});
