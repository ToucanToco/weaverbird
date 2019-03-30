import * as S from '@/lib/steps';
import { BaseTranslator, ALL_STEP_NAMES } from '@/lib/translators/base';

describe('base translator class', () => {
  class NoSupportTranslator extends BaseTranslator {}
  class DummyStringTranslator extends BaseTranslator {
    domain(step: S.DomainStep) {
      return 'domain';
    }
    filter(step: S.FilterStep) {
      return 'filter';
    }
    rename(step: S.RenameStep) {
      return 'rename';
    }
  }

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

  it('should raise a NotSupported error', () => {
    const notrs = new NoSupportTranslator();
    expect(() => notrs.translate([{ name: 'domain', domain: 'my-domain' }])).toThrow(
      'Unsupported step <domain>',
    );
  });

  it('should raise a NotSupported error', () => {
    const dummytrs = new DummyStringTranslator();
    expect(() =>
      dummytrs.translate([
        { name: 'domain', domain: 'my-domain' },
        { name: 'rename', oldname: 'old', newname: 'new' },
        { name: 'delete', columns: ['col1'] },
        { name: 'rename', oldname: 'old2', newname: 'new2' },
      ]),
    ).toThrow('Unsupported step <delete>');
  });

  it('should be possible to call translate on a translator', () => {
    const dummytrs = new DummyStringTranslator();
    expect(
      dummytrs.translate([
        { name: 'domain', domain: 'my-domain' },
        { name: 'rename', oldname: 'old', newname: 'new' },
        { name: 'rename', oldname: 'old2', newname: 'new2' },
      ]),
    ).toEqual(['domain', 'rename', 'rename']);
  });
});
