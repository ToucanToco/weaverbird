import { describe, expect, it } from 'vitest';

import type * as S from '@/lib/steps';
import {
  availableTranslators,
  backendsSupporting,
  getTranslator,
  registerTranslator,
} from '@/lib/translators';
import { ALL_STEP_NAMES, BaseTranslator } from '@/lib/translators/base';

class DummyStringTranslator extends BaseTranslator {
  /* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
  domain(step: S.DomainStep) {
    return 'domain';
  }
  filter(step: S.FilterStep) {
    return 'filter';
  }
  rename(step: S.RenameStep) {
    return 'rename';
  }
  /* eslint-enable no-unused-vars, @typescript-eslint/no-unused-vars */
}

describe('base translator class', () => {
  class NoSupportTranslator extends BaseTranslator {}

  it('should be able to get list of supported operations', () => {
    const notrs = new NoSupportTranslator();
    const dummytrs = new DummyStringTranslator();

    expect(notrs.unsupportedSteps).toEqual(ALL_STEP_NAMES);
    expect(notrs.supportedSteps).toEqual([]);
    expect(dummytrs.supportedSteps).toEqual(['domain', 'filter', 'rename']);
    expect(dummytrs.supports('domain')).toBeTruthy();
    expect(dummytrs.supports('filter')).toBeTruthy();
    expect(dummytrs.supports('rename')).toBeTruthy();
    expect(dummytrs.supports('aggregate')).toBeFalsy();
  });
});

describe('translator registration', () => {
  it('should be possible to register backends', () => {
    registerTranslator('dummy', DummyStringTranslator);
  });

  it('should provided backend supporting a specific step', () => {
    expect(backendsSupporting('aggregate')).toEqual([
      'athena',
      'google-big-query',
      'mongo36',
      'mongo40',
      'mongo42',
      'mongo50',
      'mysql',
      'pandas',
      'pandas-no_joins',
      'postgresql',
      'redshift',
      'snowflake',
    ]);
    expect(backendsSupporting('domain')).toEqual([
      'athena',
      'dummy',
      'empty',
      'google-big-query',
      'mongo36',
      'mongo40',
      'mongo42',
      'mongo50',
      'mysql',
      'pandas',
      'pandas-no_joins',
      'postgresql',
      'redshift',
      'snowflake',
    ]);
    expect(backendsSupporting('append')).toEqual([
      'mongo36',
      'mongo40',
      'mongo42',
      'mongo50',
      'pandas',
    ]);
    expect(backendsSupporting('join')).toEqual([
      'mongo36',
      'mongo40',
      'mongo42',
      'mongo50',
      'pandas',
    ]);
  });

  it('should throw an error if backend is not available', () => {
    expect(() => getTranslator('bla')).toThrow();
  });

  it('should be possible to get all available translators', () => {
    registerTranslator('dummy', DummyStringTranslator);
    const translators = availableTranslators();
    expect(Object.keys(translators).sort()).toEqual([
      'athena',
      'dummy',
      'empty',
      'google-big-query',
      'mongo36',
      'mongo40',
      'mongo42',
      'mongo50',
      'mysql',
      'pandas',
      'pandas-no_joins',
      'postgresql',
      'redshift',
      'snowflake',
    ]);
  });
});
