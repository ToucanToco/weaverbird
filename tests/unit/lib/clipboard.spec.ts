import {
  addTextValidator,
  CLIPBOARD_VALIDATOR,
  copyToClipboard,
  pasteFromClipboard,
  validateClipboardText,
} from '@/lib/clipboard';

const TEXT = 'TOTO';
const TEXT_WITH_VALIDATOR = `${CLIPBOARD_VALIDATOR}TOTO${CLIPBOARD_VALIDATOR}`;

const writeTextStub = jest.fn(),
  readTextStub = jest.fn();

Object.assign(navigator, {
  clipboard: {
    writeText: writeTextStub,
    readText: readTextStub,
  },
});

describe('validateClipboardText', () => {
  it('should return string without validator', () => {
    const value = validateClipboardText(`PARSERTOTOPARSER`, 'PARSER');
    expect(value).toStrictEqual('TOTO');
  });
  it('should return empty string if passed value is undefined', () => {
    const value = validateClipboardText(undefined, 'PARSER');
    expect(value).toStrictEqual('');
  });
  it('should return empty string if string was already empty', () => {
    const value = validateClipboardText('', 'PARSER');
    expect(value).toStrictEqual('');
  });
  it('should return empty string if passed value has no validator', () => {
    const value = validateClipboardText(`OTHERTOTOOTHER`, 'PARSER');
    expect(value).toStrictEqual('');
  });
});
describe('addTextValidator', () => {
  it('should return string with validator', () => {
    const value = addTextValidator('TOTO', 'PARSER');
    expect(value).toStrictEqual(`PARSERTOTOPARSER`);
  });
  it('should return empty string if string was already empty', () => {
    const value = addTextValidator('', 'PARSER');
    expect(value).toStrictEqual('');
  });
});

describe('copyToClipboard', () => {
  it('should copy updated string with validator to clipboard', async () => {
    await copyToClipboard(TEXT);
    expect(writeTextStub).toHaveBeenCalledWith(TEXT_WITH_VALIDATOR);
  });
});

describe('pasteFromClipboard', () => {
  beforeEach(async () => {
    readTextStub.mockResolvedValue(TEXT_WITH_VALIDATOR);
  });
  it('should return retrieved data without validator', async () => {
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
