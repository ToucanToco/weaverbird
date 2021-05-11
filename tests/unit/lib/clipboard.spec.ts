import {
  addTextFlag,
  CLIPBOARD_FLAG,
  copyToClipboard,
  pasteFromClipboard,
  validateAndRemoveTextFlag,
} from '@/lib/clipboard';

const TEXT = 'TOTO';
const TEXT_WITH_VALIDATOR = `${CLIPBOARD_FLAG}TOTO${CLIPBOARD_FLAG}`;

const writeTextStub = jest.fn(),
  readTextStub = jest.fn();

Object.assign(navigator, {
  clipboard: {
    writeText: writeTextStub,
    readText: readTextStub,
  },
});

describe('validateAndRemoveTextFlag', () => {
  it('should return a string without flag', () => {
    const value = validateAndRemoveTextFlag(`FLAGTOTOFLAG`, 'FLAG');
    expect(value).toStrictEqual('TOTO');
  });
  it('should return an empty string if passed value is undefined', () => {
    const value = validateAndRemoveTextFlag(undefined, 'FLAG');
    expect(value).toStrictEqual('');
  });
  it('should return an empty string if string was already empty', () => {
    const value = validateAndRemoveTextFlag('', 'FLAG');
    expect(value).toStrictEqual('');
  });
  it('should return an empty string if passed value has no flag', () => {
    const value = validateAndRemoveTextFlag(`OTHERTOTOOTHER`, 'FLAG');
    expect(value).toStrictEqual('');
  });
});
describe('addTextFlag', () => {
  it('should return string with flag', () => {
    const value = addTextFlag('TOTO', 'FLAG');
    expect(value).toStrictEqual(`FLAGTOTOFLAG`);
  });
  it('should return empty string if string was already empty', () => {
    const value = addTextFlag('', 'FLAG');
    expect(value).toStrictEqual('');
  });
});

describe('copyToClipboard', () => {
  it('should copy updated string with flag to clipboard', async () => {
    await copyToClipboard(TEXT);
    expect(writeTextStub).toHaveBeenCalledWith(TEXT_WITH_VALIDATOR);
  });
});

describe('pasteFromClipboard', () => {
  beforeEach(async () => {
    readTextStub.mockResolvedValue(TEXT_WITH_VALIDATOR);
  });
  it('should return retrieved data without flag', async () => {
    const value = await pasteFromClipboard();
    expect(readTextStub).toHaveBeenCalled();
    expect(value).toStrictEqual(TEXT);
  });
  describe('when paste value is not coming from weaverbird', () => {
    beforeEach(async () => {
      readTextStub.mockResolvedValue('IamBAD');
    });
    it('should return an empty string', async () => {
      const value = await pasteFromClipboard();
      expect(value).toStrictEqual('');
    });
  });
});
