import * as S from '@/lib/steps';
import {
  availableTranslators,
  backendsSupporting,
  getTranslator,
  registerTranslator,
} from '@/lib/translators';
import { ALL_STEP_NAMES, BaseTranslator } from '@/lib/translators/base';

class DummyStringTranslator extends BaseTranslator {
  /* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unused-vars-experimental */
  source(step: S.SourceStep) {
    return 'source';
  }
  filter(step: S.FilterStep) {
    return 'filter';
  }
  rename(step: S.RenameStep) {
    return 'rename';
  }
  /* eslint-enable no-unused-vars, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unused-vars-experimental */
}

describe('base translator class', () => {
  class NoSupportTranslator extends BaseTranslator {}

  it('should be able to get list of supported operations', () => {
    const notrs = new NoSupportTranslator();
    const dummytrs = new DummyStringTranslator();

    expect(notrs.unsupportedSteps).toEqual(ALL_STEP_NAMES.filter(s => s !== 'domain'));
    expect(notrs.supportedSteps).toEqual(['domain']);
    expect(dummytrs.supportedSteps).toEqual(['domain', 'filter', 'rename', 'source']);
    expect(dummytrs.supports('source')).toBeTruthy();
    expect(dummytrs.supports('filter')).toBeTruthy();
    expect(dummytrs.supports('rename')).toBeTruthy();
    expect(dummytrs.supports('aggregate')).toBeFalsy();
  });

  it('should raise a NotSupported error', () => {
    const notrs = new NoSupportTranslator();
    expect(() => notrs.translate([{ name: 'source', source: 'my-source' }])).toThrow(
      'Unsupported step <source>',
    );
  });

  it('should raise a NotSupported error', () => {
    const dummytrs = new DummyStringTranslator();
    expect(() =>
      dummytrs.translate([
        { name: 'source', source: 'my-source' },
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
        { name: 'source', source: 'my-source' },
        { name: 'rename', oldname: 'old', newname: 'new' },
        { name: 'rename', oldname: 'old2', newname: 'new2' },
      ]),
    ).toEqual(['source', 'rename', 'rename']);
  });
});

describe('translator registration', () => {
  it('should be possible to register backends', () => {
    registerTranslator('dummy', DummyStringTranslator);
    expect(backendsSupporting('aggregate')).toEqual(['mongo36', 'mongo40']);
    expect(backendsSupporting('source')).toEqual(['dummy', 'mongo36', 'mongo40']);
  });

  it('should throw an error if backend is not available', () => {
    expect(() => getTranslator('bla')).toThrow();
  });

  it('should be possible to get all available translators', () => {
    registerTranslator('dummy', DummyStringTranslator);
    const translators = availableTranslators();
    expect(Object.keys(translators).sort()).toEqual(['dummy', 'mongo36', 'mongo40']);
  });
});
